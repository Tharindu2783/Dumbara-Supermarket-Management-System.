const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// 💡 '.db' ගොනුව කෙලින්ම require කරන්නේ නැතිව sqlite3 හරහා සම්බන්ධතාවය (Connection) ගොඩනැගීම
const dbPath = path.join(__dirname, '../app.db'); 
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Error connecting to app.db:", err.message);
    } else {
        console.log("Connected to app.db successfully for invoice deletion.");
    }
});

// 💡 server.js එකේ app.use('/api', ...) දාලා තියෙන නිසා මෙතනට '/delete-invoice/:id' පමණක් යොදයි
router.delete('/delete-invoice/:id', (req, res) => {
    const invoiceId = req.params.id;

    // 1. Database එකෙන් අදාළ Invoice record එක සදහටම මකා දැමීම
    const sql = `DELETE FROM Invoice WHERE InvoiceID = ?`;
    
    db.run(sql, [invoiceId], function (err) {
        if (err) {
            console.error("Database error during deletion:", err);
            return res.status(500).json({ success: false, message: "Database delete failed" });
        }

        // 2. Database එකෙන් මැකුණු පසු 'backend/invoice/' folder එකේ ඇති PDF එකේ path එක සෙවීම
        const pdfPath = path.join(__dirname, '../invoice', `${invoiceId}.pdf`);

        // 3. එම ස්ථානයේ PDF file එකක් තිබේදැයි පරීක්ෂා කර එය මකා දැමීම
        fs.access(pdfPath, fs.constants.F_OK, (fsErr) => {
            if (!fsErr) {
                // File එක තිබේ නම් එය මකා දමයි (unlink)
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

        // Frontend එකට සාර්ථක වූ බව පණිවිඩයක් යැවීම
        res.json({ success: true, message: "Invoice record and PDF file deleted successfully" });
    });
});

module.exports = router;