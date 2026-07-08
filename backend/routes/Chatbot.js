const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require('@google/genai');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 📌 ඔයාගේ SQLite app.db ගොනුව තිබෙන නිවැරදිම ස්ථානය
const dbPath = path.resolve(__dirname, '../app.db');

// 👑 Gemini API Key එක මෙතැනට ලබා දෙන්න
const ai = new GoogleGenAI({ apiKey: process.env.GCP_API_KEY });

// Async විදිහට SQL queries රන් කිරීමට සාදාගත් Helper Function එකක්
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

// 🤖 Chatbot Main API Endpoint
router.post('/chat', async (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ error: "Message is required" });
    }

    try {
        let finalPrompt = message;
        const lowerMessage = message.toLowerCase();

        // 🔍 වඩාත් පුළුල් ලෙස වචන පරීක්ෂා කිරීම (සිංහල සහ ඉංග්‍රීසි ප්‍රධාන වචන සියල්ලම)
        if (
            lowerMessage.includes('predict') || 
            lowerMessage.includes('prediction') || 
            lowerMessage.includes('sales') || 
            lowerMessage.includes('profit') || 
            lowerMessage.includes('business') || 
            lowerMessage.includes('stock') || 
            lowerMessage.includes('product') || 
            lowerMessage.includes('supplier') || 
            lowerMessage.includes('අනාවැකි') ||
            lowerMessage.includes('ලාභය') ||
            lowerMessage.includes('ලාභ') ||
            lowerMessage.includes('අලෙවි') ||
            lowerMessage.includes('විකුණුම්') ||
            lowerMessage.includes('දින') ||
            lowerMessage.includes('භාණ්ඩ') ||
            lowerMessage.includes('ස්ටොක්') ||
            lowerMessage.includes('ඩේටාබේස්')
        ) {
            
            // 1. Invoice ටේබල් එකෙන් දිනපතා විකුණුම් සහ ලාභය ලබා ගැනීම (පසුගිය වාර්තා 30ක්)
            const salesSummary = await runQuery(`
                SELECT 
                    Date, 
                    SUM(Total) as DailySales, 
                    SUM(Profit) as DailyProfit, 
                    COUNT(InvoiceID) as DailyCount 
                FROM Invoice 
                GROUP BY Date 
                ORDER BY Date DESC 
                LIMIT 30
            `);

            // 2. product ටේබල් එකෙන් මේ වන විට ස්ටොක් එකේ අඩුම භාණ්ඩ 5 (Low Stock Items)
            const lowStockProducts = await runQuery(`
                SELECT Product_name, Brand, Quantity, Sell_Price 
                FROM product 
                ORDER BY Quantity ASC 
                LIMIT 5
            `);

            // 3. මුළු පද්ධතියේම පවතින සාරාංශ දත්ත (Total Overview)
            const overallStats = await runQuery(`
                SELECT 
                    (SELECT SUM(Total) FROM Invoice) as GrandSales,
                    (SELECT SUM(Profit) FROM Invoice) as GrandProfit,
                    (SELECT COUNT(*) FROM product) as ProductCount,
                    (SELECT COUNT(*) FROM supplier) as SupplierCount
            `);

            // 4. Gemini AI එකට ලබා දෙන Context එක සකස් කිරීම
            finalPrompt = `
            You are the Chief AI Business Analyst for 'Dumbara Supermarket'. 
            The store manager or owner is asking you the following question: "${message}".

            To help you provide a highly specific, data-driven response, here is the live analytical data retrieved from our SQLite database (app.db):

            ==================================================
            1. OVERALL STORE SUMMARY:
            - Gross Sales: Rs. ${overallStats[0]?.GrandSales || 0}
            - Gross Profit: Rs. ${overallStats[0]?.GrandProfit || 0}
            - Active Products in Inventory: ${overallStats[0]?.ProductCount || 0}
            - Registered Suppliers: ${overallStats[0]?.SupplierCount || 0}

            2. RECENT DAILY SALES & PROFIT TRENDS (Last 30 Active Days):
            ${JSON.stringify(salesSummary)}

            3. CURRENT CRITICAL LOW STOCK ITEMS (Top 5 items to reorder):
            ${JSON.stringify(lowStockProducts)}
            ==================================================

            Your Instructions as the AI Analyst:
            - Analyze the provided live database data.
            - Answer the user's specific question directly using the numbers/dates/items from the database summary above. 
            - If they ask about the highest sales days ("වැඩිම අලෙවියක් සිදුවූ දින"), look at the 'Recent Daily Sales' array, find the dates with the maximum 'DailySales' value, and list them clearly.
            - Provide actionable business insights or warning alerts if necessary.
            - Never state that you do not have access to real-time or business data, because the live database context is provided above.
            - LANGUAGE CONSTRAINT: If the user writes their query in Sinhala, reply accurately and naturally in Sinhala. If they write in English, reply in English.
            - FORMATTING CONSTRAINT: DO NOT use any markdown tags, asterisks, or stars (like **, *, or ###) in your response. 
            - Use plain text only. 
            - For lists or bullet points, just use standard numbers (1, 2, 3) or simple dashes (-) without any asterisks.
            `;
        }

        // 🚀 Gemini API එක ක්‍රියාත්මක කිරීම
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: finalPrompt,
        });

        // AI පිළිතුර React App එක වෙත යැවීම
        res.json({ reply: response.text });

    } catch (error) {
        console.error("Chatbot Error:", error);
        res.status(500).json({ error: "An error occurred while connecting with Dumbara AI Engine." });
    }
});

module.exports = router;