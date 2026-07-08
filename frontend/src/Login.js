import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import './Login.css';
import "@fontsource/protest-riot";
import dataAnalyticsBg from './assets/data-analytics.jpg';
import bgSupermarket from './assets/abc.avif';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [users, setUsers] = useState([]);
  const navigate = useNavigate(); 

  // Database එකෙන් users ගෙන්වා ගැනීම
  useEffect(() => {
    fetch('http://localhost:5000/api/users')
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(err => console.error("Fetch Error:", err));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Backend එකේ අපි හදපු /api/login එකට දත්ත යවනවා POST request එකක් විදිහට
    fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }), 
    })
    .then(res => {
      if (!res.ok) {
        throw new Error("Invalid username or password");
      }
      return res.json();
    })
    .then(data => {
      if (data.success) {
        console.log("Login Success:", data);

        /* 👑 USER ROLE එක හඳුනාගෙන LOCALSTORAGE එකේ SAVE කිරීම */
        let userRole = 'Assistant'; // Default අගය

        if (data.role) {
          // 1. Backend එකෙන් කෙලින්ම role එකක් එවනවා නම් ඒක ගනී
          userRole = data.role;
        } else if (username.toLowerCase().includes('manager') || username.toLowerCase().includes('admin')) {
          // 2. නැත්නම් Select කරපු Username එක අනුව Manager ද කියා බලයි
          userRole = 'Manager';
        }

        // හඳුනාගත් Role එක LocalStorage එකට ඇතුළත් කරයි
        localStorage.setItem('userRole', userRole);
        
        // 🚀 සාර්ථකයි නම් කෙලින්ම Dashboard පිටුවට රීඩිරෙක්ට් කරනවා!
        navigate('/dashboard'); 
      }
    })
    .catch(err => {
      console.error("Login Attempt Failed:", err);
      alert("❌ වැරදි මුරපදයක් (Password) හෝ පරිශීලක නාමයක්! කරුණාකර නැවත උත්සාහ කරන්න.");
    });
  };

  return (
    <div className="login-container">
      <div className="login-left" style={{ '--bg-url': `url(${bgSupermarket})` }}>
        <div className="brand-content fadeInRight">
          <h1>DUMBARA</h1>
          <p>Super Market</p>
        </div>
      </div>

      <div className="login-right">
        <div className="chart-overlay" style={{ backgroundImage: `url(${dataAnalyticsBg})` }}></div>
        <div className="glass-card fadeInRight">
          <h2>Welcome</h2>
          <form className="login-form" onSubmit={handleSubmit}>
            
            <div className="input-group">
              <label>Select User Name</label>
              <div className="select-wrapper">
                <select 
                  className="modern-select"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                >
                  <option value="" disabled>Select user name</option>
                  {users.map((user, index) => (
                    <option key={index} value={user.UserName} className="option-item">
                      {user.UserName}
                    </option>
                  ))}
                </select>
                <div className="select-arrow"></div>
              </div>
            </div>

            <div className="input-group">
              <label>Password</label>
              <input 
                type="password" 
                placeholder="Enter your Password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="login-button">Login Now</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;