import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../assets/UserProfile.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Button } from 'react-bootstrap';
import { toast } from 'react-toastify'; // ✅ Import Toastify

function UserProfile() {
    const [activeTab, setActiveTab] = useState('general');
    const [userRole, setUserRole] = useState(null); // Add userRole state
    const [userData, setUserData] = useState({
        id: '',
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        user_role: '',
        current_password: '',
        new_password: '',
        confirm_password: '',
        settingsTab: 'tax',
        current_tax: 0, // Default tax to 0
        new_tax: '',
    });

    const fetchUserData = () => {
        const userId = localStorage.getItem('userID');
    
        axios.get(`http://localhost:80/api/profile.php/${userId}`, { withCredentials: true })
            .then(response => {
                if (response.data) {
                    setUserData(prev => ({
                        ...prev,
                        ...response.data,
                        current_password: '',
                        new_password: '',
                        confirm_password: ''
                    }));
                }
            })
            .catch(err => toast.error("Error fetching updated profile."));
    };

    const fetchTaxData = () => {
        axios.get('http://localhost:80/api/tax.php')
            .then(response => {
                if (response.data.status === 1) {
                    setUserData(prev => ({
                        ...prev,
                        current_tax: response.data.tax !== null ? response.data.tax : 0,
                        new_tax: ''
                    }));
                }
            })
            .catch(err => toast.error("Error fetching updated tax."));
    };    
    

    useEffect(() => {
        const userId = localStorage.getItem('userID');
        const userRole = localStorage.getItem('userRole');

        setUserRole(userRole ? parseInt(userRole, 10) : null);

        axios.get(`http://localhost:80/api/profile.php/${userId}`, { withCredentials: true })
            .then(response => {
                if (response.data) {
                    setUserData(prev => ({
                        ...prev,
                        ...response.data,
                        userRole: userRole,
                        current_password: '',
                        new_password: '',
                        confirm_password: ''
                    }));
                }
            })
            .catch(err => toast.error("Error fetching profile."));

        axios.get('http://localhost:80/api/tax.php')
            .then(response => {
                if (response.data.status === 1) {
                    setUserData(prev => ({
                        ...prev,
                        current_tax: response.data.tax !== null ? response.data.tax : 0,
                    }));
                }
            })
            .catch(err => toast.error("Error fetching tax."));
    }, []);

    const handleUpdate = () => {
        if (userData.new_password && userData.new_password !== userData.confirm_password) {
            toast.error("New password and confirm password do not match.");
            return;
        }
    
        // 🔹 Prepare payload dynamically
        const updatedUserData = {
            id: userData.id, // ✅ Ensure ID is included
            email: userData.email,
            first_name: userData.first_name,
            last_name: userData.last_name,
            user_role: userData.user_role,
        };
    
        // 🔹 If updating the password, include `current_password` and `new_password`
        if (userData.new_password) {
            updatedUserData.current_password = userData.current_password;
            updatedUserData.new_password = userData.new_password;
        }
    
        axios.put(`http://localhost:80/api/profile.php/${userData.id}`, updatedUserData, {
            withCredentials: true,
        })
        .then(response => {
            if (response.data.status === 1) {
                toast.success("User updated successfully!");
                
                // 🔹 Reset password fields & fetch latest data
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
        .catch(err => toast.error("Error updating profile."));
    };
    

    const handleUpdateTax = () => {
        let newTaxValue = parseFloat(userData.new_tax); // Ensure it's a float
    
        if (isNaN(newTaxValue) || newTaxValue < 0) {
            toast.error("Invalid tax value. Please enter a valid positive number.");
            return;
        }
    
        axios.post('http://localhost:80/api/tax.php', { tax: newTaxValue.toFixed(2) }) // Send with 4 decimal places for precision
            .then(response => {
                if (response.data.status === 1) {
                    toast.success("Tax updated successfully!");
    
                    // Fetch latest tax data
                    fetchTaxData();
    
                    // Ensure UI updates correctly
                    setUserData(prev => ({
                        ...prev,
                        current_tax: newTaxValue.toFixed(2), // Display updated tax with precision
                        new_tax: ''
                    }));
                } else {
                    toast.error(response.data.message || "Failed to update tax.");
                }
            })
            .catch(err => {
                console.error("Error updating tax:", err);
                toast.error("Error updating tax. Please try again.");
            });
    };
    

    const handleChange = (e) => {
        setUserData({ ...userData, [e.target.name]: e.target.value });
    };

    return (
        <div className="container light-style flex-grow-1 container-p-y">
            <h1 className="font-weight-bold py-3 mb-4">Profile</h1>

            <div className="d-flex justify-content-end mb-3">
                <div className="nav nav-pills">
                    <button className={`nav-link ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab('general')}>
                        General
                    </button>
                    <button className={`nav-link ${activeTab === 'password' ? 'active' : ''}`} onClick={() => setActiveTab('password')}>
                        Change password
                    </button>
                    <button className={`nav-link ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
                        Tax
                    </button>
                </div>
            </div>

            <div className="card overflow-hidden">
                <div className="tab-content">
                    {activeTab === 'general' && (
                        <div className="tab-pane fade active show" id="account-general">
                            <div className="card-body">
                                <h5 className="text-primary">
                                    Role: {userData.userRole === '1' ? 'Veterinarian' : userData.userRole === '2' ? 'Receptionist' : userData.userRole === '3' ? 'Admin' : 'Super Admin'}
                                </h5>
                                <hr className="border-light m-0" />
                                <div className="form-group">
                                    <label className="form-label">First Name</label>
                                    <input type="text" className="form-control" name="first_name" value={userData.first_name || ''} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Last Name</label>
                                    <input type="text" className="form-control" name="last_name" value={userData.last_name || ''} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">E-mail</label>
                                    <input type="email" className="form-control mb-1" name="email" value={userData.email || ''} onChange={handleChange} />
                                </div>
                                <Button className="btn btn-success mt-4" onClick={handleUpdate}>Update</Button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'password' && (
                        <div className="tab-pane fade active show" id="account-change-password">
                            <div className="card-body">
                                <div className="form-group">
                                    <label className="form-label">Current password</label>
                                    <input type="password" className="form-control" name="current_password" value={userData.current_password} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">New password</label>
                                    <input type="password" className="form-control" name="new_password" value={userData.new_password} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Repeat new password</label>
                                    <input type="password" className="form-control" name="confirm_password" value={userData.confirm_password} onChange={handleChange} />
                                </div>
                                <Button className="btn btn-success mt-4" onClick={handleUpdate}>Update</Button>
                            </div>
                        </div>
                    )}

{activeTab === 'settings' && (
  <div className="tab-pane fade active show">
    {/* Settings Title (Only for Admins) */}
    {userRole === 3 && (
      <h4 className="card-title mb-4">Settings</h4>
    )}
    {/* Tax Settings (Only for Admins) */}
    {userRole === 3 && (
      <div id="account-change-tax">
        <div className="card-body">
          <div className="form-group">
            <label className="form-label">Current Tax (%)</label>
            <input 
              type="number" 
              className="form-control" 
              name="current_tax" 
              value={Math.round(userData.current_tax)} 
              readOnly 
            />
          </div>
          <div className="form-group">
            <label className="form-label">New Tax (%)</label>
            <input 
              type="number" 
              className="form-control" 
              name="new_tax" 
              value={userData.new_tax || ''} 
              onChange={handleChange} 
              min="0" 
              step="0.01" 
              placeholder="Enter new tax rate" 
            />
          </div>
          <Button className="btn btn-primary mt-3" onClick={handleUpdateTax}>
            Update Tax
          </Button>
        </div>
      </div>
    )}

    {/* Message for non-admin users */}
    {userRole !== 3 && (
      <div className="alert alert-info mt-3">
        <i className="fas fa-lock me-2"></i>
        Only administrators can access tax.
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
