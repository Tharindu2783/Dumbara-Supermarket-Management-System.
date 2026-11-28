const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const puppeteer = require('puppeteer');

const dbPath = path.resolve(__dirname, '../app.db');

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

// 🌐 1. Live Web Scraper Function (Keells / Cargills Search Simulation)
async function fetchLiveMarketPrice(productName) {
    let browser;
    try {
        // Headless Chrome Browser එකක් Open කිරීම
        browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        
        // Anti-Bot Detection වැළැක්වීමට User Agent එකක් යෙදීම
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Target Supermarket Search URL එකට යාම (Example: Keells Super)
        const searchUrl = `https://www.keellssuper.com/search?q=${encodeURIComponent(productName)}`;
        await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 15000 });

        // HTML DOM Elements වලින් Product Price එක Extract කරගැනීම
        const price = await page.evaluate(() => {
            const priceElement = document.querySelector('.product-price') || document.querySelector('.price') || document.querySelector('.current-price');
            if (priceElement) {
                const cleanedText = priceElement.innerText.replace(/[^0-9.]/g, '');
                return parseFloat(cleanedText);
            }
            return null;
        });

        await browser.close();
        return price;

    } catch (err) {
        if (browser) await browser.close();
        console.error(`Live Scraping failed for ${productName}:`, err.message);
        return null; // Scraping සාර්ථක නොවුණහොත් null return කරයි
    }
}

// 🌐 2. Static Benchmark Fallback Data (Scraper එක Block වුවහොත් භාවිතා කිරීමට)
const fallbackBenchmarks = {
    'sugar': 240,
    'samba': 220,
    'kottu me': 120,
    'baby soup': 160,
    'kome': 180,
    'anchor': 1050,
    'dhal': 290
};

// 📈 3. Competitor Price Check Route
router.post('/check-competitor-prices', async (req, res) => {
    try {
        const products = await runQuery(`SELECT Product_ID, Product_name, Sell_Price FROM product`);
        
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toTimeString().split(' ')[0];

        let alertCount = 0;
        const comparisonReport = [];

        for (const p of products) {
            const pNameLower = p.Product_name.toLowerCase();

            // 1. ප්‍රථමයෙන් සජීවීව Web Scraper එක මඟින් මිල සොයාගැනීමට උත්සාහ කරයි
            let marketPrice = await fetchLiveMarketPrice(p.Product_name);

            // 2. සජීවීව සොයාගත නොහැකි වුවහොත් Fallback Data ලබාගනී
            if (!marketPrice) {
                const matchedKey = Object.keys(fallbackBenchmarks).find(key => pNameLower.includes(key));
                if (matchedKey) {
                    marketPrice = fallbackBenchmarks[matchedKey];
                }
            }

            if (marketPrice) {
                const ourPrice = p.Sell_Price;
                const diff = ourPrice - marketPrice;

                comparisonReport.push({
                    productName: p.Product_name,
                    ourPrice: ourPrice,
                    marketPrice: marketPrice,
                    difference: diff,
                    status: diff > 0 ? 'HIGHER' : diff < 0 ? 'CHEAPER' : 'MATCHED'
                });

                // අපේ මිල මාර්කට් මිලට වඩා වැඩි නම් Notification එකක් සාදයි
                if (diff > 0) {
                    const title = `🌐 Competitor Price Alert`;
                    const msg = `Competitor Alert: Live market price for '${p.Product_name}' is Rs. ${marketPrice}. Your store price (Rs. ${ourPrice}) is Rs. ${diff} HIGHER than the market rate!`;

                    const existing = await runQuery(`SELECT id FROM notifications WHERE message = ?`, [msg]);
                    if (!existing || existing.length === 0) {
                        await runExec(
                            `INSERT INTO notifications (title, message, date, time, is_read) VALUES (?, ?, ?, ?, 0)`,
                            [title, msg, dateStr, timeStr]
                        );
                        alertCount++;
                    }
                }
            }
        }

        res.json({
            success: true,
            message: `Live competitor price check complete. ${alertCount} alerts generated.`,
            report: comparisonReport
        });

    } catch (err) {
        console.error("Competitor Check Error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;