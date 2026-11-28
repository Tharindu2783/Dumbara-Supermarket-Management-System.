const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../backend/app.db');
const db = new sqlite3.Database(dbPath);

const dbGet = (query, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(query, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

const dbAll = (query, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

router.get('/dashboard-stats', async (req, res) => {
    try {
        const stats = {};

        // 1. Invoice summary (gross sales and profit)
        const sumRow = await dbGet(`SELECT SUM(Total) AS TotalSales, SUM(Profit) AS TotalProfit FROM Invoice`);
        stats.totalSales = sumRow ? (sumRow.TotalSales || 0) : 0;
        stats.totalProfit = sumRow ? (sumRow.TotalProfit || 0) : 0;

        // 2. Total products count (combined unit and bulk products)
const prodCountRow = await dbGet(`
    SELECT 
        (SELECT COUNT(*) FROM product) + (SELECT COUNT(*) FROM bulk_products) AS TotalProducts
`);
stats.totalProducts = prodCountRow ? (prodCountRow.TotalProducts || 0) : 0;

        // 3. Total Suppliers Count
        const supRow = await dbGet(`SELECT COUNT(*) AS TotalSuppliers FROM supplier`);
        stats.totalSuppliers = supRow ? (supRow.TotalSuppliers || 0) : 0;

        // 📊 4. Chart data (fully resolved timezone issues to retrieve 7 days of data)
        const chartRows = await dbAll(`
            WITH RECURSIVE dates(date_str) AS (
                -- 💡 Calculates the previous 6 days from the latest date in the database
                SELECT date((SELECT MAX(Date) FROM Invoice), '-6 days')
                UNION ALL
                SELECT date(date_str, '+1 day')
                FROM dates
                WHERE date_str < (SELECT MAX(Date) FROM Invoice)
            )
            SELECT 
                d.date_str AS Date, 
                COALESCE(SUM(i.Total), 0) AS DailySales, 
                COALESCE(SUM(i.Profit), 0) AS DailyProfit, 
                SUM(CASE WHEN i.InvoiceID IS NOT NULL THEN 1 ELSE 0 END) AS DailyCount
            FROM dates d
            LEFT JOIN Invoice i ON d.date_str = i.Date
            GROUP BY d.date_str
            ORDER BY d.date_str ASC
        `);
        stats.chartData = chartRows || [];

        console.log("=== LIVE 7-DAY (WITH TODAY) DASHBOARD DATA SENT ===");
        console.log(stats);

        res.json(stats);

    } catch (error) {
        console.error("Dashboard DB Error:", error);
        res.status(500).json({ error: "Internal Database Server Error", details: error.message });
    }
});

module.exports = router;