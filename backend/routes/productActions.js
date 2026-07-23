const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./app.db');

// Delete Product API
router.delete('/delete-product/:id', (req, res) => {
    const productId = req.params.id;
    const requesterRole = req.headers['x-user-role']; 

   
    if (requesterRole === 'Assistant') {
        return res.status(403).json({ 
            success: false, 
            message: "⛔ Access Denied: Assistants are not allowed to delete products!" 
        });
    }

    // Delete query logic...
    const query = "DELETE FROM product WHERE Product_ID = ?";
    db.run(query, [productId], function (err) {
        if (err) {
            return res.status(500).json({ success: false, message: "Database error", error: err.message });
        }
        res.json({ success: true, message: "Product deleted successfully!" });
    });
});

// API to update a product
router.put('/update-product/:id', (req, res) => {
    const id = req.params.id;
    const { Product_name, Brand, Purchase_Price, Sell_Price, Quantity, SupplierID, Barcode } = req.body;
    const profit = parseFloat(Sell_Price) - parseFloat(Purchase_Price);

    const query = `UPDATE product SET Product_name=?, Brand=?, Purchase_Price=?, Sell_Price=?, Profit=?, Quantity=?, SupplierID=?, Barcode=? WHERE Product_ID=?`;
    
    db.run(query, [Product_name, Brand, Purchase_Price, Sell_Price, profit, Quantity, SupplierID, Barcode, id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Updated successfully" });
    });
});

module.exports = router;