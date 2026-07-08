const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./app.db');

// 1. ඊළඟ Invoice ID එක ගණනය කිරීම
router.get('/next-invoice-id', (req, res) => {
    const query = "SELECT InvoiceID FROM Invoice ORDER BY CAST(SUBSTR(InvoiceID, 4) AS INTEGER) DESC LIMIT 1";
    
    db.get(query, [], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (row && row.InvoiceID) {
            const currentNumber = parseInt(row.InvoiceID.replace('INV', ''));
            const nextID = `INV${currentNumber + 1}`;
            res.json({ nextInvoiceId: nextID });
        } else {
            res.json({ nextInvoiceId: 'INV1' }); // Database එක හිස් නම් INV1 ලබාදේ
        }
    });
});

// 2. අලුත් Invoice එකක් සහ එහි අයිතමයන් ටේබල් දෙකටම ඇතුළත් කිරීම
router.post('/add-invoice', (req, res) => {
    const { 
        InvoiceID, Product_Qty, Total, Profit, Date, Time, 
        ProductList, ProductNameList, CountList 
    } = req.body;
    
    // SQL Queries දෙක ලියා ගැනීම
    const insertInvoiceQuery = `INSERT INTO Invoice (InvoiceID, Product_Qty, Total, Profit, Date, Time) VALUES (?, ?, ?, ?, ?, ?)`;
    const insertProductsQuery = `INSERT INTO invoice_products (INVID, ProductList, ProductNameList, CountList, Date, Time) VALUES (?, ?, ?, ?, ?, ?)`;

    // 💡 ටේබල් දෙකටම එකවර ආරක්ෂිතව දත්ත ඇතුළත් කිරීම
    db.serialize(() => {
        let hasError = false;

        // 🛑 (A) පළමුව Invoice ටේබල් එකට දත්ත දැමීම
        db.run(insertInvoiceQuery, [InvoiceID, Product_Qty, Total, Profit, Date, Time], (err) => {
            if (err) {
                hasError = true;
                console.error("❌ Error saving to Invoice table:", err.message);
                return res.status(500).json({ success: false, message: "Invoice table error: " + err.message });
            }
        });

        // 🛑 (B) දෙවනුව ඔයා හදපු invoice_products ටේබල් එකට දත්ත දැමීම
        db.run(insertProductsQuery, [InvoiceID, ProductList, ProductNameList, CountList, Date, Time], (err) => {
            if (err) {
                hasError = true;
                console.error("❌ Error saving to invoice_products table:", err.message);
                // මුල් එක සේව් වෙලා මේක ෆේල් වුණොත් දැනුම් දීම
                if (!res.headersSent) {
                    return res.status(500).json({ success: false, message: "invoice_products table error: " + err.message });
                }
            }

            // ටේබල් දෙකටම සාර්ථකව සේව් වුණා නම් Response එක යැවීම
            if (!hasError && !res.headersSent) {
                res.json({ success: true, message: "All invoice details saved successfully to both tables!" });
            }
        });
    });
});

module.exports = router;