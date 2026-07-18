const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./app.db');

// 1. Barcode එක අනුව Product විස්තර ලබාගැනීම
// 1. Barcode එක අනුව Product විස්තර ලබාගැනීම (Unit සහ Bulk ටේබල් දෙකෙන්ම සොයයි)
router.get('/get-product-by-barcode/:barcode', (req, res) => {
    const barcode = req.params.barcode;
    
    // 💡 FIX: ටේබල් දෙකෙන්ම බාර්කෝඩ් එකට අදාළ දත්ත UNION එකක් මඟින් සොයා ගැනීම
    const query = `
        SELECT Product_name, Sell_Price, Purchase_Price FROM product WHERE Barcode = ?
        UNION ALL
        SELECT Product_name, Sell_Price, Purchase_Price FROM bulk_products WHERE Barcode = ?
    `; 

    db.get(query, [barcode, barcode], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row) {
            res.json({ 
                success: true, 
                item: row.Product_name, 
                price: row.Sell_Price,
                purchasePrice: row.Purchase_Price 
            });
        } else {
            res.json({ success: false, message: "Product not found" });
        }
    });
});

// 2. Billing Stats ලබාගැනීම (Last Transaction & Today Count)
router.get('/billing-stats', (req, res) => {
    // ✅ ශ්‍රී ලංකාවේ සැබෑ දිනය නිවැරදිව ලබා ගැනීම:
    const today = new Date();
    const currentDate = today.toLocaleDateString('en-CA', { timeZone: 'Asia/Colombo' }); 
    
    const query = `
        SELECT 
            (SELECT Total FROM Invoice ORDER BY ROWID DESC LIMIT 1) as lastTransaction,
            (SELECT COUNT(*) FROM Invoice WHERE Date = ?) as todayCount
    `;

    // 💡 වෙනස්කම: [today] වෙනුවට [currentDate] ලෙස නිවැරදිව pass කරන්න
    db.get(query, [currentDate], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({
            lastTransaction: row?.lastTransaction || 0,
            todayCount: row?.todayCount || 0
        });
    });
});

// ➕ Invoice එකක් ඇතුළත් කිරීම, invoice_products යාවත්කාලීන කිරීම සහ තොග (Stock Qty) අඩු කිරීමේ API
router.post('/add-invoice', (req, res) => {
    const { InvoiceID, Product_Qty, Total, Profit, Date, Time, ProductList, ProductNameList, CountList } = req.body;

    // 1. මුලින්ම Invoice ටේබල් එකට සේව් කරගන්නවා
    const invoiceQuery = `INSERT INTO Invoice (InvoiceID, Product_Qty, Total, Profit, Date, Time) VALUES (?, ?, ?, ?, ?, ?)`;
    
    db.run(invoiceQuery, [InvoiceID, Product_Qty, Total, Profit, Date, Time], function(err) {
        if (err) {
            console.error("❌ Invoice Save Error:", err.message);
            return res.status(500).json({ success: false, message: err.message });
        }

        // 2. 💡 FIX: invoice_products ටේබල් එකට බිල් එකේ බඩු ලැයිස්තුව ඇතුළත් කිරීම (INVID එකට InvoiceID එකම ලබා දේ)
        const invoiceProductsQuery = `INSERT INTO invoice_products (INVID, ProductList, ProductNameList, CountList, Date, Time) VALUES (?, ?, ?, ?, ?, ?)`;
        
        db.run(invoiceProductsQuery, [InvoiceID, ProductList, ProductNameList, CountList, Date, Time], function(err) {
            if (err) {
                console.error("❌ invoice_products Save Error:", err.message);
                // Invoice එක සේව් වුණත් මේක ෆේල් වුණොත් දැනුම් දෙනවා
            }

            // 3. බිල් එකේ තියෙන බඩු වල බාර්කෝඩ් සහ ප්‍රමාණයන් Array වලට වෙන් කරගැනීම
            const barcodes = ProductList ? ProductList.split(',') : [];
            const quantities = CountList ? CountList.split(',') : [];

            if (barcodes.length === 0 || ProductList === '') {
                return res.json({ success: true, message: "Invoice saved with no items." });
            }

            let completedQueries = 0;
            let hasError = false;

            // 4. Loop එකක් මඟින් එකින් එක භාණ්ඩයේ තොග අඩු කිරීම
            barcodes.forEach((barcode, index) => {
                const qtyToRemove = parseFloat(quantities[index]) || 0;
                const cleanBarcode = barcode.trim();

                // සාමාන්‍ය බඩු ටේබල් එක (product) බාර්කෝඩ් එකෙන් අප්ඩේට් කිරීම
                const updateProductQuery = `UPDATE product SET Quantity = Quantity - ? WHERE Barcode = ? OR Product_ID = ?`;
                
                db.run(updateProductQuery, [qtyToRemove, cleanBarcode, cleanBarcode], function(err) {
                    if (err) {
                        hasError = true;
                        console.error("❌ Error updating unit product stock:", err.message);
                    }

                    // කිරන බඩු ටේබල් එක (bulk_products) බාර්කෝඩ් එකෙන් හෝ ID එකෙන් අප්ඩේට් කිරීම
                    const updateBulkQuery = `UPDATE bulk_products SET Quantity = Quantity - ? WHERE Barcode = ? OR BulkProductID = ?`;
                    
                    db.run(updateBulkQuery, [qtyToRemove, cleanBarcode, cleanBarcode], function(err) {
                        if (err) {
                            hasError = true;
                            console.error("❌ Error updating bulk product stock:", err.message);
                        }

                        completedQueries++;
                        
                        // සියලුම භාණ්ඩ අප්ඩේට් වී අවසන් වූ පසු Response එක යැවීම
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