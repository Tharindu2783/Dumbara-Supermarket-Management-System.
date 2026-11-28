// backend/routes/viewinvoice.js
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// 💡 Route to securely read the PDF and stream it to the frontend
router.get('/invoice-pdf/:id', (req, res) => {
    const invoiceId = req.params.id;
    
    // Use the correct path from deleteinvoice.js (../invoice)
    const pdfPath = path.join(__dirname, '../invoice', `${invoiceId}.pdf`);

    // 🔍 First check whether the PDF file exists in the folder
    fs.access(pdfPath, fs.constants.F_OK, (err) => {
        if (err) {
            console.error(`❌ PDF not found at: ${pdfPath}`);
            return res.status(404).json({ success: false, message: "File Not Found" });
        }

        // 📄 If the file exists, set the content type to PDF and send it successfully to the frontend
        res.setHeader('Content-Type', 'application/pdf');
        res.sendFile(pdfPath);
    });
});

module.exports = router;