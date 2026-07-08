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

        // 1. Invoice Summary (Gross Sales & Profit)
        const sumRow = await dbGet(`SELECT SUM(Total) AS TotalSales, SUM(Profit) AS TotalProfit FROM Invoice`);
        stats.totalSales = sumRow ? (sumRow.TotalSales || 0) : 0;
        stats.totalProfit = sumRow ? (sumRow.TotalProfit || 0) : 0;

        // 2. Total Products Count
        const prodRow = await dbGet(`SELECT COUNT(*) AS TotalProducts FROM product`);
        stats.totalProducts = prodRow ? (prodRow.TotalProducts || 0) : 0;

        // 3. Total Suppliers Count
        const supRow = await dbGet(`SELECT COUNT(*) AS TotalSuppliers FROM supplier`);
        stats.totalSuppliers = supRow ? (supRow.TotalSuppliers || 0) : 0;

        // 4. Chart Data (Last 7 Days Sales)
       
        const chartRows = await dbAll(`
            SELECT Date, SUM(Total) AS DailySales, SUM(Profit) AS DailyProfit, COUNT(InvoiceID) AS DailyCount
            FROM Invoice 
            WHERE Date IS NOT NULL AND Date != ''
            GROUP BY Date 
            ORDER BY Date ASC 
            LIMIT 7
        `);
        stats.chartData = chartRows || [];
        stats.chartData = chartRows || [];

        // Node.js Terminal එකේ දත්ත ටික නිවැරදිව පෙන්වනවාදැයි බලාගැනීමට
        console.log("=== LIVE DASHBOARD DATA SENT ===");
        console.log(stats);

        res.json(stats);

    } catch (error) {
        console.error("Dashboard DB Error:", error);
        res.status(500).json({ error: "Internal Database Server Error", details: error.message });
    }
});

module.exports = router;