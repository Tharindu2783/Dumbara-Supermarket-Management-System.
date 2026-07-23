const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./app.db');

// 1. Retrieve product details by barcode from both the unit and bulk tables
router.get('/get-product-by-barcode/:barcode', (req, res) => {
    const barcode = req.params.barcode;
    
    // 💡 FIX: Updated the query to also retrieve the discount value
    const query = `
        SELECT Product_name, Sell_Price, Purchase_Price, Discount FROM product WHERE Barcode = ?
        UNION ALL
        SELECT Product_name, Sell_Price, Purchase_Price, Discount FROM bulk_products WHERE Barcode = ?
    `; 

    db.get(query, [barcode, barcode], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row) {
            res.json({ 
                success: true, 
                item: row.Product_name, 
                price: row.Sell_Price,
                purchasePrice: row.Purchase_Price,
                discount: row.Discount || 0 // 🟢 Newly added discount value
            });
        } else {
            res.json({ success: false, message: "Product not found" });
        }
    });
});

// 2. Retrieve billing statistics (last transaction and today's count)
router.get('/billing-stats', (req, res) => {
    const today = new Date();
    const currentDate = today.toLocaleDateString('en-CA', { timeZone: 'Asia/Colombo' }); 
    
    const query = `
        SELECT 
            (SELECT Total FROM Invoice ORDER BY ROWID DESC LIMIT 1) as lastTransaction,
            (SELECT COUNT(*) FROM Invoice WHERE Date = ?) as todayCount
    `;

    db.get(query, [currentDate], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({
            lastTransaction: row?.lastTransaction || 0,
            todayCount: row?.todayCount || 0
        });
    });
});

// ➕ API to add an invoice, update invoice_products, and reduce stock quantity
router.post('/add-invoice', (req, res) => {
    const { InvoiceID, Product_Qty, Total, Profit, Date, Time, ProductList, ProductNameList, CountList } = req.body;

    // 1. First save the invoice to the Invoice table
    const invoiceQuery = `INSERT INTO Invoice (InvoiceID, Product_Qty, Total, Profit, Date, Time) VALUES (?, ?, ?, ?, ?, ?)`;
    
    db.run(invoiceQuery, [InvoiceID, Product_Qty, Total, Profit, Date, Time], function(err) {
        if (err) {
            console.error("❌ Invoice Save Error:", err.message);
            return res.status(500).json({ success: false, message: err.message });
        }

        // 2. Insert the bill's item list into the invoice_products table
        const invoiceProductsQuery = `INSERT INTO invoice_products (INVID, ProductList, ProductNameList, CountList, Date, Time) VALUES (?, ?, ?, ?, ?, ?)`;
        
        db.run(invoiceProductsQuery, [InvoiceID, ProductList, ProductNameList, CountList, Date, Time], function(err) {
            if (err) {
                console.error("❌ invoice_products Save Error:", err.message);
            }

            // 3. Split the item barcodes and quantities from the bill into arrays
            const barcodes = ProductList ? ProductList.split(',') : [];
            const quantities = CountList ? CountList.split(',') : [];

            if (barcodes.length === 0 || ProductList === '') {
                return res.json({ success: true, message: "Invoice saved with no items." });
            }

            let completedQueries = 0;
            let hasError = false;

            // 4. Reduce the stock of each item one by one in a loop 
            barcodes.forEach((barcode, index) => {
                const qtyToRemove = parseFloat(quantities[index]) || 0;
                const cleanBarcode = barcode.trim();

                const updateProductQuery = `UPDATE product SET Quantity = Quantity - ? WHERE (Barcode = ? OR Product_ID = ?) AND Quantity >= ?`;
                
                db.run(updateProductQuery, [qtyToRemove, cleanBarcode, cleanBarcode, qtyToRemove], function(err) {
                    if (err) {
                        hasError = true;
                        console.error("❌ Error updating unit product stock:", err.message);
                    }

                    const updateBulkQuery = `UPDATE bulk_products SET Quantity = Quantity - ? WHERE (Barcode = ? OR BulkProductID = ?) AND Quantity >= ?`;
                    
                    db.run(updateBulkQuery, [qtyToRemove, cleanBarcode, cleanBarcode, qtyToRemove], function(err) {
                        if (err) {
                            hasError = true;
                            console.error("❌ Error updating bulk product stock:", err.message);
                        }

                        completedQueries++;
                        
                        if (completedQueries === barcodes.length) {
                            if (hasError) {
                                return res.json({ 
                                    success: true, 
                                    message: "Invoice saved, but some stocks might not have updated correctly." 
                                });
                            }
                            return res.json({ 
                                success: true, 
                                message: "Invoice saved, invoice_products updated and Stocks updated successfully!" 
                            });
                        }
                    });
                });
            });
        });
    });
});

module.exports = router;