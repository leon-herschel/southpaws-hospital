import React, { useEffect, useState } from "react";
import { FaCaretUp, FaCaretDown } from "react-icons/fa";
import axios from "axios";
import { Button, Form, Collapse, Modal } from "react-bootstrap";
import { toast } from "react-toastify";
import "../assets/table.css";
import "../assets/checkbox.css";

const ArchivedRecords = () => {
    const [data, setData] = useState([]);
    const [expandedRow, setExpandedRow] = useState(null);
    const [selectedRecords, setSelectedRecords] = useState([]);
    const [selectedTables, setSelectedTables] = useState([]);
    const [selectAll, setSelectAll] = useState(false);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = () => {
        axios.get(`http://localhost:80/api/archived.php?action=all`)
            .then((response) => {
                if (response.data.status === 1 && Array.isArray(response.data.data)) {
                    setData(response.data.data);
                } else {
                    setData([]);
                }
            })
            .catch(() => setData([]));
    };

    // Handle selecting all tables and their records
    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedRecords([]);
            setSelectedTables([]);
        } else {
            const allTableNames = [...new Set(data.map(record => record.table_name))];
            const allRecords = data.map(record => `${record.table_name}-${record.id}`);
            setSelectedTables(allTableNames);
            setSelectedRecords(allRecords);
        }
        setSelectAll(!selectAll);
    };

    // Handle selecting an entire table
    const handleSelectTable = (tableName, records) => {
        const isSelected = selectedTables.includes(tableName);

        if (isSelected) {
            setSelectedTables(selectedTables.filter(name => name !== tableName));
            setSelectedRecords(selectedRecords.filter(recordKey => 
                !records.some(record => recordKey === `${tableName}-${record.id}`)
            ));
        } else {
            setSelectedTables([...selectedTables, tableName]);
            setSelectedRecords([
                ...selectedRecords,
                ...records.map(record => `${tableName}-${record.id}`) // Store as tableName-ID format
            ]);
        }
    };

    // Handle selecting/deselecting individual records
    const handleSelectRecord = (tableName, recordId) => {
        const recordKey = `${tableName}-${recordId}`;

        setSelectedRecords(prev =>
            prev.includes(recordKey)
                ? prev.filter(key => key !== recordKey) // Remove if already selected
                : [...prev, recordKey] // Add new selection
        );
    };

    const tableMapping = {
        "Products": "products",
        "Categories": "categories",
        "Brands": "brands",
        "Suppliers": "suppliers",
        "Inventory": "inventory",
        "Unit of Measurement": "unit_of_measurement",
        "Services": "services",
        "Clients": "clients"
    };
    
    // Function to get the actual backend table name
    const getTableName = (frontendName) => tableMapping[frontendName] || frontendName;    

    const handleArchiveSelected = () => {
        if (selectedRecords.length === 0) {
            toast.error("Please select at least one record to archive.");
            return;
        }
        setShowModal(true); // Show modal before proceeding
    };

    const confirmArchive = () => {
        if (selectedRecords.length === 0) {
            toast.error("No records selected.");
            return;
        }
    
        let recordsByTable = {};
    
        selectedRecords.forEach(selectedKey => {
            // More robust splitting that handles various ID formats
            const lastDashIndex = selectedKey.lastIndexOf('-');
            if (lastDashIndex === -1) {
                console.warn("Invalid record key format:", selectedKey);
                return;
            }
    
            const tableName = selectedKey.substring(0, lastDashIndex);
            const recordIdStr = selectedKey.substring(lastDashIndex + 1);
            const recordId = parseInt(recordIdStr, 10);
    
            if (isNaN(recordId)) {
                console.warn("Invalid record ID:", recordIdStr, "from key:", selectedKey);
                return;
            }
    
            const actualTableName = getTableName(tableName);
            if (!recordsByTable[actualTableName]) {
                recordsByTable[actualTableName] = [];
            }
            recordsByTable[actualTableName].push(recordId);
        });
    
        if (Object.keys(recordsByTable).length === 0) {
            toast.error("No valid records selected.");
            return;
        }
    
        // Create an array of all archive requests
        const archiveRequests = Object.entries(recordsByTable).map(([tableName, recordIds]) => {
            // Filter out any null/undefined IDs just in case
            const validIds = recordIds.filter(id => Number.isInteger(id));
            
            if (validIds.length === 0) {
                return Promise.resolve({
                    data: {
                        status: 0,
                        message: `No valid IDs for table ${tableName}`
                    }
                });
            }
    
            return axios.post(`http://localhost:80/api/archived.php`, {
                table: tableName,
                records: validIds
            });
        });
    
        // Execute all requests in parallel
        Promise.all(archiveRequests)
            .then(responses => {
                const allSuccess = responses.every(response => response.data.status === 1);
                if (allSuccess) {
                    toast.success("All selected records archived successfully");
                } else {
                    const errorMessages = responses
                        .filter(response => response.data.status !== 1)
                        .map(response => response.data.message)
                        .join(", ");
                    toast.error(`Some records failed to archive: ${errorMessages}`);
                }
                
                // Refresh data and reset UI regardless of individual failures
                fetchData();
                setSelectedRecords([]);
                setSelectedTables([]);
                setSelectAll(false);
                setShowModal(false);
            })
            .catch(error => {
                console.error("Archive Error:", error);
                toast.error("Failed to archive some records.");
                // Still refresh data even if there were errors
                fetchData();
                setSelectedRecords([]);
                setSelectedTables([]);
                setSelectAll(false);
                setShowModal(false);
            });
    };
    
    

    return (
        <div className="container mt-2">
            <div className="d-flex justify-content-between align-items-center mb-3">
            <h1 className="m-0" style={{ textAlign: "left", fontWeight: "bold" }}>Record Archiver</h1>
            <Button className="btn btn-warning" style={{ marginBottom: '-10px' }} onClick={handleArchiveSelected}>Archive Selected</Button>
        </div>

            <div className="table-responsive mt-3">
                <table className="table table-striped table-hover custom-table align-middle shadow-sm">
                    <thead className="table-light">
                        <tr>
                            <th className="text-center">
                                <Form.Check type="checkbox" checked={selectAll} onChange={handleSelectAll} />
                            </th>
                            <th className="text-center">Table Name</th>
                            <th className="text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="text-center text-muted">No records found</td>
                            </tr>
                        ) : (
                            Object.entries(
                                data.reduce((acc, item) => {
                                    if (!acc[item.table_name]) acc[item.table_name] = [];
                                    acc[item.table_name].push(item);
                                    return acc;
                                }, {})
                            ).map(([tableName, records], key) => (
                                <React.Fragment key={key}>
                                    <tr>
                                        <td className="text-center">
                                            <Form.Check 
                                                type="checkbox" 
                                                checked={selectedTables.includes(tableName)}
                                                onChange={() => handleSelectTable(tableName, records)}
                                            />
                                        </td>  
                                        <td className="text-center font-weight-bold">{tableName}</td>
                                        <td className="text-center">
                                            <Button  onClick={() => setExpandedRow(expandedRow === key ? null : key)}>
                                            {expandedRow === key ? <FaCaretUp /> : <FaCaretDown  />}
                                            </Button>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td colSpan={3} className="p-0">
                                            <Collapse in={expandedRow === key}>
                                                <div className="p-3 border rounded bg-light">
                                                    <table className="table table-bordered align-middle">
                                                        <thead className="table-light">
                                                            <tr>
                                                                <td className="text-center"></td>
                                                                {Object.keys(records[0])
                                                                    .filter(col => col !== "id" && col !== "table_name")
                                                                    .map((col, index) => (
                                                                        <th key={index} className="text-center">{col.replace(/_/g, " ").toUpperCase()}</th>
                                                                ))}
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {records.map((record, idx) => (
                                                                <tr key={idx}>
                                                                    <td className="text-center">
                                                                        <Form.Check
                                                                            type="checkbox"
                                                                            checked={selectedRecords.includes(`${tableName}-${record.id}`)}
                                                                            onChange={() => handleSelectRecord(tableName, record.id)}
                                                                        />
                                                                    </td>
                                                                    {Object.entries(record)
                                                                        .filter(([key]) => key !== "id" && key !== "table_name")
                                                                        .map(([key, value], i) => (
                                                                            <td key={i} className="text-center">{value || "N/A"}</td>
                                                                    ))}
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </Collapse>
                                        </td>
                                    </tr>
                                </React.Fragment>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Archive Confirmation Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Confirm Archive</Modal.Title>
                </Modal.Header>
                <Modal.Body>Are you sure you want to archive the selected records?</Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                    <Button variant="warning" onClick={confirmArchive}>Confirm</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default ArchivedRecords;
