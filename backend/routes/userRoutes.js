// backend/routes/userRoutes.js
const express = require('express');
const router = express.Router(); 
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const dbPath = path.join(__dirname, '../app.db'); 
const db = new sqlite3.Database(dbPath);

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'tharinduprasad2783@gmail.com', 
        pass: 'ctqlbdlmolbmqosr' 
    }
});

// Temporary OTP Store in memory
const profileOtpStore = {};
const managerOrAdminOtpStore = {};

// ==========================================
// 🍏 1. Fetch Users List (Basic)
// ==========================================
router.get('/users', (req, res) => {
    const query = "SELECT UserName, Role, email, contact FROM user";
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// ==========================================
// 🍏 1.1 Fetch All Users Detailed (Filtered by Role)
// ==========================================
router.get('/all-users', (req, res) => {
    const requester = req.headers['x-user-name'];

    db.get("SELECT Role FROM user WHERE UserName = ?", [requester], (err, user) => {
        if (err || !user) return res.status(403).json({ success: false, message: "Unauthorized request" });

        let query = "SELECT UserName, Role, email, contact, nic, address, birthday FROM user";
        let params = [];

        // Managers should only be able to view Assistants list in UI management
        if (user.Role === 'Manager') {
            query += " WHERE Role = 'Assistant'";
        }

        db.all(query, params, (err, rows) => {
            if (err) return res.status(500).json({ success: false, error: err.message });
            res.json({ success: true, data: rows });
        });
    });
});

// ==========================================
// 💡 2. User Login API
// ==========================================
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    db.get("SELECT * FROM user WHERE UserName = ?", [username], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (row && row.password === password) {
            const isTemp = row.password.startsWith('TMP');
            res.json({ 
                success: true, 
                user: row.UserName, 
                role: row.Role,
                isTemporary: isTemp
            });
        } else {
            res.status(401).json({ success: false, message: "Invalid credentials" });
        }
    });
});

// ==========================================
// ✨ 3. Create User API (Strict RBAC applied)
// ==========================================
router.post('/create-user', (req, res) => {
    const { newUsername, newEmail, newPhone, newNic, newAddress, newBirthday, role, createdBy } = req.body;

    if (!newUsername || !newEmail || !newPhone || !newNic || !newAddress || !newBirthday || !role || !createdBy) {
        return res.status(400).json({ success: false, message: "⚠️ All fields are required!" });
    }

    if (!newEmail.includes('@')) {
        return res.status(400).json({ success: false, message: "⚠️ Invalid Email address!" });
    }

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(newPhone)) {
        return res.status(400).json({ success: false, message: "⚠️ Phone Number must contain exactly 10 digits!" });
    }

    db.get("SELECT Role FROM user WHERE UserName = ?", [createdBy], (err, creator) => {
        if (err || !creator) {
            return res.status(403).json({ success: false, message: "⛔ Unauthorized access!" });
        }

        if (creator.Role === 'Assistant') {
            return res.status(403).json({ success: false, message: "⛔ Assistants are not allowed to create accounts!" });
        }

        if (creator.Role === 'Manager' && role !== 'Assistant') {
            return res.status(403).json({ success: false, message: "⛔ Managers are ONLY allowed to create Assistant accounts!" });
        }

        if (role === 'Admin' && creator.Role !== 'Admin') {
            return res.status(403).json({ success: false, message: "⛔ Only Admins can assign Admin role!" });
        }

        const tempPassword = 'TMP' + crypto.randomInt(100, 999);
        const insertQuery = "INSERT INTO user (UserName, password, contact, Role, email, nic, address, birthday) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        
        db.run(insertQuery, [newUsername, tempPassword, newPhone, role, newEmail, newNic, newAddress, newBirthday], function(insertErr) {
            if (insertErr) {
                if (insertErr.message.includes('UNIQUE')) {
                    return res.status(400).json({ success: false, message: "❌ Username already exists!" });
                }
                return res.status(500).json({ success: false, error: insertErr.message });
            }

            const mailOptions = {
                from: '"Dumbara Supermarket" <dumbarasupermarket@gmail.com>',
                to: newEmail,
                subject: `🔑 Welcome to Dumbara System - Account Created`,
                html: `
                    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 500px; border: 1px solid #ddd; border-radius: 12px; background: #fafafa;">
                        <h2 style="color: #2ecc71; text-align: center;">Dumbara Supermarket</h2>
                        <p>Dear <strong>${newUsername}</strong>,</p>
                        <p>Your account as a <strong>${role}</strong> has been created successfully.</p>
                        <div style="background: #ffffff; border: 1px solid #2ecc71; padding: 15px; border-radius: 8px; text-align: center; font-size: 18px; font-weight: bold; color: #e67e22;">
                            Username: ${newUsername}<br/>
                            Password: ${tempPassword}
                        </div>
                    </div>
                `
            };

            transporter.sendMail(mailOptions, (mailErr) => {
                if (mailErr) {
                    return res.status(500).json({ success: false, message: "User created, but email sending failed!" });
                }
                return res.json({ success: true, message: `🎉 New ${role} created successfully!` });
            });
        });
    });
});

