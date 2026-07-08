import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import Sidebar from './Sidebar';
import './Suppliers.css';
import bgImage from './assets/abc.avif';
import Header from './Header';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE'];

function Suppliers() {
    const [suppliers, setSuppliers] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [stats, setStats] = useState({ supplierStats: [], totalSuppliers: 0 });
    
    // Sidebars සඳහා States
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    
    const [nextSupId, setNextSupId] = useState("");
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [formData, setFormData] = useState({ Name: '', Contact: '', Email: '' });

// 1. fetchData function එක මෙතනින් ඉවර වෙනවා
    const fetchData = () => {
        // Suppliers ලැයිස්තුව ලබා ගැනීම
        fetch('http://localhost:5000/api/get-suppliers-list')
            .then(res => res.json())
            .then(data => setSuppliers(data))
            .catch(err => console.error(err));

        // මුළු සැපයුම්කරුවන් ගණන ලබා ගැනීම
        fetch('http://localhost:5000/api/getsuppliercount')
            .then(res => res.json())
            .then(data => setStats(prevStats => ({
                ...prevStats,
                totalSuppliers: data.totalSuppliers || 0
            })))
            .catch(err => console.error(err));

        // Chart එකට අවශ්‍ය දත්ත ලබා ගැනීම (අලුත් URL එක)
        fetch('http://localhost:5000/api/product-dashboard-stats')
            .then(res => res.json())
            .then(data => setStats(prevStats => ({
                ...prevStats,
                supplierStats: data.supplierStats || [] 
            })))
            .catch(err => console.error(err));
    }; // 👈 fetchData function එක මෙතනින් වැහෙනවා ({})

    // 2. 💡 useEffect එක සාමාන්‍ය function එකෙන් එලියට අරන්, Component එක ඇතුලේ වෙනම ලිව්වා
    useEffect(() => { 
        fetchData(); 
    }, []);

    // Add Sidebar විවෘත කිරීම
    const handleOpenAdd = () => {
        fetch('http://localhost:5000/api/next-supplier-id')
            .then(res => res.json())
            .then(data => {
                setNextSupId(data.nextSupplierId);
                setFormData({ Name: '', Contact: '', Email: '' });
                setIsAddOpen(true);
            });
    };

    // Edit Sidebar විවෘත කිරීම
    const handleEditClick = (supplier) => {
        setSelectedSupplier(supplier);
        setFormData({ Name: supplier.Name, Contact: supplier.Contact, Email: supplier.Email });
        setIsEditOpen(true);
    };

    // Add Submit
    const handleAddSubmit = () => {
        const payload = { SupplierID: nextSupId, ...formData };
        fetch('http://localhost:5000/api/add-supplier', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).then(() => {
            setIsAddOpen(false);
            fetchData();
        });
    };

    // Update Submit
    const handleUpdateSubmit = () => {
        fetch(`http://localhost:5000/api/update-supplier/${selectedSupplier.SupplierID}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        }).then(() => {
            setIsEditOpen(false);
            fetchData();
        });
    };

    // Delete Logic
    const handleDelete = (id) => {
        if(window.confirm("Are you sure you want to delete this supplier?")) {
            fetch(`http://localhost:5000/api/delete-supplier/${id}`, { method: 'DELETE' })
                .then(() => fetchData());
        }
    };

    const filteredSuppliers = suppliers.filter(s => 
        s.Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.SupplierID?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="main-layout" style={{ backgroundImage: `url(${bgImage})` }}>
            <Sidebar />
            <div className="content-area">
                {/* Top Row */}
                <Header />

                {/* Pie Chart & Total Box */}
                <div className="stats-container fadeInRight">
                    <div className="glass-stat-card">
                        <h3>Suppliers</h3>
                        <ResponsiveContainer width="100%" height={150}>
                            <PieChart>
                                <Pie data={stats.supplierStats} dataKey="count" nameKey="SupplierID" cx="50%" cy="50%" outerRadius={50}>
                                    {stats.supplierStats.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="glass-stat-card total-box fadeInRight">
                        <h3>Total suppliers</h3>
                        <h1 className="total-number-special">{stats.totalSuppliers}</h1>
                    </div>
                </div>

                {/* Table with Actions */}
                <div className="table-glass-container fadeInRight">
                    <div className="table-top-header">
                        <div className="title-section">
                            Suppliers <span className="plus-icon" onClick={handleOpenAdd}>+</span>
                        </div>
                        <div className="search-container">
                            <input 
                                type="text" 
                                placeholder="Search Name or ID..." 
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
                                <th>Supplier ID</th><th>Name</th><th>Contact</th><th>Email</th><th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSuppliers.map((s, index) => (
                                <tr key={index}>
                                    <td>{s.SupplierID}</td><td>{s.Name}</td><td>{s.Contact}</td><td>{s.Email}</td>
                                    <td>
                                        <button className="edit-btn-small" onClick={() => handleEditClick(s)}>Edit</button>
                                        <button className="delete-btn-small" onClick={() => handleDelete(s.SupplierID)}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Add Supplier Sidebar */}
                <div className={`add-product-overlay ${isAddOpen ? 'open' : ''}`} onClick={() => setIsAddOpen(false)}>
                    <div className="add-product-sidebar" onClick={e => e.stopPropagation()}>
                        <h2>Add Supplier</h2>
                        <div className="form-group">
                            <label>Supplier ID</label>
                            <input type="text" value={nextSupId} readOnly />
                        </div>
                        <div className="form-group">
                            <label>Name</label>
                            <input type="text" placeholder="Enter name" value={formData.Name} onChange={e => setFormData({...formData, Name: e.target.value})} />
                        </div>
                        <div className="form-group">
                            <label>Contact</label>
                            <input type="text" placeholder="Enter contact" value={formData.Contact} onChange={e => setFormData({...formData, Contact: e.target.value})} />
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input type="email" placeholder="Enter email" value={formData.Email} onChange={e => setFormData({...formData, Email: e.target.value})} />
                        </div>
                        <div className="form-buttons">
                            <button className="add-btn" onClick={handleAddSubmit}>Add</button>
                            <button className="cancel-btn" onClick={() => setIsAddOpen(false)}>Cancel</button>
                        </div>
                    </div>
                </div>

                {/* Update Supplier Sidebar */}
                <div className={`add-product-overlay ${isEditOpen ? 'open' : ''}`} onClick={() => setIsEditOpen(false)}>
                    <div className="add-product-sidebar" onClick={e => e.stopPropagation()}>
                        <h2>Update Supplier</h2>
                        <div className="form-group">
                            <label>Supplier ID</label>
                            <input type="text" value={selectedSupplier?.SupplierID || ''} readOnly />
                        </div>
                        <div className="form-group">
                            <label>Name</label>
                            <input type="text" value={formData.Name} onChange={e => setFormData({...formData, Name: e.target.value})} />
                        </div>
                        <div className="form-group">
                            <label>Contact</label>
                            <input type="text" value={formData.Contact} onChange={e => setFormData({...formData, Contact: e.target.value})} />
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input type="email" value={formData.Email} onChange={e => setFormData({...formData, Email: e.target.value})} />
                        </div>
                        <div className="form-buttons">
                            <button className="add-btn" onClick={handleUpdateSubmit}>Update</button>
                            <button className="cancel-btn" onClick={() => setIsEditOpen(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Suppliers;