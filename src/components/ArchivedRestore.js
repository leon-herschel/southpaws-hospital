import React, { useEffect, useState } from "react";
import { FaCaretUp, FaCaretDown } from "react-icons/fa";
import axios from "axios";
import { Button, Form, Collapse, Modal } from "react-bootstrap";
import { toast } from "react-toastify";
import "../assets/table.css";
import "../assets/checkbox.css";

const ArchivedRestore = () => {
  const [data, setData] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null);
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [selectedTables, setSelectedTables] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState(""); // "restore" or "delete"
  const [activeTable, setActiveTable] = useState(null);
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    axios
      .get(`${API_BASE_URL}/api/restore.php?action=all`)
      .then((response) => {
        if (response.data.status === 1 && Array.isArray(response.data.data)) {
          setData(response.data.data);
          setSelectedRecords([]);
          setSelectedTables([]);
          setSelectAll(false);
        } else {
          setData([]);
        }
      })
      .catch(() => setData([]));
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRecords([]);
      setSelectedTables([]);
    } else {
      const allTableNames = [
        ...new Set(data.map((record) => record.table_name)),
      ];
      const allRecords = data.map(
        (record) => `${record.table_name}-${record.id}`
      );
      setSelectedTables(allTableNames);
      setSelectedRecords(allRecords);
    }
    setSelectAll(!selectAll);
  };

  const handleSelectTable = (tableName, records) => {
    const isSelected = selectedTables.includes(tableName);

    if (isSelected) {
      setSelectedTables(selectedTables.filter((name) => name !== tableName));
      setSelectedRecords(
        selectedRecords.filter(
          (recordKey) =>
            !records.some((record) => recordKey === `${tableName}-${record.id}`)
        )
      );
    } else {
      setSelectedTables([...selectedTables, tableName]);
      setSelectedRecords([
        ...selectedRecords,
        ...records.map((record) => `${tableName}-${record.id}`), // Store as tableName-ID format
      ]);
    }
  };

  const handleSelectRecord = (tableName, recordId) => {
    const recordKey = `${tableName}-${recordId}`;

    setSelectedRecords(
      (prev) =>
        prev.includes(recordKey)
          ? prev.filter((key) => key !== recordKey) // Remove if already selected
          : [...prev, recordKey] // Add new selection
    );
  };

  const tableMapping = {
    Products: "products",
    Categories: "categories",
    Brands: "brands",
    Suppliers: "suppliers",
    Inventory: "inventory",
    "Unit of Measurement": "unit_of_measurement",
    Appointments: "appointments",
  };

  const getTableName = (frontendName) =>
    tableMapping[frontendName] || frontendName;

  const handleActionSelected = (action) => {
    if (selectedRecords.length === 0) {
      toast.error(`Please select at least one record to ${action}.`);
      return;
    }
    setModalAction(action);
    setShowModal(true); // Show modal before proceeding
  };

  const confirmAction = () => {
    let recordsByTable = {};

    selectedRecords.forEach((selectedKey) => {
      const [tableName, recordId] = selectedKey.split("-"); // Extract table name and ID
      const actualTableName = getTableName(tableName); // Convert frontend name to backend table name
      if (!recordsByTable[actualTableName]) {
        recordsByTable[actualTableName] = [];
      }
      recordsByTable[actualTableName].push(parseInt(recordId)); // Store ID as a number
    });

    if (Object.keys(recordsByTable).length === 0) {
      toast.error("No valid records selected.");
      return;
    }

    // Use the correct API endpoint
    const apiEndpoint = modalAction === "delete" ? "delete.php" : "restore.php";

    axios
      .post(`${API_BASE_URL}/api/${apiEndpoint}`, {
        table: "all", // This ensures multiple tables are supported
        records: recordsByTable,
        action: modalAction, // Ensure correct action is sent
      })
      .then((response) => {
        toast.success(response.data.message);
        fetchData();
        setShowModal(false);
      })
      .catch((error) => {
        console.error(`Error performing ${modalAction}:`, error);
        toast.error(`Failed to ${modalAction} records.`);
      });
  };

  return (
    <div className="container mt-2">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="m-0" style={{ textAlign: "left", fontWeight: "bold" }}>
          Archived Records
        </h1>
        <div>
          <Button
            className="btn btn-danger me-2"
            style={{ marginBottom: "-10px" }}
            onClick={() => handleActionSelected("delete")}
          >
            Delete Permanently
          </Button>

          {activeTable !== "Appointments" && (
            <Button
              className="btn btn-success"
              style={{ marginBottom: "-10px" }}
              onClick={() => handleActionSelected("restore")}
            >
              Restore
            </Button>
          )}
        </div>
      </div>
      <div className="table-responsive mt-3">
        <table className="table table-striped table-hover custom-table align-middle shadow-sm">
          <thead className="table-light">
            <tr>
              <th className="text-center">
                <Form.Check
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                />
              </th>
              <th className="text-center">Table Name</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center text-muted">
                  No archived records found
                </td>
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
                    <td className="text-center font-weight-bold">
                      {tableName}
                    </td>
                    <td className="text-center">
                      <Button
                        onClick={() => {
                          setExpandedRow(expandedRow === key ? null : key);
                          setActiveTable(
                            expandedRow === key ? null : tableName
                          );
                        }}
                      >
                        {expandedRow === key ? <FaCaretUp /> : <FaCaretDown />}
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
                                  .filter(
                                    (col) =>
                                      col !== "id" && col !== "table_name"
                                  )
                                  .map((col, index) => (
                                    <th key={index} className="text-center">
                                      {col.replace(/_/g, " ").toUpperCase()}
                                    </th>
                                  ))}
                              </tr>
                            </thead>
                            <tbody>
                              {records.map((record, idx) => (
                                <tr key={idx}>
                                  <td className="text-center">
                                    <Form.Check
                                      type="checkbox"
                                      checked={selectedRecords.includes(
                                        `${tableName}-${record.id}`
                                      )}
                                      onChange={() =>
                                        handleSelectRecord(tableName, record.id)
                                      }
                                    />
                                  </td>
                                  {Object.entries(record)
                                    .filter(
                                      ([key]) =>
                                        key !== "id" && key !== "table_name"
                                    )
                                    .map(([key, value], i) => (
                                      <td key={i} className="text-center">
                                        {value || "N/A"}
                                      </td>
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

      {/* Confirmation Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm {modalAction}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to {modalAction} the selected records?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button
            variant={modalAction === "delete" ? "danger" : "success"}
            onClick={confirmAction}
          >
            Confirm
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ArchivedRestore;
