// backend/middleware/verifyToken.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../app.db');

const verifyToken = (req, res, next) => {
    // Capture the username sent from frontend headers
    const username = req.headers['x-user-name'];

    if (!username || username.trim() === "") {
        return res.status(403).json({ message: "Access Denied: No username provided!" });
    }

    const db = new sqlite3.Database(dbPath);

    // Fetch user details & role from DB to guarantee accurate RBAC check
    const query = `SELECT UserName, Role FROM user WHERE UserName = ?`;

    db.get(query, [username], (err, user) => {
        db.close();

        if (err) {
            console.error("Error fetching user role in middleware:", err.message);
            return res.status(500).json({ message: "Internal Server Error" });
        }

        if (!user) {
            return res.status(401).json({ message: "Unauthorized: User does not exist!" });
        }

        // Attach user info and role to the request object
        req.user = user.UserName;
        req.userRole = user.Role || 'Assistant'; // Default fallback if role is missing

        next();
    });
};

module.exports = verifyToken;