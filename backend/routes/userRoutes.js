const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database සම්බන්ධතාවය
const dbPath = path.join(__dirname, '../app.db');
const db = new sqlite3.Database(dbPath);

// API: සියලුම User Names ලබා ගැනීම (Drop-down එක සඳහා)
router.get('/users', (req, res) => {
    db.all("SELECT UserName FROM user", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// API: Login පරීක්ෂා කිරීම
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT * FROM user WHERE UserName = ? AND password = ?", [username, password], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row) {
            res.json({ success: true, user: row.UserName });
        } else {
            res.status(401).json({ success: false, message: "Invalid credentials" });
        }
    });
});

module.exports = router;