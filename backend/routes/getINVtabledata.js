// backend/routes/getINVtabledata.js
const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../app.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error("Database error:", err.message);
});

router.get('/get-invoices', (req, res) => {
    const sql = `
        SELECT InvoiceID, Product_Qty, Total, Date, Time 
        FROM Invoice 
        ORDER BY CAST(SUBSTR(InvoiceID, 4) AS INTEGER) DESC
    `;
    
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error("SQL Error:", err.message);
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

module.exports = router;