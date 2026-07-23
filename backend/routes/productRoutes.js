const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../app.db'); 
const db = new sqlite3.Database(dbPath);

// 📊 1. Products Dashboard Stats API
router.get('/product-dashboard-stats', (req, res) => {
    const stats = {};

    db.all("SELECT * FROM product", [], (err, unitRows) => {
        if (err) return res.status(500).json({ error: err.message });
        stats.allProducts = unitRows || [];

        db.all("SELECT * FROM bulk_products", [], (err, bulkRows) => {
            if (err) return res.status(500).json({ error: err.message });
            stats.allBulkProducts = bulkRows || [];
            stats.totalProducts = (unitRows || []).length + (bulkRows || []).length;

            const queryLow = `
                SELECT Product_name, Quantity FROM product WHERE Quantity < 10
                UNION ALL
                SELECT Product_name, Quantity FROM bulk_products WHERE Quantity < 15
            `;
            db.all(queryLow, [], (err, lowRows) => {
                if (err) return res.status(500).json({ error: err.message });
                stats.lowStock = lowRows || [];

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

// 🔢 2. API to get the next product IDs
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
router.get('/get-suppliers', (req, res) => {
    db.all("SELECT SupplierID, Name FROM supplier", [], (err, rows) => {
        if (err) {
            console.error("❌ SQL Error in get-suppliers:", err.message);
            return res.status(500).json([]);
        }
        res.json(rows || []);
    });
});

// ➕ 4. Add Unit Product (Percentage (%) Discount Logic)
router.post('/add-product', (req, res) => {
    const { Product_ID, Barcode, Product_name, Brand, Purchase_Price, Sell_Price, Quantity, SupplierID, Discount } = req.body;
    
    const purchase = parseFloat(Purchase_Price || 0);
    const sell = parseFloat(Sell_Price || 0);
    const discountPercent = parseFloat(Discount || 0);

    // Max Discount Percentage Calculator
    const maxDiscountPercent = sell > 0 ? Math.max(0, ((sell - purchase) / sell) * 100) : 0;
    
    // Calculate actual profit in Rupees after Discount Percentage
    const discountInRupees = sell * (discountPercent / 100);
    const profit = (sell - discountInRupees) - purchase;

    if (discountPercent < 0) {
        return res.status(400).json({ error: "Validation Error: Discount percentage cannot be negative!" });
    }
    if (discountPercent > maxDiscountPercent) {
        return res.status(400).json({ 
            error: `Validation Error: Discount (${discountPercent.toFixed(1)}%) cannot exceed maximum allowed discount (${maxDiscountPercent.toFixed(1)}%)!` 
        });
    }

    const query = `
        INSERT INTO product (Product_ID, Barcode, Product_name, Brand, Purchase_Price, Sell_Price, Profit, Quantity, SupplierID, Discount, Max_Discount) 
        VALUES (?,?,?,?,?,?,?,?,?,?,?)
    `;
    db.run(query, [Product_ID, Barcode, Product_name, Brand, purchase, sell, profit, Quantity, SupplierID, discountPercent, maxDiscountPercent], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Success" });
    });
});

// ➕ 5. Add Bulk Product (Percentage (%) Discount Logic)
router.post('/add-bulk-product', (req, res) => {
    const { BulkProductID, Barcode, Product_name, Purchase_Price, Sell_Price, Quantity, SupplierID, Discount } = req.body;
    
    const purchase = parseFloat(Purchase_Price || 0);
    const sell = parseFloat(Sell_Price || 0);
    const discountPercent = parseFloat(Discount || 0);

    const maxDiscountPercent = sell > 0 ? Math.max(0, ((sell - purchase) / sell) * 100) : 0;

    if (discountPercent < 0) {
        return res.status(400).json({ error: "Validation Error: Discount percentage cannot be negative!" });
    }
    if (discountPercent > maxDiscountPercent) {
        return res.status(400).json({ 
            error: `Validation Error: Discount (${discountPercent.toFixed(1)}%) cannot exceed maximum allowed discount (${maxDiscountPercent.toFixed(1)}%)!` 
        });
    }

    const query = `
        INSERT INTO bulk_products (BulkProductID, Product_name, Purchase_Price, Sell_Price, Quantity, SupplierID, Barcode, Discount, Max_Discount) 
        VALUES (?,?,?,?,?,?,?,?,?)
    `;
    db.run(query, [BulkProductID, Product_name, purchase, sell, parseFloat(Quantity), SupplierID, Barcode, discountPercent, maxDiscountPercent], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Success" });
    });
});

// 🔄 6. Update Unit Product (Percentage (%) Discount Logic)
router.put('/update-product/:id', (req, res) => {
    const { Product_name, Brand, Purchase_Price, Sell_Price, Quantity, SupplierID, Barcode, Discount } = req.body;
    
    const purchase = parseFloat(Purchase_Price || 0);
    const sell = parseFloat(Sell_Price || 0);
    const discountPercent = parseFloat(Discount || 0);

    const maxDiscountPercent = sell > 0 ? Math.max(0, ((sell - purchase) / sell) * 100) : 0;
    const discountInRupees = sell * (discountPercent / 100);
    const profit = (sell - discountInRupees) - purchase;

    if (discountPercent < 0) {
        return res.status(400).json({ error: "Validation Error: Discount percentage cannot be negative!" });
    }
    if (discountPercent > maxDiscountPercent) {
        return res.status(400).json({ 
            error: `Validation Error: Discount (${discountPercent.toFixed(1)}%) cannot exceed maximum allowed discount (${maxDiscountPercent.toFixed(1)}%)!` 
        });
    }

    const query = `
        UPDATE product 
        SET Product_name=?, Brand=?, Purchase_Price=?, Sell_Price=?, Profit=?, Quantity=?, SupplierID=?, Barcode=?, Discount=?, Max_Discount=? 
        WHERE Product_ID=?
    `;
    db.run(query, [Product_name, Brand, purchase, sell, profit, Quantity, SupplierID, Barcode, discountPercent, maxDiscountPercent, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Updated" });
    });
});

// 🔄 7. Update Bulk Product (Percentage (%) Discount Logic)
router.put('/update-bulk-product/:id', (req, res) => {
    const { Product_name, Purchase_Price, Sell_Price, Quantity, SupplierID, Barcode, Discount } = req.body;
    
    const purchase = parseFloat(Purchase_Price || 0);
    const sell = parseFloat(Sell_Price || 0);
    const discountPercent = parseFloat(Discount || 0);

    const maxDiscountPercent = sell > 0 ? Math.max(0, ((sell - purchase) / sell) * 100) : 0;

    if (discountPercent < 0) {
        return res.status(400).json({ error: "Validation Error: Discount percentage cannot be negative!" });
    }
    if (discountPercent > maxDiscountPercent) {
        return res.status(400).json({ 
            error: `Validation Error: Discount (${discountPercent.toFixed(1)}%) cannot exceed maximum allowed discount (${maxDiscountPercent.toFixed(1)}%)!` 
        });
    }

    const query = `
        UPDATE bulk_products 
        SET Product_name=?, Purchase_Price=?, Sell_Price=?, Quantity=?, SupplierID=?, Barcode=?, Discount=?, Max_Discount=? 
        WHERE BulkProductID=?
    `;
    db.run(query, [Product_name, purchase, sell, parseFloat(Quantity), SupplierID, Barcode, discountPercent, maxDiscountPercent, req.params.id], function(err) {
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

// 🔍 10. Billing Search API (FIXED: Added Quantity to Query)
router.get('/search-billing-products', (req, res) => {
    const searchTerm = req.query.q || '';
    
    // 🟢 FIXED: Quantity Column එක UNION දෙකටම එකතු කරන ලදී
    const query = `
        SELECT 'Bulk' AS Type, BulkProductID AS ID, Product_name AS Name, Purchase_Price, Sell_Price, Discount, Max_Discount, Barcode, Quantity FROM bulk_products WHERE Product_name LIKE ?
        UNION ALL
        SELECT 'Unit' AS Type, Product_ID AS ID, Product_name AS Name, Purchase_Price, Sell_Price, Discount, Max_Discount, Barcode, Quantity FROM product WHERE Product_name LIKE ?
        ORDER BY Type ASC, Name ASC
    `;
    
    const wildcard = `%${searchTerm}%`;
    db.all(query, [wildcard, wildcard], (err, rows) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true, data: rows || [] });
    });
});

module.exports = router;