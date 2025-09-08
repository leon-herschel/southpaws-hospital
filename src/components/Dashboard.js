import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { FaBox, FaUserTie, FaTags, FaClipboardList, FaChartLine } from "react-icons/fa";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title,
  PointElement,
} from "chart.js";

// Register Chart.js components
ChartJS.register(LineElement, CategoryScale, LinearScale, Tooltip, Legend, Title, PointElement);

const Card = ({ title, value, link, color, icon }) => (
  <Link
    to={link}
    className={`card text-white ${color} status-card text-decoration-none`}
    style={{
      flex: 1,
      minWidth: "160px",
      cursor: "pointer",
    }}
    onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
    onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
  >
    <div className="card-body d-flex justify-content-between align-items-center">
      <div>
        <h3 className="mb-0 fw-bold">{value}</h3>
        <p className="mb-0">{title}</p>
      </div>
      <div className="ms-3">{icon}</div>
    </div>
  </Link>
);

const Dashboard = () => {
  const [totalCategories, setTotalCategories] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalClients, setTotalClients] = useState(0);
  const [totalSuppliers, setTotalSuppliers] = useState(0);
  const [salesData, setSalesData] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:80/api/category.php/")
      .then((res) => setTotalCategories(res.data.total_categories))
      .catch((err) => console.error("Error fetching categories:", err));
  }, []);

  useEffect(() => {
    axios.get("http://localhost:80/api/products.php/")
      .then((res) => setTotalProducts(res.data.total_products))
      .catch((err) => console.error("Error fetching products:", err));
  }, []);

  useEffect(() => {
    axios.get("http://localhost:80/api/suppliers.php/")
      .then((res) => setTotalSuppliers(res.data.total_suppliers))
      .catch((err) => console.error("Error fetching suppliers:", err));
  }, []);

  useEffect(() => {
    axios.get("http://localhost:80/api/clients.php/")
      .then((res) => setTotalClients(res.data.total_clients))
      .catch((err) => console.error("Error fetching clients:", err));
  }, []);

  const calculateRevenue = (orders, year) => {
    return orders.reduce((acc, order) => {
      const orderYear = new Date(order.order_date).getFullYear();
      if (orderYear === year) {
        return acc + parseFloat(order.grand_total || 0);
      }
      return acc;
    }, 0);
  };

  useEffect(() => {
    setTotalRevenue(calculateRevenue(salesData, selectedYear).toFixed(2));
  }, [selectedYear, salesData]);

  useEffect(() => {
    axios
      .get(`http://localhost:80/api/orders.php?t=${new Date().getTime()}`)
      .then((res) => {
        if (Array.isArray(res.data.orders)) {
          setSalesData(res.data.orders);

          const years = [
            ...new Set(
              res.data.orders.map((order) =>
                new Date(order.order_date).getFullYear()
              )
            ),
          ];
          setAvailableYears(years.sort((a, b) => b - a));

          setTotalRevenue(
            calculateRevenue(res.data.orders, selectedYear).toFixed(2)
          );
        } else {
          console.error("Orders data is not an array");
        }
      })
      .catch((err) => console.error("Error fetching orders:", err));
  }, []);

  const processSalesTrend = () => {
    const monthlySales = {
      Jan: 0, Feb: 0, Mar: 0, Apr: 0, May: 0, Jun: 0,
      Jul: 0, Aug: 0, Sep: 0, Oct: 0, Nov: 0, Dec: 0,
    };

    salesData.forEach((order) => {
      const date = new Date(order.order_date);
      const year = date.getFullYear();
      const month = date.toLocaleString("default", { month: "short" });

      if (year === selectedYear) {
        monthlySales[month] += parseFloat(order.grand_total);
      }
    });

    return {
      labels: Object.keys(monthlySales),
      datasets: [
        {
          label: `Total Sales in ${selectedYear} (₱)`,
          data: Object.values(monthlySales),
          borderColor: "#31B44C",
          backgroundColor: "rgba(49, 180, 76, 0.2)",
          fill: true,
          tension: 0.4,
          pointBackgroundColor: "#218838",
        },
      ],
    };
  };

  return (
    <div className="container mt-2">
      <h1 className="fw-bold mb-4">Dashboard</h1>

      {/* Top Stats */}
      <div className="d-flex flex-wrap justify-content-between gap-3 mb-4">
        <Card title="Products" value={totalProducts} link="/products" color="bg-success" icon={<FaBox size={40} />} />
        <Card title="Categories" value={totalCategories} link="/category" color="bg-primary" icon={<FaTags size={40} />} />
        <Card title="Suppliers" value={totalSuppliers} link="/suppliers" color="bg-success" icon={<FaUserTie size={40} />} />
        <Card title="Clients" value={totalClients} link="/information/clients" color="bg-primary" icon={<FaClipboardList size={40} />} />
        <Card
  title="Total Revenue"
  value={
    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
      <span style={{ fontSize: "0.9em" }}>₱</span>
      <span>
        {Number(totalRevenue).toLocaleString("en-US", { minimumFractionDigits: 2 })}
      </span>
    </span>
  }
  link="/sales"
  color="bg-success"
  icon={
    String(Math.floor(totalRevenue)).length < 5 ? (
      <FaChartLine size={40} />
    ) : null
  }
/>

      </div>

      {/* Analytics Section */}
      <div
        className="shadow-sm p-4 rounded"
        style={{ background: "#fff", marginTop: "20px" }}
      >
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="fw-bold text-dark mb-0">
            Annual Sales Trend ({selectedYear})
          </h4>
          <select
            id="yearFilter"
            className="form-select w-auto"
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <div style={{ height: "400px" }}>
          <Line
            data={processSalesTrend()}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: true, position: "top" },
                tooltip: {
                  backgroundColor: "rgba(0, 0, 0, 0.8)",
                  titleColor: "#fff",
                  bodyColor: "#fff",
                },
              },
              scales: {
                y: { beginAtZero: true, grid: { color: "rgba(0,0,0,0.1)" } },
                x: { grid: { color: "rgba(0,0,0,0.1)" } },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
