// backend/routes/SendEmailOrder.js
const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./app.db');

// 📧 Gmail Transporter එක සකස් කිරීම
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'tharinduprasad2783@gmail.com', 
        pass: 'ctqlbdlmolbmqosr' 
    }
});

// 🎯 Status එක Update කරලා ස්වයංක්‍රීයව Email එක යවන සහ Stock වැඩි කරන API Endpoint එක
router.put('/update-status', (req, res) => {
    const { POID, newStatus } = req.body;

    const updateSql = `UPDATE orders SET Status = ? WHERE POID = ?`;
    
    db.run(updateSql, [newStatus, POID], function(err) {
        if (err) {
            console.error("Database Update Error:", err.message);
            return res.status(500).json({ success: false, message: err.message });
        }

        // ==========================================================================
        // 1️⃣ මැනේජර් 'Approved' කළොත් යන Email එක
        // ==========================================================================
        if (newStatus === 'Approved') {
            const selectSql = `
                SELECT o.POID, o.Name AS OrderProductName, o.Qty, o.Total, s.Email AS SupplierEmail, s.Name AS SupplierName
                FROM orders o
                JOIN product p ON o.ProductID = p.Product_ID
                JOIN supplier s ON p.SupplierID = s.SupplierID
                WHERE o.POID = ?
            `;

            db.get(selectSql, [POID], (err, orderDetails) => {
                if (err || !orderDetails || !orderDetails.SupplierEmail) {
                    return res.json({ success: true, message: "Order Approved, but Supplier details not found." });
                }

                const mailOptions = {
                    from: '"Dumbara Supermarket" <dumbarasupermarket@gmail.com>',
                    to: orderDetails.SupplierEmail, 
                    subject: `🚨 NEW PURCHASE ORDER - ${orderDetails.POID}`,
                    html: `
                        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                            <h2 style="color: #d9534f;">Dumbara Supermarket - Purchase Order</h2>
                            <p>Dear <strong>${orderDetails.SupplierName}</strong>,</p>
                            <p>We are pleased to place a purchase order with you. Please find the order details below:</p>
                            
                            <table style="border: 1px solid #ddd; width: 100%; border-collapse: collapse; margin-top: 15px;">
                                <thead style="background-color: #f2f2f2;">
                                    <tr>
                                        <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">POID</th>
                                        <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Product Name</th>
                                        <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Quantity</th>
                                        <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Total Cost</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td style="padding: 10px; border: 1px solid #ddd;"><strong>${orderDetails.POID}</strong></td>
                                        <td style="padding: 10px; border: 1px solid #ddd;">${orderDetails.OrderProductName}</td>
                                        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${orderDetails.Qty}</td>
                                        <td style="padding: 10px; border: 1px solid #ddd; text-align: right; color: #2e7d32; font-weight: bold;">Rs. ${Number(orderDetails.Total).toFixed(2)}</td>
                                    </tr>
                                </tbody>
                            </table>
                            <p style="margin-top: 20px;">Please process this order as soon as possible.</p>
                        </div>
                    `
                };

                transporter.sendMail(mailOptions, (mailErr) => {
                    if (mailErr) return res.json({ success: true, message: "Order Approved, but Email failed." });
                    return res.json({ success: true, message: "Order Approved and Email sent to Supplier!" });
                });
            });

        // ==========================================================================
        // 2️⃣ 🌟 මැනේජර් 'Received' කළොත් (Stock එක වැඩි කර ඊමේල් යැවීම)
        // ==========================================================================
        } else if (newStatus === 'Received') {
            
            // 💡 මුලින්ම ඕඩර් එකට අදාළ ProductID එක සහ Qty එක සහ සප්ලයර්ගේ විස්තර ජොයින් කරලා ගන්නවා
            const selectSql = `
                SELECT o.POID, o.ProductID, o.Name AS OrderProductName, o.Qty, o.Total, s.Email AS SupplierEmail, s.Name AS SupplierName
                FROM orders o
                JOIN product p ON o.ProductID = p.Product_ID
                JOIN supplier s ON p.SupplierID = s.SupplierID
                WHERE o.POID = ?
            `;

            db.get(selectSql, [POID], (err, orderDetails) => {
                if (err || !orderDetails) {
                    return res.json({ success: true, message: "Order marked as Received, but Order details not found in Database." });
                }

                const { ProductID, Qty, OrderProductName, SupplierEmail, SupplierName, Total } = orderDetails;

                // 🎯 [ප්‍රධානම කොටස]: product ටේබල් එකේ Quantity එකට ඕඩර් එකේ තියෙන Qty එක එකතු කරනවා
                const updateStockSql = `UPDATE product SET Quantity = Quantity + ? WHERE Product_ID = ?`;
                
                db.run(updateStockSql, [Qty, ProductID], function(stockErr) {
                    if (stockErr) {
                        console.error("Stock Update Error:", stockErr.message);
                        return res.status(500).json({ success: false, message: "Failed to update product stock level." });
                    }

                    console.log(`✅ Stock updated successfully for ${ProductID}. Added +${Qty}`);

                    // 💡 සප්ලයර්ට ඊමේල් එකක් තිබේ නම් පමණක් ඊමේල් එක සකස් කර යවයි
                    if (SupplierEmail) {
                        const mailOptions = {
                            from: '"Dumbara Supermarket" <dumbarasupermarket@gmail.com>',
                            to: SupplierEmail, 
                            subject: `✅ ORDER RECEIVED CONFIRMATION - ${POID}`,
                            html: `
                                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                                    <h2 style="color: #2e7d32;">Order Received Confirmation</h2>
                                    <p>Dear <strong>${SupplierName}</strong>,</p>
                                    <p>This is to inform you that we have successfully received the items ordered under Purchase Order ID: <strong>${POID}</strong>.</p>
                                    
                                    <h3 style="margin-top: 20px; color: #555;">Received Order Summary:</h3>
                                    <table style="border: 1px solid #ddd; width: 100%; border-collapse: collapse; margin-top: 10px;">
                                        <thead style="background-color: #f9f9f9;">
                                            <tr>
                                                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Product Name</th>
                                                <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Received Qty</th>
                                                <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Total Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td style="padding: 10px; border: 1px solid #ddd;">${OrderProductName}</td>
                                                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${Qty}</td>
                                                <td style="padding: 10px; border: 1px solid #ddd; text-align: right; font-weight: bold;">Rs. ${Number(Total).toFixed(2)}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                    
                                    <p style="margin-top: 20px;">The stock has been updated in our system, and the payment process will be initiated accordingly.</p>
                                    <p>Thank you for your excellent service and prompt delivery!</p>
                                    <br/>
                                    <p>Best Regards,<br/><strong>Inventory Manager</strong><br/>Dumbara Supermarket</p>
                                </div>
                            `
                        };

                        // 📧 ඊමේල් එක යවනවා
                        transporter.sendMail(mailOptions, (mailErr) => {
                            if (mailErr) {
                                console.error("Nodemailer Error:", mailErr);
                                return res.json({ success: true, message: "Stock updated successfully, but Confirmation Email failed to send." });
                            }
                            return res.json({ success: true, message: `Order marked as Received, Stock updated (+${Qty}), and Email sent to Supplier!` });
                        });
                    } else {
                        // සප්ලයර්ට ඊමේල් එකක් නැත්නම් ස්ටොක් එක විතරක් අප්ඩේට් කරලා රෙස්පොන්ස් එක දෙනවා
                        return res.json({ success: true, message: `Order marked as Received and Stock updated (+${Qty}), but Supplier email was empty.` });
                    }
                });
            });

        } else {
            // Cancel වැනි වෙනත් එකක් නම් Email යවන්නේ නැතිව සාමාන්‍ය පරිදි Response කරයි
            res.json({ success: true, message: `Order status successfully changed to ${newStatus}.` });
        }
    });
});

module.exports = router;