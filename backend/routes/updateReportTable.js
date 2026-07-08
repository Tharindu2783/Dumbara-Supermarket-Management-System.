// 📄 backend/routes/updateReportTable.js
const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// app.db එකට නිවැරදිව සම්බන්ධ වීම
const dbPath = path.join(__dirname, '../app.db');
const db = new sqlite3.Database(dbPath);

// 💡 GET API - Report වගුවේ ඇති සියලුම දත්ත Frontend Table එකට ලබා දීම
router.get('/get-reports', (req, res) => {
    // අලුතින්ම හැදුණු රිපෝට් එක උඩටම එන විදිහට Order කරලා දත්ත ලබාගැනීම
    const query = "SELECT * FROM Report ORDER BY CAST(SUBSTR(ReportID, 4) AS INTEGER) DESC";
    
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error("Error fetching from Report table:", err.message);
            return res.status(500).json({ error: err.message });
        }
        res.json(rows); // Frontend එකට JSON දත්ත ලිස්ට් එකක් ලෙස යවයි
    });
});

module.exports = router;