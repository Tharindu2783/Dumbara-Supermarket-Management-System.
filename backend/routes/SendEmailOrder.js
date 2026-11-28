const nodemailer = require('nodemailer');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../app.db'); 
const db = new sqlite3.Database(dbPath);

// ✉️ Transporter Setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'tharinduprasad2783@gmail.com', 
        pass: 'ctqlbdlmolbmqosr' 
    }
});

// 💡 Logic to format the quantity of a bulk product as g or Kg
function formatQuantity(qty, prodId) {
    if (prodId && prodId.toString().startsWith('B')) {
        if (Number(qty) < 1) {
            const grams = Number(qty) * 1000;
            return `${grams} g`;
        }
        return `${qty} Kg`;
    }
    return qty;
}

// 🎯 1. Email sent to the supplier after the manager approves the order (no price included)
function sendApprovalEmail(POID, prodId) {
    let selectSql = `
        SELECT o.POID, o.Name AS OrderProductName, o.Qty, s.Email AS SupplierEmail, s.Name AS SupplierName
        FROM orders o
        JOIN product p ON o.ProductID = p.Product_ID
        JOIN supplier s ON p.SupplierID = s.SupplierID
        WHERE o.POID = ?
    `;

    if (prodId && prodId.toString().startsWith('B')) {
        selectSql = `
            SELECT o.POID, o.Name AS OrderProductName, o.Qty, s.Email AS SupplierEmail, s.Name AS SupplierName
            FROM orders o
            JOIN bulk_products bp ON o.ProductID = bp.BulkProductID
            JOIN supplier s ON bp.SupplierID = s.SupplierID
            WHERE o.POID = ?
        `;
    }

    db.get(selectSql, [POID], (err, orderDetails) => {
        if (err || !orderDetails || !orderDetails.SupplierEmail) {
            console.log("❌ Order Approved, but Supplier details or Email not found in DB.");
            return;
        }

        const displayQty = formatQuantity(orderDetails.Qty, prodId);

        const mailOptions = {
            from: '"Dumbara Supermarket" <dumbarasupermarket@gmail.com>',
            to: orderDetails.SupplierEmail, 
            subject: `🚨 NEW PURCHASE ORDER APPROVED - ${orderDetails.POID}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; border: 1px solid #e0e0e0; border-radius: 10px;">
                    <h2 style="color: #2ecc71;">Dumbara Supermarket - Purchase Order</h2>
                    <p>Dear <strong>${orderDetails.SupplierName}</strong>,</p>
                    <p>We are pleased to inform you that Purchase Order <strong>${orderDetails.POID}</strong> has been approved. Please find the order details below:</p>
                    
                    <table style="border: 1px solid #ddd; width: 100%; border-collapse: collapse; margin-top: 15px;">
                        <thead style="background-color: #f2f2f2;">
                            <tr>
                                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">POID</th>
                                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Product Name</th>
                                <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Quantity</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="padding: 10px; border: 1px solid #ddd;"><strong>${orderDetails.POID}</strong></td>
                                <td style="padding: 10px; border: 1px solid #ddd;">${orderDetails.OrderProductName}</td>
                                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;"><b>${displayQty}</b></td>
                            </tr>
                        </tbody>
                    </table>

                    <p style="margin-top: 20px;">Please arrange delivery at your earliest convenience.</p>
                    <p>Thank you,<br><strong>Dumbara Supermarket Management</strong></p>
                </div>
            `
        };

        transporter.sendMail(mailOptions, (mailErr) => {
            if (mailErr) console.error("❌ Nodemailer Approval Email failed:", mailErr.message);
            else console.log("✅ Approval Email sent to Supplier:", orderDetails.SupplierEmail);
        });
    });
}

// 🎯 2. Email sent to the supplier after the manager marks the order as received (no price included)
function sendReceivedEmail(POID, prodId) {
    let selectSql = `
        SELECT o.POID, o.Name AS OrderProductName, o.Qty, s.Email AS SupplierEmail, s.Name AS SupplierName
        FROM orders o
        JOIN product p ON o.ProductID = p.Product_ID
        JOIN supplier s ON p.SupplierID = s.SupplierID
        WHERE o.POID = ?
    `;

    if (prodId && prodId.toString().startsWith('B')) {
        selectSql = `
            SELECT o.POID, o.Name AS OrderProductName, o.Qty, s.Email AS SupplierEmail, s.Name AS SupplierName
            FROM orders o
            JOIN bulk_products bp ON o.ProductID = bp.BulkProductID
            JOIN supplier s ON bp.SupplierID = s.SupplierID
            WHERE o.POID = ?
        `;
    }

    db.get(selectSql, [POID], (err, orderDetails) => {
        if (err || !orderDetails || !orderDetails.SupplierEmail) return;

        const { Qty, OrderProductName, SupplierEmail, SupplierName } = orderDetails;
        const displayQty = formatQuantity(Qty, prodId);

        const mailOptions = {
            from: '"Dumbara Supermarket" <dumbarasupermarket@gmail.com>',
            to: SupplierEmail, 
            subject: `✅ ORDER RECEIVED ACKNOWLEDGEMENT - ${POID}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; border: 1px solid #e0e0e0; border-radius: 10px;">
                    <h2 style="color: #3498db;">Order Received Confirmation</h2>
                    <p>Dear <strong>${SupplierName}</strong>,</p>
                    <p>This is an acknowledgement that we have successfully received the items ordered under Purchase Order ID: <strong>${POID}</strong>.</p>
                    
                    <table style="border: 1px solid #ddd; width: 100%; border-collapse: collapse; margin-top: 15px;">
                        <thead style="background-color: #f9f9f9;">
                            <tr>
                                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Product Name</th>
                                <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Received Qty</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="padding: 10px; border: 1px solid #ddd;">${OrderProductName}</td>
                                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;"><b>${displayQty}</b></td>
                            </tr>
                        </tbody>
                    </table>

                    <p style="margin-top: 20px;">Thank you for your service.</p>
                    <p>Best Regards,<br><strong>Dumbara Supermarket Management</strong></p>
                </div>
            `
        };

        transporter.sendMail(mailOptions, (mailErr) => {
            if (mailErr) console.error("❌ Nodemailer Received Email failed:", mailErr.message);
            else console.log("✅ Received Confirmation Email sent to Supplier:", SupplierEmail);
        });
    });
}

module.exports = { sendApprovalEmail, sendReceivedEmail };