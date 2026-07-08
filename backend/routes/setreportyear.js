const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 💡 කුමන ෆෝල්ඩරයක සිටියත් නිවැරදිව ප්‍රධාන backend ෆෝල්ඩරයේ ඇති app.db එක සොයා ගැනීමට path.join භාවිතා කරමු
const dbPath = path.join(__dirname, '../app.db');
const db = new sqlite3.Database(dbPath);

// GET API - Invoice වගුවෙන් Unique අවුරුදු ලබා ගැනීම
router.get('/get-invoice-years', (req, res) => {
    // 💡 SQLite වල substr(Date, 1, 4) මඟින් "2026-05-25" වැනි දිනයකින් "2026" කොටස වෙන් කරගනී
    const query = `
        SELECT DISTINCT substr(Date, 1, 4) AS Year 
        FROM Invoice 
        WHERE Date IS NOT NULL AND Date != ''
        ORDER BY Year ASC
    `;

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error("Error fetching invoice years:", err.message);
            return res.status(500).json({ error: err.message });
        }
        
        // ලැබෙන rows වලින් ['2026'] වැනි සරල Array එකක් සකසා ගැනීම
        const years = rows.map(row => row.Year);
        
        // පරීක්ෂා කිරීම සඳහා backend console එකේ print කර බලමු
        console.log("Fetched Years from DB:", years);
        
        // කිසිම Invoice එකක් නැත්නම්, දැනට පවතින වර්ෂය Default එකක් ලෙස යැවීම
        if (years.length === 0) {
            years.push(new Date().getFullYear().toString());
        }
        
        res.json(years);
    });
});

module.exports = router;