// backend/server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

app.use(cors());

// 💡 Payload limit configuration for PDF Base64 & large JSON data
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ==========================================
// 🛡️ MIDDLEWARE IMPORT
// ==========================================
const verifyToken = require('./middleware/verifyToken'); 

// Optional Role Guard Middleware Helper
const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.userRole || !allowedRoles.includes(req.userRole)) {
            return res.status(403).json({ 
                message: `Access Denied: Requires one of these roles: ${allowedRoles.join(', ')}` 
            });
        }
        next();
    };
};

// ==========================================
// 📥 ROUTES IMPORT (REQUIRE) SECTION
// ==========================================
const dashboardRoute = require('./routes/dashboardRoute.js');
const billingRoutes = require('./routes/billingRoutes');
const addinvoice = require('./routes/addinvoice.js');  
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const productIdRoute = require('./routes/productIdRoute');
const productSupplierRoute = require('./routes/productSupplierID');
const addProductRoute = require('./routes/addproductdetails.js');
const productActionsRoute = require('./routes/productActions.js');
const getsuppliersRoute = require('./routes/getsuppliers.js');
const getSupplierIDRoute = require('./routes/getsupplierID.js'); 
const addSupplierRoute = require('./routes/addsupplier.js'); 
const supplierActionsRoute = require('./routes/supplierActions.js');   
const saveBillRoute = require('./routes/saveBill.js');
const getINVtabledata = require('./routes/getINVtabledata');
const deleteInvoiceRoute = require('./routes/deleteInvoice');
const setreportyear = require('./routes/setreportyear.js');
const createsalesreport = require('./routes/createsalesreport.js');
const setREPID = require('./routes/setREPID.js');
const updateReportTable = require('./routes/updateReportTable.js');
const deleteReportRoute = require('./routes/deleteReport.js');
const orderReqRoutes = require('./routes/OrderReqRoutes');
const createProfitReport = require('./routes/createProfitReport.js'); 
const viewInvoiceRouter = require('./routes/viewinvoice'); 
const chatbotRoute = require('./routes/Chatbot.js'); 
const aprioriRoutes = require('./routes/aprioriRoutes.js'); 
const competitorRoutes = require('./routes/competitorRoutes.js');

// ==========================================
// ⚙️ EXPRESS APP MIDDLEWARE & ROUTES USAGE
// ==========================================

// 🔓 Public Routes (can be used without logging in)
app.use('/api', userRoutes);
app.use('/api', chatbotRoute);
app.use('/api', aprioriRoutes); 

// 🔒 Protected API Routes (only work when logged in and pass through verifyToken)
app.use('/api', verifyToken, dashboardRoute);
app.use('/api', verifyToken, productRoutes);
app.use('/api', verifyToken, billingRoutes);
app.use('/api', verifyToken, addinvoice);
app.use('/api', verifyToken, productIdRoute);
app.use('/api', verifyToken, productSupplierRoute);
app.use('/api', verifyToken, addProductRoute);
app.use('/api', verifyToken, productActionsRoute);
app.use('/api', verifyToken, getsuppliersRoute);
app.use('/api', verifyToken, getSupplierIDRoute);
app.use('/api', verifyToken, addSupplierRoute);
app.use('/api', verifyToken, supplierActionsRoute);
app.use('/api', verifyToken, saveBillRoute);
app.use('/api', verifyToken, getINVtabledata);
app.use('/api', verifyToken, deleteInvoiceRoute);
app.use('/api', verifyToken, setreportyear);
app.use('/api', verifyToken, createsalesreport);
app.use('/api', verifyToken, setREPID);
app.use('/api', verifyToken, updateReportTable);
app.use('/api', verifyToken, deleteReportRoute);
app.use('/api', verifyToken, createProfitReport); 
app.use('/api/orders', verifyToken, orderReqRoutes);
app.use('/api', viewInvoiceRouter);
app.use('/api', competitorRoutes);

// ==========================================
// 🔒 FILE STREAMING ENDPOINTS
// ==========================================
app.get('/api/invoice/:filename', verifyToken, (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'invoice', filename);

    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).json({ error: "Invoice file not found" });
    }
});

app.get('/api/report/:filename', verifyToken, (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'report', filename);

    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).json({ error: "Report file not found" });
    }
});

app.get('/', (req, res) => {
    res.send('Backend is working securely with RBAC routes!');
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});