const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./app.db');

// Supplier Update korar API
router.put('/update-supplier/:id', (req, res) => {
    const { Name, Contact, Email } = req.body;
    const id = req.params.id;
    const query = `UPDATE supplier SET Name = ?, Contact = ?, Email = ? WHERE SupplierID = ?`;

    db.run(query, [Name, Contact, Email, id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Supplier updated successfully!" });
    });
});

// Supplier Delete korar API
router.delete('/delete-supplier/:id', (req, res) => {
    const id = req.params.id;
    db.run("DELETE FROM supplier WHERE SupplierID = ?", id, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Supplier deleted successfully!" });
    });
});

router.get('/getsuppliercount', (req, res) => {
    const query = "SELECT COUNT(*) AS total FROM supplier";
    
    db.get(query, [], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        // මුළු ගණන totalSuppliers ලෙස රිටර්න් කරයි
        res.json({ totalSuppliers: row.total || 0 });
    });
});

module.exports = router;