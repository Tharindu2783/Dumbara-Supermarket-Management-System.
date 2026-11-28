const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./app.db');

// 1. Calculate the next invoice ID
router.get('/next-invoice-id', (req, res) => {
    const query = "SELECT InvoiceID FROM Invoice ORDER BY CAST(SUBSTR(InvoiceID, 4) AS INTEGER) DESC LIMIT 1";
    
    db.get(query, [], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (row && row.InvoiceID) {
            const currentNumber = parseInt(row.InvoiceID.replace('INV', ''));
            const nextID = `INV${currentNumber + 1}`;
            res.json({ nextInvoiceId: nextID });
        } else {
            res.json({ nextInvoiceId: 'INV1' }); // If the database is empty, return INV1
        }
    });
});

// 2. Add a new invoice and its items to both tables
router.post('/add-invoice', (req, res) => {
    const { 
        InvoiceID, Product_Qty, Total, Profit, Date, Time, 
        ProductList, ProductNameList, CountList 
    } = req.body;
    
    // Prepare the two SQL queries
    const insertInvoiceQuery = `INSERT INTO Invoice (InvoiceID, Product_Qty, Total, Profit, Date, Time) VALUES (?, ?, ?, ?, ?, ?)`;
    const insertProductsQuery = `INSERT INTO invoice_products (INVID, ProductList, ProductNameList, CountList, Date, Time) VALUES (?, ?, ?, ?, ?, ?)`;

    // 💡 Save data safely to both tables at once
    db.serialize(() => {
        let hasError = false;

        // 🛑 (A) First save the data to the Invoice table
        db.run(insertInvoiceQuery, [InvoiceID, Product_Qty, Total, Profit, Date, Time], (err) => {
            if (err) {
                hasError = true;
                console.error("❌ Error saving to Invoice table:", err.message);
                return res.status(500).json({ success: false, message: "Invoice table error: " + err.message });
            }
        });

        // 🛑 (B) Then save the data to the invoice_products table
        db.run(insertProductsQuery, [InvoiceID, ProductList, ProductNameList, CountList, Date, Time], (err) => {
            if (err) {
                hasError = true;
                console.error("❌ Error saving to invoice_products table:", err.message);
                // If the first save succeeded but this one failed, notify the client
                if (!res.headersSent) {
                    return res.status(500).json({ success: false, message: "invoice_products table error: " + err.message });
                }
            }

            // Send a response if both tables were saved successfully
            if (!hasError && !res.headersSent) {
                res.json({ success: true, message: "All invoice details saved successfully to both tables!" });
            }
        });
    });
});

module.exports = router;