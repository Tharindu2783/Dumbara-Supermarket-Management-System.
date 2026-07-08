const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 💡 app.db එක සම්බන්ධ කරගැනීම
const dbPath = path.join(__dirname, '../app.db'); 
const db = new sqlite3.Database(dbPath);

// ==========================================================================
// 📊 1. සියලුම Orders ටේබල් එකට ගන්නා API එක
// ==========================================================================
router.get('/all', (req, res) => {
    const query = "SELECT * FROM orders"; 
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// ==========================================================================
// 🆕 2. + බටන් එක එබුවම ඊළඟට එන POID එක දෙන API එක
// ==========================================================================
router.get('/next-poid', (req, res) => {
    db.get("SELECT POID FROM orders ORDER BY ROWID DESC LIMIT 1", (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        
        let nextId = "PO1"; 
        if (row && row.POID) {
            const currentNumber = parseInt(row.POID.replace('PO', ''), 10);
            nextId = `PO${currentNumber + 1}`;
        }
        res.json({ nextPOID: nextId }); 
    });
});

// ==========================================================================
// 🍏 3. Dropdown එක සඳහා Product_ID සහ Product_name ගන්නා API එක
// ==========================================================================
router.get('/products-list', (req, res) => {
    // 💡 ඔයාගේ කෝඩ් එකට අනුව නිවැරදිම Column නම්: Product_ID, Product_name
    const query = "SELECT Product_ID, Product_name FROM product"; 
    
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        
        // Frontend එකේ code එකට ගැලපෙන්න map කරනවා
        const formattedProducts = rows.map(p => ({
            productid: p.Product_ID,   // 👈 Product_ID එක productid විදිහට ගත්තා
            name: p.Product_name       // 👈 Product_name එක name විදිහට ගත්තා
        }));
        
        res.json(formattedProducts);
    });
});

// ==========================================================================
// 🚀 4. Send For Approval ක්ලික් කළ විට නව Order එකක් Insert කරන API එක
// ==========================================================================
// ==========================================================================
// 🚀 4. Send For Approval ක්ලික් කළ විට නව Order එකක් Insert කරන API එක
// ==========================================================================
router.post('/add-request', (req, res) => {
    const { POID, ProductID, Name, Qty } = req.body;
    
    // ✅ ශ්‍රී ලංකාවේ සැබෑ දිනය සහ වෙලාව (24hr) නිවැරදිව ලබා ගැනීම:
    const today = new Date();

    // Output: YYYY-MM-DD (උදා: 2026-05-30)
    const currentDate = today.toLocaleDateString('en-CA', { timeZone: 'Asia/Colombo' }); 

    // Output: HH:MM:SS (උදා: 14:30:15)
    const currentTime = today.toLocaleTimeString('en-GB', { timeZone: 'Asia/Colombo', hour12: false }); 

    const status = 'Approval Pending'; 

    // (ඉතිරි කේතය සියල්ලම පෙර පරිදිම තිබෙන්න හැරිය හැක...)
    const priceQuery = "SELECT Sell_Price FROM product WHERE Product_ID = ?";
    db.get(priceQuery, [ProductID], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: "Product not found" });

        const unitPrice = row.Sell_Price || 0;
        const total = unitPrice * Qty; 

        const insertQuery = `
            INSERT INTO orders (POID, ProductID, Name, Qty, Total, Date, Time, Status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        db.run(insertQuery, [POID, ProductID, Name, Qty, total, currentDate, currentTime, status], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Order requested successfully and status set to Approval Pending!" });
        });
    });
});

// ==========================================================================
// 🔄 5. Status එක Update කරන සහ Stock එක වැඩි කරන API එක
// ==========================================================================
router.put('/update-status', (req, res) => {
    const { POID, newStatus } = req.body;

    if (!POID || !newStatus) {
        return res.status(400).json({ error: "POID and newStatus are required" });
    }

    // 1. මුලින්ම Orders ටේබල් එකේ Status එක Update කරමු
    const updateOrderQuery = "UPDATE orders SET Status = ? WHERE POID = ?";
    
    db.run(updateOrderQuery, [newStatus, POID], function(err) {
        if (err) return res.status(500).json({ error: err.message });

        // 2. ඉදිරි පියවර කරන්නේ Status එක "Received" නම් පමණි
        if (newStatus === 'Received') {
            
            // 3. මේ Order එකට අදාළ ProductID එක සහ Qty එක orders එකෙන් කියවා ගනිමු
            const getOrderDetails = "SELECT ProductID, Qty FROM orders WHERE POID = ?";
            
            db.get(getOrderDetails, [POID], (err, orderRow) => {
                if (err) return res.status(500).json({ error: err.message });
                if (!orderRow) return res.status(404).json({ error: "Order not found" });

                const { ProductID, Qty } = orderRow;

                // 4. Product ටේබල් එකේ තියෙන Quantity එකට අලුත් Qty එක එකතු කරමු
                // 💡 ඔයාගේ ඩේටාබේස් එකේ Column එක 'Quantity' ලෙස උපකල්පනය කර ඇත
                const updateStockQuery = "UPDATE product SET Quantity = Quantity + ? WHERE Product_ID = ?";
                
                db.run(updateStockQuery, [Qty, ProductID], function(err) {
                    if (err) return res.status(500).json({ error: err.message });
                    
                    return res.json({ 
                        success: true, 
                        message: `Order set to Received and Stock updated successfully for Product: ${ProductID} (+${Qty})` 
                    });
                });
            });
        } else {
            // "Approved" හෝ "Cancel" නම් Stock වෙනස් නොකර මෙතනින් අවසන් වේ
            return res.json({ success: true, message: `Order status updated to ${newStatus}` });
        }
    });
});

module.exports = router;