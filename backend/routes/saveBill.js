const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// 'invoice' ෆෝල්ඩරයට ඇති පාර (Path) ලබා ගැනීම
// මෙය backend/invoice ෆෝල්ඩරය වෙත යොමු වේ
const invoiceDir = path.join(__dirname, '../invoice');

// ෆෝල්ඩරය manual හැදුවේ නැතිනම් ස්වයංක්‍රීයව සෑදීමට මෙය තබන්න (ආරක්ෂිතයි)
if (!fs.existsSync(invoiceDir)) {
    fs.mkdirSync(invoiceDir, { recursive: true });
}

// PDF එක සේව් කරන API Endpoint එක
router.post('/save-pdf', (req, res) => {
    const { pdfData, fileName } = req.body;

    if (!pdfData || !fileName) {
        return res.status(400).json({ success: false, message: "Missing data" });
    }

    const filePath = path.join(invoiceDir, fileName);

    // Base64 string එක පිරිසිදු කර ගැනීම
    const base64Data = pdfData.replace(/^data:application\/pdf;base64,/, "");

    // File එක ලිවීම
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