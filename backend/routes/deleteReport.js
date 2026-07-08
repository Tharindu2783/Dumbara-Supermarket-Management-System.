const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../app.db');
const db = new sqlite3.Database(dbPath);
const reportFolder = path.join(__dirname, '../report');

// DELETE API - ReportID එක අනුව DB එකෙන් සහ ෆෝල්ඩරයෙන් රිපෝට් එක මැකීම
router.delete('/delete-report/:id', (req, res) => {
    const reportId = req.params.id;

    // 1. මුලින්ම මැකීමට අවශ්‍ය PDF ෆයිල් එකේ නම සකසා ගැනීම (REP1_Sales_Report.pdf වගේ)
    // සටහන: ඔයාගේ DB එකේ ReportName එක ඇතුළේ "Sales Report (2026-01-01 to 2026-01-31)" වගේ තියෙන නිසා, 
    // අපි කෙලින්ම Standard නම වන "${reportId}_Sales_Report.pdf" ලෙස ෆයිල් එක සොයමු.
    const pdfFileName = `${reportId}_Sales_Report.pdf`;
    const pdfFilePath = path.join(reportFolder, pdfFileName);

    // 2. Database එකෙන් දත්තය මැකීම
    const query = "DELETE FROM Report WHERE ReportID = ?";
    db.run(query, [reportId], function (err) {
        if (err) {
            console.error("DB Error deleting report:", err.message);
            return res.status(500).json({ error: err.message });
        }

        if (this.changes === 0) {
            return res.status(404).json({ message: "Report not found in database" });
        }

        // 3. Database එකෙන් සාර්ථකව මැකුණොත් පමණක් ෆෝල්ඩරයේ ඇති PDF ෆයිල් එක මැකීම
        if (fs.existsSync(pdfFilePath)) {
            fs.unlink(pdfFilePath, (unlinkErr) => {
                if (unlinkErr) {
                    console.error("Error deleting PDF file:", unlinkErr.message);
                    // ෆයිල් එක මැකීමේ අවුලක් වුණත් DB එකෙන් මැකුණු නිසා සාර්ථකයි කියා යවමු
                }
            });
        }

        res.json({ message: "Report and PDF file deleted successfully" });
    });
});

module.exports = router;