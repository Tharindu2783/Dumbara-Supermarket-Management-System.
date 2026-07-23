// frontend/src/Header.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Header.css';

function Header() {
    const [username, setUsername] = useState('User');
    const [userRole, setUserRole] = useState('');
    const [profileData, setProfileData] = useState({ 
        UserName: '', Role: '', email: '', contact: '', nic: '', address: '', birthday: '' 
    });
    
    // Dropdown & Modal Visibility States
    const [showDropdown, setShowDropdown] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [showCreateUserModal, setShowCreateUserModal] = useState(false);
    const [showManageUsersModal, setShowManageUsersModal] = useState(false);
    const [activeTab, setActiveTab] = useState('profile'); 

    // Settings Modal States (Self Edit)
    const [editUsername, setEditUsername] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [editNic, setEditNic] = useState('');
    const [editAddress, setEditAddress] = useState('');
    const [editBirthday, setEditBirthday] = useState('');

    // Security States (Self OTP)
    const [otpCode, setOtpCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Create User States
    const [createUsername, setCreateUsername] = useState('');
    const [createEmail, setCreateEmail] = useState('');
    const [createPhone, setCreatePhone] = useState('');
    const [createNic, setCreateNic] = useState('');
    const [createAddress, setCreateAddress] = useState('');
    const [createBirthday, setCreateBirthday] = useState('');
    const [createRole, setCreateRole] = useState('Assistant');
    const [createUserMsg, setCreateUserMsg] = useState({ text: '', type: '' });

    // Manage User States
    const [allUsers, setAllUsers] = useState([]);
    const [searchNicQuery, setSearchNicQuery] = useState('');
    const [suggestedUsers, setSuggestedUsers] = useState([]);
    const [selectedTargetUser, setSelectedTargetUser] = useState(null);
    const [targetOriginalUsername, setTargetOriginalUsername] = useState('');
    
    // Target Editable Form States
    const [mEditUsername, setMEditUsername] = useState('');
    const [mEditEmail, setMEditEmail] = useState('');
    const [mEditContact, setMEditContact] = useState('');
    const [mEditNic, setMEditNic] = useState('');
    const [mEditAddress, setMEditAddress] = useState('');
    const [mEditBirthday, setMEditBirthday] = useState('');
    const [mEditRole, setMEditRole] = useState('Assistant');

    // Security & Control
    const [managerOtp, setManagerOtp] = useState('');
    const [managerStep, setManagerStep] = useState(1);
    const [actionType, setActionType] = useState('UPDATE');
    const [manageUserMsg, setManageUserMsg] = useState({ text: '', type: '' });

    // Common Controls
    const [step, setStep] = useState(1); 
    const [modalMsg, setModalMsg] = useState({ text: '', type: '' });
    const [loading, setLoading] = useState(false);
    const [loaderText, setLoaderText] = useState('PROCESSING...');
    const [isSuccessFinished, setIsSuccessFinished] = useState(false);

    const navigate = useNavigate();

    const getSavedUserName = () => {
        return sessionStorage.getItem('userName') || 
               sessionStorage.getItem('user') || 
               localStorage.getItem('userName') || 
               localStorage.getItem('user') || '';
    };

    const savedName = getSavedUserName();

    useEffect(() => {
        if (savedName) {
            setUsername(savedName);
        }
        const savedRole = sessionStorage.getItem('userRole') || localStorage.getItem('userRole') || '';
        setUserRole(savedRole);
    }, [savedName]);

    // Fetch Profile Details for Active Logged User
    const fetchProfileDetails = () => {
        const currentActiveUser = getSavedUserName();
        if (!currentActiveUser) return;

        fetch(`http://localhost:5000/api/profile-details/${encodeURIComponent(currentActiveUser)}`, {
            headers: { 'x-user-name': currentActiveUser }
        })
            .then(res => res.json())
            .then(resData => {
                if (resData.success) {
                    const data = resData.data;
                    setProfileData(data);
                    setEditUsername(data.UserName || '');
                    setEditEmail(data.email || '');
                    setEditPhone(data.contact || '');
                    setEditNic(data.nic || '');
                    setEditAddress(data.address || '');
                    setEditBirthday(data.birthday || '');
                    setUserRole(data.Role || '');
                }
            })
            .catch(err => console.error("Error fetching profile:", err));
    };

    // Open Self Settings Modal
    const handleOpenSettings = () => {
        fetchProfileDetails();
        setShowDropdown(false);
        setShowSettingsModal(true);
        setActiveTab('profile');
        setIsSuccessFinished(false); 
        resetFormFlow();
    };

    // Open Create User Modal (Admin & Manager)
    const handleOpenCreateUser = () => {
        setShowDropdown(false);
        setShowCreateUserModal(true);
        setCreateUsername('');
        setCreateEmail('');
        setCreatePhone('');
        setCreateNic('');
        setCreateAddress('');
        setCreateBirthday('');
        setCreateRole('Assistant');
        setCreateUserMsg({ text: '', type: '' });
    };

    // Open Manage Users Modal (Admin & Manager)
    const handleOpenManageUsers = () => {
        setShowDropdown(false);
        setShowManageUsersModal(true);
        setSearchNicQuery('');
        setSuggestedUsers([]);
        setSelectedTargetUser(null);
        clearTargetForm();
        setManagerStep(1);
        setManageUserMsg({ text: '', type: '' });
        fetchAllUsersList();
    };

    // Fetch users list based on caller's role
    const fetchAllUsersList = () => {
        const currentActiveUser = getSavedUserName();
        setLoaderText('FETCHING SYSTEM USERS...');
        setLoading(true);
        fetch('http://localhost:5000/api/all-users', {
            headers: { 'x-user-name': currentActiveUser }
        })
            .then(res => res.json())
            .then(resData => {
                setLoading(false);
                if (resData.success) {
                    setAllUsers(resData.data);
                }
            })
            .catch(() => {
                setLoading(false);
                setManageUserMsg({ text: '❌ Failed to load user list!', type: 'error' });
            });
    };

    const clearTargetForm = () => {
        setTargetOriginalUsername('');
        setMEditUsername('');
        setMEditEmail('');
        setMEditContact('');
        setMEditNic('');
        setMEditAddress('');
        setMEditBirthday('');
        setMEditRole('Assistant');
        setManagerOtp('');
    };

    const resetFormFlow = () => {
        setStep(1);
        setOtpCode('');
        setNewPassword('');
        setConfirmPassword('');
        setModalMsg({ text: '', type: '' });
    };

    const handleNicInputChange = (e) => {
        const val = e.target.value;
        setSearchNicQuery(val);

        if (val.trim() === '') {
            setSuggestedUsers([]);
        } else {
            const matches = allUsers.filter(u => 
                u.nic && u.nic.toLowerCase().includes(val.toLowerCase())
            );
            setSuggestedUsers(matches);
        }
    };

    const handleSelectUserFromSuggestion = (u) => {
        setSelectedTargetUser(u);
        setSearchNicQuery(u.nic);
        setSuggestedUsers([]);

        setTargetOriginalUsername(u.UserName);
        setMEditUsername(u.UserName || '');
        setMEditEmail(u.email || '');
        setMEditContact(u.contact || '');
        setMEditNic(u.nic || '');
        setMEditAddress(u.address || '');
        setMEditBirthday(u.birthday || '');
        setMEditRole(u.Role || 'Assistant');
    };

    // Handle Create User Submit
    const handleCreateUserSubmit = (e) => {
        e.preventDefault();
        setCreateUserMsg({ text: '', type: '' });

        if (!createUsername || !createEmail || !createPhone || !createNic || !createAddress || !createBirthday || !createRole) {
            setCreateUserMsg({ text: '⚠️ All fields are required!', type: 'error' });
            return;
        }

        if (!createEmail.includes('@')) {
            setCreateUserMsg({ text: '⚠️ Invalid Email Address!', type: 'error' });
            return;
        }

        if (!/^\d{10}$/.test(createPhone)) {
            setCreateUserMsg({ text: '⚠️ Phone number must contain 10 digits!', type: 'error' });
            return;
        }

        const currentActiveUser = getSavedUserName();
        setLoaderText('CREATING USER & SENDING EMAIL...');
        setLoading(true);

        fetch('http://localhost:5000/api/create-user', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-user-name': currentActiveUser
            },
            body: JSON.stringify({
                newUsername: createUsername,
                newEmail: createEmail,
                newPhone: createPhone,
                newNic: createNic,
                newAddress: createAddress,
                newBirthday: createBirthday,
                role: createRole,
                createdBy: currentActiveUser
            })
        })
        .then(res => res.json())
        .then(data => {
            setLoading(false);
            if (data.success) {
                setCreateUserMsg({ text: data.message, type: 'success' });
                setCreateUsername('');
                setCreateEmail('');
                setCreatePhone('');
                setCreateNic('');
                setCreateAddress('');
                setCreateBirthday('');
            } else {
                setCreateUserMsg({ text: data.message || "Failed to create user!", type: 'error' });
            }
        })
        .catch(() => {
            setLoading(false);
            setCreateUserMsg({ text: '❌ Server communication error!', type: 'error' });
        });
    };

    const handleRequestOtp = () => {
    const currentActiveUser = getSavedUserName();
    setLoaderText('SENDING SECURE OTP...'); 
    setLoading(true);
    setModalMsg({ text: '', type: '' });

    
    const targetEmail = editEmail || profileData.email;

    fetch('http://localhost:5000/api/send-profile-otp', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'x-user-name': currentActiveUser
        },
        body: JSON.stringify({ 
            username: currentActiveUser,
            email: targetEmail 
        })
    })
    .then(res => res.json())
    .then(data => {
        setLoading(false);
        if (data.success) {
            setModalMsg({ text: `✅ OTP code sent to ${targetEmail}!`, type: 'success' });
            setStep(2);
        } else {
            setModalMsg({ text: `❌ Request Error: ${data.message}`, type: 'error' });
        }
    })
    .catch(() => {
        setLoading(false);
        setModalMsg({ text: '❌ OTP dispatch error.', type: 'error' });
    });
};

    // Request Manager/Admin Verification OTP
    const handleRequestManagerOtp = (action) => {
        setActionType(action);
        if (action === 'UPDATE' && (!mEditUsername || !mEditEmail || !mEditContact || !mEditNic || !mEditAddress || !mEditBirthday)) {
            setManageUserMsg({ text: '⚠️ Please fill all required target user fields!', type: 'error' });
            return;
        }

        const managerUsername = getSavedUserName();
        setLoaderText('DISPATCHING SECURITY OTP TO YOUR EMAIL...');
        setLoading(true);

        fetch('http://localhost:5000/api/manager/send-otp', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-user-name': managerUsername
            },
            body: JSON.stringify({ managerUsername })
        })
        .then(res => res.json())
        .then(data => {
            setLoading(false);
            if (data.success) {
                setManageUserMsg({ text: '✅ Security verification OTP sent to your email!', type: 'success' });
                setManagerStep(2);
            } else {
                setManageUserMsg({ text: `❌ ${data.message}`, type: 'error' });
            }
        })
        .catch(() => {
            setLoading(false);
            setManageUserMsg({ text: '❌ Server error while dispatching OTP!', type: 'error' });
        });
    };

    // Update User Details Submit with OTP
    const handleManagerUpdateUserSubmit = (e) => {
        e.preventDefault();
        const managerUsername = getSavedUserName();
        setLoaderText('SAVING USER CHANGES...');
        setLoading(true);

        fetch('http://localhost:5000/api/manager/update-user', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-user-name': managerUsername
            },
            body: JSON.stringify({
                managerUsername,
                targetOriginalUsername,
                newUsername: mEditUsername,
                email: mEditEmail,
                contact: mEditContact,
                nic: mEditNic,
                address: mEditAddress,
                birthday: mEditBirthday,
                role: mEditRole,
                otp: managerOtp
            })
        })
        .then(res => res.json())
        .then(data => {
            setLoading(false);
            if (data.success) {
                setManageUserMsg({ text: data.message, type: 'success' });
                setManagerStep(1);
                clearTargetForm();
                setSearchNicQuery('');
                setSelectedTargetUser(null);
                fetchAllUsersList();
            } else {
                setManageUserMsg({ text: data.message, type: 'error' });
            }
        })
        .catch(() => {
            setLoading(false);
            setManageUserMsg({ text: '❌ Failed to update target user!', type: 'error' });
        });
    };

    // Delete User Submit with OTP
    const handleManagerDeleteUserSubmit = (e) => {
        e.preventDefault();
        const managerUsername = getSavedUserName();
        setLoaderText('DELETING TARGET USER ACCOUNT...');
        setLoading(true);

        fetch('http://localhost:5000/api/manager/delete-user', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-user-name': managerUsername
            },
            body: JSON.stringify({
                managerUsername,
                targetUsername: targetOriginalUsername,
                otp: managerOtp
            })
        })
        .then(res => res.json())
        .then(data => {
            setLoading(false);
            if (data.success) {
                setManageUserMsg({ text: data.message, type: 'success' });
                setManagerStep(1);
                clearTargetForm();
                setSearchNicQuery('');
                setSelectedTargetUser(null);
                fetchAllUsersList();
            } else {
                setManageUserMsg({ text: data.message, type: 'error' });
            }
        })
        .catch(() => {
            setLoading(false);
            setManageUserMsg({ text: '❌ Failed to delete target user!', type: 'error' });
        });
    };

    // Self Profile Update
    const handleUpdateProfile = (e) => {
        e.preventDefault();
        const currentActiveUser = getSavedUserName();
        setLoaderText('SAVING YOUR PROFILE CHANGES...'); 
        setLoading(true);

        fetch('http://localhost:5000/api/update-profile-with-otp', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-user-name': currentActiveUser
            },
            body: JSON.stringify({ 
                currentUsername: currentActiveUser, 
                newUsername: editUsername, 
                newEmail: editEmail,
                newPhone: editPhone,
                newNic: editNic,
                newAddress: editAddress,
                newBirthday: editBirthday,
                otp: otpCode 
            })
        })
        .then(res => res.json())
        .then(data => {
            setLoading(false);
            if (data.success) {
                sessionStorage.setItem('userName', editUsername);
                setIsSuccessFinished(true);
            } else {
                setModalMsg({ text: data.message, type: 'error' });
            }
        })
        .catch(() => {
            setLoading(false);
            setModalMsg({ text: '❌ Failed to update profile!', type: 'error' });
        });
    };

    // Self Password Change
    const handleVerifyAndChangePassword = (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setModalMsg({ text: '⚙️ Passwords do not match!', type: 'error' });
            return;
        }

        const currentActiveUser = getSavedUserName();
        setLoaderText('UPDATING SECURE PASSWORD...'); 
        setLoading(true);
        
        fetch('http://localhost:5000/api/change-password-with-otp', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-user-name': currentActiveUser
            },
            body: JSON.stringify({ username: currentActiveUser, otp: otpCode, newPassword })
        })
        .then(res => res.json())
        .then(data => {
            setLoading(false);
            if (data.success) {
                setIsSuccessFinished(true);
            } else {
                setModalMsg({ text: data.message, type: 'error' });
            }
        })
        .catch(() => {
            setLoading(false);
            setModalMsg({ text: '❌ Network or server error occurred!', type: 'error' });
        });
    };

    const handleFinalLogoutRedirect = () => {
        sessionStorage.clear();
        localStorage.clear();
        setShowSettingsModal(false);
        navigate('/');
    };

    const handleLogout = () => {
        sessionStorage.clear();
        localStorage.clear();
        navigate('/');
    };

    return (
        <div className="global-header-container">
            <div className="header-badge-box" onClick={() => setShowDropdown(!showDropdown)}>
                <span className="badge-icon">👤</span>
                <span className="badge-text">{username} ({userRole})</span>
                <span className="badge-status-dot"></span>
                <span className="dropdown-arrow-icon">▼</span>

                {showDropdown && (
                    <div className="header-profile-dropdown">
                        <div className="dropdown-item" onClick={handleOpenSettings}>⚙️ Profile Settings</div>
                        
                        {/* Admin and Manager get access to user management */}
                        {(userRole === 'Admin' || userRole === 'Manager') && (
                            <>
                                <div className="dropdown-item create-user-item" onClick={handleOpenCreateUser}>
                                    ➕ Create a new user
                                </div>
                                <div className="dropdown-item change-user-item" onClick={handleOpenManageUsers}>
                                    ✏️ Change user details
                                </div>
                            </>
                        )}

                        <div className="dropdown-item logout-item" onClick={handleLogout}>🚪 Logout System</div>
                    </div>
                )}
            </div>

            {/* CHANGE / DELETE USER DETAILS MODAL */}
            {showManageUsersModal && (
                <div className="profile-modal-overlay">
                    <div className="profile-modal-card modal-large-card" style={{ position: 'relative' }}>
                        {loading && (
                            <div className="modal-glass-loader">
                                <div className="modern-otp-spinner"></div>
                                <div className="loader-otp-text">{loaderText}</div>
                            </div>
                        )}

                        <div className="profile-modal-header">
                            <h3>✏️ Change / Delete User Details</h3>
                            <button className="close-x-btn" onClick={() => setShowManageUsersModal(false)} disabled={loading}>✖</button>
                        </div>

                        {manageUserMsg.text && (
                            <div className={`modal-status-alert ${manageUserMsg.type}`}>
                                {manageUserMsg.text}
                            </div>
                        )}

                        {managerStep === 1 ? (
                            <>
                                <div className="sett-input-group" style={{ position: 'relative' }}>
                                    <label style={{ color: '#f1c40f', fontWeight: 'bold' }}>Type Target User NIC for Suggestions *</label>
                                    <input 
                                        type="text" 
                                        placeholder="Type NIC to search..." 
                                        value={searchNicQuery} 
                                        onChange={handleNicInputChange}
                                        disabled={loading}
                                        style={{ border: '1px solid #f1c40f' }}
                                    />
                                    {suggestedUsers.length > 0 && (
                                        <div className="nic-suggestions-dropdown">
                                            {suggestedUsers.map((u) => (
                                                <div 
                                                    key={u.UserName} 
                                                    className="suggestion-item" 
                                                    onClick={() => handleSelectUserFromSuggestion(u)}
                                                >
                                                    <strong>{u.nic}</strong> - {u.UserName} ({u.Role})
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="modal-divider"></div>

                                <div className="modal-grid-2col">
                                    <div className="sett-input-group">
                                        <label>Username *</label>
                                        <input 
                                            type="text" 
                                            value={mEditUsername} 
                                            onChange={(e) => setMEditUsername(e.target.value)} 
                                            disabled={!selectedTargetUser || loading} 
                                            placeholder="Empty" 
                                        />
                                    </div>
                                    <div className="sett-input-group">
                                        <label>NIC Number *</label>
                                        <input 
                                            type="text" 
                                            value={mEditNic} 
                                            onChange={(e) => setMEditNic(e.target.value)} 
                                            disabled={!selectedTargetUser || loading} 
                                            placeholder="Empty" 
                                        />
                                    </div>
                                </div>

                                <div className="modal-grid-2col">
                                    <div className="sett-input-group">
                                        <label>Email Address *</label>
                                        <input 
                                            type="email" 
                                            value={mEditEmail} 
                                            onChange={(e) => setMEditEmail(e.target.value)} 
                                            disabled={!selectedTargetUser || loading} 
                                            placeholder="Empty" 
                                        />
                                    </div>
                                    <div className="sett-input-group">
                                        <label>Phone (Contact) *</label>
                                        <input 
                                            type="text" 
                                            value={mEditContact} 
                                            onChange={(e) => setMEditContact(e.target.value.replace(/\D/g, ''))} 
                                            disabled={!selectedTargetUser || loading} 
                                            placeholder="Empty" 
                                        />
                                    </div>
                                </div>

                                <div className="modal-grid-2col">
                                    <div className="sett-input-group">
                                        <label>Birthday *</label>
                                        <input 
                                            type="date" 
                                            value={mEditBirthday} 
                                            onChange={(e) => setMEditBirthday(e.target.value)} 
                                            disabled={!selectedTargetUser || loading} 
                                        />
                                    </div>
                                    <div className="sett-input-group">
                                        <label>System Role *</label>
                                        <select 
                                            value={mEditRole} 
                                            onChange={(e) => setMEditRole(e.target.value)}
                                            className="sett-select-input"
                                            disabled={!selectedTargetUser || loading}
                                        >
                                            <option value="Assistant">Assistant</option>
                                            {userRole === 'Admin' && <option value="Manager">Manager</option>}
                                        </select>
                                    </div>
                                </div>

                                <div className="sett-input-group">
                                    <label>Residential Address *</label>
                                    <input 
                                        type="text" 
                                        value={mEditAddress} 
                                        onChange={(e) => setMEditAddress(e.target.value)} 
                                        disabled={!selectedTargetUser || loading} 
                                        placeholder="Empty" 
                                    />
                                </div>

                                <div className="step-two-buttons" style={{ marginTop: '20px' }}>
    <button 
        type="button" 
        className="save-pass-btn" 
        onClick={() => handleRequestManagerOtp('UPDATE')}
        disabled={!selectedTargetUser || loading}
    >
        Save Changes (Send OTP)
    </button>

    
    {selectedTargetUser?.nic !== profileData.nic && selectedTargetUser?.UserName !== username && (
        <button 
            type="button" 
            className="delete-red-btn" 
            onClick={() => handleRequestManagerOtp('DELETE')}
            disabled={!selectedTargetUser || loading}
        >
            🗑️ Delete User
        </button>
    )}
</div>
                            </>
                        ) : (
                            <form onSubmit={actionType === 'UPDATE' ? handleManagerUpdateUserSubmit : handleManagerDeleteUserSubmit}>
                                <div className="sett-input-group" style={{ marginTop: '15px' }}>
                                    <label style={{ color: '#2ecc71', fontWeight: 'bold' }}>
                                        Enter Security OTP sent to your Email:
                                    </label>
                                    <input 
                                        type="text" 
                                        value={managerOtp} 
                                        onChange={(e) => setManagerOtp(e.target.value)} 
                                        placeholder="Enter 6-digit OTP code" 
                                        required 
                                        disabled={loading} 
                                    />
                                </div>
                                <div className="step-two-buttons">
                                    <button 
                                        type="submit" 
                                        className={actionType === 'DELETE' ? 'delete-red-btn' : 'save-pass-btn'} 
                                        disabled={loading}
                                    >
                                        {actionType === 'DELETE' ? 'Confirm & Permanently Delete' : 'Confirm & Save Updates'}
                                    </button>
                                    <button type="button" className="back-step-btn" onClick={() => setManagerStep(1)} disabled={loading}>
                                        Back
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* CREATE NEW USER MODAL */}
            {showCreateUserModal && (
                <div className="profile-modal-overlay">
                    <div className="profile-modal-card modal-large-card" style={{ position: 'relative' }}>
                        {loading && (
                            <div className="modal-glass-loader">
                                <div className="modern-otp-spinner"></div>
                                <div className="loader-otp-text">{loaderText}</div>
                            </div>
                        )}

                        <div className="profile-modal-header">
                            <h3>➕ Create a New System User</h3>
                            <button className="close-x-btn" onClick={() => setShowCreateUserModal(false)} disabled={loading}>✖</button>
                        </div>

                        {createUserMsg.text && (
                            <div className={`modal-status-alert ${createUserMsg.type}`}>
                                {createUserMsg.text}
                            </div>
                        )}

                        <form onSubmit={handleCreateUserSubmit}>
                            <div className="modal-grid-2col">
                                <div className="sett-input-group">
                                    <label>Full Username *</label>
                                    <input type="text" placeholder="Enter full username" value={createUsername} onChange={(e) => setCreateUsername(e.target.value)} required disabled={loading} />
                                </div>

                                <div className="sett-input-group">
                                    <label>NIC Number *</label>
                                    <input type="text" placeholder="Enter NIC Number" value={createNic} onChange={(e) => setCreateNic(e.target.value)} required disabled={loading} />
                                </div>
                            </div>

                            <div className="modal-grid-2col">
                                <div className="sett-input-group">
                                    <label>Email Address (@) *</label>
                                    <input type="email" placeholder="user@gmail.com" value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} required disabled={loading} />
                                </div>

                                <div className="sett-input-group">
                                    <label>Phone Number (10 digits) *</label>
                                    <input type="text" placeholder="0771234567" maxLength="10" value={createPhone} onChange={(e) => setCreatePhone(e.target.value.replace(/\D/g, ''))} required disabled={loading} />
                                </div>
                            </div>

                            <div className="modal-grid-2col">
                                <div className="sett-input-group">
                                    <label>Date of Birth *</label>
                                    <input type="date" value={createBirthday} onChange={(e) => setCreateBirthday(e.target.value)} required disabled={loading} />
                                </div>

                                <div className="sett-input-group">
                                    <label>System Role *</label>
                                    <select value={createRole} onChange={(e) => setCreateRole(e.target.value)} className="sett-select-input" required disabled={loading}>
                                        <option value="Assistant">Assistant</option>
                                        {userRole === 'Admin' && <option value="Manager">Manager</option>}
                                    </select>
                                </div>
                            </div>

                            <div className="sett-input-group">
                                <label>Residential Address *</label>
                                <input type="text" placeholder="Enter full address" value={createAddress} onChange={(e) => setCreateAddress(e.target.value)} required disabled={loading} />
                            </div>

                            <div className="step-two-buttons">
                                <button type="submit" className="save-pass-btn" disabled={loading}>Create User & Send Password</button>
                                <button type="button" className="back-step-btn" onClick={() => setShowCreateUserModal(false)} disabled={loading}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* PROFILE SETTINGS MODAL */}
            {showSettingsModal && (
                <div className="profile-modal-overlay">
                    <div className="profile-modal-card modal-large-card" style={{ position: 'relative' }}>
                        
                        {loading && (
                            <div className="modal-glass-loader">
                                <div className="modern-otp-spinner"></div>
                                <div className="loader-otp-text">{loaderText}</div>
                            </div>
                        )}

                        {isSuccessFinished ? (
                            <div style={{ textAlign: 'center', padding: '20px 10px' }}>
                                <div style={{ fontSize: '50px', marginBottom: '15px' }}>🎉</div>
                                <h3 style={{ color: '#2ecc71', marginBottom: '15px' }}>Success!</h3>
                                <p style={{ fontSize: '14px', color: '#eee', lineHeight: '1.6', marginBottom: '25px' }}>
                                    Your account details have been updated. Please re-login to ensure system security.
                                </p>
                                <button 
                                    className="req-otp-btn" 
                                    onClick={handleFinalLogoutRedirect}
                                    style={{ background: '#2ecc71', boxShadow: '0 4px 15px rgba(46, 204, 113, 0.4)' }}
                                >
                                    Go to Login Area 🚪
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="profile-modal-header">
                                    <h3>⚙️ Account Settings</h3>
                                    <button className="close-x-btn" onClick={() => setShowSettingsModal(false)} disabled={loading}>✖</button>
                                </div>

                                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                                    <button 
                                        className={`back-step-btn ${activeTab === 'profile' ? 'req-otp-btn' : ''}`}
                                        style={{ flex: 1, padding: '8px', border: activeTab === 'profile' ? 'none' : '1px solid rgba(255,255,255,0.3)' }}
                                        onClick={() => { if(!loading) { setActiveTab('profile'); resetFormFlow(); } }}
                                        disabled={loading}
                                    >
                                        👤 Edit Profile Details
                                    </button>
                                    <button 
                                        className={`back-step-btn ${activeTab === 'security' ? 'req-otp-btn' : ''}`}
                                        style={{ flex: 1, padding: '8px', border: activeTab === 'security' ? 'none' : '1px solid rgba(255,255,255,0.3)' }}
                                        onClick={() => { if(!loading) { setActiveTab('security'); resetFormFlow(); } }}
                                        disabled={loading}
                                    >
                                        🔒 Security & Password
                                    </button>
                                </div>

                                {modalMsg.text && <div className={`modal-status-alert ${modalMsg.type}`}>{modalMsg.text}</div>}

                                {activeTab === 'profile' && (
                                    <div className="profile-security-section">
                                        <div className="modal-grid-2col">
                                            <div className="sett-input-group">
                                                <label>Username *</label>
                                                <input type="text" value={editUsername} onChange={(e) => setEditUsername(e.target.value)} disabled={step === 2 || loading} required />
                                            </div>

                                            <div className="sett-input-group">
                                                <label>NIC Number *</label>
                                                <input type="text" value={editNic} onChange={(e) => setEditNic(e.target.value)} disabled={step === 2 || loading} required />
                                            </div>
                                        </div>

                                        <div className="modal-grid-2col">
                                            <div className="sett-input-group">
                                                <label>Email Address (@) *</label>
                                                <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} disabled={step === 2 || loading} required />
                                            </div>

                                            <div className="sett-input-group">
                                                <label>Phone Number (10 digits) *</label>
                                                <input type="text" maxLength="10" value={editPhone} onChange={(e) => setEditPhone(e.target.value.replace(/\D/g, ''))} disabled={step === 2 || loading} required />
                                            </div>
                                        </div>

                                        <div className="modal-grid-2col">
                                            <div className="sett-input-group">
                                                <label>Date of Birth *</label>
                                                <input type="date" value={editBirthday} onChange={(e) => setEditBirthday(e.target.value)} disabled={step === 2 || loading} required />
                                            </div>

                                            <div className="sett-input-group">
                                                <label>Password (Encrypted)</label>
                                                <input type="text" value="***" disabled style={{ letterSpacing: '3px', fontWeight: 'bold', background: 'rgba(0,0,0,0.3)' }} />
                                            </div>
                                        </div>

                                        <div className="sett-input-group">
                                            <label>Address *</label>
                                            <input type="text" value={editAddress} onChange={(e) => setEditAddress(e.target.value)} disabled={step === 2 || loading} required />
                                        </div>

                                        {step === 1 ? (
                                            <button type="button" className="req-otp-btn" onClick={handleRequestOtp} disabled={loading} style={{ marginTop: '10px' }}>
                                                Verify Email & Save Profile Updates
                                            </button>
                                        ) : (
                                            <form onSubmit={handleUpdateProfile}>
                                                <div className="sett-input-group" style={{ marginTop: '15px' }}>
                                                    <label style={{ color: '#2ecc71', fontWeight: 'bold' }}>Enter OTP sent to your registered email:</label>
                                                    <input type="text" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} placeholder="Enter 6-digit OTP" required disabled={loading} />
                                                </div>
                                                <div className="step-two-buttons">
                                                    <button type="submit" className="save-pass-btn" disabled={loading}>Confirm & Save Changes</button>
                                                    <button type="button" className="back-step-btn" onClick={() => setStep(1)} disabled={loading}>Back</button>
                                                </div>
                                            </form>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'security' && (
                                    <div className="profile-security-section">
                                        {step === 1 ? (
                                            <div className="step-one-box">
                                                <p className="step-desc-text">To change password, an OTP code will be sent to your registered email.</p>
                                                <button type="button" className="req-otp-btn" onClick={handleRequestOtp} disabled={loading}>
                                                    Send OTP to Email
                                                </button>
                                            </div>
                                        ) : (
                                            <form onSubmit={handleVerifyAndChangePassword} className="step-two-form">
                                                <div className="sett-input-group">
                                                    <label>Enter OTP Code :</label>
                                                    <input type="text" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} placeholder="Enter OTP" required disabled={loading} />
                                                </div>
                                                <div className="sett-input-group">
                                                    <label>New Password :</label>
                                                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" required disabled={loading} />
                                                </div>
                                                <div className="sett-input-group">
                                                    <label>Confirm Password :</label>
                                                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" required disabled={loading} />
                                                </div>
                                                <div className="step-two-buttons">
                                                    <button type="submit" className="save-pass-btn" disabled={loading}>Update Password</button>
                                                    <button type="button" className="back-step-btn" onClick={() => setStep(1)} disabled={loading}>Back</button>
                                                </div>
                                            </form>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Header;