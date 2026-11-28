const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Get the path to the 'invoice' folder
// This points to the backend/invoice folder
const invoiceDir = path.join(__dirname, '../invoice');

// Create the folder automatically if it was not created manually (safe)
if (!fs.existsSync(invoiceDir)) {
    fs.mkdirSync(invoiceDir, { recursive: true });
}

// API endpoint to save the PDF
router.post('/save-pdf', (req, res) => {
    const { pdfData, fileName } = req.body;

    if (!pdfData || !fileName) {
        return res.status(400).json({ success: false, message: "Missing data" });
    }

    const filePath = path.join(invoiceDir, fileName);

    // Clean the base64 string
    const base64Data = pdfData.replace(/^data:application\/pdf;base64,/, "");

    // Write the file
    fs.writeFile(filePath, base64Data, 'base64', (err) => {
        if (err) {
            console.error("PDF Save Error:", err);
            return res.status(500).json({ success: false, message: "Could not save PDF to server" });
        }
        console.log(`Invoice Saved: ${fileName}`);
        res.json({ success: true, message: "PDF saved successfully!" });
    });
});

module.exports = router;