import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Sidebar from './Sidebar';
import './Products.css';
import bgImage from './assets/abc.avif';
import Header from './Header';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE'];

function Products() {
    const [viewMode, setViewMode] = useState("unit"); 
    const [products, setProducts] = useState([]); 
    const [bulkProducts, setBulkProducts] = useState([]); 
    const [lowStockData, setLowStockData] = useState([]); 
    const [supplierStats, setSupplierStats] = useState([]); 
    const [totalProducts, setTotalProducts] = useState(0); 

    const [searchTerm, setSearchTerm] = useState(""); 
    const [isAddProductOpen, setIsAddProductOpen] = useState(false);
    const [isUpdateProductOpen, setIsUpdateProductOpen] = useState(false);
    
    const [nextId, setNextId] = useState("");
    const [nextBulkId, setNextBulkId] = useState(""); 
    const [suppliers, setSuppliers] = useState([]); // Suppliers State
    const [selectedId, setSelectedId] = useState("");
    const [formData, setFormData] = useState({
        Barcode: '', Name: '', Brand: '', PurchasePrice: '', SellPrice: '', Quantity: '', Supplier: ''
    });

    // 🔄 පිටුවට ඇතුළු වන විටම සියලු දත්ත සහ Suppliers ලැයිස්තුව ලබා ගැනීම
    const loadAllPageData = () => {
        fetch('http://localhost:5000/api/product-dashboard-stats')
            .then(res => res.json())
            .then(data => {
                setProducts(data.allProducts || []);
                setBulkProducts(data.allBulkProducts || []); 
                setTotalProducts(data.totalProducts || 0);
                setLowStockData(data.lowStock || []);
                setSupplierStats(data.supplierStats || []);
            })
            .catch(err => console.error("Error fetching products:", err));

        // 🏢 පේජ් එක ලෝඩ් වෙද්දීම Suppliers ලෝඩ් කර තබා ගැනීම (Fixes dropdown empty issue)
        fetch('http://localhost:5000/api/get-suppliers')
            .then(res => res.json())
            .then(res => {
                console.log("Suppliers loaded:", res); // බ්‍රවුසර් console එකේ චෙක් කිරීමට
                setSuppliers(Array.isArray(res) ? res : []);
            })
            .catch(err => console.error("Error fetching suppliers:", err));
    };

    useEffect(() => {
        loadAllPageData();
    }, []);

    const currentList = viewMode === "unit" ? products : bulkProducts;
    const filteredProducts = (currentList || []).filter(prod => 
        prod.Product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (prod.Product_ID && prod.Product_ID.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (prod.BulkProductID && prod.BulkProductID.toLowerCase().includes(searchTerm.toLowerCase())) ||
        prod.Barcode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prod.Brand?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleOpenAddProduct = () => {
        setFormData({ Barcode: '', Name: '', Brand: '', PurchasePrice: '', SellPrice: '', Quantity: '', Supplier: '' });
        
        fetch('http://localhost:5000/api/next-product-id')
            .then(res => res.json())
            .then(res => {
                setNextId(res.nextUnitId);
                setNextBulkId(res.nextBulkId);
                setIsAddProductOpen(true);
            })
            .catch(err => {
                console.error("Error fetching IDs:", err);
                setIsAddProductOpen(true); 
            });
    };

    const handleEditClick = (product) => {
        setSelectedId(viewMode === "unit" ? product.Product_ID : product.BulkProductID);
        setFormData({
            Barcode: product.Barcode, 
            Name: product.Product_name, 
            Brand: product.Brand || '', 
            PurchasePrice: product.Purchase_Price, 
            SellPrice: product.Sell_Price,
            Quantity: product.Quantity, 
            Supplier: product.SupplierID || ''
        });
        setIsUpdateProductOpen(true);
    };

    const handleDelete = (id) => {
        if (window.confirm("Are you sure you want to delete this product?")) {
            const url = viewMode === "unit" 
                ? `http://localhost:5000/api/delete-product/${id}`
                : `http://localhost:5000/api/delete-bulk-product/${id}`;

            fetch(url, { method: 'DELETE' }).then(() => loadAllPageData());
        }
    };

    const handleAddProduct = () => {
        if (parseFloat(formData.PurchasePrice) >= parseFloat(formData.SellPrice)) {
            alert("Error: Sell Price must be greater than Purchase Price!");
            return;
        }

        if (viewMode === "unit") {
            const payload = {
                Product_ID: nextId, Barcode: formData.Barcode, Product_name: formData.Name,
                Brand: formData.Brand, Purchase_Price: formData.PurchasePrice, Sell_Price: formData.SellPrice,
                Quantity: parseInt(formData.Quantity), SupplierID: formData.Supplier
            };
            fetch('http://localhost:5000/api/add-product', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
            }).then(() => { setIsAddProductOpen(false); loadAllPageData(); });
        } else {
            const payload = {
                BulkProductID: nextBulkId, Barcode: formData.Barcode, Product_name: formData.Name,
                Purchase_Price: formData.PurchasePrice, Sell_Price: formData.SellPrice,
                Quantity: parseFloat(formData.Quantity), SupplierID: formData.Supplier
            };
            fetch('http://localhost:5000/api/add-bulk-product', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
            }).then(() => { setIsAddProductOpen(false); loadAllPageData(); });
        }
    };

    const handleUpdateProduct = () => {
        if (parseFloat(formData.PurchasePrice) >= parseFloat(formData.SellPrice)) {
            alert("Error: Sell Price must be greater than Purchase Price!");
            return;
        }

        if (viewMode === "unit") {
            const payload = {
                Product_name: formData.Name, Brand: formData.Brand, Purchase_Price: formData.PurchasePrice,
                Sell_Price: formData.SellPrice, Quantity: formData.Quantity, SupplierID: formData.Supplier, Barcode: formData.Barcode
            };
            fetch(`http://localhost:5000/api/update-product/${selectedId}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
            }).then(() => { setIsUpdateProductOpen(false); loadAllPageData(); });
        } else {
            const payload = {
                Product_name: formData.Name, Purchase_Price: formData.PurchasePrice,
                Sell_Price: formData.SellPrice, Quantity: parseFloat(formData.Quantity), SupplierID: formData.Supplier, Barcode: formData.Barcode
            };
            fetch(`http://localhost:5000/api/update-bulk-product/${selectedId}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
            }).then(() => { setIsUpdateProductOpen(false); loadAllPageData(); });
        }
    };

    return (
        <div className="main-layout" style={{ backgroundImage: `url(${bgImage})` }}>
            <Sidebar />
            <div className="content-area">
                <Header />

                <div className="stats-container fadeInRight">
                    <div className="glass-stat-card">
                        <h3>Low Stock Products</h3>
                        <ResponsiveContainer width="100%" height={150}>
                            <BarChart data={lowStockData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ddd" />
                                <XAxis dataKey="Product_name" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                                <YAxis tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                                <Tooltip />
                                <Bar dataKey="Quantity" fill="#FF0000" radius={[5, 5, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="glass-stat-card fadeInRight">
                        <h3>Suppliers</h3>
                        <ResponsiveContainer width="100%" height={150}>
                            <PieChart>
                                <Pie data={supplierStats} dataKey="count" nameKey="SupplierID" cx="50%" cy="50%" outerRadius={50}>
                                    {supplierStats.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="glass-stat-card total-box fadeInRight">
                        <h3>Total Products</h3>
                        <h1 className="total-number-special">{totalProducts}</h1>
                    </div>
                </div>

                <div className="table-glass-container fadeInRight">
                    <div className="table-top-header">
                        <div className="title-section" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span>{viewMode === "unit" ? "Products" : "Bulk Products"}</span>
                            <span className="plus-icon" onClick={handleOpenAddProduct} style={{ cursor: 'pointer' }}>+</span>
                            <span 
                                className="toggle-arrow-icon" 
                                style={{ fontSize: '24px', color: '#28a745', cursor: 'pointer', userSelect: 'none', marginLeft: '5px' }}
                                onClick={() => setViewMode(viewMode === "unit" ? "bulk" : "unit")}
                            >
                                {viewMode === "unit" ? "▶" : "◀"}
                            </span>
                        </div>
                        <div className="search-container">
                            <input 
                                type="text" 
                                placeholder={viewMode === "unit" ? "Search Name, Brand, Barcode..." : "Search Name, Barcode..."}
                                className="search-input"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <button className="search-btn-modern">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
                                    <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>Product ID</th><th>BarCode</th><th>Product name</th>
                                {viewMode === "unit" && <th>Brand</th>}
                                <th>Quantity</th>
                                <th>Purchase Price</th><th>Sell Price</th><th>Supplier</th><th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.map((p, index) => (
                                <tr key={index}>
                                    <td>{viewMode === "unit" ? p.Product_ID : p.BulkProductID}</td>
                                    <td>{p.Barcode}</td>
                                    <td>{p.Product_name}</td>
                                    {viewMode === "unit" && <td>{p.Brand}</td>}
                                    <td>{viewMode === "unit" ? p.Quantity : `${Number(p.Quantity).toFixed(3)} Kg`}</td>
                                    <td>Rs. {Number(p.Purchase_Price || 0).toFixed(2)}</td>
                                    <td>Rs. {Number(p.Sell_Price || 0).toFixed(2)}</td>
                                    <td>{p.SupplierID}</td>
                                    <td>
                                        <button className="edit-btn-small" onClick={() => handleEditClick(p)}>Edit</button>
                                        <button className="delete-btn-small" onClick={() => handleDelete(viewMode === "unit" ? p.Product_ID : p.BulkProductID)}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Sidebar Drawer Form (Add & Update) */}
                <div className={`add-product-overlay ${(isAddProductOpen || isUpdateProductOpen) ? 'open' : ''}`} onClick={() => { setIsAddProductOpen(false); setIsUpdateProductOpen(false); }}>
                    <div className="add-product-sidebar" onClick={(e) => e.stopPropagation()}>
                        <h2>{isUpdateProductOpen ? "Update Product" : "Add Product"}</h2>
                        
                        <div className="form-group">
                            <label>Product ID</label>
                            <input 
                                type="text" 
                                className="form-input" 
                                value={isUpdateProductOpen ? selectedId : (viewMode === "unit" ? nextId : nextBulkId)} 
                                readOnly 
                            />
                        </div>
                        <div className="form-group">
                            <label>Barcode</label>
                            <input type="text" name="Barcode" autoComplete="off" className="form-input" value={formData.Barcode} onChange={handleChange} placeholder="Enter barcode" />
                        </div>
                        <div className="form-group">
                            <label>Name</label>
                            <input type="text" name="Name" autoComplete="off" className="form-input" value={formData.Name} onChange={handleChange} placeholder="Enter name" />
                        </div>

                        {viewMode === "unit" && (
                            <div className="form-group">
                                <label>Brand</label>
                                <input type="text" name="Brand" autoComplete="off" className="form-input" value={formData.Brand} onChange={handleChange} placeholder="Enter brand" />
                            </div>
                        )}

                        <div className="form-group">
                            <label>{viewMode === "unit" ? "Purchase Price" : "Purchase Price (per 1Kg)"}</label>
                            <input type="text" name="PurchasePrice" autoComplete="off" className="form-input" value={formData.PurchasePrice} onChange={handleChange} placeholder="Enter purchase price" />
                        </div>
                        <div className="form-group">
                            <label>{viewMode === "unit" ? "Sell Price" : "Sell Price (per 1Kg)"}</label>
                            <input type="text" name="SellPrice" autoComplete="off" className="form-input" value={formData.SellPrice} onChange={handleChange} placeholder="Enter sell price" />
                        </div>
                        <div className="form-group">
                            <label>{viewMode === "unit" ? "Quantity" : "Quantity (in Kg)"}</label>
                            <input 
                                type="number" 
                                name="Quantity" 
                                autoComplete="off"
                                className="form-input" 
                                value={formData.Quantity} 
                                onChange={handleChange} 
                                step={viewMode === "unit" ? "1" : "any"} 
                                placeholder={viewMode === "unit" ? "Enter quantity" : "Enter weight in Kg"} 
                            />
                        </div>
                        <div className="form-group">
                            <label>Supplier</label>
                            <select name="Supplier" className="form-input" value={formData.Supplier} onChange={handleChange}>
                                <option value="">Select supplier</option>
                                {Array.isArray(suppliers) && suppliers.map((s, i) => (
                                    <option key={i} value={s.SupplierID}>{s.SupplierID} - {s.Name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-buttons">
                            <button className="add-btn" onClick={isUpdateProductOpen ? handleUpdateProduct : handleAddProduct}>
                                {isUpdateProductOpen ? "Update" : "Add"}
                            </button>
                            <button className="cancel-btn" onClick={() => { setIsAddProductOpen(false); setIsUpdateProductOpen(false); }}>Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Products;