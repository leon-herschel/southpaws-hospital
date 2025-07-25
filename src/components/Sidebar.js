import React, { useState, useEffect } from 'react';
import '../App.css';
import { SidebarData } from './SidebarData';
import logo from '../assets/southpawslogo.png';
import { RiArrowDownSLine, RiArrowRightSLine } from 'react-icons/ri';

function Sidebar() {
    const [isProductsOpen, setIsProductsOpen] = useState(false);
    const [isSalesOpen, setIsSalesOpen] = useState(false); // State for Sales section
    const [isServicesOpen, setIsServicesOpen] = useState(false);
    const userRole = parseInt(localStorage.getItem('userRole'), 10); // Retrieve user role from localStorage

    useEffect(() => {
        // Check if the current path is a product sublink
        const isCurrentPageInProducts = SidebarData.find(item =>
            item.title === "Products" && item.subItems?.some(subItem => window.location.pathname === subItem.link)
        );

        if (isCurrentPageInProducts) {
            setIsProductsOpen(true);
        }

        // Check if the current path is a sales sublink
        const isCurrentPageInSales = SidebarData.find(item =>
            item.title === "Sales" && item.subItems?.some(subItem => window.location.pathname === subItem.link)
        );

        if (isCurrentPageInSales) {
            setIsSalesOpen(true);
        }

        const isCurrentPageInServices = SidebarData.find(item =>
            item.title === "Services" && item.subItems?.some(subItem => window.location.pathname === subItem.link)
        );

        if (isCurrentPageInServices) {
            setIsServicesOpen(true);
        }
    }, []);

    const toggleProducts = () => {
        setIsProductsOpen(!isProductsOpen);
    };

    const toggleSales = () => {
        setIsSalesOpen(!isSalesOpen);
    };

    const toggleServices = () => {
        setIsServicesOpen(!isServicesOpen);
    };

    const handleSubItemClick = (link, isProducts) => {
        // Set window location to the new path
        window.location.pathname = link;
        // Only close other sections if they were open
        if (isProducts) {
            setIsSalesOpen(false);
        } else {
            setIsProductsOpen(false);
        }
    };

    return (
        <div className='Sidebar'>
            <div className='logo'>
                <img src={logo} alt="logo" id='logo' />
            </div>
            <ul className='SidebarList'>
                {SidebarData.map((val, key) => {
                    // Skip rendering User Management if the user is not an admin
                    if (val.title === "User Management" && !(userRole === 3 || userRole === 4)) {
                        return null;
                    }

                    // Skip rendering Archive if the user role is 1
                    if (val.title === "Archive" && userRole === 1) {
                        return null;
                    }

                    return (
                        <React.Fragment key={key}>
                            {(val.title === "Products") ? (
                                <>
                                    <li
                                        id={window.location.pathname === val.link ? "active" : ""}
                                        className='row'
                                        onClick={toggleProducts}
                                    >
                                        <div id='icon'>{val.icon}</div>
                                        <div id='title'>
                                            {val.title} {isProductsOpen ? <RiArrowDownSLine /> : <RiArrowRightSLine />}
                                        </div>
                                    </li>
                                    {isProductsOpen && val.subItems.map((subVal, subKey) => (
                                        <li
                                            key={subKey}
                                            id={window.location.pathname === subVal.link ? "active" : ""}
                                            className='row'
                                            onClick={() => handleSubItemClick(subVal.link, true)}
                                            style={{ paddingLeft: '20px' }} // Indentation applied here
                                        >
                                            <div id='icon'>{subVal.icon}</div> 
                                            <div id='title'>{subVal.title}</div>
                                        </li>
                                    ))}
                                </>
                            ) : (
                                (val.title === "Sales") ? (
                                    <>
                                        <li
                                            id={window.location.pathname === val.link ? "active" : ""}
                                            className='row'
                                            onClick={toggleSales}
                                        >
                                            <div id='icon'>{val.icon}</div>
                                            <div id='title'>
                                                {val.title} {isSalesOpen ? <RiArrowDownSLine /> : <RiArrowRightSLine />}
                                            </div>
                                        </li>
                                        {isSalesOpen && val.subItems.map((subVal, subKey) => {
                                            // Check if the sub-item is "Point of Sales"
                                            if (subVal.title === "Point of Sales" && userRole === 1) {
                                                // Skip rendering "Point of Sales" for user_role 1
                                                return null;
                                            }

                                            return (
                                                <li
                                                    key={subKey}
                                                    id={window.location.pathname === subVal.link ? "active" : ""}
                                                    className='row'
                                                    onClick={() => handleSubItemClick(subVal.link, false)}
                                                    style={{ paddingLeft: '20px' }} // Indentation applied here
                                                >
                                                    <div id='icon'>{subVal.icon}</div> 
                                                    <div id='title'>{subVal.title}</div>
                                                </li>
                                            );
                                        })}
                                    </>
                                ) : val.title === "Services" ? (
                                    <>
                                        <li className='row' id={window.location.pathname === val.link ? "active" : ""} onClick={toggleServices}>
                                            <div id='icon'>{val.icon}</div>
                                            <div id='title'>{val.title} {isServicesOpen ? <RiArrowDownSLine /> : <RiArrowRightSLine />}</div>
                                        </li>
                                        {isServicesOpen && val.subItems.map((subVal, subKey) => (
                                            <li key={subKey} className='row' id={window.location.pathname === subVal.link ? "active" : ""}
                                                onClick={() => handleSubItemClick(subVal.link, false)} style={{ paddingLeft: '20px' }}>
                                                <div id='icon'>{subVal.icon}</div>
                                                <div id='title'>{subVal.title}</div>
                                            </li>
                                        ))}
                                    </>
                                ) : (
                                    <li
                                        id={window.location.pathname === val.link ? "active" : ""}
                                        className='row'
                                        onClick={() => {
                                            setIsProductsOpen(false);
                                            setIsSalesOpen(false);
                                            window.location.pathname = val.link;
                                        }}
                                    >
                                        <div id='icon'>{val.icon}</div> 
                                        <div id='title'>{val.title}</div>
                                    </li>
                                )
                            )}
                            {(key === 0 || key === 3 || key === 4 || key === 7) ? <hr className='divider' /> : null}
                        </React.Fragment>
                    );
                })}
            </ul>
        </div>
    );
}

export default Sidebar;