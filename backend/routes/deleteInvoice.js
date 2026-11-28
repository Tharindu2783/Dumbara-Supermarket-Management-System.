const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// 💡 Create the database connection through sqlite3 instead of requiring the '.db' file directly
const dbPath = path.join(__dirname, '../app.db'); 
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Error connecting to app.db:", err.message);
    } else {
        console.log("Connected to app.db successfully for invoice deletion.");
    }
});

// 💡 Since app.use('/api', ...) is already defined in server.js, only '/delete-invoice/:id' is added here
router.delete('/delete-invoice/:id', (req, res) => {
    const invoiceId = req.params.id;

    // 1. Permanently delete the relevant invoice record from the database
    const sql = `DELETE FROM Invoice WHERE InvoiceID = ?`;
    
    db.run(sql, [invoiceId], function (err) {
        if (err) {
            console.error("Database error during deletion:", err);
            return res.status(500).json({ success: false, message: "Database delete failed" });
        }

        // 2. After deleting the record from the database, locate the PDF file path in the 'backend/invoice/' folder
        const pdfPath = path.join(__dirname, '../invoice', `${invoiceId}.pdf`);

        // 3. Check whether a PDF file exists at that location and delete it
        fs.access(pdfPath, fs.constants.F_OK, (fsErr) => {
            if (!fsErr) {
                // If the file exists, delete it (unlink)
                fs.unlink(pdfPath, (unlinkErr) => {
                    if (unlinkErr) {
                        console.error("Error deleting PDF file from folder:", unlinkErr);
                    } else {
                        console.log(`Successfully deleted PDF file: ${invoiceId}.pdf`);
                    }
                });
            } else {
                console.log(`PDF file not found for ${invoiceId}, skipped file deletion.`);
            }
        });

        // Send a success message to the frontend
        res.json({ success: true, message: "Invoice record and PDF file deleted successfully" });
    });
});

module.exports = router;