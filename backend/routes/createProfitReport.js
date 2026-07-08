const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const ChartJSImage = require('chart.js-image');

// app.db එකට සම්බන්ධ වීම
const dbPath = path.join(__dirname, '../app.db');
const db = new sqlite3.Database(dbPath);

// report ෆෝල්ඩරයේ path එක
const reportFolder = path.join(__dirname, '../report');

if (!fs.existsSync(reportFolder)) {
    fs.mkdirSync(reportFolder, { recursive: true });
}

// POST API - Profit Report එක සාදා PDF එක Folder එකට සේව් කර බ්‍රව්සර් එකට ලබාදීම
router.post('/generate-profit-report', async (req, res) => {
    const { ReportID, ReportType, FromDate, ToDate } = req.body;

    const query = `
        SELECT Date, SUM(Profit) AS DailyProfit
        FROM Invoice
        WHERE Date BETWEEN ? AND ?
        GROUP BY Date
        ORDER BY Date ASC
    `;

    db.all(query, [FromDate, ToDate], async (err, rows) => {
        if (err) {
            console.error("Database error:", err.message);
            return res.status(500).json({ error: err.message });
        }

        if (!rows || rows.length === 0) {
            return res.status(400).json({ error: "No profit data found for the selected date range!" });
        }

        try {
            // 📊 1. Chart.js-Image මඟින් Bar Graph එක සෑදීම
            const labels = rows.map(r => r.Date);
            const dataValues = rows.map(r => r.DailyProfit);
            const totalProfitSum = dataValues.reduce((a, b) => a + b, 0);

            const chart = ChartJSImage()
                .chart({
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Profit (Rs.)',
                            backgroundColor: '#28a745',
                            data: dataValues
                        }]
                    },
                    options: {
                        scales: {
                            yAxes: [{ ticks: { beginAtZero: true } }]
                        }
                    }
                })
                .width(500)
                .height(300);

            const chartBuffer = await chart.toBuffer();

            // 📄 2. PDFKit මඟින් PDF එක නිර්මාණය කිරීම
            const doc = new PDFDocument({ margin: 50 });

            // 💾 3. PDF එක backend/report ෆෝල්ඩරය ඇතුළත සේව් කිරීමට File Stream එකක් සෑදීම
            const pdfFileName = `${ReportID}_Profit_Report.pdf`;
            const pdfFilePath = path.join(reportFolder, pdfFileName);
            const fileStream = fs.createWriteStream(pdfFilePath);
            
            doc.pipe(fileStream); // ෆෝල්ඩරයට සේව් වේ
            
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=${pdfFileName}`);
            doc.pipe(res); // Frontend එකට download වීමට යැවේ

            // Dumbara Supermarket Header
            doc.fontSize(28).text('Dumbara Supermarket', { align: 'center' }).moveDown(1);
            doc.fontSize(16).text(`Profit Summary (${FromDate} to ${ToDate})`, { align: 'center' }).moveDown(1.5);

            // Table Headers
            doc.fontSize(12).font('Helvetica-Bold');
            doc.text('Date', 100, doc.y, { width: 200, continued: true });
            doc.text('Profit (Rs.)', { align: 'right' });
            doc.moveDown(0.5);
            doc.moveTo(100, doc.y).lineTo(500, doc.y).stroke().moveDown(0.5);

            // Table Rows
            doc.font('Helvetica');
            rows.forEach(row => {
                doc.text(row.Date, 100, doc.y, { width: 200, continued: true });
                doc.text(row.DailyProfit.toFixed(2), { align: 'right' });
                doc.moveDown(0.4);
            });

            doc.moveDown(1);
            doc.moveTo(100, doc.y).lineTo(500, doc.y).stroke().moveDown(0.5);

            // Total Profit
            doc.font('Helvetica-Bold').fontSize(14);
            doc.text(`Total Net Profit : Rs. ${totalProfitSum.toFixed(2)}`, 100, doc.y).moveDown(1.5);

            // Bar Chart එක එකතු කිරීම
            doc.image(chartBuffer, 60, doc.y, { width: 480 });

            // 💾 4. Report Table එකට දත්ත ඇතුළත් කිරීම (doc.end එකට කලින් කිරීම වඩාත් සුරක්ෂිතයි)
            const today = new Date();
            const currentDate = today.toLocaleDateString('en-CA', { timeZone: 'Asia/Colombo' }); 
            const currentTime = today.toLocaleTimeString('en-GB', { timeZone: 'Asia/Colombo', hour12: false });

            const insertQuery = `INSERT INTO Report (ReportID, ReportName, Date, Time) VALUES (?, ?, ?, ?)`;
            db.run(insertQuery, [ReportID, `Profit Report (${FromDate} to ${ToDate})`, currentDate, currentTime], (insertErr) => {
                if (insertErr) {
                    console.error("Error saving to Report table:", insertErr.message);
                } else {
                    console.log(`Report ${ReportID} successfully saved to DB at Sri Lankan time: ${currentDate} ${currentTime}`);
                }
            });

            doc.end(); // PDF ලිවීම අවසන් කර Response එක ක්ලෝස් කිරීම

        } catch (chartError) {
            console.error("Chart generation error:", chartError);
            if (!res.headersSent) res.status(500).json({ error: "Failed to generate report chart" });
        }
    });
});

module.exports = router;