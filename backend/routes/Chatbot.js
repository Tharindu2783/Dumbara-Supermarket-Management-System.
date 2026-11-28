require('dotenv').config(); 
const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require('@google/genai'); 
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../app.db');

const ai = new GoogleGenAI({ 
    apiKey: process.env.GCP_API_KEY 
});

// Helper Function to Execute SQL Queries Safely
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

// Helper: Dates in YYYY-MM-DD Local Format
const getTodayDate = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getYesterdayDate = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// 🤖 Chatbot Main API Endpoint
router.post('/chat', async (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ error: "Message is required" });
    }

    try {
        const lowerMsg = message.toLowerCase();
        let dbDataContext = "";

        const numberMatch = lowerMsg.match(/\d+/g);
        const extractedNumber = numberMatch ? parseFloat(numberMatch[0]) : null;

        // =========================================================
        // NEW: PREDICTION & FUTURE SALES / PROFIT / TRANSACTION ANALYSIS
        // =========================================================
        if (
            lowerMsg.includes('predict') || lowerMsg.includes('future') || 
            lowerMsg.includes('idiri') || lowerMsg.includes('anagatha') || 
            lowerMsg.includes('forecast') || lowerMsg.includes('next') || 
            lowerMsg.includes('issarahata') || lowerMsg.includes('iwediyata')
        ) {
            // 1. Fetch Past 30 Days Summary Data
            const past30DaysStats = await runQuery(
                `SELECT 
                    COUNT(DISTINCT Date) as totalActiveDays,
                    COUNT(InvoiceID) as totalTransactions, 
                    COALESCE(SUM(Product_Qty), 0) as totalItemsSold, 
                    COALESCE(SUM(Total), 0) as totalSalesRevenue, 
                    COALESCE(SUM(Profit), 0) as totalProfit,
                    COALESCE(AVG(Total), 0) as avgSalesPerInvoice,
                    COALESCE(AVG(Profit), 0) as avgProfitPerInvoice
                 FROM Invoice 
                 WHERE Date >= DATE('now', '-30 days')`
            );

            // 2. Fetch Recent Daily Sales Trend (Last 7 Days)
            const dailyTrends = await runQuery(
                `SELECT 
                    Date, 
                    COUNT(InvoiceID) as transactions,
                    SUM(Total) as dailySales, 
                    SUM(Profit) as dailyProfit 
                 FROM Invoice 
                 WHERE Date >= DATE('now', '-7 days') 
                 GROUP BY Date 
                 ORDER BY Date ASC`
            );

            const stats30 = past30DaysStats[0] || {};
            const activeDays = stats30.totalActiveDays || 1;
            const avgDailySales = ((stats30.totalSalesRevenue || 0) / activeDays).toFixed(2);
            const avgDailyProfit = ((stats30.totalProfit || 0) / activeDays).toFixed(2);
            const avgDailyTransactions = ((stats30.totalTransactions || 0) / activeDays).toFixed(1);

            dbDataContext = `
            HISTORICAL BUSINESS PERFORMANCE & PREDICTION DATA (Past 30 Days):
            - Active Operating Days Recorded: ${activeDays} days
            - Total Cumulative Sales (30 Days): Rs. ${(stats30.totalSalesRevenue || 0).toFixed(2)}
            - Total Cumulative Profit (30 Days): Rs. ${(stats30.totalProfit || 0).toFixed(2)}
            - Total Transactions (30 Days): ${stats30.totalTransactions || 0}
            - Total Items Sold (30 Days): ${stats30.totalItemsSold || 0}
            
            CALCULATED DAILY AVERAGES (For Future Forecasts):
            - Average Daily Sales Revenue: Rs. ${avgDailySales}
            - Average Daily Profit: Rs. ${avgDailyProfit}
            - Average Daily Transactions: ${avgDailyTransactions} per day

            RECENT 7-DAY SALES & PROFIT TREND BREAKDOWN:
            ${JSON.stringify(dailyTrends)}
            `;
        }

        // =========================================================
        // 1. INVOICE / DAILY SALES & PROFIT ANALYSIS
        // =========================================================
        else if (
            lowerMsg.includes('sale') || lowerMsg.includes('sales') || 
            lowerMsg.includes('profit') || lowerMsg.includes('labha') || 
            lowerMsg.includes('wikinuna') || lowerMsg.includes('income') || 
            lowerMsg.includes('alewi') || lowerMsg.includes('ganudenu') || lowerMsg.includes('revenue')
        ) {
            
            let dateTarget = getTodayDate();
            let dateName = "Today";

            if (lowerMsg.includes('iye') || lowerMsg.includes('yesterday')) {
                dateTarget = getYesterdayDate();
                dateName = "Yesterday";
            }

            // Query 1: Fetch overall total sales and profit from Invoice table
            const invoiceTotals = await runQuery(
                `SELECT 
                    COUNT(InvoiceID) as totalTransactions, 
                    COALESCE(SUM(Product_Qty), 0) as totalItemsSold, 
                    COALESCE(SUM(Total), 0) as totalSalesRevenue, 
                    COALESCE(SUM(Profit), 0) as totalProfit 
                 FROM Invoice 
                 WHERE Date = ?`, 
                [dateTarget]
            );

            // Query 2: Fetch product details breakdown from invoice_products table
            const itemRows = await runQuery(
                `SELECT ProductNameList, CountList FROM invoice_products WHERE Date = ?`,
                [dateTarget]
            );

            const productMap = {};
            if (itemRows && itemRows.length > 0) {
                itemRows.forEach(row => {
                    const names = (row.ProductNameList || '').split(',').map(s => s.trim());
                    const counts = (row.CountList || '').split(',').map(s => parseInt(s.trim()) || 0);

                    names.forEach((name, idx) => {
                        if (name) {
                            const qty = counts[idx] || 1;
                            productMap[name] = (productMap[name] || 0) + qty;
                        }
                    });
                });
            }

            const stats = invoiceTotals[0] || {};
            
            dbDataContext = `
            Financial & Sales Data for ${dateName} (${dateTarget}):
            - Total Sales Revenue (Mulu Sales): Rs. ${(stats.totalSalesRevenue || 0).toFixed(2)}
            - Total Net Profit (Mulu Profit): Rs. ${(stats.totalProfit || 0).toFixed(2)}
            - Total Transactions (Ganudenu Gana): ${stats.totalTransactions || 0}
            - Total Items Sold (Wikinunu Badu Gana): ${stats.totalItemsSold || 0}
            - Product Wise Quantity Breakdown: ${JSON.stringify(productMap)}
            `;
        }

        // =========================================================
        // 2. BULK PRODUCTS TABLE ANALYSIS
        // =========================================================
        else if (lowerMsg.includes('bulk')) {
            if (lowerMsg.includes('adu') || lowerMsg.includes('low') || lowerMsg.includes('qty') || lowerMsg.includes('quantity')) {
                const limitQty = extractedNumber || 10;
                const data = await runQuery(`SELECT Product_name, Quantity, Purchase_Price, Sell_Price FROM bulk_products WHERE Quantity <= ? ORDER BY Quantity ASC`, [limitQty]);
                dbDataContext = `Bulk Products with Low Quantity (<= ${limitQty}): ${JSON.stringify(data)}`;
            } 
            else if (lowerMsg.includes('discount') || lowerMsg.includes('wattam')) {
                const data = await runQuery(`SELECT Product_name, Discount, Max_Discount, Sell_Price FROM bulk_products ORDER BY Discount DESC LIMIT 10`);
                dbDataContext = `Bulk Products Discount Info: ${JSON.stringify(data)}`;
            }
            else if (lowerMsg.includes('wadi') || lowerMsg.includes('high') || lowerMsg.includes('price') || lowerMsg.includes('ganan') || lowerMsg.includes('value')) {
                const priceLimit = extractedNumber || 1000;
                const operator = lowerMsg.includes('adu') ? '<=' : '>=';
                const data = await runQuery(`SELECT Product_name, Sell_Price, Quantity FROM bulk_products WHERE Sell_Price ${operator} ? ORDER BY Sell_Price DESC LIMIT 10`, [priceLimit]);
                dbDataContext = `Bulk Products Price Filter (${operator} ${priceLimit}): ${JSON.stringify(data)}`;
            }
            else {
                const data = await runQuery(`SELECT Product_name, Purchase_Price, Sell_Price, Quantity, Discount FROM bulk_products LIMIT 15`);
                dbDataContext = `General Bulk Products List: ${JSON.stringify(data)}`;
            }
        }

        // =========================================================
        // 3. RETAIL PRODUCT TABLE ANALYSIS
        // =========================================================
        else if (lowerMsg.includes('product') || lowerMsg.includes('bhadu') || lowerMsg.includes('item') || lowerMsg.includes('stock')) {
            if (lowerMsg.includes('adu') || lowerMsg.includes('low') || lowerMsg.includes('iwarawi')) {
                const limitQty = extractedNumber || 10;
                const data = await runQuery(`SELECT Product_name, Quantity, Brand, Sell_Price FROM product WHERE Quantity <= ? ORDER BY Quantity ASC`, [limitQty]);
                dbDataContext = `Retail Products Low in Stock (<= ${limitQty}): ${JSON.stringify(data)}`;
            } 
            else if (lowerMsg.includes('discount') || lowerMsg.includes('wattam')) {
                const data = await runQuery(`SELECT Product_name, Discount, Max_Discount, Sell_Price FROM product WHERE Discount > 0 ORDER BY Discount DESC LIMIT 10`);
                dbDataContext = `Retail Products with Active Discounts: ${JSON.stringify(data)}`;
            }
            else if (lowerMsg.includes('price') || lowerMsg.includes('mila') || lowerMsg.includes('value') || lowerMsg.includes('ganan')) {
                const priceLimit = extractedNumber || 500;
                const operator = (lowerMsg.includes('adu') || lowerMsg.includes('ocha')) ? '<=' : '>=';
                const data = await runQuery(`SELECT Product_name, Sell_Price, Quantity, Brand FROM product WHERE Sell_Price ${operator} ? ORDER BY Sell_Price DESC LIMIT 10`, [priceLimit]);
                dbDataContext = `Retail Products Price Filter (${operator} ${priceLimit}): ${JSON.stringify(data)}`;
            }
            else if (lowerMsg.includes('profit') || lowerMsg.includes('labha')) {
                const data = await runQuery(`SELECT Product_name, Sell_Price, Purchase_Price, Profit FROM product ORDER BY Profit DESC LIMIT 10`);
                dbDataContext = `Top Highest Profit Margin Products: ${JSON.stringify(data)}`;
            }
            else {
                const data = await runQuery(`SELECT Product_name, Brand, Sell_Price, Quantity FROM product LIMIT 15`);
                dbDataContext = `Retail Product Sample Data: ${JSON.stringify(data)}`;
            }
        }

        // =========================================================
        // 4. SUPPLIER DETAILS
        // =========================================================
        else if (lowerMsg.includes('supplier') || lowerMsg.includes('sapayumkaru')) {
            const suppliers = await runQuery(`SELECT SupplierID, Name, Contact, Email FROM supplier`);
            dbDataContext = `Registered Suppliers Details: ${JSON.stringify(suppliers)}`;
        }

        // =========================================================
        // 5. ORDERS DETAILS (Purchase Orders / PO)
        // =========================================================
        else if (lowerMsg.includes('order') || lowerMsg.includes('po') || lowerMsg.includes('poid')) {
            if (lowerMsg.includes('pending') || lowerMsg.includes('approval') || lowerMsg.includes('cancel')) {
                const statusQuery = lowerMsg.includes('cancel') ? 'Canceled' : 'Approval Pending';
                const orders = await runQuery(`SELECT POID, Name, Qty, Total, Date, Status FROM orders WHERE Status LIKE ? ORDER BY Date DESC`, [`%${statusQuery}%`]);
                dbDataContext = `Orders with Status (${statusQuery}): ${JSON.stringify(orders)}`;
            } else {
                const orders = await runQuery(`SELECT POID, Name, Qty, Total, Date, Status FROM orders ORDER BY Date DESC LIMIT 15`);
                dbDataContext = `Recent Purchase Orders: ${JSON.stringify(orders)}`;
            }
        }

        // =========================================================
        // 6. REPORTS & GENERAL STATS
        // =========================================================
        else if (lowerMsg.includes('report')) {
            const reports = await runQuery(`SELECT ReportID, ReportName, Date, Time FROM Report ORDER BY Date DESC LIMIT 10`);
            dbDataContext = `Generated System Reports: ${JSON.stringify(reports)}`;
        }

        // =========================================================
        // STEP 2: Pass Data & Rules to Gemini AI for Smart Response
        // =========================================================
        const prompt = `
        You are the Chief AI Business Analyst for 'Dumbara Supermarket'.
        The user asked: "${message}"

        Database Context gathered:
        ${dbDataContext ? dbDataContext : "No exact DB table matched. Answer using general supermarket management advice."}

        INSTRUCTIONS:
        1. When user asks for future sales, profit, or transaction predictions, analyze the HISTORICAL DATA provided (30-day averages & 7-day trend). State projected daily/weekly/monthly expectations for Sales Revenue, Profit, and Transaction Count based on these past performance trends.
        2. When user asks about total sales or profit for today/yesterday, state BOTH the Total Sales (Revenue) in Rs. and Total Profit in Rs. clearly along with transaction count and items sold.
        3. DO NOT use markdown like **, *, # or HTML bold formatting. Keep response in plain, simple text.
        4. LANGUAGE: Reply in Singlish/Sinhala if user asked in Singlish/Sinhala. Reply in English if asked in English.
        `;

        const aiResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        res.json({ reply: aiResponse.text || "can not find informations" });

    } catch (error) {
        console.error("Chatbot Error:", error); 
        res.status(500).json({ error: error.message || "An error occurred while processing" });
    }
});

module.exports = router;