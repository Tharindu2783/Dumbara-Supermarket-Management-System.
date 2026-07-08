const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// app.db එකට නිවැරදිව සම්බන්ධ වීම
const dbPath = path.join(__dirname, '../app.db');
const db = new sqlite3.Database(dbPath);

// GET API - Report වගුවෙන් ඊළඟට පැමිණිය යුතු Report ID එක ගණනය කර ලබාදීම
router.get('/next-report-id', (req, res) => {
    // ReportID එකෙහි 'REP' ඉවත් කර ඉතිරි ඉලක්කම් කොටසින් උපරිම අගය (Last ID) සෙවීමේ Query එක
    const query = "SELECT ReportID FROM Report ORDER BY CAST(SUBSTR(ReportID, 4) AS INTEGER) DESC LIMIT 1";
    
    db.get(query, [], (err, row) => {
        if (err) {
            console.error("Database error in setREPID:", err.message);
            return res.status(500).json({ error: err.message });
        }
        
        if (row && row.ReportID) {
            // දැනට පවතින උපරිම අංකය ගෙන (උදා: REP1 -> 1) එයට 1ක් එකතු කර ඊළඟ ID එක සෑදීම
            const currentNumber = parseInt(row.ReportID.replace('REP', ''), 10);
            const nextID = `REP${currentNumber + 1}`;
            res.json({ nextReportId: nextID });
        } else {
            // Report වගුව සම්පූර්ණයෙන්ම හිස් නම් මුල්ම ID එක REP1 ලෙස ලබාදේ
            res.json({ nextReportId: 'REP1' });
        }
    });
});

module.exports = router;