// frontend/src/Login.js
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
  const [showForgotModal, setShowForgotModal] = useState(false);
  const navigate = useNavigate(); 

  const [loading, setLoading] = useState(false);
  const [loaderText, setLoaderText] = useState('VERIFYING CREDENTIALS...');
  
  const [loginError, setLoginError] = useState('');
  const [forgotFinished, setForgotFinished] = useState(false);
  const [forgotError, setForgotError] = useState('');

  useEffect(() => {
    fetch('http://localhost:5000/api/users')
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(err => console.error("Fetch Error:", err));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoginError('');
    setLoaderText('VERIFYING CREDENTIALS...'); 
    setLoading(true);
    
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
        setLoaderText('LOADING DASHBOARD SYSTEM...'); 
        
        const userRole = data.role || 'Assistant';
        sessionStorage.setItem('userRole', userRole);
        sessionStorage.setItem('userName', username);
        sessionStorage.setItem('isTemporary', data.isTemporary); 
        
        setTimeout(() => {
          setLoading(false);
          navigate('/dashboard'); 
        }, 1200); 
      }
    })
    .catch(err => {
      console.error("Login Attempt Failed:", err);
      setLoading(false);
      setLoginError("❌ Access Denied: Invalid username or password. Please try again.");
    });
  };

  const handleForgotPassword = () => {
    if (!username) {
      setForgotError("⚠️ Please type or select a User Name first!");
      return;
    }

    setForgotError('');
    setLoaderText('SENDING TEMPORARY PASSWORD...'); 
    setLoading(true);

    fetch('http://localhost:5000/api/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username }),
    })
    .then(res => res.json())
    .then(data => {
      setLoading(false);
      if (data.success) {
        setForgotFinished(true); 
      } else {
        setForgotError(`❌ Error: ${data.message}`);
      }
    })
    .catch(err => {
      console.error(err);
      setLoading(false);
      setForgotError("❌ Communication Failed: Check your backend server connections.");
    });
  };

  const handleCloseForgotModal = () => {
    setShowForgotModal(false);
    setForgotFinished(false);
    setForgotError('');
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
        
        <div className="mobile-brand-header">
          <h1>DUMBARA</h1>
          <p>SUPER MARKET</p>
        </div>

        <div className="glass-card fadeInRight" style={{ position: 'relative' }}>
          
          {loading && !showForgotModal && (
            <div className="login-glass-loader">
              <div className="modern-login-spinner"></div>
              <div className="loader-login-text">{loaderText}</div>
            </div>
          )}

          <h2>Welcome</h2>
          
          {loginError && <div className="login-error-alert">{loginError}</div>}

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Select User Name</label>
              <div className="select-wrapper">
                <input
                  type="text"
                  className="modern-select"
                  placeholder="Type or select user name"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  list="usernames-list"
                  required
                  autoComplete="off"
                  disabled={loading}
                />
                <datalist id="usernames-list">
                  {users.map((user, index) => (
                    <option key={index} value={user.UserName} />
                  ))}
                </datalist>
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
                disabled={loading}
              />
            </div>

            <button type="submit" className="login-button" disabled={loading}>Login Now</button>
            
            <div className="forgot-password-wrapper">
              <span className="forgot-password-link" onClick={() => { if(!loading) setShowForgotModal(true); }}>
                Forgot Password?
              </span>
            </div>
          </form>
        </div>
      </div>

      {showForgotModal && (
        <div className="forgot-modal-overlay">
          <div className="forgot-modal-card" style={{ position: 'relative' }}>
            
            {loading && (
              <div className="forgot-glass-loader">
                <div className="modern-login-spinner"></div>
                <div className="loader-login-text">{loaderText}</div>
              </div>
            )}

            {forgotFinished ? (
              <div style={{ padding: '10px 0' }}>
                <div className="modal-icon" style={{ fontSize: '3rem' }}>✅</div>
                <h3 style={{ color: '#2ecc71' }}>Email Dispatched!</h3>
                <p style={{ marginTop: '10px', fontSize: '0.95rem', color: '#eee' }}>
                  A secure temporary access password has been successfully sent to the registered email address of <b>"{username}"</b>.
                </p>
                <button className="modal-btn-confirm" style={{ width: '100%', marginTop: '15px' }} onClick={handleCloseForgotModal}>
                  Return to Login Screen
                </button>
              </div>
            ) : (
              <>
                <div className="modal-icon">🔐</div>
                <h3>Reset Password</h3>
                
                {forgotError && <div className="login-error-alert" style={{ borderRadius: '10px', fontSize: '0.85rem' }}>{forgotError}</div>}
                
                <p>
                  {username ? (
                    <>Do you want to dispatch a secure Temporary Password Code to the registered email of user <b>"{username}"</b>?</>
                  ) : (
                    "Please close this window and input or select your User Name on the main form first."
                  )}
                </p>
                <div className="modal-buttons">
                  {username && (
                    <button className="modal-btn-confirm" onClick={handleForgotPassword} disabled={loading}>Yes, Send Code</button>
                  )}
                  <button className="modal-btn-cancel" onClick={handleCloseForgotModal} disabled={loading}>Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;