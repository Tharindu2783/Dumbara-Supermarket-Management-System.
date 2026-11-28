const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to app.db correctly
const dbPath = path.join(__dirname, '../app.db');
const db = new sqlite3.Database(dbPath);

// GET API - Calculate and return the next report ID from the Report table
router.get('/next-report-id', (req, res) => {
    // Remove 'REP' from the ReportID and find the maximum numeric portion (last ID)
    const query = "SELECT ReportID FROM Report ORDER BY CAST(SUBSTR(ReportID, 4) AS INTEGER) DESC LIMIT 1";
    
    db.get(query, [], (err, row) => {
        if (err) {
            console.error("Database error in setREPID:", err.message);
            return res.status(500).json({ error: err.message });
        }
        
        if (row && row.ReportID) {
            // Take the current maximum number (for example, REP1 -> 1), add 1, and create the next ID
            const currentNumber = parseInt(row.ReportID.replace('REP', ''), 10);
            const nextID = `REP${currentNumber + 1}`;
            res.json({ nextReportId: nextID });
        } else {
            // If the Report table is completely empty, return the first ID REP1
            res.json({ nextReportId: 'REP1' });
        }
    });
});

module.exports = router;