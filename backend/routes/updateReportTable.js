// 📄 backend/routes/updateReportTable.js
const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to app.db correctly
const dbPath = path.join(__dirname, '../app.db');
const db = new sqlite3.Database(dbPath);

// 💡 GET API - Return all data from the Report table to the frontend table
router.get('/get-reports', (req, res) => {
    // Order the data so the newest report appears first
    const query = "SELECT * FROM Report ORDER BY CAST(SUBSTR(ReportID, 4) AS INTEGER) DESC";
    
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error("Error fetching from Report table:", err.message);
            return res.status(500).json({ error: err.message });
        }
        res.json(rows); // Send the data to the frontend as a JSON list
    });
});

module.exports = router;