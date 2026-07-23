// frontend/src/Orders.js
import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import axios from 'axios'; 
import './Orders.css';
import bgImage from './assets/abc.avif';
import Header from './Header';

function Orders() {
    const [orders, setOrders] = useState([]); 
    const [products, setProducts] = useState([]); 
    const [searchTerm, setSearchTerm] = useState(""); 
    const [isAddOrderOpen, setIsAddOrderOpen] = useState(false);
    
    const [productSearch, setProductSearch] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);
    const [isBulk, setIsBulk] = useState(false); 
    const [weightUnit, setWeightUnit] = useState('Kg'); 

    // 📄 Pagination States
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Edit Modal States
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingOrder, setEditingOrder] = useState(null);
    const [editQty, setEditQty] = useState('');
    const [editUnitPrice, setEditUnitPrice] = useState(''); 
    const [editUnit, setEditUnit] = useState('Kg');
    const [isEditBulk, setIsEditBulk] = useState(false);

    // Loader States
    const [isOrderLoading, setIsOrderLoading] = useState(false);
    const [loaderText, setLoaderText] = useState("PROCESSING...");

    const currentUserRole = sessionStorage.getItem('userRole') || 'Assistant';
    const [formData, setFormData] = useState({ POID: '', ProductID: '', Name: '', Qty: '' });

    const getAxiosConfig = (extraHeaders = {}) => {
        const username = sessionStorage.getItem('userName') || '';
        return {
            headers: {
                'x-user-name': username,
                ...extraHeaders
            }
        };
    };

    useEffect(() => {
        fetchOrders();
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') { fetchOrders(); }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    // Reset the page to 1 when searching
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const fetchOrders = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/orders/all', getAxiosConfig()); 
            setOrders(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error("Error fetching orders:", err);
            setOrders([]);
        }
    };

    const handleOpenAddOrder = async () => {
        try {
            const poidRes = await axios.get('http://localhost:5000/api/orders/next-poid', getAxiosConfig());
            const prodRes = await axios.get('http://localhost:5000/api/orders/products-list', getAxiosConfig());
            
            setProducts(Array.isArray(prodRes.data) ? prodRes.data : []);
            setProductSearch(""); 
            setShowDropdown(false);
            setIsBulk(false); 
            setWeightUnit('Kg');
            
            setFormData({
                POID: poidRes.data.nextPOID, 
                ProductID: '', Name: '', Qty: ''
            });
            setIsAddOrderOpen(true);
        } catch (err) {
            alert("Error loading initial data from API");
            console.error(err);
        }
    };

    const handleSelectProduct = (prod) => {
        const prodId = prod.productid || prod.ProductID || '';
        const prodName = prod.name || prod.Name || '';
        setFormData({ ...formData, ProductID: prodId, Name: prodName });
        setProductSearch(prodName); 
        if (prod.Type === 'Bulk' || (prodId && prodId.toString().startsWith('B'))) {
            setIsBulk(true);
            setWeightUnit('Kg');
        } else {
            setIsBulk(false);
        }
        setShowDropdown(false); 
    };

    const handleQtyChange = (e) => { setFormData({ ...formData, Qty: e.target.value }); };

    const handleSendForApproval = async () => {
        if (!formData.ProductID || !formData.Qty) {
            alert("Please select a Product and enter Quantity!");
            return;
        }
        let finalQtyForDB = parseFloat(formData.Qty) || 1; 
        if (isBulk && weightUnit === 'g') { finalQtyForDB = parseFloat(formData.Qty) / 1000; }

        const submissionData = { ...formData, Qty: finalQtyForDB };

        setLoaderText("SENDING FOR APPROVAL...");
        setIsOrderLoading(true);

        try {
            await axios.post('http://localhost:5000/api/orders/add-request', submissionData, getAxiosConfig());
            setTimeout(() => {
                setIsOrderLoading(false);
                setIsAddOrderOpen(false); 
                fetchOrders(); 
            }, 500);
        } catch (err) {
            setIsOrderLoading(false);
            alert("Failed to send request for approval");
            console.error(err);
        }
    };

    const handleOpenEdit = (order) => {
        setEditingOrder(order);
        setEditQty(order.Qty);
        
        const currentUnitPrice = order.Qty > 0 ? (order.Total / order.Qty) : 0;
        setEditUnitPrice(currentUnitPrice.toFixed(2));

        const prodId = String(order.ProductID || order.productid || '').trim();
        const prodIdUpper = prodId.toUpperCase();

        const matchedProduct = products.find(p => 
            String(p.productid || p.ProductID || '').trim().toUpperCase() === prodIdUpper
        );

        const isBulkProd = 
            matchedProduct?.Type === 'Bulk' || 
            prodIdUpper.startsWith('B');

        setIsEditBulk(isBulkProd);
        setEditUnit('Kg');
        setIsEditModalOpen(true);
    };

    const handleSaveEditQty = async () => {
        if (!editQty || parseFloat(editQty) <= 0 || !editUnitPrice || parseFloat(editUnitPrice) < 0) {
            alert("Please enter a valid Quantity and Unit Price!");
            return;
        }

        let finalQtyForDB = parseFloat(editQty);
        if (isEditBulk && editUnit === 'g') {
            finalQtyForDB = parseFloat(editQty) / 1000;
        }

        setLoaderText("UPDATING ORDER DETAILS...");
        setIsOrderLoading(true);

        try {
            await axios.put('http://localhost:5000/api/orders/update-qty-price', {
                POID: editingOrder.POID,
                newQty: finalQtyForDB,
                unitPrice: parseFloat(editUnitPrice)
            }, getAxiosConfig());

            setTimeout(() => {
                setIsOrderLoading(false);
                setIsEditModalOpen(false);
                fetchOrders();
            }, 500);
        } catch (err) {
            setIsOrderLoading(false);
            alert("Failed to update order details.");
            console.error(err);
        }
    };

    const handleActionChange = async (poid, currentStatus, selectedStatus) => {
        if (!selectedStatus) return;
        if (currentUserRole !== 'Manager' && currentUserRole !== 'Admin') {
            alert("❌ Access Denied: Only Managers or Admins can approve or modify orders!");
            return;
        }
        if (currentStatus === 'Received' || currentStatus === 'Cancel') {
            alert(`This order is already ${currentStatus} and cannot be modified.`);
            return;
        }

        const confirmChange = window.confirm(`Are you sure you want to change the status of ${poid} to "${selectedStatus}"?`);
        if (confirmChange) {
            if (selectedStatus === 'Approved') {
                setLoaderText("SENDING EMAIL...");
            } else if (selectedStatus === 'Received') {
                setLoaderText("UPDATING STOCK INVENTORY...");
            } else if (selectedStatus === 'Cancel') {
                setLoaderText("CANCELLING PURCHASE ORDER...");
            } else {
                setLoaderText("PROCESSING TRANSACTION...");
            }

            setIsOrderLoading(true);

            try {
                await axios.put('http://localhost:5000/api/orders/update-status', {
                    POID: poid, newStatus: selectedStatus
                }, getAxiosConfig());
                
                setTimeout(() => {
                    setIsOrderLoading(false);
                    fetchOrders(); 
                }, 800);
            } catch (err) {
                setIsOrderLoading(false);
                alert("❌ Failed to update order status.");
                console.error(err);
            }
        }
    };

    const filteredProducts = Array.isArray(products)
        ? products.filter(p => {
            const id = (p.productid || p.ProductID || '').toString().toLowerCase();
            const name = (p.name || p.Name || '').toString().toLowerCase();
            const search = productSearch.toLowerCase();
            return id.includes(search) || name.includes(search);
          })
        : [];

    const filteredOrders = Array.isArray(orders)
        ? orders.filter(o => o.Name?.toLowerCase().includes(searchTerm.toLowerCase()) || o.POID?.toLowerCase().includes(searchTerm.toLowerCase()))
        : [];

    // Reverse orders for latest first
    const reversedOrders = [...filteredOrders].reverse();

    // 📄 Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = reversedOrders.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(reversedOrders.length / itemsPerPage);

    const handlePageChange = (pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
    };

    return (
        <div className="main-layout" style={{ backgroundImage: `url(${bgImage})` }}>
            
            {isOrderLoading && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    backgroundColor: 'rgba(0, 0, 0, 0.45)',
                    backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                    display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                    zIndex: 999999
                }}>
                    <div className="modern-login-spinner" style={{ borderColor: 'rgba(46, 204, 113, 0.2)', borderTopColor: '#2ecc71', width: '55px', height: '55px' }}></div>
                    <div className="loader-login-text" style={{ color: '#2ecc71', fontWeight: 'bold', marginTop: '20px', letterSpacing: '2px', fontSize: '15px' }}>
                        {loaderText}
                    </div>
                </div>
            )}

            <Sidebar />
            <div className="content-area">
                <Header />
                <div className="stats-container fadeInRight">
                    <div className="glass-stat-card">
                        <h3>Pending Approve</h3>
                        <h1 className="total-number-special">
                            {filteredOrders.filter(o => o.Status === 'Approval Pending' || o.Status === 'Pending').length}
                        </h1>
                    </div>
                    <div className="glass-stat-card">
                        <h3>Pending Receive</h3>
                        <h1 className="total-number-special">
                            {filteredOrders.filter(o => o.Status === 'Approved').length}
                        </h1>
                    </div>
                    <div className="glass-stat-card">
                        <h3>Total Expenses</h3>
                        <h1 className="total-number expense-color">
                            Rs. {filteredOrders.filter(o => o.Status === 'Received').reduce((sum, o) => sum + Number(o.Total || 0), 0).toFixed(2)}
                        </h1>
                    </div>
                </div>

                <div className="table-glass-container fadeInRight">
                    <div className="table-top-header">
                        <div className="title-section">
                            Orders <span className="plus-icon" onClick={handleOpenAddOrder}>+</span>
                        </div>
                        <div className="search-container">
                            <input type="text" placeholder="Search Order..." className="search-input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                    </div>

                    <div className="orders-table-wrapper">
                        <table className="modern-table">
                            <thead>
                                <tr>
                                    <th>POID</th><th>ProductID</th><th>Name</th><th>Qty</th><th>Total</th><th>Date</th><th>Time</th><th>Status</th><th>Action</th> 
                                </tr>
                            </thead>
                            <tbody>
                                {currentItems.length === 0 ? (
                                    <tr>
                                        <td colSpan="9" style={{ textAlign: 'center', color: '#888', padding: '25px' }}>
                                            No orders found
                                        </td>
                                    </tr>
                                ) : (
                                    currentItems.map((o, index) => {
                                        const isCompleted = o.Status === 'Received' || o.Status === 'Cancel';
                                        const canManage = currentUserRole === 'Manager' || currentUserRole === 'Admin';
                                        return (
                                            <tr key={index}>
                                                <td><strong>{o.POID}</strong></td>
                                                <td>{o.ProductID}</td>
                                                <td>{o.Name}</td>
                                                <td>{o.Qty}</td>
                                                <td>Rs. {Number(o.Total || 0).toFixed(2)}</td>
                                                <td>{o.Date}</td>
                                                <td>{o.Time}</td>
                                                <td>
                                                    <span className={`status-badge ${o.Status ? o.Status.toLowerCase().replace(' ', '-') : 'pending'}`}>
                                                        {o.Status === 'Cancel' ? 'Canceled' : o.Status}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="action-buttons-flex">
                                                        <button 
                                                            className="edit-btn-small" 
                                                            onClick={() => handleOpenEdit(o)}
                                                            disabled={isCompleted || !canManage}
                                                            title="Edit Quantity and Price"
                                                        >
                                                            Edit
                                                        </button>

                                                        <select 
                                                            className="action-dropdown" 
                                                            value="" 
                                                            onChange={(e) => handleActionChange(o.POID, o.Status, e.target.value)} 
                                                            disabled={!canManage || isCompleted}
                                                        >
                                                            <option value="" disabled>-- Select Action --</option>
                                                            {(o.Status === 'Approval Pending' || o.Status === 'Pending') && (
                                                                <option value="Approved">Approve</option>
                                                            )}
                                                            <option value="Received">Received</option>
                                                            <option value="Cancel">Canceled</option>
                                                        </select>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* 📄 Pagination Controls */}
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

                {/* EDIT QTY & UNIT PRICE MODAL POPUP */}
                {/* EDIT QTY & UNIT PRICE MODAL POPUP */}
{isEditModalOpen && (
    <div className="orders-modal-overlay">
        <div className="orders-modal-content">
            <h3>Edit Order Details ({editingOrder?.POID})</h3>
            <p style={{ margin: '5px 0 15px 0', color: '#555' }}>Item: <b>{editingOrder?.Name}</b></p>
            
            <div className="form-group">
                <label style={{ color: '#2c3e50', fontWeight: 'bold' }}>New Quantity</label>
                <div className="orders-qty-wrapper">
                    <input 
                        type="number" 
                        className="form-input-rounded qty-flex-input" 
                        style={{ border: '2px solid #2ecc71', backgroundColor: '#ffffff', color: '#2c3e50', fontWeight: 'bold' }}
                        value={editQty} 
                        onChange={(e) => setEditQty(e.target.value)} 
                        placeholder="Enter quantity" 
                        min="0.001" 
                        step="any" 
                    />
                    {isEditBulk && (
                        <select 
                            value={editUnit} 
                            onChange={(e) => setEditUnit(e.target.value)} 
                            className="orders-unit-select"
                            style={{ border: '2px solid #2ecc71', background: '#2ecc71', color: 'white', fontWeight: 'bold' }}
                        >
                            <option value="Kg">Kg</option>
                            <option value="g">g</option>
                        </select>
                    )}
                </div>
            </div>

            <div className="form-group" style={{ marginTop: '15px' }}>
                <label style={{ color: '#2c3e50', fontWeight: 'bold' }}>
                    {isEditBulk ? 'Price per 1 Kg (Rs.)' : 'Price per 1 Unit (Rs.)'}
                </label>
                <input 
                    type="number" 
                    className="form-input-rounded" 
                    style={{ border: '2px solid #2ecc71', backgroundColor: '#ffffff', color: '#2c3e50', fontWeight: 'bold' }}
                    value={editUnitPrice} 
                    onChange={(e) => setEditUnitPrice(e.target.value)} 
                    placeholder="Enter Price" 
                    min="0" 
                    step="any" 
                />
            </div>

            <div className="modal-buttons-flex">
                <button className="send-approval-btn modal-btn" onClick={handleSaveEditQty}>Save Changes</button>
                <button className="cancel-btn-modern modal-btn cancel-bg" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
            </div>
        </div>
    </div>
)}

                {/* Add Order Sidebar Overlay */}
                <div className={`add-product-overlay ${isAddOrderOpen ? 'open' : ''}`} onClick={() => setIsAddOrderOpen(false)}>
                    <div className="add-product-sidebar" onClick={(e) => e.stopPropagation()}>
                        <h2>Orders</h2>
                        <div className="form-group">
                            <label>POID</label>
                            <input type="text" className="form-input-rounded" value={formData.POID} readOnly style={{ background: 'rgba(255,255,255,0.1)', cursor: 'not-allowed' }} />
                        </div>
                        <div className="form-group" style={{ position: 'relative' }}>
                            <label>Product Name / ID</label>
                            <input 
                                type="text" className="form-input-rounded" placeholder="-- Type or Select Product --" value={productSearch}
                                onChange={(e) => {
                                    setProductSearch(e.target.value); setShowDropdown(true);
                                    if(!e.target.value) { setFormData({...formData, ProductID: '', Name: ''}); setIsBulk(false); }
                                }}
                                onFocus={() => setShowDropdown(true)}
                                onBlur={() => setTimeout(() => setShowDropdown(false), 200)} 
                            />
                            {showDropdown && filteredProducts.length > 0 && (
                                <ul className="orders-search-dropdown">
                                    {filteredProducts.map((p, idx) => {
                                        const displayPrice = p.price || p.Sell_Price || 0;
                                        const prodId = p.productid || p.ProductID;
                                        const isProductBulk = p.Type === 'Bulk' || (prodId && prodId.toString().startsWith('B'));
                                        return (
                                            <li key={idx} className="orders-dropdown-item" onMouseDown={() => handleSelectProduct(p)}>
                                                <div>
                                                    <span className={`badge ${isProductBulk ? 'bulk' : 'unit'}`} style={{ marginRight: '8px', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', background: isProductBulk ? '#ffc107' : '#007bff', color: isProductBulk ? '#000' : '#fff' }}>{isProductBulk ? 'Bulk' : 'Unit'}</span>
                                                    <span className="ord-prod-name-main">{p.name || p.Name}</span>
                                                </div>
                                                <span style={{ background: 'rgba(230, 126, 34, 0.1)', color: '#e67e22', padding: '4px 8px', borderRadius: '8px', fontWeight: 'bold' }}>Rs.{Number(displayPrice).toFixed(2)}</span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                        <div className="form-group">
                            <label>ProductID</label>
                            <input type="text" className="form-input-rounded" value={formData.ProductID} readOnly style={{ background: 'rgba(255,255,255,0.1)', cursor: 'not-allowed' }} />
                        </div>
                        <div className="form-group">
                            <label>Name</label>
                            <input type="text" className="form-input-rounded" value={formData.Name} readOnly style={{ background: 'rgba(255,255,255,0.1)', cursor: 'not-allowed' }} />
                        </div>
                        <div className="form-group">
                            <label>Quantity</label>
                            <div className="orders-qty-wrapper">
                                <input type="number" className="form-input-rounded qty-flex-input" value={formData.Qty} onChange={handleQtyChange} placeholder="Enter quantity" min="0.001" step="any" />
                                {isBulk && (
                                    <select value={weightUnit} onChange={(e) => setWeightUnit(e.target.value)} className="orders-unit-select">
                                        <option value="Kg">Kg</option><option value="g">g</option>
                                    </select>
                                )}
                            </div>
                        </div>
                        <div className="form-buttons-modern">
                            <button className="send-approval-btn" onClick={handleSendForApproval}>Send For Approval</button>
                            <button className="cancel-btn-modern" onClick={() => setIsAddOrderOpen(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Orders;