// ==========================================
// 🔐 4. Temporary Password Reset
// ==========================================
router.post('/reset-permanent-password', (req, res) => {
    const { username, newPassword } = req.body;
    if (!username || !newPassword) return res.status(400).json({ success: false, message: "All fields are required" });

    const query = "UPDATE user SET password = ? WHERE UserName = ?";
    db.run(query, [newPassword, username], (err) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        return res.json({ success: true, message: "Password updated successfully!" });
    });
});

// ==========================================
// 🚨 5. Forgot Password API
// ==========================================
router.post('/forgot-password', (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(400).json({ success: false, message: "Username is required" });

    db.get("SELECT email FROM user WHERE UserName = ?", [username], (err, row) => {
        if (err || !row || !row.email) return res.status(404).json({ success: false, message: "Email not found!" });

        const userEmail = row.email;
        const tempPassword = 'TMP' + crypto.randomInt(100, 999);

        db.run("UPDATE user SET password = ? WHERE UserName = ?", [tempPassword, username], (updateErr) => {
            if (updateErr) return res.status(500).json({ success: false, error: updateErr.message });

            const mailOptions = {
                from: '"Dumbara Supermarket" <dumbarasupermarket@gmail.com>',
                to: userEmail,
                subject: `🔐 PASSWORD RESET - TEMPORARY PASSWORD`,
                html: `<p>Your temporary password: <b>${tempPassword}</b></p>`
            };

            transporter.sendMail(mailOptions, (mailErr) => {
                if (mailErr) return res.status(500).json({ success: false, message: "Email sending failed!" });
                return res.json({ success: true, message: "Temporary password sent!" });
            });
        });
    });
});

// ==========================================
// 🔐 6. Profile Settings Details API
// ==========================================
router.get('/profile-details/:username', (req, res) => {
    const { username } = req.params;
    db.get("SELECT UserName, Role, email, contact, nic, address, birthday FROM user WHERE UserName = ?", [username], (err, row) => {
        if (err || !row) return res.status(404).json({ success: false, message: "User not found" });
        res.json({ success: true, data: row });
    });
});

