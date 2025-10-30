import React, { useState, useEffect, useRef } from 'react';
import '../App.css';
import { Link, useNavigate } from 'react-router-dom';
import { TopbarData } from './TopbarData';
import axios from 'axios';

const TopBar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [firstName, setFirstName] = useState(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    const userId = localStorage.getItem('userID');
    const userFirstName = localStorage.getItem('first_name');
    const userRole = localStorage.getItem('userRole');

    if (!userId) {
      // Force logout if userID is missing
      handleForceLogout();
    } else {
      // If user is admin (role 4), set the first name as "Super Admin"
      if (userRole === '4') {
        setFirstName('Super Admin');
      } else if (userFirstName) {
        setFirstName(userFirstName);
      } else {
        console.error('No first name available in localStorage');
      }
    }
  }, []); // Dependency array ensures this runs only once on component mount

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleForceLogout = () => {
    // Clear local storage and navigate to login
    localStorage.removeItem('userID');
    localStorage.removeItem('userRole');
    localStorage.removeItem('username');
    navigate('/login', { replace: true });
    window.location.reload(); // Refresh the page to clear any cached state
  };

  const handleLogout = () => {
    const userId = localStorage.getItem('userID');
    const userRole = localStorage.getItem('userRole');
  
    // If there's no user data, perform local logout immediately
    if (!userId || !userRole) {
      console.warn('No user data found. Performing local logout.');
      performLocalLogout();
      return;
    }
  
    // Attempt API-based logout if data exists
    axios
      .post(`${API_BASE_URL}/api/logout.php`, { user_id: userId, user_role: userRole })
      .then((response) => {
        console.log('API Response:', response);
        if (response.data.status === 1) {
          // Successful logout from the backend
          performLocalLogout();
        } else {
          console.error('API logout failed:', response.data.message);
          console.warn('Falling back to local logout.');
          performLocalLogout(); // Fallback to local logout
        }
      })
      .catch((error) => {
        console.error('Error during API logout:', error);
        console.warn('Falling back to local logout.');
        performLocalLogout(); // Fallback to local logout
      });
  };
  
  // Helper function for local logout
  const performLocalLogout = () => {
    // Clear all session-related data in localStorage
    localStorage.removeItem('userID');
    localStorage.removeItem('userRole');
    localStorage.removeItem('first_name');
    localStorage.removeItem('username');
  
    // Optionally, clear everything in localStorage
    // localStorage.clear(); // Uncomment if you want to remove all stored data
  
    // Redirect to login page
    navigate('/login', { replace: true });
  
    // Reload the page to ensure a clean state
    window.location.reload();
  };
  

  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  const topbarData = TopbarData(firstName);

  return (
    <div className="top-bar">
      <div className="container">
        <section className="custom-section">
          <nav className="top-bar-nav d-flex justify-content-end align-items-center" style={{ height: '50px' }}>
                <div
                  className="d-flex justify-content-end align-items-center"
                  style={{ height: '100%' }}
                >
                  <div
                    ref={dropdownRef}
                    className="topbarlink me-3 d-flex align-items-center"
                    style={{
                      color: 'white',
                      fontSize: '18px',
                      fontWeight: '500',
                      position: 'relative',
                    }}
                  >
                    <div
                      onClick={toggleDropdown}
                      style={{
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        color: 'white',
                      }}
                    >
                      {topbarData[0].icon}
                      <span style={{ marginLeft: '10px', whiteSpace: 'nowrap' }}>
                        {firstName ? `Hello! ${firstName}` : 'Hello! Loading...'}
                      </span>
                    </div>
                    {isDropdownOpen && topbarData[0].subItems && (
                      <div
                        className={`dropdown-menu ${isDropdownOpen ? 'show' : ''}`}
                      >
                        {topbarData[0].subItems.map((subItem, subIndex) => (
                          <Link
                            key={subIndex}
                            to={subItem.link}
                            onClick={
                              subItem.title === 'Log out' ? handleLogout : null
                            }
                            style={{
                              display: 'block',
                              padding: '10px',
                              color: 'black',
                              textDecoration: 'none',
                              fontWeight: 'normal',
                            }}
                          >
                            {subItem.title}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </nav>
        </section>
      </div>
    </div>
  );
};

export default TopBar;
