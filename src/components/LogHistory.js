import React, { useEffect, useState } from "react";
import { AiOutlineArrowUp, AiOutlineArrowDown } from "react-icons/ai";
import axios from "axios";
import { Pagination } from "react-bootstrap";
import "../assets/table.css";

const History = () => {
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [dataPerPage, setDataPerPage] = useState(10);
  const [sortBy, setSortBy] = useState({ key: "", order: "" });
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchData();
  }, [fromDate, toDate]);

  const fetchData = async () => {
    try {
      const params = {
        from: fromDate || undefined, // Ensuring empty values are handled
        to: toDate || undefined,
      };

      const response = await axios.get(
        `http://localhost:80/api/history_api.php`,
        { params }
      );

      if (
        response.data &&
        response.data.status === 1 &&
        Array.isArray(response.data.data)
      ) {
        setData(response.data.data);
        setColumns(
          response.data.data.length > 0
            ? Object.keys(response.data.data[0])
            : []
        );
      } else {
        console.error("Invalid data format received:", response.data);
        setData([]);
      }
    } catch (error) {
      console.error("❌ Error fetching data:", error);
      setData([]);
    }
  };

  // Format date to "Feb 2, 2025, 12:00 PM"
  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";

    const date = new Date(dateStr);
    if (isNaN(date)) return "Invalid Date";

    const options = { year: "numeric", month: "short", day: "numeric" };
    const formattedDate = date.toLocaleDateString("en-US", options);

    const hours = date.getHours() % 12 || 12;
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const ampm = date.getHours() >= 12 ? "PM" : "AM";

    return `${formattedDate}, ${hours}:${minutes} ${ampm}`;
  };

  // Sorting function with improved null safety
  const handleSort = (key) => {
    let order = "asc";
    if (sortBy.key === key && sortBy.order === "asc") {
      order = "desc";
    }
    setSortBy({ key, order });

    const sortedData = [...data].sort((a, b) => {
      const valueA = a[key] || ""; // Handle null values
      const valueB = b[key] || "";

      if (typeof valueA === "string" && typeof valueB === "string") {
        return order === "asc"
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }
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

  // Sorting icon function
  const getSortIcon = (key) => {
    if (sortBy.key === key) {
      return sortBy.order === "asc" ? (
        <AiOutlineArrowUp />
      ) : (
        <AiOutlineArrowDown />
      );
    }
    return null;
  };

  // Filtered data based on search term
  const filteredData = data.filter((item) => {
    const term = searchTerm.toLowerCase();

    // Safely handle `created_at` and extract the date part
    const createdAt = item.created_at ? item.created_at.split(" ")[0] : "";

    // Convert `fromDate` and `toDate` to valid formats
    const isAfterFromDate = fromDate ? createdAt >= fromDate : true;
    const isBeforeToDate = toDate ? createdAt <= toDate : true;

    // Safely handle fields and convert them to strings before calling `toLowerCase()`
    const matchesSearch =
      (item.record_name?.toString() ?? "").toLowerCase().includes(term) ||
      (item.type?.toString() ?? "").toLowerCase().includes(term) ||
      (item.created_by?.toString() ?? "").toLowerCase().includes(term) ||
      (item.updated_by?.toString() ?? "").toLowerCase().includes(term);

    return isAfterFromDate && isBeforeToDate && matchesSearch;
  });

  // Pagination logic
  const indexOfLastItem = currentPage * dataPerPage;
  const indexOfFirstItem = indexOfLastItem - dataPerPage;
  const currentData = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="container mt-2">
      <h1 style={{ textAlign: "left", fontWeight: "bold" }}>History</h1>

      {/* Search Input */}
      <input
        type="text"
        className="form-control mb-3"
        placeholder="🔍 Search..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ width: "460px" }}
      />

      <div className="d-flex justify-content-between align-items-center">
        <div className="d-flex">
          <label htmlFor="fromDate" className="me-2">
            From:{" "}
          </label>
          <input
            type="date"
            id="fromDate"
            className="form-control me-3"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
          <label htmlFor="toDate" className="me-2">
            To:{" "}
          </label>
          <input
            type="date"
            id="toDate"
            className="form-control"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
      </div>

      {/* Dynamic Table */}
      <div id="printable-history" className="table-responsive mt-3">
        <table className="table table-striped table-hover custom-table">
          <thead>
            <tr>
              {columns.map((col, index) => (
                <th
                  key={index}
                  className="text-center"
                  onClick={() => handleSort(col)}
                >
                  {col === "created_by"
                    ? "CREATED BY"
                    : col === "confirmed_by"
                    ? "CONFIRMED BY"
                    : col.replace(/_/g, " ").toUpperCase()}{" "}
                  {getSortIcon(col)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentData.map((item, key) => (
              <tr key={key}>
                {columns.map((col, index) => (
                  <td key={index} className="text-center">
                    {col === "created_at" || col === "updated_at"
                      ? formatDate(item[col])
                      : col === "created_by"
                      ? item["created_by"] ?? "N/A"
                      : col === "confirmed_by"
                      ? item["confirmed_by"] ?? "N/A"
                      : item[col] ?? "N/A"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination & Entries Selector */}
      <div className="d-flex justify-content-between align-items-center mt-3">
        <div className="d-flex align-items-center">
          <label htmlFor="dataPerPage" className="me-2">
            Show:
          </label>
          <select
            id="dataPerPage"
            className="form-select me-3"
            value={dataPerPage}
            onChange={(e) => setDataPerPage(Number(e.target.value))}
            style={{ width: "80px" }}
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
          <span>entries</span>
        </div>

        <Pagination>
          {Array.from(
            { length: Math.ceil(filteredData.length / dataPerPage) },
            (_, index) => (
              <Pagination.Item
                key={index}
                active={index + 1 === currentPage}
                onClick={() => paginate(index + 1)}
              >
                {index + 1}
              </Pagination.Item>
            )
          )}
        </Pagination>
      </div>
    </div>
  );
};

export default History;
