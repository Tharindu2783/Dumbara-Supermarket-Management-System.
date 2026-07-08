const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 💡 app.db ගොනුවට නිවැරදි Path එක සම්බන්ධ කිරීම
const dbPath = path.join(__dirname, '../app.db'); 
const db = new sqlite3.Database(dbPath);

// 📊 1. Products Dashboard Stats API
router.get('/product-dashboard-stats', (req, res) => {
    const stats = {};

    // සාමාන්‍ය බඩු
    db.all("SELECT * FROM product", [], (err, unitRows) => {
        if (err) return res.status(500).json({ error: err.message });
        stats.allProducts = unitRows || [];

        // කිරන බඩු (Bulk)
        db.all("SELECT * FROM bulk_products", [], (err, bulkRows) => {
            if (err) return res.status(500).json({ error: err.message });
            stats.allBulkProducts = bulkRows || [];
            stats.totalProducts = (unitRows || []).length + (bulkRows || []).length;

            // Low Stock (සාමාන්‍ය බඩු < 10, කිරන බඩු < 15kg)
            const queryLow = `
                SELECT Product_name, Quantity FROM product WHERE Quantity < 10
                UNION ALL
                SELECT Product_name, Quantity FROM bulk_products WHERE Quantity < 15
            `;
            db.all(queryLow, [], (err, lowRows) => {
                if (err) return res.status(500).json({ error: err.message });
                stats.lowStock = lowRows || [];

                // Suppliers Stats (ටේබල් දෙකේම)
                const querySupp = `
                    SELECT SupplierID, COUNT(*) as count FROM (
                        SELECT SupplierID FROM product WHERE SupplierID IS NOT NULL AND SupplierID != ''
                        UNION ALL
                        SELECT SupplierID FROM bulk_products WHERE SupplierID IS NOT NULL AND SupplierID != ''
                    ) GROUP BY SupplierID
                `;
                db.all(querySupp, [], (err, suppRows) => {
                    if (err) return res.status(500).json({ error: err.message });
                    stats.supplierStats = suppRows || [];
                    
                    res.json(stats);
                });
            });
        });
    });
});

// 🔢 2. Next Product IDs ගන්නා API
router.get('/next-product-id', (req, res) => {
    db.get("SELECT Product_ID FROM product ORDER BY ROWID DESC LIMIT 1", [], (err, unitRow) => {
        let nextUnitId = "P1";
        if (unitRow && unitRow.Product_ID) {
            const num = parseInt(unitRow.Product_ID.replace('P', '')) || 0;
            nextUnitId = `P${num + 1}`;
        }

        db.get("SELECT BulkProductID FROM bulk_products ORDER BY ROWID DESC LIMIT 1", [], (err, bulkRow) => {
            let nextBulkId = "B1";
            if (bulkRow && bulkRow.BulkProductID) {
                
                const num = parseInt(bulkRow.BulkProductID.replace('B', '')) || 0;
                nextBulkId = `B${num + 1}`;
            }
            res.json({ nextUnitId, nextBulkId });
        });
    });
});

// 🏢 3. Get Suppliers 
// 💡 FIX: DB එකේ තියෙන්නේ 'Name' මිසක් 'Supplier_Name' නෙවෙයි. එය නිවැරදි කරන ලදී!
router.get('/get-suppliers', (req, res) => {
    db.all("SELECT SupplierID, Name FROM supplier", [], (err, rows) => {
        if (err) {
            console.error("❌ SQL Error in get-suppliers:", err.message);
            return res.status(500).json([]);
        }
        res.json(rows || []);
    });
});

// ➕ 4. Add Unit Product
router.post('/add-product', (req, res) => {
    const { Product_ID, Barcode, Product_name, Brand, Purchase_Price, Sell_Price, Quantity, SupplierID } = req.body;
    const profit = parseFloat(Sell_Price || 0) - parseFloat(Purchase_Price || 0);
    const query = `INSERT INTO product (Product_ID, Barcode, Product_name, Brand, Purchase_Price, Sell_Price, Profit, Quantity, SupplierID) VALUES (?,?,?,?,?,?,?,?,?)`;
    db.run(query, [Product_ID, Barcode, Product_name, Brand, Purchase_Price, Sell_Price, profit, Quantity, SupplierID], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Success" });
    });
});

// ➕ 5. Add Bulk Product
router.post('/add-bulk-product', (req, res) => {
    const { BulkProductID, Barcode, Product_name, Purchase_Price, Sell_Price, Quantity, SupplierID } = req.body;
    const query = `INSERT INTO bulk_products (BulkProductID, Product_name, Purchase_Price, Sell_Price, Quantity, SupplierID, Barcode) VALUES (?,?,?,?,?,?,?)`;
    db.run(query, [BulkProductID, Product_name, Purchase_Price, Sell_Price, parseFloat(Quantity), SupplierID, Barcode], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Success" });
    });
});

// 🔄 6. Update Unit Product
router.put('/update-product/:id', (req, res) => {
    const { Product_name, Brand, Purchase_Price, Sell_Price, Quantity, SupplierID, Barcode } = req.body;
    const profit = parseFloat(Sell_Price || 0) - parseFloat(Purchase_Price || 0);
    const query = `UPDATE product SET Product_name=?, Brand=?, Purchase_Price=?, Sell_Price=?, Profit=?, Quantity=?, SupplierID=?, Barcode=? WHERE Product_ID=?`;
    db.run(query, [Product_name, Brand, Purchase_Price, Sell_Price, profit, Quantity, SupplierID, Barcode, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Updated" });
    });
});

// 🔄 7. Update Bulk Product
router.put('/update-bulk-product/:id', (req, res) => {
    const { Product_name, Purchase_Price, Sell_Price, Quantity, SupplierID, Barcode } = req.body;
    const query = `UPDATE bulk_products SET Product_name=?, Purchase_Price=?, Sell_Price=?, Quantity=?, SupplierID=?, Barcode=? WHERE BulkProductID=?`;
    db.run(query, [Product_name, Purchase_Price, Sell_Price, parseFloat(Quantity), SupplierID, Barcode, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Updated Bulk" });
    });
});

// 🗑️ 8. Delete Unit Product
router.delete('/delete-product/:id', (req, res) => {
    db.run("DELETE FROM product WHERE Product_ID = ?", [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Deleted" });
    });
});

// 🗑️ 9. Delete Bulk Product
router.delete('/delete-bulk-product/:id', (req, res) => {
    db.run("DELETE FROM bulk_products WHERE BulkProductID = ?", [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Deleted Bulk" });
    });
});

// 🔍 Billing Page එක සඳහා බඩු සර්ච් කරන API (Bulk Products වලට මුල් තැන දෙමින්)
router.get('/search-billing-products', (req, res) => {
    const searchTerm = req.query.q || '';
    
    // SQL Query එක: bulk_products සහ product ටේබල් දෙකෙන්ම දත්ත එකතු කර සර්ච් කිරීම
    const query = `
        SELECT 'Bulk' AS Type, BulkProductID AS ID, Product_name AS Name, Purchase_Price, Sell_Price, Barcode FROM bulk_products WHERE Product_name LIKE ?
        UNION ALL
        SELECT 'Unit' AS Type, Product_ID AS ID, Product_name AS Name, Purchase_Price, Sell_Price, Barcode FROM product WHERE Product_name LIKE ?
        ORDER BY Type ASC, Name ASC
    `;
    
    const wildcard = `%${searchTerm}%`;
    db.all(query, [wildcard, wildcard], (err, rows) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true, data: rows || [] });
    });
});

module.exports = router;