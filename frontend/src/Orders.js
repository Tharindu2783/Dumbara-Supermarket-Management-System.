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
    
    /* 👑 LocalStorage එකෙන් ලොග් වෙලා ඉන්න User ගේ Role එක මෙතනට ගන්නවා */
    const currentUserRole = localStorage.getItem('userRole') || 'Assistant';

    const [formData, setFormData] = useState({
        POID: '', ProductID: '', Name: '', Qty: ''
    });

    useEffect(() => {
        fetchOrders();

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                fetchOrders();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    const fetchOrders = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/orders/all'); 
            setOrders(res.data);
        } catch (err) {
            console.error("Error fetching orders:", err);
        }
    };

    const handleOpenAddOrder = async () => {
        try {
            const poidRes = await axios.get('http://localhost:5000/api/orders/next-poid');
            const prodRes = await axios.get('http://localhost:5000/api/orders/products-list');
            
            setProducts(prodRes.data);
            
            setFormData({
                POID: poidRes.data.nextPOID, 
                ProductID: '',
                Name: '',
                Qty: ''
            });
            
            setIsAddOrderOpen(true);
        } catch (err) {
            alert("Error loading initial data from API");
            console.error(err);
        }
    };

    const handleProductChange = (e) => {
        const selectedId = e.target.value;
        const selectedProd = products.find(p => p.productid === selectedId);
        
        setFormData({
            ...formData,
            ProductID: selectedId,
            Name: selectedProd ? selectedProd.name : '' 
        });
    };

    const handleQtyChange = (e) => {
        setFormData({ ...formData, Qty: e.target.value });
    };

    const handleSendForApproval = async () => {
        if (!formData.ProductID || !formData.Qty) {
            alert("Please select a Product and enter Quantity!");
            return;
        }

        try {
            const response = await axios.post('http://localhost:5000/api/orders/add-request', formData);
            alert(response.data.message); 
            setIsAddOrderOpen(false); 
            fetchOrders(); 
        } catch (err) {
            alert("Failed to send request for approval");
            console.error(err);
        }
    };

    const handleActionChange = async (poid, currentStatus, selectedStatus) => {
        if (!selectedStatus) return;

        if (currentUserRole !== 'Manager') {
            alert("❌ Access Denied: Only Managers can approve or modify orders!");
            return;
        }

        if (currentStatus === 'Received' || currentStatus === 'Cancel') {
            alert(`This order is already ${currentStatus} and cannot be modified.`);
            return;
        }

        const confirmChange = window.confirm(`Are you sure you want to change the status of ${poid} to "${selectedStatus}"?`);
        
        if (confirmChange) {
            try {
                const response = await axios.put('http://localhost:5000/api/email-orders/update-status', {
                    POID: poid,
                    newStatus: selectedStatus
                });
                
                alert(`✅ ${response.data.message}`);
                fetchOrders(); 
            } catch (err) {
                alert("❌ Failed to update order status.");
                console.error(err);
            }
        }
    };

    return (
        <div className="main-layout" style={{ backgroundImage: `url(${bgImage})` }}>
            <Sidebar />
            <div className="content-area">
                
                <Header />

                <div className="stats-container fadeInRight">
                    <div className="glass-stat-card">
                        <h3>Pending Approve</h3>
                        <h1 className="total-number-special ">
                            {orders.filter(o => o.Status === 'Approval Pending' || o.Status === 'Pending').length}
                        </h1>
                    </div>
                    <div className="glass-stat-card">
                        <h3>Total expences</h3>
                        <h1 className="total-number expense-color">
                            Rs. {orders
                                .filter(o => o.Status === 'Received') 
                                .reduce((sum, o) => sum + Number(o.Total || 0), 0) 
                                .toFixed(2)}
                        </h1>
                    </div>
                </div>

                <div className="table-glass-container fadeInRight">
                    <div className="table-top-header">
                        <div className="title-section">
                            Orders <span className="plus-icon" onClick={handleOpenAddOrder}>+</span>
                        </div>
                    </div>

                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>POID</th>
                                <th>ProductID</th>
                                <th>Name</th>
                                <th>Qty</th>
                                <th>Total</th>
                                <th>Date</th>
                                <th>Time</th>
                                <th>Status</th>
                                <th>Action</th> 
                            </tr>
                        </thead>
                        <tbody>
                            {[...orders].reverse().map((o, index) => (
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
                                        {/* 🎯 නිවැරදි කරන ලද <select> කොටස */}
                                        <select 
                                            className="action-dropdown"
                                            // 💡 ලොජික් එක වෙනස් කළා: Status එක Approved හෝ Approval Pending නම් Dropdown එක '-- Select Action --' ලෙස පෙන්වයි
                                            value={(o.Status === 'Approval Pending' || o.Status === 'Approved') ? '' : o.Status}
                                            onChange={(e) => handleActionChange(o.POID, o.Status, e.target.value)}
                                            disabled={
                                                currentUserRole !== 'Manager' || 
                                                o.Status === 'Received' || 
                                                o.Status === 'Cancel'
                                            }
                                        >
                                            <option value="" disabled>-- Select Action --</option>
                                            
                                            {/* ✅ 'Approval Pending' මට්ටමේ තිබේ නම් පමණක් 'Approve' කිරීමට ඉඩ දෙයි */}
                                            {o.Status === 'Approval Pending' && (
                                                <option value="Approved">Approve</option>
                                            )}
                                            
                                            <option value="Received">Received</option>
                                            <option value="Cancel">Canceled</option>
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Add Order Sidebar Overlay */}
                <div className={`add-product-overlay ${isAddOrderOpen ? 'open' : ''}`} onClick={() => setIsAddOrderOpen(false)}>
                    <div className="add-product-sidebar" onClick={(e) => e.stopPropagation()}>
                        <div className="sidebar-form-header">
                            <h2>Orders</h2>
                        </div>
                        <div className="form-group">
                            <label>POID</label>
                            <input type="text" name="POID" className="form-input-rounded" value={formData.POID} readOnly style={{ background: 'rgba(255,255,255,0.1)', cursor: 'not-allowed' }} />
                        </div>
                        <div className="form-group">
                            <label>ProductID</label>
                            <select name="ProductID" className="form-input-rounded" value={formData.ProductID} onChange={handleProductChange}>
                                <option value="">-- Select Product ID --</option>
                                {products.map((p) => (
                                    <option key={p.productid} value={p.productid}>
                                        {p.productid} - {p.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Name</label>
                            <input type="text" name="Name" className="form-input-rounded" value={formData.Name} readOnly style={{ background: 'rgba(255,255,255,0.1)', cursor: 'not-allowed' }} placeholder="Select Product ID first" />
                        </div>
                        <div className="form-group">
                            <label>Quantity</label>
                            <input type="number" name="Qty" className="form-input-rounded" value={formData.Qty} onChange={handleQtyChange} placeholder="Enter quantity" />
                        </div>
                        <div className="form-buttons-modern">
                            <button className="send-approval-btn" onClick={handleSendForApproval}>
                                Send For Approval
                            </button>
                            <button className="cancel-btn-modern" onClick={() => setIsAddOrderOpen(false)}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default Orders;