// src/Products.js
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
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
    const [suppliers, setSuppliers] = useState([]); 
    const [selectedId, setSelectedId] = useState("");

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    
    const [formData, setFormData] = useState({
        Barcode: '', Name: '', Brand: '', PurchasePrice: '', SellPrice: '', Quantity: '', Supplier: '', Discount: ''
    });


    const userRole = sessionStorage.getItem('userRole') || localStorage.getItem('userRole') || '';
    const canEditOrDelete = userRole === 'Admin' || userRole === 'Manager';

    const getAuthHeaders = (extraHeaders = {}) => {
        const username = sessionStorage.getItem('userName') || localStorage.getItem('userName') || '';
        return { 'x-user-name': username, ...extraHeaders };
    };

    const loadAllPageData = () => {
        fetch('http://localhost:5000/api/product-dashboard-stats', { headers: getAuthHeaders() })
            .then(res => res.json())
            .then(data => {
                setProducts(data.allProducts || []);
                setBulkProducts(data.allBulkProducts || []); 
                setTotalProducts(data.totalProducts || 0);
                setLowStockData(data.lowStock || []);
                setSupplierStats(data.supplierStats || []);
            })
            .catch(err => console.error("Error fetching products:", err));

        fetch('http://localhost:5000/api/get-suppliers', { headers: getAuthHeaders() })
            .then(res => res.json())
            .then(res => { setSuppliers(Array.isArray(res) ? res : []); })
            .catch(err => console.error("Error fetching suppliers:", err));
    };

    useEffect(() => { loadAllPageData(); }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, viewMode]);

    const currentList = viewMode === "unit" ? products : bulkProducts;
    const filteredProducts = Array.isArray(currentList)
        ? currentList.filter(prod => 
            prod.Product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            prod.Product_ID?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            prod.BulkProductID?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            prod.Barcode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            prod.Brand?.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : [];

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

    const handlePageChange = (pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
    };

    const handleChange = (e) => { setFormData({ ...formData, [e.target.name]: e.target.value }); };

    const handleBarcodeChange = async (e) => {
        const barcodeValue = e.target.value;
        setFormData(prev => ({ ...prev, Barcode: barcodeValue }));

        if (barcodeValue.length >= 8) {
            try {
                const localCheck = await fetch(`http://localhost:5000/api/check-local-product/${barcodeValue}`);
                const localData = await localCheck.json();

                if (localData.exists) {
                    alert("This product already exists in the system!");
                    setFormData(prev => ({
                        ...prev,
                        Name: localData.product.Product_name || localData.product.Name || '',
                        Brand: localData.product.Brand || '',
                        PurchasePrice: localData.product.Purchase_Price || '',
                        SellPrice: localData.product.Sell_Price || '',
                        Supplier: localData.product.SupplierID || '',
                        Discount: localData.product.Discount || ''
                    }));
                    return;
                }

                const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcodeValue}.json`);
                const data = await response.json();

                if (data.status === 1) {
                    setFormData(prev => ({
                        ...prev,
                        Name: data.product.product_name || "",
                        Brand: data.product.brands || ""
                    }));
                }
            } catch (error) {
                console.error("Error fetching barcode data:", error);
            }
        }
    };

    const handleOpenAddProduct = () => {
        setFormData({ Barcode: '', Name: '', Brand: '', PurchasePrice: '', SellPrice: '', Quantity: '', Supplier: '', Discount: '' });
        fetch('http://localhost:5000/api/next-product-id', { headers: getAuthHeaders() })
            .then(res => res.json())
            .then(res => {
                setNextId(res.nextUnitId || res.nextId); setNextBulkId(res.nextBulkId); setIsAddProductOpen(true);
            })
            .catch(() => { setIsAddProductOpen(true); });
    };

    const handleEditClick = (product) => {
        setSelectedId(viewMode === "unit" ? product.Product_ID : product.BulkProductID);
        setFormData({
            Barcode: product.Barcode || '', 
            Name: product.Product_name || '', 
            Brand: product.Brand || '', 
            PurchasePrice: product.Purchase_Price || '', 
            SellPrice: product.Sell_Price || '', 
            Quantity: product.Quantity || '', 
            Supplier: product.SupplierID || '',
            Discount: product.Discount || ''
        });
        setIsUpdateProductOpen(true);
    };

    const handleDelete = (id) => {
        if (window.confirm("Are you sure you want to delete this product?")) {
            const url = viewMode === "unit" 
                ? `http://localhost:5000/api/delete-product/${id}`
                : `http://localhost:5000/api/delete-bulk-product/${id}`;
            fetch(url, { method: 'DELETE', headers: getAuthHeaders() }).then(() => loadAllPageData());
        }
    };

    const sellPriceNum = parseFloat(formData.SellPrice) || 0;
    const purchasePriceNum = parseFloat(formData.PurchasePrice) || 0;
    const calculatedMaxDiscountPercent = sellPriceNum > 0 
        ? Math.max(0, ((sellPriceNum - purchasePriceNum) / sellPriceNum) * 100) 
        : 0;

    const handleAddProduct = () => {
        const purchase = parseFloat(formData.PurchasePrice) || 0;
        const sell = parseFloat(formData.SellPrice) || 0;
        const discountPercent = parseFloat(formData.Discount) || 0;
        const maxDiscountPercent = calculatedMaxDiscountPercent;

        if (purchase >= sell) {
            alert("Error: Sell Price must be greater than Purchase Price!"); 
            return;
        }

        if (discountPercent < 0) {
            alert("Error: Discount percentage cannot be negative!");
            return;
        }

        if (discountPercent > maxDiscountPercent) {
            alert(`Validation Error: Discount (${discountPercent.toFixed(1)}%) cannot exceed the maximum allowed discount (${maxDiscountPercent.toFixed(1)}%)!`);
            return;
        }

        const url = viewMode === "unit" ? 'http://localhost:5000/api/add-product' : 'http://localhost:5000/api/add-bulk-product';
        const payload = viewMode === "unit" ? {
            Product_ID: nextId, Barcode: formData.Barcode, Product_name: formData.Name, Brand: formData.Brand,
            Purchase_Price: purchase, Sell_Price: sell, Quantity: parseInt(formData.Quantity) || 0, SupplierID: formData.Supplier,
            Discount: discountPercent, Max_Discount: maxDiscountPercent
        } : {
            BulkProductID: nextBulkId, Barcode: formData.Barcode, Product_name: formData.Name,
            Purchase_Price: purchase, Sell_Price: sell, Quantity: parseFloat(formData.Quantity) || 0, SupplierID: formData.Supplier,
            Discount: discountPercent, Max_Discount: maxDiscountPercent
        };

        fetch(url, { method: 'POST', headers: getAuthHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify(payload) })
            .then(res => res.json())
            .then(data => {
                if(data.error) alert(data.error);
                else { setIsAddProductOpen(false); loadAllPageData(); }
            });
    };

    const handleUpdateProduct = () => {
        const purchase = parseFloat(formData.PurchasePrice) || 0;
        const sell = parseFloat(formData.SellPrice) || 0;
        const discountPercent = parseFloat(formData.Discount) || 0;
        const maxDiscountPercent = calculatedMaxDiscountPercent;

        if (purchase >= sell) {
            alert("Error: Sell Price must be greater than Purchase Price!"); 
            return;
        }

        if (discountPercent < 0) {
            alert("Error: Discount percentage cannot be negative!");
            return;
        }

        if (discountPercent > maxDiscountPercent) {
            alert(`Validation Error: Discount (${discountPercent.toFixed(1)}%) cannot exceed the maximum allowed discount (${maxDiscountPercent.toFixed(1)}%)!`);
            return;
        }

        const url = viewMode === "unit" ? `http://localhost:5000/api/update-product/${selectedId}` : `http://localhost:5000/api/update-bulk-product/${selectedId}`;
        const payload = viewMode === "unit" ? {
            Product_name: formData.Name, Brand: formData.Brand, Purchase_Price: purchase, Sell_Price: sell, Quantity: formData.Quantity, SupplierID: formData.Supplier, Barcode: formData.Barcode,
            Discount: discountPercent, Max_Discount: maxDiscountPercent
        } : {
            Product_name: formData.Name, Purchase_Price: purchase, Sell_Price: sell, Quantity: parseFloat(formData.Quantity) || 0, SupplierID: formData.Supplier, Barcode: formData.Barcode,
            Discount: discountPercent, Max_Discount: maxDiscountPercent
        };

        fetch(url, { method: 'PUT', headers: getAuthHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify(payload) })
            .then(res => res.json())
            .then(data => {
                if(data.error) alert(data.error);
                else { setIsUpdateProductOpen(false); loadAllPageData(); }
            });
    };

    // Label Formatter to prevent long text overflow/clashing
    const formatXAxisLabel = (value) => {
        if (!value) return '';
        return value.length > 8 ? `${value.substring(0, 8)}...` : value;
    };

    return (
        <div className="main-layout" style={{ backgroundImage: `url(${bgImage})` }}>
            <Sidebar />
            <div className="content-area">
                <Header />
                
                {/* 🏆 Top Stats Row */}
                <div className="stats-container fadeInRight">
                    <div className="glass-stat-card">
                        <h3>Low Stock Products</h3>
                        <div className="chart-container-box">
                            <ResponsiveContainer width="100%" height={135}>
                                <BarChart data={lowStockData} margin={{ top: 5, right: 10, left: -25, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ddd" />
                                    <XAxis 
                                        dataKey="Product_name" 
                                        tickFormatter={formatXAxisLabel}
                                        tick={{ fontSize: 9.5, fill: '#444' }} 
                                        interval={0} 
                                        angle={-20} 
                                        textAnchor="end" 
                                        axisLine={false} 
                                        tickLine={false} 
                                    />
                                    <YAxis tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                                    <Tooltip />
                                    <Bar dataKey="Quantity" fill="#FF0000" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="glass-stat-card">
                        <h3>Suppliers</h3>
                        <div className="chart-container-box">
                            <ResponsiveContainer width="100%" height={135}>
                                <PieChart>
                                    {/* outerRadius 38 to 52 for larger pie */}
                                    <Pie data={supplierStats} dataKey="count" nameKey="SupplierID" cx="50%" cy="50%" outerRadius={50}>
                                        {supplierStats.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="glass-stat-card total-card">
                        <h3>Total Products</h3>
                        <h1 className="total-number-special">{totalProducts}</h1>
                    </div>
                </div>

                {/* 📊 Table Glass Container */}
                <div className="table-glass-container fadeInRight">
                    <div className="table-top-header">
                        <div className="title-section">
        <span>{viewMode === "unit" ? "Products" : "Bulk Products"}</span>
        {/* Add Product Button එක Assistant ඇතුළු හැමෝටම පෙනේ */}
        <span className="plus-icon" onClick={handleOpenAddProduct}>+</span>
        <span className="toggle-arrow-icon" style={{ fontSize: '24px', color: '#28a745', cursor: 'pointer', userSelect: 'none' }} onClick={() => setViewMode(viewMode === "unit" ? "bulk" : "unit")}>
            {viewMode === "unit" ? "▶" : "◀"}
        </span>
    </div>
                        <div className="search-container">
                            <input type="text" placeholder="Search..." className="search-input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                    </div>

                    <div className="prod-table-wrapper">
                        <table className="modern-table">
                            <thead>
    <tr>
        <th>Product ID</th>
        <th>BarCode</th>
        <th>Product name</th>
        {viewMode === "unit" && <th>Brand</th>}
        <th>Quantity</th>
        <th>Purchase Price</th>
        <th>Sell Price</th>
        <th>Discount (%)</th>
        <th>Max Discount (%)</th>
        <th>Supplier</th>
        {/* Admin හෝ Manager නම් පමණක් Actions header එක පෙන්වයි */}
        {canEditOrDelete && <th>Actions</th>}
    </tr>
</thead>
                            <tbody>
                                {currentItems.map((p, index) => (
                                    <tr key={index}>
                                        <td>{viewMode === "unit" ? p.Product_ID : p.BulkProductID}</td>
                                        <td>{p.Barcode}</td>
                                        <td>{p.Product_name}</td>
                                        {viewMode === "unit" && <td>{p.Brand}</td>}
                                        <td>{viewMode === "unit" ? p.Quantity : `${Number(p.Quantity).toFixed(3)} Kg`}</td>
                                        <td>Rs. {Number(p.Purchase_Price || 0).toFixed(2)}</td>
                                        <td>Rs. {Number(p.Sell_Price || 0).toFixed(2)}</td>
                                        <td><b style={{ color: '#27ae60' }}>{Number(p.Discount || 0).toFixed(1)}%</b></td>
                                        <td><b style={{ color: '#f39c12' }}>{Number(p.Max_Discount || 0).toFixed(1)}%</b></td>
                                        <td>{p.SupplierID}</td>
                                        {/* Admin හෝ Manager ට පමණක් Edit සහ Delete Buttons පෙන්වයි */}
    {canEditOrDelete && (
        <td>
            <div className="action-buttons-wrapper">
                <button className="edit-btn-small" onClick={() => handleEditClick(p)}>Edit</button>
                <button className="delete-btn-small" onClick={() => handleDelete(viewMode === "unit" ? p.Product_ID : p.BulkProductID)}>Delete</button>
            </div>
        </td>
    )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="pagination-wrapper">
                            <button className="pagination-btn" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                                ◀ Prev
                            </button>
                            <div className="pagination-numbers">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                                    <button key={number} className={`page-number-btn ${currentPage === number ? 'active' : ''}`} onClick={() => handlePageChange(number)}>
                                        {number}
                                    </button>
                                ))}
                            </div>
                            <button className="pagination-btn" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
                                Next ▶
                            </button>
                        </div>
                    )}
                </div>

                {/* Form Overlay Drawer */}
                <div className={`add-product-overlay ${(isAddProductOpen || isUpdateProductOpen) ? 'open' : ''}`} onClick={() => { setIsAddProductOpen(false); setIsUpdateProductOpen(false); }}>
                    <div className="add-product-sidebar" onClick={(e) => e.stopPropagation()}>
                        <h2>{isUpdateProductOpen ? "Update Product" : "Add Product"}</h2>
                        
                        <div className="form-group">
                            <label>Product ID</label>
                            <input type="text" className="form-input" value={isUpdateProductOpen ? selectedId : (viewMode === "unit" ? nextId : nextBulkId)} readOnly />
                        </div>
                        <div className="form-group">
                            <label>Barcode</label>
                            <input type="text" name="Barcode" className="form-input" placeholder="Enter barcode" value={formData.Barcode} onChange={handleBarcodeChange} />
                        </div>
                        <div className="form-group">
                            <label>Name</label>
                            <input type="text" name="Name" className="form-input" placeholder="Enter product name" value={formData.Name} onChange={handleChange} />
                        </div>
                        {viewMode === "unit" && (
                            <div className="form-group">
                                <label>Brand</label>
                                <input type="text" name="Brand" className="form-input" placeholder="Enter brand name" value={formData.Brand} onChange={handleChange} />
                            </div>
                        )}
                        <div className="form-group">
                            <label>Purchase Price</label>
                            <input type="number" name="PurchasePrice" className="form-input" placeholder="Enter purchase price" value={formData.PurchasePrice} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>Sell Price</label>
                            <input type="number" name="SellPrice" className="form-input" placeholder="Enter sell price" value={formData.SellPrice} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>Discount (%)</label>
                            <input type="number" name="Discount" className="form-input" placeholder="Enter discount percentage" value={formData.Discount} onChange={handleChange} min="0" max="100" step="any" />
                        </div>
                        <div className="form-group">
                            <label>Max Allowed Discount (%)</label>
                            <input type="text" className="form-input" value={`${calculatedMaxDiscountPercent.toFixed(1)}%`} readOnly style={{ background: 'rgba(0,0,0,0.3)', color: '#f1c40f', fontWeight: 'bold' }} />
                        </div>
                        <div className="form-group">
                            <label>Quantity</label>
                            <input type="number" name="Quantity" className="form-input" placeholder="Enter quantity" value={formData.Quantity} onChange={handleChange} step={viewMode === "unit" ? "1" : "any"} />
                        </div>
                        <div className="form-group">
                            <label>Supplier</label>
                            <select name="Supplier" className="form-input" value={formData.Supplier} onChange={handleChange}>
                                <option value="">Select supplier</option>
                                {suppliers.map((s, i) => <option key={i} value={s.SupplierID}>{s.SupplierID} - {s.Name}</option>)}
                            </select>
                        </div>
                        <div className="form-buttons">
                            <button className="add-btn" onClick={isUpdateProductOpen ? handleUpdateProduct : handleAddProduct}>{isUpdateProductOpen ? "Update" : "Add"}</button>
                            <button className="cancel-btn" onClick={() => { setIsAddProductOpen(false); setIsUpdateProductOpen(false); }}>Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Products;