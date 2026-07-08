import React, { useState, useEffect } from 'react';
import './Header.css';

function Header() {
    const [role, setRole] = useState('Assistant'); // Default 'Assistant' ලෙස තැබුවා

    useEffect(() => {
        const savedRole = localStorage.getItem('userRole');
        if (savedRole) {
            setRole(savedRole);
        }
    }, []);

    return (
    <div className="global-header-container">
        {/* දකුණු පැත්තේ Role බජ් එක විතරයි */}
        <div className="header-badge-box">
            <span className="badge-icon">👤</span>
            <span className="badge-text">{role}</span>
            <span className="badge-status-dot"></span>
        </div>
    </div>
);
}

export default Header;