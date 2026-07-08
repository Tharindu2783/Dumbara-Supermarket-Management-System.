const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./app.db');

router.get('/get-suppliers-list', (req, res) => {
    // සැපයුම්කරුවන්ගේ සියලුම තොරතුරු ලබා ගැනීම
    const query = `SELECT SupplierID, Name, Contact, Email FROM supplier`;
    
    db.all(query, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

module.exports = router;