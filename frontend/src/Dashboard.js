import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './Sidebar';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import './Dashboard.css';
import bgImage from './assets/abc.avif';
import Header from './Header';

const Dashboard = () => {
    // 📊 Dashboard States
    const [stats, setStats] = useState({
        totalSales: 0,
        totalProfit: 0,
        totalProducts: 0,
        totalSuppliers: 0,
        salesGraphData: []
    });

    // 🤖 Chatbot States
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [messages, setMessages] = useState([
        { text: "ආයුබෝවන්! මම Dumbara Business AI සහායකයා. ඔයාගේ ඩේටාබේස් එක ඇසුරෙන් විකුණුම් අනාවැකි (Sales Predictions), ලාභ අලාභ සහ ව්‍යාපාරික උපදෙස් ලබාදෙන්න මට පුළුවන්. ඔබට අද කුමන තොරතුරක්ද අවශ්‍ය?", isBot: true }
    ]);
    const [chatInput, setChatInput] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);
    const chatEndRef = useRef(null);

    // චැට් එක ගලාගෙන යන විට ස්වයංක්‍රීයව පහළට Scroll වීම සඳහා
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isAiLoading]);

    // Dashboard Data Fetching
    const fetchDashboardData = () => {
        fetch('http://localhost:5000/api/dashboard-stats')
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
    }, []);

    // Chatbot Message Sender
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
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessage })
            });

            const data = await response.json();
            
            if (data.reply) {
                setMessages(prev => [...prev, { text: data.reply, isBot: true }]);
            } else {
                setMessages(prev => [...prev, { text: "කණගාටුයි, මට පිළිතුරක් සකස් කරගන්න අපහසු වුණා.", isBot: true }]);
            }
        } catch (error) {
            console.error("AI Error:", error);
            setMessages(prev => [...prev, { text: "Server එක සම්බන්ධ කරගැනීමට නොහැකි වුණා. කරුණාකර Back-end එක ක්‍රියාත්මකදැයි පරීක්ෂා කරන්න.", isBot: true }]);
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

                {/* 📊 Charts Section */}
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(45%, 1fr))', 
                    gap: '15px', 
                    width: '100%', 
                    marginTop: '-10px', 
                    marginBottom: '50px' 
                }}>
                    
                    {/* 🗂️ LEFT COLUMN: Sales & Transaction Count */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        
                        {/* 📈 1. Sales Analytics Chart */}
                        <div className="db-table-glass-container db-fadeInRight" style={{ padding: '20px 20px', marginBottom: '0px' }}>
                            <div className="db-table-top-header">
                                <div className="db-title-section">Total Sales Analytics</div>
                            </div>
                            <div className="db-graph-wrapper" style={{ width: '100%' }}>
                                <ResponsiveContainer width="100%" height={250}>
                                    <LineChart data={stats.salesGraphData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#666' }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 11, fill: '#666' }} axisLine={false} tickLine={false} />
                                        <Tooltip cursor={{ stroke: '#2ecc71', strokeWidth: 1 }} />
                                        <Line type="monotone" dataKey="sales" name="Sales (Rs)" stroke="#2ecc71" strokeWidth={3} dot={{ fill: '#2ecc71', r: 5 }} activeDot={{ r: 8 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* 🔢 2. Daily Transaction Count Chart */}
                        <div className="db-table-glass-container db-fadeInRight" style={{ padding: '20px 20px', marginBottom: '0px' }}>
                            <div className="db-table-top-header">
                                <div className="db-title-section" style={{ color: '#e67e22' }}>Daily Transaction Count</div>
                            </div>
                            <div className="db-graph-wrapper" style={{ width: '100%' }}>
                                <ResponsiveContainer width="100%" height={250}>
                                    <LineChart data={stats.salesGraphData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#666' }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 11, fill: '#666' }} axisLine={false} tickLine={false} />
                                        <Tooltip cursor={{ stroke: '#e67e22', strokeWidth: 1 }} />
                                        <Line type="monotone" dataKey="count" name="Transactions" stroke="#e67e22" strokeWidth={3} dot={{ fill: '#e67e22', r: 5 }} activeDot={{ r: 8 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                    </div>

                    {/* 📉 RIGHT COLUMN: Profit Analytics Chart */}
                    <div className="db-table-glass-container db-fadeInRight" style={{ 
                        padding: '20px 20px', 
                        marginBottom: '0px',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <div className="db-table-top-header">
                            <div className="db-title-section" style={{ color: '#007bff' }}>Total Profit Analytics</div>
                        </div>
                        
                        <div className="db-graph-wrapper" style={{ width: '100%', flex: 1, display: 'flex', alignItems: 'center' }}>
                            <ResponsiveContainer width="100%" height={560}>
                                <LineChart data={stats.salesGraphData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#666' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: '#666' }} axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{ stroke: '#007bff', strokeWidth: 1 }} />
                                    <Line type="monotone" dataKey="profit" name="Profit (Rs)" stroke="#007bff" strokeWidth={3} dot={{ fill: '#007bff', r: 5 }} activeDot={{ r: 8 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                </div>

            </div>

            {/* ==========================================
                🤖 FLOATING AI CHATBOT SYSTEM FOR DASHBOARD
               ========================================== */}
            <div className="db-ai-assistant-wrapper">
                {/* Floating Action Button */}
                <button className={`db-ai-float-btn ${isChatOpen ? 'db-chat-active' : ''}`} onClick={() => setIsChatOpen(!isChatOpen)}>
                    {isChatOpen ? '✖' : '🤖'}
                </button>

                {/* Glassmorphism Chat Window */}
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
                                placeholder="Ask about sales, predictions, stock..." 
                                value={chatInput} 
                                onChange={(e) => setChatInput(e.target.value)} 
                                disabled={isAiLoading}
                            />
                            <button type="submit" disabled={isAiLoading || !chatInput.trim()}>Send</button>
                        </form>
                    </div>
                )}
            </div>

        </div>
    );
};

export default Dashboard;