# Supermarket Management System Documentation

## 1. Project Overview

This project is a full-stack supermarket management system built with:
- Frontend: React.js
- Backend: Node.js + Express.js
- Database: SQLite
- PDF generation: PDFKit and jsPDF
- Charts: Recharts and chart.js-image
- Email notifications: Nodemailer

The system helps manage products, suppliers, invoices, reports, orders, and user authentication for a supermarket business.

---

## 2. Project Structure

### Frontend
- [frontend/src/App.js](frontend/src/App.js) — main router and application layout
- [frontend/src/Login.js](frontend/src/Login.js) — login page
- [frontend/src/Dashboard.js](frontend/src/Dashboard.js) — dashboard analytics and AI chatbot
- [frontend/src/Products.js](frontend/src/Products.js) — product management screen
- [frontend/src/Suppliers.js](frontend/src/Suppliers.js) — supplier management screen
- [frontend/src/Billing.js](frontend/src/Billing.js) — billing and checkout screen
- [frontend/src/Invoice.js](frontend/src/Invoice.js) — invoice history screen
- [frontend/src/Report.js](frontend/src/Report.js) — sales/profit report generation screen
- [frontend/src/Orders.js](frontend/src/Orders.js) — purchase order workflow screen
- [frontend/src/Sidebar.js](frontend/src/Sidebar.js) — navigation sidebar
- [frontend/src/Header.js](frontend/src/Header.js) — top header

### Backend
- [backend/server.js](backend/server.js) — main Express server entry point
- [backend/setup_db.js](backend/setup_db.js) — database schema setup script
- [backend/routes](backend/routes) — API route modules for each feature
- [backend/app.db](backend/app.db) — SQLite database file

---

## 3. Class / Component Structure

This project uses React functional components rather than traditional class-based components.

### Main Component Structure

```text
App
├── Login
├── Dashboard
├── Products
├── Suppliers
├── Billing
├── Invoice
├── Report
├── Orders
├── Sidebar
└── Header
```

### Component Responsibilities

#### App
- Sets up React Router
- Defines all major routes
- Wraps the app with the shared layout and sidebar

#### Login
- Loads available users from the database
- Authenticates the user
- Stores user role in local storage
- Redirects the user to the dashboard

#### Dashboard
- Displays overall sales, profit, product, and supplier summaries
- Shows daily sales and transaction charts
- Includes an AI chatbot assistant for business insights

#### Products
- Lists all products in a searchable table
- Shows stock and supplier-related charts
- Supports add, update, and delete operations
- Validates sell price vs purchase price

#### Suppliers
- Lists suppliers in a searchable table
- Supports add, update, and delete supplier records
- Shows supplier-related statistics

#### Billing
- Scans or enters a barcode to fetch product info
- Adds products to a bill
- Calculates totals and profit
- Generates and saves invoice PDF files
- Stores invoice details in the database

#### Invoice
- Lists invoice history
- Shows totals, date, time, and product count
- Opens stored invoice PDFs
- Deletes invoices and related PDF files

#### Report
- Generates sales and profit reports for a chosen date range
- Downloads PDF files
- Saves report metadata in the database
- Lists and deletes existing reports

#### Orders
- Creates purchase order requests
- Shows the order approval workflow
- Supports manager actions like approve, receive, or cancel
- Updates stock and sends email notifications when appropriate

#### Sidebar / Header
- Provide navigation and page consistency across modules

---

## 4. Database Structure

The application uses SQLite with the file [backend/app.db](backend/app.db).

### Database Tables

#### 1. Invoice
Purpose: stores invoice header information.

Columns:
- InvoiceID (TEXT, PRIMARY KEY)
- Product_Qty (INTEGER)
- Total (REAL)
- Profit (REAL)
- Date (TEXT)
- Time (TEXT)

Used by:
- Billing checkout flow
- Invoice history page
- Dashboard stats and report calculations

#### 2. invoice_products
Purpose: stores invoice item details as comma-separated strings for products, names, and counts.

Columns:
- INVID (TEXT, PRIMARY KEY)
- ProductList (TEXT)
- ProductNameList (TEXT)
- CountList (TEXT)
- Date (TEXT)
- Time (TEXT)

Used by:
- Saving detailed billing data for each invoice

#### 3. Report
Purpose: stores report metadata such as generated sales/profit reports.

Columns:
- ReportID (TEXT, PRIMARY KEY)
- ReportName (TEXT)
- Date (TEXT)
- Time (TEXT)

Used by:
- Report listing screen
- Report deletion logic

#### 4. orders
Purpose: stores purchase order records and their approval lifecycle.

Columns:
- POID (TEXT, PRIMARY KEY)
- ProductID (TEXT)
- Name (TEXT)
- Qty (INTEGER)
- Total (REAL)
- Date (TEXT)
- Time (TEXT)
- Status (TEXT)

Used by:
- Orders module
- Manager approval flow
- Stock update actions

#### 5. product
Purpose: stores inventory product records.

Columns:
- Product_ID (TEXT, PRIMARY KEY)
- Product_name (TEXT)
- Brand (TEXT)
- Purchase_Price (REAL)
- Sell_Price (REAL)
- Profit (REAL)
- Quantity (INTEGER)
- SupplierID (TEXT)
- Barcode (TEXT)

Used by:
- Product management screen
- Billing barcode lookup
- Stock updates from orders
- Dashboard and reports

#### 6. supplier
Purpose: stores supplier information.

Columns:
- SupplierID (TEXT, PRIMARY KEY)
- Name (TEXT)
- Contact (TEXT)
- Email (TEXT)

