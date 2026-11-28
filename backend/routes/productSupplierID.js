const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./app.db');

// API to retrieve all supplier IDs
router.get('/get-suppliers', (req, res) => {
    const query = "SELECT SupplierID, Name FROM supplier"; 
    
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error("Database Error:", err.message);
            return res.status(500).json({ error: err.message });
        }
        res.json(rows); 
    });
});

module.exports = router;