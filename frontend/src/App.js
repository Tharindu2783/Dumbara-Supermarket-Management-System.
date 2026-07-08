import React from 'react';
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

function App() {
  return (
    <Router>
      <Routes>
        {/* 🔑 ප්‍රධාන Login පේජ් එක (URL එක http://localhost:3000/ තියෙනකොට) */}
        <Route path="/" element={<Login />} />

        {/* 🏛️ Login වුණාට පසුව ලැබෙන සමස්ත Layout එක */}
        <Route
          path="/*"
          element={
            <div className="app-layout">
              {/* හැම පේජ් එකකටම පොදුවේ පෙනෙන Sidebar එක */}
              <Sidebar /> 
              
              <div className="main-content">
                <Routes>
                  {/* 💡 වෙනස්කම: කවුරුහරි වැරදීමකින් / ලොග් වුණාම sidebar එක ඇතුළේ තියෙන '/' පාරට ආවොත්, 
                      එයාව කෙලින්ම '/dashboard' වෙත හරවා යවයි (Redirect) */}
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/suppliers" element={<Suppliers />} />
                  <Route path="/billing" element={<Billing />} />
                  <Route path="/invoices" element={<Invoice />} />
                  <Route path="/reports" element={<Report />} />
                  <Route path="/orders" element={<Orders />} />
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