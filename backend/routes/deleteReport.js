const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../app.db');
const db = new sqlite3.Database(dbPath);
const reportFolder = path.join(__dirname, '../report');

// DELETE API - Remove the report from the database and the folder by ReportID
router.delete('/delete-report/:id', (req, res) => {
    const reportId = req.params.id;

    // 1. First construct the name of the PDF file to delete (for example, REP1_Sales_Report.pdf)
    // Note: since the ReportName in your database may look like "Sales Report (2026-01-01 to 2026-01-31)",
    // we directly search for the standard file name "${reportId}_Sales_Report.pdf".
    const pdfFileName = `${reportId}_Sales_Report.pdf`;
    const pdfFilePath = path.join(reportFolder, pdfFileName);

    // 2. Delete the data from the database
    const query = "DELETE FROM Report WHERE ReportID = ?";
    db.run(query, [reportId], function (err) {
        if (err) {
            console.error("DB Error deleting report:", err.message);
            return res.status(500).json({ error: err.message });
        }

        if (this.changes === 0) {
            return res.status(404).json({ message: "Report not found in database" });
        }

        // 3. Delete the PDF file from the folder only if it was successfully removed from the database
        if (fs.existsSync(pdfFilePath)) {
            fs.unlink(pdfFilePath, (unlinkErr) => {
                if (unlinkErr) {
                    console.error("Error deleting PDF file:", unlinkErr.message);
                    // Even if deleting the file fails, we can still report success because it was already removed from the database
                }
            });
        }

        res.json({ message: "Report and PDF file deleted successfully" });
    });
});

module.exports = router;