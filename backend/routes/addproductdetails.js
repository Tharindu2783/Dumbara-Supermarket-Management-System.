const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./app.db');

router.post('/add-product', (req, res) => {
    const { Product_ID, Barcode, Product_name, Brand, Purchase_Price, Sell_Price, Quantity, SupplierID } = req.body;

    // 1. Quantity එක Integer එකක්දැයි පරීක්ෂා කිරීම (Validation)
    if (!Number.isInteger(Number(Quantity))) {
        return res.status(400).json({ error: "Quantity must be a whole number (Integer)." });
    }

    // Profit එක ගණනය කිරීම (අවශ්‍ය නම් පමණක්, ඔබේ Table එකේ GENERATED ALWAYS නිසා මෙය අවශ්‍ය නොවනු ඇත)
    const profit = parseFloat(Sell_Price) - parseFloat(Purchase_Price);

    const query = `
        INSERT INTO product (Product_ID, Product_name, Brand, Purchase_Price, Sell_Price, Quantity, SupplierID, Barcode)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(query, [Product_ID, Product_name, Brand, Purchase_Price, Sell_Price, Quantity, SupplierID, Barcode], function(err) {
        if (err) {
            console.error("Insert Error:", err.message);
            return res.status(500).json({ error: "Could not add product. ID might already exist." });
        }
        res.json({ message: "Product added successfully!", id: this.lastID });
    });
});

module.exports = router;