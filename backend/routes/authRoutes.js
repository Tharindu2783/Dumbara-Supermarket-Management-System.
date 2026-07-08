const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../backend/app.db'); // 💡 image_d9f41c.png එකේ තියෙන app.db එකට path එක
const db = new sqlite3.Database(dbPath);

// 🔐 පරිශීලකයන් ලැයිස්තුව Select එකට ලබා ගැනීමට (දැනටමත් ඔයා පාවිච්චි කරන එක)
router.get('/users', (req, res) => {
    db.all("SELECT UserName FROM user", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 🔑 ඩේටාබේස් එක හරහා Username සහ Password චෙක් කරන ප්‍රධාන API එක
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    // image_d9f41c.png එකේ තියෙන Column නම් වලට අනුවම Query එක ලියා ඇත
    const query = `SELECT * FROM user WHERE UserName = ? AND password = ?`;
    
    db.get(query, [username, password], (err, row) => {
        if (err) {
            return res.status(500).json({ success: false, message: "Database error" });
        }
        
        if (row) {
            // නිවැරදි නම් සාර්ථකයි කියලා දන්වනවා
            res.json({ success: true, message: "Login successful", user: row.UserName });
        } else {
            // වැරදි නම් 401 Error එකක් දෙනවා
            res.status(401).json({ success: false, message: "Invalid username or password!" });
        }
    });
});

module.exports = router;