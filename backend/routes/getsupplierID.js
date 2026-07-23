const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./app.db');

router.get('/next-supplier-id', (req, res) => {
    db.get("SELECT SupplierID FROM supplier ORDER BY ROWID DESC LIMIT 1", (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        
        let nextId = "SUP1";
        if (row && row.SupplierID) {
            const currentNumber = parseInt(row.SupplierID.replace('SUP', ''));
            nextId = `SUP${currentNumber + 1}`;
        }
        res.json({ nextSupplierId: nextId });
    });
});

module.exports = router;