Used by:
- Supplier management screen
- Product supplier attachment
- Emailing purchase orders

#### 7. user
Purpose: stores authorized system users.

Columns:
- UserName (TEXT, PRIMARY KEY)
- password (TEXT)
- contact (TEXT)

Used by:
- Login authentication

---

## 5. System Activities by Module

### Authentication and Access
- User opens the login page
- System loads all usernames from the database
- User submits username and password
- Backend validates credentials
- If valid, role is assigned and the user is redirected to the dashboard

### Dashboard Activities
- Fetches summary values from the database
- Displays total sales, profit, products, and suppliers
- Builds sales and profit line charts for recent dates
- Supports AI-driven business questions through a chatbot

### Product Management Activities
- Displays all products and highlights low stock items
- Supports searching by product name, ID, brand, or barcode
- Allows adding new products with supplier assignment
- Allows editing product prices, stock, and supplier details
- Allows deleting products from the inventory

### Supplier Management Activities
- Lists all suppliers
- Supports create, edit, and delete supplier records
- Provides supplier count and product distribution statistics

### Billing Activities
- User enters or scans a barcode
- Backend fetches product name, selling price, and purchase price
- Items are added to a bill list
- User enters cash amount and confirms payment
- The system calculates profit and total
- Invoice is stored in the database and PDF is generated

### Invoice History Activities
- Displays all invoices
- Supports searching by invoice ID
- Allows viewing the saved PDF invoice
- Allows deleting an invoice and its stored PDF

### Report Generation Activities
- User selects a report type: Sales or Profit
- User selects a date range
- Backend queries invoice data from the selected period
- PDF report is generated with charts and summary values
- Report metadata is saved to the database

### Purchase Order Activities
- User creates a purchase request for a selected product and quantity
- Request is stored with Approval Pending status
- Manager can approve, receive, or cancel the order
- If received, stock increases automatically
- If approved, supplier email is sent through Nodemailer

---

## 6. Backend Routing Details

The backend server is launched from [backend/server.js](backend/server.js) and uses the prefix /api for most routes.

### Main Route Groups

#### Dashboard Routes
- GET /api/dashboard-stats
  - Returns sales, profit, product count, supplier count, and chart data

#### Billing Routes
- GET /api/get-product-by-barcode/:barcode
  - Fetches product name and price from barcode
- GET /api/billing-stats
  - Returns last transaction and today’s transaction count

#### Authentication Routes
- GET /api/users
  - Returns all usernames for login dropdown
- POST /api/login
  - Validates user credentials

#### Product Routes
- GET /api/product-dashboard-stats
  - Returns all products, low-stock data, and supplier stats
- POST /api/add-product
  - Adds a new product
- PUT /api/update-product/:id
  - Updates an existing product
- DELETE /api/delete-product/:id
  - Deletes a product

#### Supplier Routes
- POST /api/add-supplier
  - Adds supplier
- GET /api/get-suppliers-list
  - Fetches all suppliers
- GET /api/next-supplier-id
  - Generates next supplier ID
- PUT /api/update-supplier/:id
  - Updates supplier details
- DELETE /api/delete-supplier/:id
  - Deletes supplier
- GET /api/getsuppliercount
  - Returns total supplier count

#### Invoice Routes
- GET /api/next-invoice-id
  - Generates the next invoice ID
- POST /api/add-invoice
  - Stores invoice header and product details
- GET /api/get-invoices
  - Lists invoice records
- DELETE /api/delete-invoice/:id
  - Deletes invoice and PDF file
- POST /api/save-pdf
  - Saves generated invoice PDF to the server

#### Report Routes
- GET /api/get-invoice-years
  - Returns available years from invoice data
- POST /api/generate-sales-report
  - Generates sales report PDF
- POST /api/generate-profit-report
  - Generates profit report PDF
- GET /api/get-reports
  - Lists generated reports
- DELETE /api/delete-report/:id
  - Deletes report metadata and PDF file

#### Order Routes
- GET /api/orders/all
  - Lists all purchase orders
- GET /api/orders/next-poid
  - Generates next purchase order ID
- GET /api/orders/products-list
  - Returns products for order dropdown
- POST /api/orders/add-request
  - Creates a new order request
- PUT /api/orders/update-status
  - Updates order status

#### Email and Approval Routes
- PUT /api/email-orders/update-status
  - Updates order status, sends email, and updates inventory when received

#### AI Chatbot Route
- POST /api/chat
  - Handles chatbot questions and business assistance requests

---

## 7. Frontend Routing Details

The frontend uses React Router and is defined in [frontend/src/App.js](frontend/src/App.js).

### Routes
- / → Login page
- /dashboard → Dashboard
- /products → Products page
- /suppliers → Suppliers page
- /billing → Billing page
- /invoices → Invoice history page
- /reports → Reports page
- /orders → Orders page

If the user visits the root while already inside the app layout, they are redirected to /dashboard.

---

## 8. Important Business Logic Notes

- Sales profit is calculated from selling price minus purchase price.
- Stock increases when a purchase order is marked as Received.
- Invoices are saved both in the Invoice table and the invoice_products table.
- PDF files are stored in the backend invoice and report folders.
- Managers can control the purchase order workflow.
- The dashboard includes AI-based assistance for business questions.

---

## 9. Summary

This system provides:
- Inventory and stock management
- Supplier management
- Billing and invoice processing
- Sales and profit reporting
- Purchase order approval workflow
- Email notifications for suppliers
- Authentication and role-based actions
- Dashboard analytics and AI assistant support

This project is a practical example of a complete supermarket management platform with both inventory and business reporting capabilities.
