const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./app.db');

router.post('/add-supplier', (req, res) => {
    const { SupplierID, Name, Contact, Email } = req.body;
    const query = `INSERT INTO supplier (SupplierID, Name, Contact, Email) VALUES (?, ?, ?, ?)`;

    db.run(query, [SupplierID, Name, Contact, Email], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Supplier added successfully!" });
    });
});

module.exports = router;