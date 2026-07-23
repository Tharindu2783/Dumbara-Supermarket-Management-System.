const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 💡 Use path.join to correctly locate the main backend app.db regardless of the folder
const dbPath = path.join(__dirname, '../app.db');
const db = new sqlite3.Database(dbPath);

// GET API - Retrieve unique years from the Invoice table
router.get('/get-invoice-years', (req, res) => {
    // 💡 In SQLite, substr(Date, 1, 4) extracts the year part from a date like "2026-05-25"
    const query = `
        SELECT DISTINCT substr(Date, 1, 4) AS Year 
        FROM Invoice 
        WHERE Date IS NOT NULL AND Date != ''
        ORDER BY Year ASC
    `;

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error("Error fetching invoice years:", err.message);
            return res.status(500).json({ error: err.message });
        }
        
        // Create a simple array like ['2026'] from the returned rows
        const years = rows.map(row => row.Year);
        
        // Print to the backend console for verification
        console.log("Fetched Years from DB:", years);
        
        // If there are no invoices, use the current year as the default
        if (years.length === 0) {
            years.push(new Date().getFullYear().toString());
        }
        
        res.json(years);
    });
});

module.exports = router;