# System Documentation

## 1. Project Overview

This repository contains a full-stack supermarket management system built for daily operations such as inventory control, billing, invoice history, supplier management, purchase-order approval, report generation, and user administration.

The application is split into two main parts:
- Frontend: React single-page application
- Backend: Node.js + Express REST API
- Database: SQLite file-based database

The system currently implements a 3-tier role-based access model:
- Admin
- Manager
- Assistant

---

## 2. Technology Stack

### Frontend
- React 19
- React Router DOM
- Axios
- Chart.js and Recharts
- jsPDF / jsPDF-AutoTable
- CSS-based UI styling

### Backend
- Node.js
- Express.js
- SQLite3
- Nodemailer
- PDFKit
- Chart.js-Image
- bcryptjs
- dotenv

### Database
- SQLite file: backend/app.db
- Schema initialization handled by backend/setup_db.js

---

## 3. Application Architecture

### High-Level Structure

```text
supermarket-management-system/
├── backend/
│   ├── routes/
│   ├── middleware/
│   ├── invoice/
│   ├── report/
│   ├── server.js
│   ├── setup_db.js
│   └── app.db
├── frontend/
│   └── src/
├── PROJECT_DOCUMENTATION.md
└── SYSTEM_DOCUMENTATION.md
```

### Runtime Flow
1. The frontend sends requests to the backend API.
2. The backend validates authentication using the username header and role from the database.
3. Protected routes are mounted behind the verification middleware.
4. Business operations are executed against the SQLite database.
5. Reports and invoices are generated as PDF files and saved to backend/report and backend/invoice folders.

---

## 4. Frontend Modules

### Main Application Entry
- frontend/src/App.js
  - Configures the router
  - Implements protected routes
  - Applies role-based route restrictions

### Core Pages
- frontend/src/Login.js
  - User login experience
  - Handles password reset request flow
  - Stores username and role in session storage

- frontend/src/Dashboard.js
  - Displays summary statistics
  - Shows charts for sales/profit trends
  - Includes AI-assisted chatbot UI

- frontend/src/Products.js
  - Product inventory management
  - Supports create, edit, delete, and stock-related actions
  - Handles both unit and bulk products

- frontend/src/Suppliers.js
  - Supplier CRUD interface
  - Supplier-related metrics and management actions

- frontend/src/Billing.js
  - Billing and checkout flow
  - Barcode-based product lookup
  - Invoice creation and PDF generation

- frontend/src/Invoice.js
  - Invoice list and invoice preview/download actions
  - Supports invoice deletion

- frontend/src/Report.js
  - Report generation screen for sales and profit reports
  - Allows report download and deletion

- frontend/src/Orders.js
  - Purchase-order workflow UI
  - Approval, receiving, and cancel actions
  - Manager/Admin-only workflow controls

### Shared UI Components
- frontend/src/Sidebar.js
  - Navigation menu
  - Hides certain menu items for Assistant users

- frontend/src/Header.js
  - Top header with profile/settings/options
  - Contains user management modals for Admin and Manager

---

## 5. Backend Modules

### Server Entry Point
- backend/server.js
  - Creates the Express server
  - Enables CORS and JSON payload support
  - Registers middleware and protected routes
  - Exposes invoice/report file download endpoints

### Authentication and Access Control
- backend/middleware/verifyToken.js
  - Reads the username from the x-user-name header
  - Loads the corresponding user role from the database
  - Attaches req.user and req.userRole to the request

### User and RBAC Logic
- backend/routes/userRoutes.js
  - Login API
  - User listing APIs
  - Create user API
  - Forgot password and temporary password reset flows
  - Profile update and OTP-based security actions
  - Manager/Admin user management actions

### Product and Inventory
- backend/routes/productRoutes.js
  - Product dashboard stats
  - Product ID generation
  - Supplier list retrieval
  - Unit and bulk product add/update/delete operations
  - Billing search functionality

### Billing and Invoices
- backend/routes/billingRoutes.js
  - Billing statistics
  - Invoice creation
  - Stock reduction after sales
  - Invoice detail persistence

### Orders and Approval Workflow
- backend/routes/OrderReqRoutes.js
  - Fetch all orders
  - Generate next POID
  - Load product list for order requests
  - Submit purchase requests
  - Update quantity/price
  - Change order status and trigger related logic

### Email Logic
- backend/routes/SendEmailOrder.js
  - Sends supplier emails when orders are approved or received
  - Uses Gmail SMTP transport

### Report Generation
- backend/routes/createsalesreport.js
  - Generates sales PDF reports
  - Saves report metadata into the Report table

- backend/routes/createProfitReport.js
  - Generates profit PDF reports
  - Saves report metadata into the Report table

### Database Setup / Migration
- backend/setup_db.js
  - Ensures the Role column exists
  - Seeds a default admin account if none exists

---

## 6. Authentication and RBAC Model

### Current Role Model
The application supports three roles:
- Admin
- Manager
- Assistant

### Authentication Flow
1. The user logs in through the React login page.
2. The backend validates the username and password against the user table.
3. The frontend stores the username and role in session storage.
4. Protected frontend routes check the stored role.
5. Backend routes also rely on the verify-token middleware to ensure the request has a valid user and role.

### Current RBAC Rules

#### Admin
- Can access all main modules.
- Can create Admin accounts.
- Can manage users and update user details.
- Can approve/receive/cancel purchase orders.
- Can access suppliers and reports.

#### Manager
- Can access most management functions.
- Can approve/receive/cancel purchase orders.
- Can manage Assistant accounts only.
- Cannot create Admin accounts.
- Can access suppliers and reports.

#### Assistant
- Has restricted access to sensitive management screens.
- Cannot access suppliers and reports from the sidebar.
- Cannot create user accounts.
- Cannot manage other user accounts.
- Can still work with billing, invoices, products, and orders depending on the implemented UI behavior.

