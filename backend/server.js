const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

app.use(cors());

// 💡 වෙනස්කම: PDF Base64 සහ අනෙකුත් විශාල JSON දත්ත පැමිණීමේදී Payload Too Large Error එක මඟහරවා ගැනීමට limit එක වැඩි කරන ලදී.
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ==========================================
// 📥 ROUTES IMPORT කිරීම (REQUIRE) SECTION
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
const sendEmailOrderRoute = require('./routes/SendEmailOrder');
const createProfitReport = require('./routes/createProfitReport.js'); 

// 🤖 අලුතින් එකතු කළ AI Chatbot Route එක
const chatbotRoute = require('./routes/Chatbot.js'); 

// ==========================================
// ⚙️ EXPRESS APP middleware & ROUTES USAGE
// ==========================================
app.use('/invoice', express.static(path.join(__dirname, 'invoice')));
app.use('/report', express.static(path.join(__dirname, 'report')));

app.use('/api', dashboardRoute);
app.use('/api', productRoutes);
app.use('/api', billingRoutes);
app.use('/api', addinvoice);
app.use('/api', userRoutes);
app.use('/api', productIdRoute);
app.use('/api', productSupplierRoute);
app.use('/api', addProductRoute);
app.use('/api', productActionsRoute);
app.use('/api', getsuppliersRoute);
app.use('/api', getSupplierIDRoute);
app.use('/api', addSupplierRoute);
app.use('/api', supplierActionsRoute);
app.use('/api', saveBillRoute);
app.use('/api', getINVtabledata);
app.use('/api', deleteInvoiceRoute);
app.use('/api', setreportyear);
app.use('/api', createsalesreport);
app.use('/api', setREPID);
app.use('/api', updateReportTable);
app.use('/api', deleteReportRoute);
app.use('/api', createProfitReport); 
app.use('/api/orders', orderReqRoutes);
app.use('/api/email-orders', sendEmailOrderRoute);

// 🤖 AI Chatbot එක සඳහා Endpoint එක සක්‍රීය කිරීම
app.use('/api', chatbotRoute); // මෙය මඟින් http://localhost:5000/api/chat සක්‍රීය වේ

app.get('/', (req, res) => {
    res.send('Backend is working with separate routes999999999');
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});