import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './Invoice.css';
import bgImage from './assets/abc.avif';
import Header from './Header';

const Invoice = () => {
    const [invoices, setInvoices] = useState([]);
    const [stats, setStats] = useState({
        totalInvoices: 0,
        todayInvoices: 0,
        graphData: []
    });
    const [searchTerm, setSearchTerm] = useState("");

    // ==========================================================================
    // 🔄 1. API එකෙන් දත්ත ලබාගන්නා ෆන්ක්ෂන් එක
    // ==========================================================================
    const fetchInvoiceData = () => {
        fetch('http://localhost:5000/api/get-invoices')
            .then(res => res.json())
            .then(data => {
                setInvoices(data);
                calculateStats(data); // 👈 දත්ත ආපු ගමන් Tabs අප්ඩේට් කරන්න මෙතනින් යවනවා
            })
            .catch(err => console.error("Error fetching invoices:", err));
    };

    // ==========================================================================
    // 📊 2. ලංකාවේ වෙලාවට අනුව Tabs වල දත්ත ගණනය කිරීම
    // ==========================================================================
    const calculateStats = (allInvoices) => {
        const total = allInvoices.length;
        
        // ✅ ශ්‍රී ලංකාවේ සැබෑ දිනය (YYYY-MM-DD) නිවැරදිව ලබා ගැනීම
        const today = new Date();
        const todayStr = today.toLocaleDateString('en-CA', { timeZone: 'Asia/Colombo' }); 
        
        // අද දිනට අදාළ බිල්පත් පමණක් පෙරීම
        const todayCount = allInvoices.filter(inv => inv.Date === todayStr).length;

        // ප්‍රස්ථාරය සඳහා අවසන් බිල්පත් 7 ලබා ගැනීම (Slice කර අග සිට මුලට ගනී)
        const last7Invoices = [...allInvoices].slice(-7); 
        const chartData = last7Invoices.map(inv => ({
            name: inv.InvoiceID,
            total: Number(inv.Total) || 0
        }));

        // 💡 මෙන්න මෙතනින් තමයි Tabs තුනටම අගයන් ටික එකවර සෙට් කරන්නේ
        setStats({
            totalInvoices: total,
            todayInvoices: todayCount,
            graphData: chartData
        });
    };

    // ==========================================================================
    // ❌ 3. බිල්පතක් ඉවත් කිරීමේ ෆන්ක්ෂන් එක
    // ==========================================================================
    const handleDelete = (invoiceID) => {
        if (window.confirm(`Are you sure you want to delete invoice ${invoiceID}?`)) {
            fetch(`http://localhost:5000/api/delete-invoice/${invoiceID}`, {
                method: 'DELETE'
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    alert("Invoice and its PDF deleted successfully!");
                    fetchInvoiceData(); // 👈 ඩිලීට් වුණාම පිටුව බ්ලින්ක් නොවී Tabs ස්වයංක්‍රීයව අප්ඩේට් වේ
                } else {
                    alert("Failed to delete invoice: " + data.message);
                }
            })
            .catch(err => console.error("Error:", err));
        }
    };

    // ==========================================================================
    // 🔓 4. PDF එක විවෘත කිරීමේ ෆන්ක්ෂන් එක
    // ==========================================================================
    const openInvoicePDF = (invoiceID) => {
        const pdfUrl = `http://localhost:5000/invoice/${invoiceID}.pdf`;
        window.open(pdfUrl, '_blank');
    };

    // පිටුව මුලින්ම ලෝඩ් වන විට දත්ත කියවා ගැනීම
    useEffect(() => {
        fetchInvoiceData();
    }, []);

    // Search input එක අනුව Invoices ෆිල්ටර් කිරීම
    const filteredInvoices = invoices.filter(inv =>
        inv.InvoiceID?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="main-layout" style={{ backgroundImage: `url(${bgImage})` }}>
            <Sidebar />
            <div className="content-area">
                <Header />
                
                {/* Summary Cards */}
                <div className="stats-container fadeInRight">
                    <div className="glass-stat-card">
                        <h3>Total Invoices</h3>
                        <h1 className="total-number-special">{stats.totalInvoices}</h1>
                    </div>
                    <div className="glass-stat-card">
                        <h3>Today Invoices</h3>
                        <h1 className="total-number-special invoice-count-color">{stats.todayInvoices}</h1>
                    </div>
                    <div className="glass-stat-card">
                        <h3>Last 7 Invoices Total</h3>
                        <ResponsiveContainer width="100%" height={150}>
                            <BarChart data={stats.graphData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ddd" />
                                <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="total" fill="#FF0000" radius={[5, 5, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Invoices Table */}
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

                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>Invoice ID</th>
                                <th>Total Products</th>
                                <th>Total</th>
                                <th>Date</th>
                                <th>Time</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInvoices.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="no-data-cell">No invoices found</td>
                                </tr>
                            ) : (
                                filteredInvoices.map((inv, index) => (
                                    <tr key={index}>
                                        <td style={{ fontWeight: 'bold' }}>{inv.InvoiceID}</td>
                                        <td>{inv.Product_Qty}</td>
                                        <td>{Number(inv.Total).toFixed(2)}</td>
                                        <td>{inv.Date}</td>
                                        <td>{inv.Time}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <button 
                                                    className="open-pdf-btn" 
                                                    onClick={() => openInvoicePDF(inv.InvoiceID)}
                                                >
                                                    Open
                                                </button>
                                                <button 
                                                    className="delete-invoice-btn" 
                                                    onClick={() => handleDelete(inv.InvoiceID)}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    );
};

export default Invoice;