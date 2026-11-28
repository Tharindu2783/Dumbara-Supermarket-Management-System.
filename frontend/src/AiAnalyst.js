import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import bgImage from './assets/abc.avif'; // 🍃 Dumbara Background Image
import './AiAnalyst.css';

const AiAnalyst = () => {
    const [messages, setMessages] = useState([
        { text: "Welcome! I am the Dumbara Business AI Analyst. Ask me anything about your store sales, profit predictions, stock levels, or upload documents for analysis.", isBot: true }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [attachedFile, setAttachedFile] = useState(null);
    const [chatHistory, setChatHistory] = useState([
        { id: 1, title: "Yesterday's top selling products" },
        { id: 2, title: "Low stock items alert" },
        { id: 3, title: "Monthly profit predictions" }
    ]);

    const chatEndRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const getAuthHeaders = (extraHeaders = {}) => {
        const loggedUser = sessionStorage.getItem('userName') || '';
        return {
            'x-user-name': loggedUser,
            ...extraHeaders
        };
    };

    // 🎙️ Speech-to-Text Recognition
    const handleVoiceInput = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Your browser does not support voice recognition. Please use Google Chrome.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US'; 
        recognition.continuous = false;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setInput(prev => (prev ? prev + " " + transcript : transcript));
        };

        recognition.start();
    };

    // 📁 File Attachment Handler
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAttachedFile(file);
        }
    };

    // 📤 Send Message Handler
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if ((!input.trim() && !attachedFile) || isLoading) return;

        const userMsg = input;
        const currentFile = attachedFile;

        setMessages(prev => [...prev, { text: userMsg, isBot: false, file: currentFile ? currentFile.name : null }]);
        setInput('');
        setAttachedFile(null);
        setIsLoading(true);

        try {
            const response = await fetch('http://localhost:5000/api/chat', {
                method: 'POST',
                headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({ message: userMsg })
            });

            const data = await response.json();

            if (response.ok && data.reply) {
                setMessages(prev => [...prev, { text: data.reply, isBot: true }]);
            } else {
                setMessages(prev => [...prev, { text: `⚠️ Error: ${data.error || "Failed to fetch response."}`, isBot: true }]);
            }
        } catch (error) {
            setMessages(prev => [...prev, { text: "⚠️ Unable to connect to server. Please check your backend.", isBot: true }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="db-main-layout" style={{ backgroundImage: `url(${bgImage})` }}>
            <Sidebar />
            <div className="db-content-area">
                <Header />

                <div className="ai-workspace-container db-fadeInRight">
                    
                    {/* 📜 LEFT PANEL: Glass History Sidebar */}
                    <div className="ai-glass-history-panel">
                        <button className="ai-new-chat-btn" onClick={() => setMessages([])}>
                            ➕ Start New Analysis
                        </button>
                        
                        <div className="ai-history-section-title">Recent Queries</div>
                        
                        <div className="ai-history-list">
                            {chatHistory.map(item => (
                                <div key={item.id} className="ai-history-item">
                                    <span className="ai-history-icon">💬</span>
                                    <span className="ai-history-text">{item.title}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 💬 RIGHT PANEL: Main Glass Gemini Workspace */}
                    <div className="ai-glass-chat-panel">
                        <div className="ai-chat-header-bar">
                            <div className="ai-chat-header-title">
                                <span className="ai-header-sparkle">💡</span> Dumbara AI Business Workspace
                            </div>
                            <span className="ai-online-badge">Live System Agent</span>
                        </div>

                        {/* Message Scroll Area */}
                        <div className="ai-messages-scroll">
                            {messages.map((msg, index) => (
                                <div key={index} className={`ai-msg-row ${msg.isBot ? 'ai-bot-row' : 'ai-user-row'}`}>
                                    <div className="ai-avatar-badge">{msg.isBot ? '🤖' : '👤'}</div>
                                    <div className="ai-bubble-content">
                                        {msg.file && <div className="ai-attached-badge">📎 {msg.file}</div>}
                                        {msg.text.split('\n').map((line, i) => (
                                            <p key={i} style={{ margin: '0 0 6px 0' }}>{line}</p>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            {isLoading && (
                                <div className="ai-msg-row ai-bot-row">
                                    <div className="ai-avatar-badge">🤖</div>
                                    <div className="ai-bubble-content ai-loading-bubble">
                                        <div className="db-typing-indicator">
                                            <span></span><span></span><span></span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* ⌨️ BOTTOM GEMINI PROMPT BAR */}
                        <form className="ai-gemini-prompt-bar" onSubmit={handleSendMessage}>
                            {attachedFile && (
                                <div className="ai-file-preview-chip">
                                    📄 {attachedFile.name}
                                    <button type="button" onClick={() => setAttachedFile(null)}>✖</button>
                                </div>
                            )}

                            <div className="ai-input-controls-row">
                                {/* Attachment Button */}
                                <button 
                                    type="button" 
                                    className="ai-action-icon-btn" 
                                    onClick={() => fileInputRef.current?.click()}
                                    title="Attach File or Image"
                                >
                                    📎
                                </button>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    style={{ display: 'none' }} 
                                    onChange={handleFileChange} 
                                />

                                {/* Text Input */}
                                <input 
                                    type="text" 
                                    placeholder="Ask Dumbara AI analyst or give a voice command..." 
                                    value={input} 
                                    onChange={(e) => setInput(e.target.value)}
                                    disabled={isLoading}
                                />

                                {/* Mic Voice Button */}
                                <button 
                                    type="button" 
                                    className={`ai-action-icon-btn ${isListening ? 'ai-listening-pulse' : ''}`} 
                                    onClick={handleVoiceInput}
                                    title="Voice Command"
                                >
                                    {isListening ? '🔴' : '🎙️'}
                                </button>

                                {/* Send Button */}
                                <button 
                                    type="submit" 
                                    className="ai-send-btn" 
                                    disabled={isLoading || (!input.trim() && !attachedFile)}
                                >
                                    Send
                                </button>
                            </div>
                        </form>

                    </div>

                </div>
            </div>
        </div>
    );
};

export default AiAnalyst;