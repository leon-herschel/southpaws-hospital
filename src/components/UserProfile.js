import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../assets/UserProfile.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Button } from 'react-bootstrap';
import { toast } from 'react-toastify'; 

function UserProfile() {
    const [activeTab, setActiveTab] = useState('general');
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
    const [userData, setUserData] = useState({
        id: '',
        email: '',
        first_name: '',
        last_name: '',
        user_role: '',
        current_password: '',
        new_password: '',
        confirm_password: '',
        settingsTab: 'tax',
        current_tax: 0, 
        new_tax: '',
    });

    // Fetch logged-in user profile from backend
    const fetchUserData = () => {
        axios.get(`${API_BASE_URL}/api/profile.php`, { withCredentials: true })
    .then(response => {
        console.log("Profile response:", response.data); 
        if (response.data && response.data.id) {
            setUserData(prev => ({
                ...prev,
                ...response.data,
                current_password: '',
                new_password: '',
                confirm_password: ''
            }));
        }
    })
    .catch(() => toast.error("Error fetching updated profile."));
    };

    const role = Number(userData.user_role) || 0;

    // Fetch tax settings
    const fetchTaxData = () => {
        axios.get(`${API_BASE_URL}/api/tax.php`)
            .then(response => {
                if (response.data.status === 1) {
                    setUserData(prev => ({
                        ...prev,
                        current_tax: response.data.tax !== null ? response.data.tax : 0,
                        new_tax: ''
                    }));
                }
            })
            .catch(() => toast.error("Error fetching updated tax."));
    };    

    // Call both on mount
    useEffect(() => {
        fetchUserData();
        fetchTaxData();
    }, []);

    const handleUpdate = () => {
        if (userData.new_password && userData.new_password !== userData.confirm_password) {
            toast.error("New password and confirm password do not match.");
            return;
        }

        const updatedUserData = {
            id: userData.id,
            email: userData.email,
            first_name: userData.first_name,
            last_name: userData.last_name,
            user_role: userData.user_role,
        };

        if (userData.new_password) {
            updatedUserData.current_password = userData.current_password;
            updatedUserData.new_password = userData.new_password;
        }

        axios.put(`${API_BASE_URL}/api/profile.php`, updatedUserData, { withCredentials: true })
            .then(response => {
                if (response.data.status === 1) {
                    toast.success("User updated successfully!");
                    fetchUserData();
                    setUserData(prev => ({
                        ...prev,
                        current_password: '',
                        new_password: '',
                        confirm_password: ''
                    }));
                } else {
                    toast.error(response.data.message || "Failed to update user.");
                }
            })
            .catch(() => toast.error("Error updating profile."));
    };

    const handleUpdateTax = () => {
        let newTaxValue = parseFloat(userData.new_tax); 
    
        if (isNaN(newTaxValue) || newTaxValue < 0) {
            toast.error("Invalid tax value. Please enter a valid positive number.");
            return;
        }
    
        axios.post(`${API_BASE_URL}/api/tax.php`, { tax: newTaxValue.toFixed(2) })
            .then(response => {
                if (response.data.status === 1) {
                    toast.success("Tax updated successfully!");
                    fetchTaxData();
                    setUserData(prev => ({
                        ...prev,
                        current_tax: newTaxValue.toFixed(2), 
                        new_tax: ''
                    }));
                } else {
                    toast.error(response.data.message || "Failed to update tax.");
                }
            })
            .catch(() => toast.error("Error updating tax. Please try again."));
    };

    const handleChange = (e) => {
        setUserData({ ...userData, [e.target.name]: e.target.value });
    };

    return (
        <div className="container light-style flex-grow-1 container-p-y shadow-sm">
            <h1 className="font-weight-bold py-3 mb-4">Profile</h1>
            <div className="card overflow-hidden shadow-sm">
                <div className="card-header">
                    <ul className="nav nav-tabs card-header-tabs">
                        <li className="nav-item">
                            <button 
                                className={`nav-link ${activeTab === 'general' ? 'active' : ''}`} 
                                onClick={() => setActiveTab('general')}
                            >
                                General
                            </button>
                        </li>
                        <li className="nav-item">
                            <button 
                                className={`nav-link ${activeTab === 'password' ? 'active' : ''}`} 
                                onClick={() => setActiveTab('password')}
                            >
                                Change Password
                            </button>
                        </li>
                        {(role === 3 || role === 4) && (
                            <li className="nav-item">
                                <button 
                                    className={`nav-link ${activeTab === 'settings' ? 'active' : ''}`} 
                                    onClick={() => setActiveTab('settings')}
                                >
                                    Tax Settings
                                </button>
                            </li>
                            )}
                    </ul>
                </div>

                <div className="card-body">
                    {activeTab === 'general' && (
                        <div className="tab-pane fade active show">
                            <div className="d-flex align-items-center mb-4">
                                <div>
                                    <h5 className="mb-0 text-primary">
                                        Role: {role === 1 ? 'Veterinarian' :
                                                role === 2 ? 'Receptionist' :
                                                role === 3 ? 'Admin' :
                                                role === 4 ? 'Super Admin' : 'Unknown'}

                                    </h5>
                                    <small className="text-muted">Account Information</small>
                                </div>
                            </div>
                            
                            <hr className="border-light m-0" />
                            
                            <div className="row mt-4">
                                <div className="col-md-6">
                                    <div className="form-group mb-3">
                                        <label className="form-label">First Name</label>
                                        <input 
                                            type="text" 
                                            className="form-control shadow-sm" 
                                            name="first_name" 
                                            value={userData.first_name || ''} 
                                            onChange={handleChange} 
                                        />
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="form-group mb-3">
                                        <label className="form-label">Last Name</label>
                                        <input 
                                            type="text" 
                                            className="form-control shadow-sm" 
                                            name="last_name" 
                                            value={userData.last_name || ''} 
                                            onChange={handleChange} 
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="form-group mb-4">
                                <label className="form-label">Email Address</label>
                                <input 
                                    type="email" 
                                    className="form-control shadow-sm" 
                                    name="email" 
                                    value={userData.email || ''} 
                                    onChange={handleChange} 
                                />
                            </div>
                            
                            <Button className="btn btn-primary mt-2" onClick={handleUpdate}>
                                Update Profile
                            </Button>
                        </div>
                    )}

                    {activeTab === 'password' && (
                        <div className="tab-pane fade active show">
                            <div className="d-flex align-items-center mb-4">
                                <div>
                                    <h5 className="mb-0">Password Settings</h5>
                                    <small className="text-muted">Change your password securely</small>
                                </div>
                            </div>
                            
                            <hr className="border-light m-0" />
                            
                            <div className="row mt-4">
                                <div className="col-md-12">
                                    <div className="form-group mb-3">
                                        <label className="form-label">Current Password</label>
                                        <input 
                                            type="password" 
                                            className="form-control shadow-sm" 
                                            name="current_password" 
                                            value={userData.current_password} 
                                            onChange={handleChange} 
                                        />
                                    </div>
                                    
                                    <div className="form-group mb-3">
                                        <label className="form-label">New Password</label>
                                        <input 
                                            type="password" 
                                            className="form-control shadow-sm" 
                                            name="new_password" 
                                            value={userData.new_password} 
                                            onChange={handleChange} 
                                        />
                                    </div>
                                    
                                    <div className="form-group mb-4">
                                        <label className="form-label">Confirm New Password</label>
                                        <input 
                                            type="password" 
                                            className="form-control shadow-sm" 
                                            name="confirm_password" 
                                            value={userData.confirm_password} 
                                            onChange={handleChange} 
                                        />
                                    </div>
                                    
                                    <Button className="btn btn-primary" onClick={handleUpdate}>
                                        <i className="fas fa-key me-2"></i>
                                        Update Password
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="tab-pane fade active show">
                            {(parseInt(userData.user_role, 10) === 3 || parseInt(userData.user_role, 10) === 4) ? (
                                <>
                                    <div className="d-flex align-items-center mb-4">
                                        <div>
                                            <h5 className="mb-0">Tax Settings</h5>
                                            <small className="text-muted">Manage application tax rate</small>
                                        </div>
                                    </div>
                                    
                                    <hr className="border-light m-0" />
                                    
                                    <div className="row mt-4">
                                        <div className="col-md-6">
                                            <div className="form-group mb-3">
                                                <label className="form-label">Current Tax Rate (%)</label>
                                                <input 
                                                    type="number" 
                                                    className="form-control shadow-sm" 
                                                    name="current_tax" 
                                                    value={Math.round(userData.current_tax)} 
                                                    readOnly 
                                                />
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="form-group mb-3">
                                                <label className="form-label">New Tax Rate (%)</label>
                                                <input 
                                                    type="number" 
                                                    className="form-control shadow-sm" 
                                                    name="new_tax" 
                                                    value={userData.new_tax || ''} 
                                                    onChange={handleChange} 
                                                    min="0" 
                                                    step="0.01" 
                                                    placeholder="Enter new tax rate" 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <Button className="btn btn-primary mt-3" onClick={handleUpdateTax}>
                                        <i className="fas fa-sync-alt me-2"></i>
                                        Update Tax Rate
                                    </Button>
                                </>
                            ) : (
                                <div className="alert alert-info mt-3">
                                    <i className="fas fa-lock me-2"></i>
                                    Only administrators can access tax settings.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default UserProfile;
