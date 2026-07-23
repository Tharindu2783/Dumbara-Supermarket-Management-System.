// frontend/src/Sidebar.js
import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './Sidebar.css';

function Sidebar() {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false); // 📱 Mobile Menu Toggle State
    const [userRole, setUserRole] = useState('');

    useEffect(() => {
        // Read user role from session or local storage
        const savedRole = sessionStorage.getItem('userRole') || localStorage.getItem('userRole') || '';
        setUserRole(savedRole);
    }, []);

    const handleLogout = (e) => {
        e.preventDefault();
        sessionStorage.clear();
        localStorage.clear();
        navigate('/');
    };

    const toggleSidebar = () => {
        setIsOpen(!isOpen);
    };

    return (
        <>
            {/* 📱 Mobile Hamburger Menu Button */}
            <button className="mobile-menu-toggle-btn" onClick={toggleSidebar}>
                {isOpen ? '✖' : '☰'}
            </button>

            {/* 📱 Mobile Dark Overlay */}
            {isOpen && <div className="sidebar-overlay" onClick={toggleSidebar}></div>}

            {/* Sidebar Container */}
            <div className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-brand">
                    <h2 className="brand-name">Dumbara</h2>
                    <p className="brand-sub">Super Market</p>
                </div>

                <nav className="sidebar-nav" onClick={() => setIsOpen(false)}>
                    <NavLink to="/dashboard" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                        Dashboard
                    </NavLink>
                    <NavLink to="/billing" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                        Billing
                    </NavLink>
                    <NavLink to="/products" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                        Products
                    </NavLink>

                    {/* Suppliers: Hidden for Assistant */}
                    {userRole !== 'Assistant' && (
                        <NavLink to="/suppliers" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                            Suppliers
                        </NavLink>
                    )}

                    <NavLink to="/invoices" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                        Invoices
                    </NavLink>

                    {/* Reports: Hidden for Assistant */}
                    {userRole !== 'Assistant' && (
                        <NavLink to="/reports" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                            Reports
                        </NavLink>
                    )}

                    <NavLink to="/Orders" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                        Orders
                    </NavLink>
                </nav>

                <div className="sidebar-logout">
                    <a href="/" className="logout-link" onClick={handleLogout}>
                        ← Logout
                    </a>
                </div>
            </div>
        </>
    );
}

export default Sidebar;