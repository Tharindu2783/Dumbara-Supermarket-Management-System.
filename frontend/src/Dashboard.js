import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './Sidebar';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import bgImage from './assets/abc.avif';
import Header from './Header';

const Dashboard = () => {
    const navigate = useNavigate();

    const [stats, setStats] = useState({
        totalSales: 0,
        totalProfit: 0,
        totalProducts: 0,
        totalSuppliers: 0,
        salesGraphData: []
    });

    const [showResetModal, setShowResetModal] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [isResetLoading, setIsResetLoading] = useState(false);
    const [isResetSuccess, setIsResetSuccess] = useState(false);
    
    const username = sessionStorage.getItem('userName'); 

    const [isChatOpen, setIsChatOpen] = useState(false);
    const [messages, setMessages] = useState([
        { text: "Welcome! I am the Dumbara Business AI Assistant. Based on your database, I can provide sales predictions, profit/loss insights, and business advice. What information do you need today?", isBot: true }
    ]);
    const [chatInput, setChatInput] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);
    const chatEndRef = useRef(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isAiLoading]);

    const getAuthHeaders = (extraHeaders = {}) => {
        const loggedUser = sessionStorage.getItem('userName') || '';
        return {
            'x-user-name': loggedUser,
            ...extraHeaders
        };
    };

    const fetchDashboardData = () => {
        fetch('http://localhost:5000/api/dashboard-stats', {
            method: 'GET',
            headers: getAuthHeaders() 
        })
            .then(res => {
                if (!res.ok) throw new Error("Network response was not ok");
                return res.json();
            })
            .then(data => {
                const formattedChartData = data.chartData ? data.chartData.map(item => ({
                    name: item.Date,
                    sales: Number(item.DailySales),
                    profit: Number(item.DailyProfit || 0),
                    count: Number(item.DailyCount || 0)
                })) : [];

                setStats({
                    totalSales: data.totalSales ?? 0,
                    totalProfit: data.totalProfit ?? 0,
                    totalProducts: data.totalProducts ?? 0,
                    totalSuppliers: data.totalSuppliers ?? 0,
                    salesGraphData: formattedChartData
                });
            })
            .catch(err => console.error("Error fetching dashboard stats:", err));
    };

    useEffect(() => {
        fetchDashboardData();
        const isTemp = sessionStorage.getItem('isTemporary');
        if (isTemp === 'true') {
            setShowResetModal(true);
        }
    }, []);

    const handlePasswordReset = async (e) => {
        e.preventDefault();
        setErrorMsg('');

        if (newPassword !== confirmPassword) {
            setErrorMsg('⚙️ Passwords do not match!');
            return;
        }

        if (newPassword.length < 4) {
            setErrorMsg('⚙️ Password must be at least 4 characters long!');
            return;
        }

        setIsResetLoading(true);

        try {
            const response = await fetch('http://localhost:5000/api/reset-permanent-password', {
                method: 'POST',
                headers: getAuthHeaders({ 'Content-Type': 'application/json' }), 
                body: JSON.stringify({ username, newPassword })
            });
            const data = await response.json();

            setTimeout(() => {
                setIsResetLoading(false);
                if (data.success) {
                    setIsResetSuccess(true); 
                } else {
                    setErrorMsg('Update failed!');
                }
            }, 1200);

        } catch (err) {
            setIsResetLoading(false);
            setErrorMsg('A Server Error occurred!');
            console.error(err);
        }
    };

    const handleSuccessRedirect = () => {
        sessionStorage.clear(); 
        localStorage.clear(); 
        setShowResetModal(false);
        setIsResetSuccess(false);
        navigate('/'); 
    };

    const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isAiLoading) return;

    const userMessage = chatInput;
    setMessages(prev => [...prev, { text: userMessage, isBot: false }]);
    setChatInput('');
    setIsAiLoading(true);

    try {
        const response = await fetch('http://localhost:5000/api/chat', {
            method: 'POST',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }), 
            body: JSON.stringify({ message: userMessage })
        });

        const data = await response.json();
        
        if (response.ok && data.reply) {
            setMessages(prev => [...prev, { text: data.reply, isBot: true }]);
        } else {
            // Backend එකෙන් ආපු exact error එක හෝ fallback message එක පෙන්වයි
            const errorMessage = data.error || "Sorry, I was unable to process a response.";
            setMessages(prev => [...prev, { text: `⚠️ Error: ${errorMessage}`, isBot: true }]);
        }
    } catch (error) {
        console.error("AI Error:", error);
        setMessages(prev => [...prev, { text: "Unable to connect to the server. Please check if the Back-end is running.", isBot: true }]);
    } finally {
        setIsAiLoading(false);
    }
};

    return (
        <div className="db-main-layout" style={{ backgroundImage: `url(${bgImage})` }}>
            <Sidebar />
            <div className="db-content-area">
                <Header />
                
                {/* Summary Cards Row */}
                <div className="db-stats-container db-fadeInRight">
                    <div className="db-glass-stat-card">
                        <h3 className="db-glass-stat-card-title">Gross Sales</h3>
                        <h1 className="db-only-total-number db-sales-color">
                            Rs. {(stats.totalSales || 0).toFixed(2)}
                        </h1>
                    </div>
                    <div className="db-glass-stat-card">
                        <h3 className="db-glass-stat-card-title">Gross Profit</h3>
                        <h1 className="db-only-total-number db-profit-color">
                            Rs. {(stats.totalProfit || 0).toFixed(2)}
                        </h1>
                    </div>
                    <div className="db-glass-stat-card">
                        <h3 className="db-glass-stat-card-title">Total Products</h3>
                        <h1 className="db-only-total-number db-items-color">
                            {stats.totalProducts}
                        </h1>
                    </div>
                    <div className="db-glass-stat-card">
                        <h3 className="db-glass-stat-card-title">Total Suppliers</h3>
                        <h1 className="db-only-total-number db-suppliers-color">
                            {stats.totalSuppliers}
                        </h1>
                    </div>
                </div>

                {/* 📊 Responsive charts section (arranged into a single column on mobile) */}
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr', 
                    gap: '15px', 
                    width: '100%', 
                    maxWidth: '1200px',
                    marginTop: '-5px', 
                    marginBottom: '40px',
                    boxSizing: 'border-box'
                }}>
                    
                    {/* 1. Total Sales Analytics */}
                    <div className="db-table-glass-container db-fadeInRight">
                        <div className="db-table-top-header">
                            <div className="db-title-section">Total Sales Analytics</div>
                        </div>
                        <div className="db-graph-wrapper">
                            <ResponsiveContainer width="100%" height={220}>
                                <LineChart data={stats.salesGraphData} margin={{ top: 10, right: 15, left: -25, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                    <XAxis 
                                        dataKey="name" 
                                        tick={{ fontSize: 10, fill: '#666' }} 
                                        axisLine={false} 
                                        tickLine={false}
                                        interval={0}
                                        tickFormatter={(tick) => tick ? tick.substring(5) : ''}
                                    />
                                    <YAxis tick={{ fontSize: 10, fill: '#666' }} axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{ stroke: '#2ecc71', strokeWidth: 1 }} />
                                    <Line type="monotone" dataKey="sales" name="Sales (Rs)" stroke="#2ecc71" strokeWidth={3} dot={{ fill: '#2ecc71', r: 4 }} activeDot={{ r: 7 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* 2. Daily Transaction Count */}
                    <div className="db-table-glass-container db-fadeInRight">
                        <div className="db-table-top-header">
                            <div className="db-title-section" style={{ color: '#e67e22' }}>Daily Transaction Count</div>
                        </div>
                        <div className="db-graph-wrapper">
                            <ResponsiveContainer width="100%" height={220}>
                                <LineChart data={stats.salesGraphData} margin={{ top: 10, right: 15, left: -25, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                    <XAxis 
                                        dataKey="name" 
                                        tick={{ fontSize: 10, fill: '#666' }} 
                                        axisLine={false} 
                                        tickLine={false}
                                        interval={0}
                                        tickFormatter={(tick) => tick ? tick.substring(5) : ''}
                                    />
                                    <YAxis tick={{ fontSize: 10, fill: '#666' }} axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{ stroke: '#e67e22', strokeWidth: 1 }} />
                                    <Line type="monotone" dataKey="count" name="Transactions" stroke="#e67e22" strokeWidth={3} dot={{ fill: '#e67e22', r: 4 }} activeDot={{ r: 7 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* 3. Total Profit Analytics */}
                    <div className="db-table-glass-container db-fadeInRight">
                        <div className="db-table-top-header">
                            <div className="db-title-section" style={{ color: '#007bff' }}>Total Profit Analytics</div>
                        </div>
                        <div className="db-graph-wrapper">
                            <ResponsiveContainer width="100%" height={220}>
                                <LineChart data={stats.salesGraphData} margin={{ top: 10, right: 15, left: -25, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                    <XAxis 
                                        dataKey="name" 
                                        tick={{ fontSize: 10, fill: '#666' }} 
                                        axisLine={false} 
                                        tickLine={false}
                                        interval={0}
                                        tickFormatter={(tick) => tick ? tick.substring(5) : ''}
                                    />
                                    <YAxis tick={{ fontSize: 10, fill: '#666' }} axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{ stroke: '#007bff', strokeWidth: 1 }} />
                                    <Line type="monotone" dataKey="profit" name="Profit (Rs)" stroke="#007bff" strokeWidth={3} dot={{ fill: '#007bff', r: 4 }} activeDot={{ r: 7 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                </div>
            </div>

            {/* 🤖 FLOATING AI CHATBOT SYSTEM */}
            <div className="db-ai-assistant-wrapper">
                <button className={`db-ai-float-btn ${isChatOpen ? 'db-chat-active' : ''}`} onClick={() => setIsChatOpen(!isChatOpen)}>
                    {isChatOpen ? '✖' : '🤖'}
                </button>

                {isChatOpen && (
                    <div className="db-ai-chat-window db-animate-popup">
                        <div className="db-ai-chat-header">
                            <div className="db-ai-avatar">💡</div>
                            <div>
                                <h4>Dumbara Business AI</h4>
                                <span className="db-online-dot">Live System Analyst</span>
                            </div>
                        </div>

                        <div className="db-ai-chat-messages">
                            {messages.map((msg, index) => (
                                <div key={index} className={`db-ai-msg-row ${msg.isBot ? 'db-bot-row' : 'db-user-row'}`}>
                                    <div className="db-ai-message-bubble">
                                        <div className="db-message-text">
                                            {msg.text.split('\n').map((line, i) => (
                                                <p key={i} style={{ margin: '0 0 6px 0' }}>{line}</p>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {isAiLoading && (
                                <div className="db-ai-msg-row db-bot-row">
                                    <div className="db-ai-message-bubble db-loading-bubble">
                                        <div className="db-typing-indicator">
                                            <span></span><span></span><span></span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        <form className="db-ai-chat-input-area" onSubmit={handleSendChatMessage}>
                            <input 
                                type="text" 
                                placeholder="Ask about sales, predictions..." 
                                value={chatInput} 
                                onChange={(e) => setChatInput(e.target.value)} 
                                disabled={isAiLoading}
                            />
                            <button type="submit" disabled={isAiLoading || !chatInput.trim()}>Send</button>
                        </form>
                    </div>
                )}
            </div>

            {/* 🚨 FORCE RESET PASSWORD POPUP MODAL */}
            {showResetModal && (
                <div style={modalOverlayStyle}>
                    <div style={{ ...modalContentStyle, position: 'relative' }}>
                        {isResetLoading && (
                            <div className="forgot-glass-loader" style={{ borderRadius: '15px' }}>
                                <div className="modern-login-spinner"></div>
                                <div className="loader-login-text">SAVING SYSTEM PASSWORD...</div>
                            </div>
                        )}

                        {isResetSuccess ? (
                            <div style={{ padding: '10px 0' }}>
                                <div style={{ fontSize: '3.5rem', marginBottom: '10px' }}>🎉</div>
                                <h3 style={{ color: '#2ecc71', margin: '0 0 10px 0', fontSize: '20px' }}>Password Saved!</h3>
                                <p style={{ fontSize: '13px', color: '#eee', lineHeight: '1.5', marginBottom: '20px' }}>
                                    Your secure permanent password has been successfully configured. Please log in again to access the terminal.
                                </p>
                                <button className="modal-btn-confirm" style={{ width: '100%' }} onClick={handleSuccessRedirect}>
                                    Proceed to Login Screen 🚪
                                </button>
                            </div>
                        ) : (
                            <>
                                <h2 style={{ color: '#e74c3c', marginTop: 0, fontSize: '18px' }}>🔐 Security Requirement</h2>
                                <p style={{ color: '#bbb', fontSize: '13px', lineHeight: '1.4' }}>
                                    You have logged into the system using a temporary password. Please configure your new permanent password before proceeding.
                                </p>
                                
                                {errorMsg && (
                                    <div style={{ color: '#ff6b6b', fontWeight: 'bold', margin: '10px 0', fontSize: '13px' }}>
                                        {errorMsg}
                                    </div>
                                )}

                                <form onSubmit={handlePasswordReset}>
                                    <div style={{ marginBottom: '12px', textAlign: 'left' }}>
                                        <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', color: '#fff', fontSize: '13px' }}>
                                            New Password:
                                        </label>
                                        <input 
                                            type="password" 
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            required 
                                            style={inputStyle}
                                            placeholder="Enter new password"
                                            disabled={isResetLoading}
                                        />
                                    </div>

                                    <div style={{ marginBottom: '15px', textAlign: 'left' }}>
                                        <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', color: '#fff', fontSize: '13px' }}>
                                            Confirm Password:
                                        </label>
                                        <input 
                                            type="password" 
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required 
                                            style={inputStyle}
                                            placeholder="Confirm new password"
                                            disabled={isResetLoading}
                                        />
                                    </div>

                                    <button type="submit" style={btnStyle} disabled={isResetLoading}>Save New Password</button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const modalOverlayStyle = {
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.85)', 
    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999,
    padding: '10px', boxSizing: 'border-box'
};

const modalContentStyle = {
    background: 'rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    padding: '20px', borderRadius: '15px',
    maxWidth: '400px', width: '100%', textAlign: 'center',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
    color: '#fff',
    boxSizing: 'border-box',
    maxHeight: '90vh',
    overflowY: 'auto'
};

const inputStyle = {
    width: '100%', 
    padding: '10px', borderRadius: '8px', 
    border: '1px solid rgba(255,255,255,0.3)', fontSize: '13.5px',
    background: 'rgba(255,255,255,0.1)', color: '#fff', outline: 'none',
    boxSizing: 'border-box'
};

const btnStyle = {
    width: '100%', padding: '11px', border: 'none', borderRadius: '8px',
    backgroundColor: '#2ecc71', color: '#fff', fontSize: '14.5px', fontWeight: 'bold', 
    cursor: 'pointer', boxShadow: '0 4px 15px rgba(46, 204, 113, 0.4)', transition: '0.3s'
};

export default Dashboard;