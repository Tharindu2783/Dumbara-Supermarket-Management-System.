const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../app.db');

// Database Helper Functions
const runQuery = (query, params = []) => {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) return reject(err);
        });
        db.all(query, params, (err, rows) => {
            db.close();
            if (err) return reject(err);
            resolve(rows);
        });
    });
};

const runExec = (query, params = []) => {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) return reject(err);
        });
        db.run(query, params, function (err) {
            db.close();
            if (err) return reject(err);
            resolve(this);
        });
    });
};

// 💡 Notifications Table එක Initialize කිරීම
const initNotifTable = async () => {
    const createSql = `
        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            date TEXT NOT NULL,
            time TEXT NOT NULL,
            is_read INTEGER DEFAULT 0
        )
    `;
    await runExec(createSql);
};

initNotifTable().catch(console.error);

// 🤖 1. Run Apriori Algorithm & Generate AI Insights
router.post('/run-apriori', async (req, res) => {
    try {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toTimeString().split(' ')[0];

        let newNotifCount = 0;

        // 🛒 A. Market Basket Analysis (Apriori)
        const rows = await runQuery(`SELECT ProductNameList FROM invoice_products WHERE ProductNameList IS NOT NULL AND ProductNameList != ''`);

        if (rows && rows.length > 0) {
            const transactions = [];
            rows.forEach(r => {
                const items = r.ProductNameList.split(',')
                    .map(i => i.trim().toLowerCase())
                    .filter(i => i.length > 0);
                
                const uniqueItems = Array.from(new Set(items));
                if (uniqueItems.length > 1) {
                    transactions.push(uniqueItems);
                }
            });

            if (transactions.length > 0) {
                const itemSupport = {};
                const pairSupport = {};

                transactions.forEach(basket => {
                    basket.forEach(item => {
                        itemSupport[item] = (itemSupport[item] || 0) + 1;
                    });

                    for (let i = 0; i < basket.length; i++) {
                        for (let j = i + 1; j < basket.length; j++) {
                            const pair = [basket[i], basket[j]].sort().join(' | ');
                            pairSupport[pair] = (pairSupport[pair] || 0) + 1;
                        }
                    }
                });

                const minSupportCount = 2;
                const minConfidence = 0.4;
                const generatedRules = [];

                Object.keys(pairSupport).forEach(pair => {
                    const count = pairSupport[pair];
                    if (count >= minSupportCount) {
                        const [itemA, itemB] = pair.split(' | ');

                        const confA = count / itemSupport[itemA];
                        if (confA >= minConfidence) {
                            generatedRules.push({
                                antecedent: itemA,
                                consequent: itemB,
                                confidence: (confA * 100).toFixed(0),
                                support: count
                            });
                        }

                        const confB = count / itemSupport[itemB];
                        if (confB >= minConfidence) {
                            generatedRules.push({
                                antecedent: itemB,
                                consequent: itemA,
                                confidence: (confB * 100).toFixed(0),
                                support: count
                            });
                        }
                    }
                });

                for (const rule of generatedRules) {
                    const title = `💡 Smart Combo Recommendation`;
                    const msg = `Customers buying '${rule.antecedent.toUpperCase()}' frequently buy '${rule.consequent.toUpperCase()}' (${rule.confidence}% Confidence). Consider offering a bundled discount!`;

                    const existing = await runQuery(`SELECT id FROM notifications WHERE message = ?`, [msg]);
                    if (!existing || existing.length === 0) {
                        await runExec(
                            `INSERT INTO notifications (title, message, date, time, is_read) VALUES (?, ?, ?, ?, 0)`,
                            [title, msg, dateStr, timeStr]
                        );
                        newNotifCount++;
                    }
                }
            }
        }

        // ⚠️ B. Low Stock Alert Check (Quantity < 10)
        try {
            const lowStockProducts = await runQuery(`SELECT Product_name, Quantity FROM product WHERE Quantity < 10`);
            for (const p of lowStockProducts) {
                const title = `⚠️ Low Stock Alert`;
                const msg = `Product '${p.Product_name.toUpperCase()}' is running low! Only ${p.Quantity} units remaining in stock.`;

                const existing = await runQuery(`SELECT id FROM notifications WHERE message = ?`, [msg]);
                if (!existing || existing.length === 0) {
                    await runExec(
                        `INSERT INTO notifications (title, message, date, time, is_read) VALUES (?, ?, ?, ?, 0)`,
                        [title, msg, dateStr, timeStr]
                    );
                    newNotifCount++;
                }
            }
        } catch (stockErr) {
            console.error("Low stock query error:", stockErr);
        }

        res.json({
            success: true,
            message: `Apriori Analysis complete. ${newNotifCount} new AI recommendations/alerts generated.`
        });

    } catch (err) {
        console.error("Apriori Mining Error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// 🔔 2. Get All Notifications
router.get('/notifications', async (req, res) => {
    try {
        const notifications = await runQuery(`SELECT * FROM notifications ORDER BY id DESC LIMIT 30`);
        const unreadRow = await runQuery(`SELECT COUNT(*) as count FROM notifications WHERE is_read = 0`);
        const unreadCount = unreadRow[0] ? unreadRow[0].count : 0;

        res.json({
            success: true,
            notifications,
            unreadCount
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ✅ 3. Mark Notifications as Read
router.post('/notifications/mark-read', async (req, res) => {
    try {
        await runExec(`UPDATE notifications SET is_read = 1 WHERE is_read = 0`);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;