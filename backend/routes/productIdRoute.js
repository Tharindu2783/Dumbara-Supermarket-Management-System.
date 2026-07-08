const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./app.db');

router.get('/next-product-id', (req, res) => {
    // Product_ID එකෙන් අවසන් අගය ලබා ගැනීම
    const query = "SELECT Product_ID FROM product ORDER BY Product_ID DESC LIMIT 1";
    
    db.get(query, [], (err, row) => {
        if (err) {
            console.error("Database Error:", err.message);
            return res.status(500).json({ error: err.message });
        }

        let nextId = "P1"; 
        if (row && row.Product_ID) {
            const lastIdStr = row.Product_ID.toString();
            const lastNumber = parseInt(lastIdStr.replace('P', ''));
            nextId = `P${lastNumber + 1}`;
        }
        
        console.log("Calculated Next ID:", nextId);
        res.json({ nextId });
    });
});

module.exports = router;