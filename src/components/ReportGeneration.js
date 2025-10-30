import React, { useEffect, useState } from "react";
import { AiOutlineArrowUp, AiOutlineArrowDown } from "react-icons/ai";
import axios from "axios";
import { Pagination, Button, Nav } from "react-bootstrap";
import "../assets/table.css";

const ReportGeneration = () => {
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]); // Stores column names dynamically
  const [currentPage, setCurrentPage] = useState(1);
  const [dataPerPage, setDataPerPage] = useState(5);
  const [sortBy, setSortBy] = useState({ key: "", order: "" });
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filter, setFilter] = useState("sales");
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    fetchData();
  }, [fromDate, toDate, filter]);

  const fetchData = () => {
    const params = { from: fromDate, to: toDate };
    axios
      .get(`${API_BASE_URL}/api/reports.php?action=${filter}`, { params })
      .then((response) => {
        console.log("📥 Fetched Data:", response.data);

        if (response.data.status === 1 && Array.isArray(response.data.data)) {
          setData(response.data.data);
          setColumns(
            response.data.data.length > 0
              ? Object.keys(response.data.data[0])
              : []
          );
        } else {
          console.error("Invalid data format received:", response.data);
          setData([]); // Ensure it's always an array
        }
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        setData([]); // Prevent frontend from breaking
      });
  };

  const formatDate = (dateStr) => {
    if (!dateStr || dateStr === "000000") return "No Expiry Date";

    const date = new Date(dateStr);
    if (isNaN(date)) return "No Expiry Date";

    const options = { year: "numeric", month: "long", day: "numeric" };
    const formattedDate = date.toLocaleDateString("en-US", options);

    // Convert to 12-hour format with AM/PM
    const hours = date.getHours() % 12 || 12; // Convert 0 to 12
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const ampm = date.getHours() >= 12 ? "PM" : "AM";

    return `${formattedDate}, ${hours}:${minutes} ${ampm}`;
  };

  const [searchTerm, setSearchTerm] = useState("");

  const filteredData = data.filter((item) => {
    const term = searchTerm.toLowerCase();
    if (!term) return true; // If search is empty, return all

    if (filter === "sales") {
      return (
        item.product_service?.toLowerCase().includes(term) ||
        item.receipt_number?.toLowerCase().includes(term) ||
        item.type?.toLowerCase().includes(term) ||
        formatDate(item.transaction_date).toLowerCase().includes(term)
      );
    }

    if (filter === "products") {
      return (
        item.sku?.toLowerCase().includes(term) ||
        item.product_name?.toLowerCase().includes(term) ||
        item.generic_name?.toLowerCase().includes(term) ||
        item.unit_name?.toLowerCase().includes(term) ||
        item.category_name?.toLowerCase().includes(term) ||
        item.brand_name?.toLowerCase().includes(term) ||
        formatDate(item.expiration_date)?.toLowerCase().includes(term) ||
        formatDate(item.created_at).toLowerCase().includes(term)
      );
    }

    if (filter === "services") {
      return (
        item.service_name?.toLowerCase().includes(term) ||
        item.consent_form?.toLowerCase().includes(term) ||
        formatDate(item.created_at).toLowerCase().includes(term)
      );
    }

    if (filter === "clients") {
      return (
        item.name?.toLowerCase().includes(term) ||
        item.email?.toLowerCase().includes(term) ||
        formatDate(item.created_at).toLowerCase().includes(term)
      );
    }

    return false;
  });

  // Apply pagination AFTER filtering the data
  const indexOfLastItem = currentPage * dataPerPage;
  const indexOfFirstItem = indexOfLastItem - dataPerPage;
  const currentData = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  const handleSort = (key) => {
    let order = "asc";
    if (sortBy.key === key && sortBy.order === "asc") {
      order = "desc";
    }
    setSortBy({ key, order });
    const sortedData = [...data].sort((a, b) => {
      const valueA = a[key] || "";
      const valueB = b[key] || "";
      return order === "asc"
        ? valueA < valueB
          ? -1
          : 1
        : valueA > valueB
        ? -1
        : 1;
    });
    setData(sortedData);
  };

  const getSortIcon = (key) =>
    sortBy.key === key ? (
      sortBy.order === "asc" ? (
        <AiOutlineArrowUp />
      ) : (
        <AiOutlineArrowDown />
      )
    ) : null;

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handlePrint = () => {
    const printContent = document.getElementById("printable-report").innerHTML;
    const reportTitle = `${
      filter.charAt(0).toUpperCase() + filter.slice(1)
    } Report`;

    // Retrieve user details from local storage
    const firstName = localStorage.getItem("first_name"); // User's first name
    const lastName = localStorage.getItem("last_name"); // User's first name
    const userRole = localStorage.getItem("userRole"); // User's role ID (1, 2, or 3)

    // Map role ID to role name
    const roleName =
      {
        1: "Veterinarian",
        2: "Receptionist",
        3: "Admin",
      }[userRole] || "Unknown Role"; // Default to 'Unknown Role' if role ID is invalid

    // ✅ Hosted logo link (Ensure it's accessible)
    const logoUrl = "https://southpaws.swucite.tech/southpawslogo.png";

    const printWindow = window.open(
      "",
      "_blank",
      "width=800,height=600,top=100,left=100"
    );

    printWindow.document.write(`
            <html>
                <head>
                    <title>${reportTitle}</title>
                    <style>
                        @media print {
                            @page {
                                size: Letter;
                                margin: 0.5in; /* Adjust overall page margins */
                            }
                            body {
                                font-family: Arial, sans-serif;
                                padding: 20px; /* Add padding to the body */
                                text-align: center;
                                font-size: 12px; /* Smaller font size for better fit */
                                margin: 0; /* Remove default body margin */
                            }
                            .logo-container {
                                margin-top: 0; /* Adjust logo margin */
                                text-align: center;
                                margin-bottom: 10px; /* Space below the logo */
                            }
                            .logo-container img {
                                max-width: 300px; /* Smaller logo size */
                                height: auto;
                            }
                            .report-title {
                                font-size: 18px; /* Slightly smaller title */
                                font-weight: bold;
                                margin-bottom: 15px; /* Space below the title */
                                text-transform: uppercase;
                            }
                            .table-container {
                                display: flex;
                                justify-content: center;
                                margin-top: 10px; /* Space above the table */
                            }
                            table {
                                width: 100%; /* Full width */
                                max-width: 100%;
                                border-collapse: collapse;
                                text-align: center;
                                margin: auto; /* Center the table */
                                font-size: 12px; /* Smaller font size for table */
                            }
                            th, td {
                                border: 1px solid black;
                                padding: 8px; /* Smaller padding for cells */
                                text-align: center;
                            }
                            th {
                                background-color: #f2f2f2;
                                font-weight: bold;
                                text-transform: uppercase;
                            }
                            .prepared-by {
                                margin-top: 20px; /* Space above the "Prepared by" section */
                                text-align: right;
                                font-size: 12px; /* Smaller font size */
                                padding-right: 20px; /* Add padding to align text properly */
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="logo-container">
                        <img id="print-logo" src="${logoUrl}" alt="Southpaws Logo">
                    </div>
    
                    <div class="report-title">${reportTitle}</div>
    
                    <div class="table-container">
                        ${printContent}
                    </div>
    
                    <div class="prepared-by">
                    <div class="prepared-by-label">Prepared by:</div>
                    </br>
                    <div>${firstName} ${lastName}</div>
                    <div>${roleName}</div>
                    <div class="signature-line"></div>
                </div>
                </div>
                    </div>
                </body>
            </html>
        `);

    printWindow.document.close();

    // ✅ Ensure the image loads before printing
    const img = printWindow.document.getElementById("print-logo");
    img.onload = () => {
      printWindow.print();
    };

    // ✅ Fallback if image doesn't load in 2 seconds
    setTimeout(() => {
      printWindow.print();
    }, 2000);
  };

  return (
    <div className="container mt-2">
      <h1 style={{ textAlign: "left", fontWeight: "bold" }}>
        Report Generation
      </h1>

      {/* Navigation Tabs for Filters */}
      <Nav variant="tabs" defaultActiveKey="sales">
        {["sales", "products", "services", "clients", "appointments"].map(
          (type) => (
            <Nav.Item key={type}>
              <Nav.Link eventKey={type} onClick={() => setFilter(type)}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Nav.Link>
            </Nav.Item>
          )
        )}
      </Nav>
      <input
        type="text"
        className="form-control shadow-sm"
        placeholder="Search"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ width: "460px" }}
      />

      <div className="d-flex justify-content-between align-items-center mt-3">
        <div className="d-flex">
          <label htmlFor="fromDate" className="me-2">
            From:{" "}
          </label>
          <input
            type="date"
            id="fromDate"
            className="form-control me-3 shadow-sm"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
          <label htmlFor="toDate" className="me-2">
            To:{" "}
          </label>
          <input
            type="date"
            id="toDate"
            className="form-control shadow-sm"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
        <Button
          onClick={handlePrint}
          style={{ marginBottom: "-10px" }}
          className="btn btn-primary"
        >
          Print Report
        </Button>
      </div>

      {/* Dynamic Table */}
      <div id="printable-report" className="table-responsive mt-1">
        <table className="table table-striped table-hover custom-table align-middle shadow-sm">
          <thead className="table-light">
            <tr>
              {columns.map((col, index) => (
                <th
                  key={index}
                  className="text-center"
                  onClick={() => handleSort(col)}
                >
                  {col.replace(/_/g, " ").toUpperCase()} {getSortIcon(col)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentData.map((item, key) => (
              <tr key={key}>
                {columns.map((col, index) => {
                  let value = item[col];

                  // ✅ Format dates properly
                  if (
                    col.toLowerCase().includes("date") ||
                    col.toLowerCase().includes("created_at") ||
                    col.toLowerCase().includes("updated_at")
                  ) {
                    value = formatDate(value);
                  }

                  // ✅ Convert string numbers to float for proper formatting
                  if (
                    value &&
                    (col.toLowerCase().includes("price") ||
                      col.toLowerCase().includes("total") ||
                      col.toLowerCase().includes("amount"))
                  ) {
                    value = parseFloat(value); // Ensure it's a number
                    value = !isNaN(value)
                      ? `₱${value.toLocaleString("en-PH", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`
                      : "N/A";
                  }

                  return (
                    <td key={index} className="text-center">
                      {value || "N/A"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="d-flex justify-content-between align-items-center">
        {/* Items per page selector */}
        <div className="d-flex align-items-center">
          <label htmlFor="dataPerPage" className="form-label me-2 fw-bold">
            Items per page:
          </label>
          <select
            id="dataPerPage"
            className="form-select form-select-sm shadow-sm me-3"
            value={dataPerPage}
            onChange={(e) => setDataPerPage(Number(e.target.value))}
            style={{ width: "80px" }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        {/* Pagination aligned to the right */}
        <div className="d-flex justify-content-end">
          <Pagination className="mb-0">
            {/* Prev button */}
            <Pagination.Prev
              onClick={() => currentPage > 1 && paginate(currentPage - 1)}
              disabled={currentPage === 1}
            />

            {Array.from(
              { length: Math.ceil(data.length / dataPerPage) },
              (_, index) => index + 1
            )
              .filter(
                (page) =>
                  page === 1 ||
                  page === Math.ceil(data.length / dataPerPage) ||
                  (page >= currentPage - 2 && page <= currentPage + 2)
              )
              .map((page, i, arr) => (
                <React.Fragment key={page}>
                  {/* Ellipsis when skipping pages */}
                  {i > 0 && arr[i] !== arr[i - 1] + 1 && (
                    <Pagination.Ellipsis disabled />
                  )}
                  <Pagination.Item
                    active={page === currentPage}
                    onClick={() => paginate(page)}
                  >
                    {page}
                  </Pagination.Item>
                </React.Fragment>
              ))}

            {/* Next button */}
            <Pagination.Next
              onClick={() =>
                currentPage < Math.ceil(data.length / dataPerPage) &&
                paginate(currentPage + 1)
              }
              disabled={currentPage === Math.ceil(data.length / dataPerPage)}
            />
          </Pagination>
        </div>
      </div>
    </div>
  );
};

export default ReportGeneration;
