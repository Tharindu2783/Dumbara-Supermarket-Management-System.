const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const { sendApprovalEmail, sendReceivedEmail } = require('./SendEmailOrder');

const dbPath = path.join(__dirname, '../app.db'); 
const db = new sqlite3.Database(dbPath);

// 📊 1. Retrieve all orders
router.get('/all', (req, res) => {
    const query = "SELECT * FROM orders"; 
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 🆕 2. API to generate the next POID
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

// 🍏 3. Products List API
router.get('/products-list', (req, res) => {
    const query = `
        SELECT Product_ID, Product_name, Sell_Price, 'Unit' AS Type FROM product
        UNION ALL
        SELECT BulkProductID AS Product_ID, Product_name, Sell_Price, 'Bulk' AS Type FROM bulk_products
    `; 
    
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const formattedProducts = rows.map(p => ({
            productid: p.Product_ID,   
            name: p.Product_name,      
            price: p.Sell_Price,       
            Type: p.Type               
        }));
        
        res.json(formattedProducts);
    });
});

// 🚀 4. Send For Approval
router.post('/add-request', (req, res) => {
    const { POID, ProductID, Name, Qty } = req.body;
    
    const today = new Date();
    const currentDate = today.toLocaleDateString('en-CA', { timeZone: 'Asia/Colombo' }); 
    const currentTime = today.toLocaleTimeString('en-GB', { timeZone: 'Asia/Colombo', hour12: false }); 

    const status = 'Approval Pending'; 

    let priceQuery = "SELECT Sell_Price FROM product WHERE Product_ID = ?";
    if (ProductID && ProductID.toString().startsWith('B')) {
        priceQuery = "SELECT Sell_Price FROM bulk_products WHERE BulkProductID = ?";
    }

    db.get(priceQuery, [ProductID], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: "Product not found in database!" });

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

// 🟢 5. API to edit both quantity and unit price and auto-calculate the total
router.put('/update-qty-price', (req, res) => {
    const { POID, newQty, unitPrice } = req.body;

    if (!POID || !newQty || unitPrice === undefined) {
        return res.status(400).json({ error: "POID, newQty, and unitPrice are required" });
    }

    const newTotal = parseFloat(unitPrice) * parseFloat(newQty);

    const updateQuery = "UPDATE orders SET Qty = ?, Total = ? WHERE POID = ?";
    db.run(updateQuery, [newQty, newTotal, POID], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: "Order details updated successfully!" });
    });
});

// 🔄 6. Status update and email trigger API
router.put('/update-status', (req, res) => {
    const { POID, newStatus } = req.body;

    if (!POID || !newStatus) {
        return res.status(400).json({ error: "POID and newStatus are required" });
    }

    const updateOrderQuery = "UPDATE orders SET Status = ? WHERE POID = ?";
    
    db.run(updateOrderQuery, [newStatus, POID], function(err) {
        if (err) return res.status(500).json({ error: err.message });

        const getOrderDetails = "SELECT ProductID, Name, Qty FROM orders WHERE POID = ?";
        
        db.get(getOrderDetails, [POID], (err, orderRow) => {
            if (err || !orderRow) return res.status(404).json({ error: "Order not found" });

            const { ProductID, Name, Qty } = orderRow;

            if (newStatus === 'Approved') {
                // 🟢 Here, 'ProductID' should be sent instead of 'Name' (this is required in SendEmailOrder.js to check for 'B' using prodId)
                sendApprovalEmail(POID, ProductID);
                return res.json({ success: true, message: `Order status updated to Approved and Email logic triggered.` });
            }

            if (newStatus === 'Received') {
                let updateStockQuery = "UPDATE product SET Quantity = Quantity + ? WHERE Product_ID = ?";
                if (ProductID && ProductID.toString().toUpperCase().startsWith('B')) {
                    updateStockQuery = "UPDATE bulk_products SET Quantity = Quantity + ? WHERE BulkProductID = ?";
                }
                
                db.run(updateStockQuery, [Qty, ProductID], function(err) {
                    if (err) return res.status(500).json({ error: err.message });
                    
                    // 🟢 It is also appropriate to provide 'ProductID' here instead of 'Name'
                    sendReceivedEmail(POID, ProductID);

                    return res.json({ 
                        success: true, 
                        message: `Order set to Received, Stock updated (+${Qty}) and Email logic triggered.` 
                    });
                });
            } else {
                return res.json({ success: true, message: `Order status updated to ${newStatus}` });
            }
        });
    });
});

module.exports = router;