// ==========================================
// 📧 7. Send Profile OTP API (UPDATED FOR NEW EMAIL)
// ==========================================
router.post('/send-profile-otp', (req, res) => {
    const { username, email } = req.body;

    db.get("SELECT email FROM user WHERE UserName = ?", [username], (err, row) => {
        if (err || !row) return res.status(404).json({ success: false, message: "User not found!" });

        // 💡 Request එකෙන් අලුතෙන් වෙනස් කරපු email එකක් ආවොත් ඒකට යවනවා, නැත්නම් DB එකේ තියෙන email එක ගන්නවා
        const targetEmail = (email && email.trim() !== '') ? email : row.email;

        if (!targetEmail || !targetEmail.includes('@')) {
            return res.status(400).json({ success: false, message: "Invalid Email Address!" });
        }

        const otp = crypto.randomInt(100000, 999999).toString();
        profileOtpStore[username] = otp;

        const mailOptions = {
            from: '"Dumbara Supermarket" <dumbarasupermarket@gmail.com>',
            to: targetEmail, // 👈 අලුතෙන් Type කරපු Email එකට යයි!
            subject: `🔐 Dumbara System - Security Verification OTP`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 500px; border: 1px solid #ddd; border-radius: 12px; background: #fafafa;">
                    <h2 style="color: #2ecc71; text-align: center;">Dumbara Supermarket</h2>
                    <p>Dear <strong>${username}</strong>,</p>
                    <p>Your OTP Code for Profile Updates / Security Actions is:</p>
                    <div style="background: #ffffff; border: 1px solid #2ecc71; padding: 15px; border-radius: 8px; text-align: center; font-size: 24px; font-weight: bold; color: #2ecc71; letter-spacing: 4px;">
                        ${otp}
                    </div>
                    <p style="margin-top: 15px; font-size: 12px; color: #777;">This code is valid for 5 minutes.</p>
                </div>
            `
        };

        transporter.sendMail(mailOptions, (mailErr) => {
            if (mailErr) {
                console.error("Mail Send Error:", mailErr);
                return res.status(500).json({ success: false, message: "Email sending failed" });
            }
            res.json({ success: true, message: `OTP sent successfully to ${targetEmail}` });
        });
    });
});

// ==========================================
// 📧 7.1 Manager/Admin Security OTP Sender
// ==========================================
router.post('/manager/send-otp', (req, res) => {
    const { managerUsername } = req.body;

    db.get("SELECT email, Role FROM user WHERE UserName = ?", [managerUsername], (err, row) => {
        if (err || !row || (row.Role !== 'Manager' && row.Role !== 'Admin')) {
            return res.status(403).json({ success: false, message: "Unauthorized Manager or Admin Account!" });
        }

        const otp = crypto.randomInt(100000, 999999).toString();
        managerOrAdminOtpStore[managerUsername] = otp;

        const mailOptions = {
            from: '"Dumbara Supermarket" <dumbarasupermarket@gmail.com>',
            to: row.email,
            subject: `🛡️ Security Action Verification OTP Code`,
            html: `<p>Management Action Security Verification OTP Code: <b>${otp}</b></p>`
        };

        transporter.sendMail(mailOptions, (mailErr) => {
            if (mailErr) return res.status(500).json({ success: false, message: "OTP dispatch failed" });
            res.json({ success: true, message: "OTP code sent to email!" });
        });
    });
});

// ==========================================
// 🛠️ 8. Change Self Password
// ==========================================
router.post('/change-password-with-otp', (req, res) => {
    const { username, otp, newPassword } = req.body;

    if (!profileOtpStore[username] || profileOtpStore[username] !== otp) {
        return res.status(400).json({ success: false, message: "❌ Invalid or expired OTP code!" });
    }

    db.run("UPDATE user SET password = ? WHERE UserName = ?", [newPassword, username], (err) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        delete profileOtpStore[username];
        res.json({ success: true, message: "🎉 Password updated successfully!" });
    });
});

// ==========================================
// 🛠️ 9. Update Self Profile Details
// ==========================================
router.post('/update-profile-with-otp', (req, res) => {
    const { currentUsername, newUsername, newEmail, newPhone, newNic, newAddress, newBirthday, otp } = req.body;

    if (!profileOtpStore[currentUsername] || profileOtpStore[currentUsername] !== otp) {
        return res.status(400).json({ success: false, message: "❌ Invalid or expired OTP code!" });
    }

    const query = "UPDATE user SET UserName = ?, email = ?, contact = ?, nic = ?, address = ?, birthday = ? WHERE UserName = ?";
    db.run(query, [newUsername, newEmail, newPhone, newNic, newAddress, newBirthday, currentUsername], (err) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        delete profileOtpStore[currentUsername];
        res.json({ success: true, message: "🎉 Profile details updated successfully!" });
    });
});

// ==========================================
// 👑 10. Update Any User Details (Strict Role Restrictions)
// ==========================================
router.post('/manager/update-user', (req, res) => {
    const { managerUsername, targetOriginalUsername, newUsername, email, contact, nic, address, birthday, role, otp } = req.body;

    if (!managerOrAdminOtpStore[managerUsername] || managerOrAdminOtpStore[managerUsername] !== otp) {
        return res.status(400).json({ success: false, message: "❌ Invalid or expired Security OTP code!" });
    }

    db.get("SELECT Role FROM user WHERE UserName = ?", [managerUsername], (err, actor) => {
        if (err || !actor) return res.status(403).json({ success: false, message: "Unauthorized action!" });

        db.get("SELECT Role FROM user WHERE UserName = ?", [targetOriginalUsername], (targetErr, targetUser) => {
            if (targetErr || !targetUser) return res.status(404).json({ success: false, message: "Target user not found!" });

            if (actor.Role === 'Manager') {
                if (targetUser.Role !== 'Assistant') {
                    return res.status(403).json({ success: false, message: "⛔ Managers can ONLY edit Assistant accounts!" });
                }
                if (role !== 'Assistant') {
                    return res.status(403).json({ success: false, message: "⛔ Managers cannot elevate accounts to Manager/Admin!" });
                }
            }

            const query = "UPDATE user SET UserName = ?, email = ?, contact = ?, nic = ?, address = ?, birthday = ?, Role = ? WHERE UserName = ?";
            db.run(query, [newUsername, email, contact, nic, address, birthday, role, targetOriginalUsername], (updateErr) => {
                if (updateErr) return res.status(500).json({ success: false, error: updateErr.message });
                delete managerOrAdminOtpStore[managerUsername];
                res.json({ success: true, message: "🎉 Target user details updated successfully!" });
            });
        });
    });
});

// ==========================================
// 👑 11. Delete Any User (Strict Role Restrictions)
// ==========================================
router.post('/manager/delete-user', (req, res) => {
    const { managerUsername, targetUsername, otp } = req.body;

    if (!managerOrAdminOtpStore[managerUsername] || managerOrAdminOtpStore[managerUsername] !== otp) {
        return res.status(400).json({ success: false, message: "❌ Invalid or expired Security OTP code!" });
    }

    // ⛔ Rule 2: තමන්ගේම Account එක Delete කිරීම වැලැක්වීම (Admin & Manager දෙදෙනාටම)
    if (managerUsername.toLowerCase().trim() === targetUsername.toLowerCase().trim()) {
        return res.status(400).json({ success: false, message: "❌ Security Restriction: You cannot delete your own active account!" });
    }

    db.get("SELECT Role FROM user WHERE UserName = ?", [managerUsername], (err, actor) => {
        if (err || !actor) return res.status(403).json({ success: false, message: "Unauthorized action!" });

        db.get("SELECT Role FROM user WHERE UserName = ?", [targetUsername], (targetErr, targetUser) => {
            if (targetErr || !targetUser) return res.status(404).json({ success: false, message: "Target user not found!" });

            // Restriction Check: Manager can ONLY delete Assistant
            if (actor.Role === 'Manager' && targetUser.Role !== 'Assistant') {
                return res.status(403).json({ success: false, message: "⛔ Managers can ONLY delete Assistant accounts!" });
            }

            const query = "DELETE FROM user WHERE UserName = ?";
            db.run(query, [targetUsername], (deleteErr) => {
                if (deleteErr) return res.status(500).json({ success: false, error: deleteErr.message });
                delete managerOrAdminOtpStore[managerUsername];
                res.json({ success: true, message: "🗑️ Target user account deleted successfully!" });
            });
        });
    });
});
module.exports = router;