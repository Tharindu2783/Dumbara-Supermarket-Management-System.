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

module.exports = router;