import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

function Sidebar() {
    return (
        <div className="sidebar">
            <div className="sidebar-brand">
                <h2 className="brand-name">Dumbara</h2>
                <p className="brand-sub">Super Market</p>
            </div>

            <nav className="sidebar-nav">
                <NavLink to="/dashboard" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                    Dashboard
                </NavLink>
                <NavLink to="/billing" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                    Billing
                </NavLink>
                <NavLink to="/products" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                    Products
                </NavLink>
                <NavLink to="/suppliers" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                    Suppliers
                </NavLink>
                <NavLink to="/invoices" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                    Invoices
                </NavLink>
                <NavLink to="/reports" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                    Reports
                </NavLink>
                <NavLink to="/Orders" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                    Orders
                </NavLink>
            </nav>

            <div className="sidebar-logout">
                <NavLink to="/" className="logout-link">
                    ← Logout
                </NavLink>
            </div>
        </div>
    );
}

export default Sidebar;