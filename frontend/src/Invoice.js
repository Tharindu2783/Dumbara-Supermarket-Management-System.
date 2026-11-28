import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './Invoice.css';
import bgImage from './assets/abc.avif';
import Header from './Header';

const Invoice = () => {
    const [invoices, setInvoices] = useState([]);
    const [stats, setStats] = useState({ totalInvoices: 0, todayInvoices: 0, graphData: [] });
    const [searchTerm, setSearchTerm] = useState("");


    const userRole = sessionStorage.getItem('userRole') || localStorage.getItem('userRole') || '';
    const canDelete = userRole === 'Admin' || userRole === 'Manager';

    // 📄 Pagination States
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Helper function to create a common auth header
    const getAuthHeaders = (extraHeaders = {}) => {
        const username = sessionStorage.getItem('userName') || localStorage.getItem('userName') || '';
        return { 
            'x-user-name': username, 
            ...extraHeaders 
        };
    };

    // All Invoices Data Fetching
    const fetchInvoiceData = () => {
        fetch('http://localhost:5000/api/get-invoices', { 
            headers: getAuthHeaders() 
        })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setInvoices(data);
                    calculateStats(data);
                } else {
                    setInvoices([]);
                }
            })
            .catch(err => {
                console.error("Error fetching invoices:", err);
                setInvoices([]);
            });
    };

    // Statistics Calculation
    const calculateStats = (allInvoices) => {
        if (!Array.isArray(allInvoices)) return;
        const total = allInvoices.length;
        const today = new Date();
        const todayStr = today.toLocaleDateString('en-CA', { timeZone: 'Asia/Colombo' }); 
        const todayCount = allInvoices.filter(inv => inv.Date === todayStr).length;

        const last7Invoices = [...allInvoices].slice(-7); 
        const chartData = last7Invoices.map(inv => ({
            name: inv.InvoiceID,
            total: Number(inv.Total) || 0
        }));

        setStats({ totalInvoices: total, todayInvoices: todayCount, graphData: chartData });
    };

    // Delete Invoice Handler
    const handleDelete = (invoiceID) => {
        if (window.confirm(`Are you sure you want to delete invoice ${invoiceID}?`)) {
            fetch(`http://localhost:5000/api/delete-invoice/${invoiceID}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    alert("Invoice and its PDF deleted successfully!");
                    fetchInvoiceData();
                } else {
                    alert("Failed to delete invoice: " + data.message);
                }
            })
            .catch(err => console.error("Error:", err));
        }
    };

    // Fetch the PDF securely with auth headers
    const openInvoicePDF = async (invoiceID) => {
        try {
            const response = await fetch(`http://localhost:5000/api/invoice-pdf/${invoiceID}`, {
                method: 'GET',
                headers: getAuthHeaders()
            });
            
            if (response.status === 403) {
                alert("Access Denied! Invalid Session.");
                return;
            }
            if (!response.ok) { 
                alert("Access Denied or File Not Found"); 
                return; 
            }
            
            const blob = await response.blob();
            const fileURL = URL.createObjectURL(blob);
            window.open(fileURL, '_blank');
        } catch (error) {
            console.error("Error opening PDF:", error);
            alert("Server Error occurred while opening PDF.");
        }
    };

    useEffect(() => { 
        fetchInvoiceData(); 
    }, []);

    // Reset the page to 1 when searching
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    // Filtering & Pagination Logic
    const filteredInvoices = Array.isArray(invoices)
        ? invoices.filter(inv => inv.InvoiceID?.toLowerCase().includes(searchTerm.toLowerCase()))
        : [];

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredInvoices.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);

    const handlePageChange = (pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
    };

    return (
        <div className="main-layout" style={{ backgroundImage: `url(${bgImage})` }}>
            <Sidebar />
            <div className="content-area">
                <Header />

                {/* 🏆 Stats Container */}
                <div className="stats-container fadeInRight">
                    <div className="glass-stat-card">
                        <h3>Total Invoices</h3>
                        <h1 className="total-number-special">{stats.totalInvoices}</h1>
                    </div>
                    <div className="glass-stat-card">
                        <h3>Today Invoices</h3>
                        <h1 className="total-number-special">{stats.todayInvoices}</h1>
                    </div>
                    <div className="glass-stat-card">
                        <h3>Last 7 Invoices Total</h3>
                        <div className="chart-container-box">
                            <ResponsiveContainer width="100%" height={135}>
                                <BarChart data={stats.graphData} margin={{ top: 10, right: 10, left: -15, bottom: 15 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ddd" />
                                    <XAxis 
                                        dataKey="name" 
                                        tick={{ fontSize: 9.5, fill: '#333' }} 
                                        interval={0}
                                        angle={-25}
                                        textAnchor="end"
                                        axisLine={false} 
                                        tickLine={false} 
                                    />
                                    <YAxis tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                                    <Bar dataKey="total" fill="#FF0000" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* 📊 Table Container */}
                <div className="table-glass-container fadeInRight">
                    <div className="table-top-header">
                        <div className="title-section">Invoices</div>
                        <div className="search-container">
                            <input 
                                type="text" 
                                placeholder="Search Invoice ID..." 
                                className="search-input" 
                                value={searchTerm} 
                                onChange={(e) => setSearchTerm(e.target.value)} 
                            />
                        </div>
                    </div>

                    <div className="invoice-table-wrapper">
                        <table className="modern-table">
                            <thead>
                                <tr>
                                    <th>Invoice ID</th>
                                    <th>Total Products</th>
                                    <th>Total (Rs.)</th>
                                    <th>Date</th>
                                    <th>Time</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentItems.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center', color: '#999', padding: '30px' }}>
                                            No invoices found
                                        </td>
                                    </tr>
                                ) : (
                                    currentItems.map((inv, index) => (
                                        <tr key={index}>
                                            <td style={{ fontWeight: 'bold' }}>{inv.InvoiceID}</td>
                                            <td>{inv.Product_Qty}</td>
                                            <td>{Number(inv.Total).toFixed(2)}</td>
                                            <td>{inv.Date}</td>
                                            <td>{inv.Time}</td>
                                            <td>
    <div className="action-buttons-wrapper">
        {/* Open PDF button එක Assistant ඇතුළු හැමෝටම පෙනේ */}
        <button className="open-pdf-btn" onClick={() => openInvoicePDF(inv.InvoiceID)}>Open</button>
        
        {/* Delete button එක Admin/Manager ට පමණක් පෙනේ */}
        {canDelete && (
            <button className="delete-invoice-btn" onClick={() => handleDelete(inv.InvoiceID)}>Delete</button>
        )}
    </div>
</td>
                                        </tr>
                                    ))
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
            </div>
        </div>
    );
};

export default Invoice;