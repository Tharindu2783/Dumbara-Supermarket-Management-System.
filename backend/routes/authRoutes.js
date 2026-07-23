const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../backend/app.db'); // 💡 Path to the app.db file referenced in the screenshot
const db = new sqlite3.Database(dbPath);

// 🔐 Retrieve the list of users for the select dropdown
router.get('/users', (req, res) => {
    db.all("SELECT UserName FROM user", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 🔑 Main API to verify username and password against the database
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Write the query according to the column names shown in the screenshot
    const query = `SELECT * FROM user WHERE UserName = ? AND password = ?`;
    
    db.get(query, [username, password], (err, row) => {
        if (err) {
            return res.status(500).json({ success: false, message: "Database error" });
        }
        
        if (row) {
            // If correct, report success
            res.json({ success: true, message: "Login successful", user: row.UserName });
        } else {
            // If incorrect, return a 401 error
            res.status(401).json({ success: false, message: "Invalid username or password!" });
        }
    });
});

module.exports = router;