### Important Implementation Notes
- Frontend route access is controlled in frontend/src/App.js using allowedRoles.
- Sidebar visibility is also role-aware in frontend/src/Sidebar.js.
- Backend enforcement is implemented partially through middleware and explicit route checks in userRoutes and Orders flow.

---

## 7. Database Design

The application uses the SQLite database file at backend/app.db.

### Main Tables

#### user
Purpose: stores authenticated system users.
Columns:
- UserName (primary key)
- password
- contact
- Role
- email
- nic
- address
- birthday
- phone

Used by:
- Login
- Profile management
- RBAC checks
- User creation and administration

#### product
Purpose: stores unit inventory products.
Columns:
- Product_ID (primary key)
- Product_name
- Brand
- Purchase_Price
- Sell_Price
- Profit
- Quantity
- SupplierID
- Barcode
- Discount
- Max_Discount

Used by:
- Product management
- Billing barcode lookups
- Stock updates

#### bulk_products
Purpose: stores bulk inventory items.
Columns:
- BulkProductID (primary key)
- Product_name
- Purchase_Price
- Sell_Price
- Quantity
- SupplierID
- Barcode
- Discount
- Max_Discount

Used by:
- Bulk product inventory operations
- Bulk order workflows

#### supplier
Purpose: stores supplier information.
Columns:
- SupplierID (primary key)
- Name
- Contact
- Email

Used by:
- Supplier management
- Purchase-order email notifications

#### Invoice
Purpose: stores invoice header information.
Columns:
- InvoiceID (primary key)
- Product_Qty
- Total
- Profit
- Date
- Time

Used by:
- Billing and checkout
- Invoice history
- Dashboard metrics
- Report generation

#### invoice_products
Purpose: stores detailed invoice item lists.
Columns:
- INVID (primary key)
- ProductList
- ProductNameList
- CountList
- Date
- Time

Used by:
- Detailed invoice persistence

#### orders
Purpose: stores purchase-order records and workflow status.
Columns:
- POID (primary key)
- ProductID
- Name
- Qty
- Total
- Date
- Time
- Status

Used by:
- Orders workflow
- Approval and receiving process

#### Report
Purpose: stores metadata for generated reports.
Columns:
- ReportID (primary key)
- ReportName
- Date
- Time

Used by:
- Report listing and management

---

## 8. Key Business Workflows

### 8.1 Login and Session Handling
- User enters username and password.
- Backend checks the user in the database.
- Frontend stores session values.
- Routes are then rendered according to the user role.

### 8.2 Product Management
- Products can be added, edited, and deleted.
- Unit and bulk products are handled separately.
- Discount validation is performed before saving new data.
- Product stock is updated through billing and order receiving logic.

### 8.3 Billing and Invoice Creation
- The user scans or enters a barcode.
- Product price and discount are fetched.
- The bill is calculated and saved as an invoice.
- Inventory quantities are reduced after order completion.
- Invoice PDF files are generated and stored.

### 8.4 Purchase Orders
- Purchase requests are created from the Orders module.
- Orders start with Approval Pending status.
- Managers/Admins can approve the order, mark it as received, or cancel it.
- When approved or received, supplier emails are sent automatically.
- If received, stock is updated in the relevant inventory table.

### 8.5 Report Generation
- Sales and profit reports can be generated for a selected date range.
- A PDF is generated with a chart and summary table.
- The report is saved in the backend/report folder.
- Report metadata is inserted into the Report table.

---

## 9. Report and PDF Handling

### Invoice PDF Storage
- Files are stored in backend/invoice/
- Served through backend endpoints under /api/invoice/:filename

### Report PDF Storage
- Files are stored in backend/report/
- Served through backend endpoints under /api/report/:filename

### Report Generation Libraries
- PDFKit for document generation
- Chart.js-Image for generating bar charts embedded in PDF files

---

## 10. Email Functionality

### Current Mail Flow
The system uses Nodemailer with a Gmail-based SMTP transport.

### Email Areas
- Password reset emails
- Account creation emails
- OTP delivery for profile changes and security actions
- Supplier communication for purchase order approvals and receiving acknowledgements

### Notes
- Email credentials are currently embedded directly in the source code.
- This should be moved to environment variables for better security in a production deployment.

---

## 11. Setup and Run Instructions

### Backend
1. Open the backend folder.
2. Install dependencies:
   - npm install
3. Start the backend server:
   - npm start
4. The backend listens on port 5000.

### Frontend
1. Open the frontend folder.
2. Install dependencies:
   - npm install
3. Start the frontend development server:
   - npm start
4. The frontend typically runs on port 3000.

### Database Initialization
- The app uses an existing SQLite database file in backend/app.db.
- If needed, run backend/setup_db.js to ensure the required columns and default admin account are present.

---

## 12. Important Observations

### Strengths
- Clear split between frontend and backend layers
- Role-aware UI and route handling
- Support for invoices, reports, orders, products, suppliers, and users
- PDF generation and email automation are integrated into the business workflow

### Areas for Improvement
- Move hardcoded email credentials to environment variables
- Centralize RBAC enforcement more consistently on both frontend and backend
- Replace direct SQLite usage with a more structured ORM layer in future versions
- Add formal validation and error handling for all API routes
- Add automated testing coverage for authentication, RBAC, and report generation

---

## 13. Summary

This system is a practical supermarket management platform with inventory handling, billing, invoice history, supplier management, purchase-order approvals, reporting, and user access management. The current implementation already contains a functional RBAC concept with Admin, Manager, and Assistant roles, though the enforcement is split between frontend UI rules and backend route logic.

This documentation reflects the current codebase structure and implementation behavior as of the latest audit.
