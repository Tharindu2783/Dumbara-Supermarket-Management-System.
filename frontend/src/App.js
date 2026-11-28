// frontend/src/App.js
import React, { useState, useEffect } from 'react'; 
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Products from './Products';
import Suppliers from './Suppliers'; 
import Billing from './Billing';
import Login from './Login';
import Invoice from './Invoice';
import './App.css';
import Report from './Report';
import Dashboard from './Dashboard';
import Orders from './Orders';
import AiAnalyst from './AiAnalyst';

// Routes කොටස ඇතුළත:


// 🔒 Secure route guard (Session Based)
const ProtectedRoute = ({ children, allowedRoles }) => {
  const [isValid, setIsValid] = useState(null);
  
  const isAuthenticated = sessionStorage.getItem('userName');
  const userRole = sessionStorage.getItem('userRole') || 'Assistant';

  useEffect(() => {
    if (!isAuthenticated || isAuthenticated.trim() === "") {
      setIsValid(false);
      return;
    }

    fetch('http://localhost:5000/api/users')
      .then((res) => {
        if (res.ok) {
          setIsValid(true); 
        } else {
          sessionStorage.clear();
          localStorage.clear();
          setIsValid(false);
        }
      })
      .catch(() => {
        setIsValid(false);
      });
  }, [isAuthenticated]);

  if (isValid === null) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        backgroundColor: '#1a1a1a', 
        color: '#fff',
        fontSize: '18px'
      }}>
        Verifying Session Security...
      </div>
    );
  }

  if (!isValid) return <Navigate to="/" replace />;

  // Restrict routes if role is not allowed
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Bypass route for the login page
const LoginRoute = ({ children }) => {
  const isAuthenticated = sessionStorage.getItem('userName');
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginRoute><Login /></LoginRoute>} />

        <Route
          path="/*"
          element={
            <div className="app-layout">
              <Sidebar /> 
              
              <div className="main-content">
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  
                  {/* Protected Routes */}
                  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
                  
                  {/* Manager & Admin Only Routes */}
                  <Route path="/suppliers" element={<ProtectedRoute allowedRoles={['Admin', 'Manager']}><Suppliers /></ProtectedRoute>} />
                  <Route path="/reports" element={<ProtectedRoute allowedRoles={['Admin', 'Manager']}><Report /></ProtectedRoute>} />
                  
                  <Route path="/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
                  <Route path="/invoices" element={<ProtectedRoute><Invoice /></ProtectedRoute>} />
                  <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
                  <Route path="/ai-analyst" element={<AiAnalyst />} />
                </Routes>
              </div>
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;