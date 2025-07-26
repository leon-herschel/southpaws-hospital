import React, { useState, useEffect } from "react";
import { BsArrowRightCircleFill } from "react-icons/bs";
import { Link } from "react-router-dom";
import axios from "axios";
import { FaBox, FaUserTie, FaTags, FaClipboardList, FaChartLine } from "react-icons/fa";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, Tooltip, Legend, Title, PointElement } from "chart.js";

// Register Chart.js components
ChartJS.register(LineElement, CategoryScale, LinearScale, Tooltip, Legend, Title, PointElement);

const Card = ({ title, value, link, color, icon }) => (
  <div className="card" style={{ width: "24rem", backgroundColor: color, border: "none", margin: "10px" }}>
    <div className="card-body">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h5 className="card-title" style={{ fontSize: "28px", color: "white", fontWeight: "bold" }}>{value}</h5>
          <p className="card-text" style={{ fontSize: "28px", color: "white", fontWeight: "bold" }}>{title}</p>
        </div>
        <div>{icon}</div>
      </div>
    </div>
    <Link to={link} className="btn btn-primary" style={{ backgroundColor: color, border: "none", fontSize: "22px", fontWeight: "700" }}>
      View <BsArrowRightCircleFill />
    </Link>
  </div>
);

const Dashboard = () => {
  const [totalCategories, setTotalCategories] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalClients, setTotalClients] = useState(0);
  const [totalSuppliers, setTotalSuppliers] = useState(0);
  const [salesData, setSalesData] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear()); // Default to current year
  const [availableYears, setAvailableYears] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:80/api/category.php/")
      .then(response => setTotalCategories(response.data.total_categories))
      .catch(error => console.error("Error fetching total categories:", error));
  }, []);

  useEffect(() => {
    axios.get("http://localhost:80/api/products.php/")
      .then(response => setTotalProducts(response.data.total_products))
      .catch(error => console.error("Error fetching total products:", error));
  }, []);

  useEffect(() => {
    axios.get("http://localhost:80/api/suppliers.php/")
      .then(response => setTotalSuppliers(response.data.total_suppliers))
      .catch(error => console.error("Error fetching total suppliers:", error));
  }, []);

  useEffect(() => {
    axios.get("http://localhost:80/api/clients.php/")
      .then(response => setTotalClients(response.data.total_clients))
      .catch(error => console.error("Error fetching total clients:", error));
  }, []);

  useEffect(() => {
    axios.get(`http://localhost:80/api/orders.php?t=${new Date().getTime()}`)
      .then(response => {
        if (Array.isArray(response.data.orders)) {
          setSalesData(response.data.orders);

          // ✅ Extract all available years dynamically
          const years = [...new Set(response.data.orders.map(order => new Date(order.order_date).getFullYear()))];
          setAvailableYears(years.sort((a, b) => b - a));

          // ✅ Calculate total revenue
          const total = response.data.orders.reduce((acc, order) => acc + parseFloat(order.grand_total || 0), 0);
          setTotalRevenue(total.toFixed(2));
        } else {
          console.error("Orders data is not an array");
        }
      })
      .catch(error => console.error("Error fetching orders:", error));
  }, []);

  // ✅ Process sales data into a trend based on selected year
  const processSalesTrend = () => {
    const monthlySales = {
      Jan: 0, Feb: 0, Mar: 0, Apr: 0, May: 0, Jun: 0,
      Jul: 0, Aug: 0, Sep: 0, Oct: 0, Nov: 0, Dec: 0
    };

    salesData.forEach(order => {
      const date = new Date(order.order_date);
      const year = date.getFullYear();
      const month = date.toLocaleString("default", { month: "short" });

      // Filter sales by selected year
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
          tension: 0.4, // Smooth curve
          pointBackgroundColor: "#218838",
        }
      ]
    };
  };

  return (
    <div className="container mt-2">
      <h1 style={{ textAlign: "left", fontWeight: "bold" }}>Dashboard</h1>

      <div className="card-container" style={{ display: "flex", flexWrap: "wrap" }}>
        <Card title="Products" value={totalProducts} link="/products" color="#31B44C" icon={<FaBox size={50} style={{ fill: "#fff" }} />} />
        <Card title="Categories" value={totalCategories} link="/category" color="#006CB7" icon={<FaTags size={50} style={{ fill: "#fff" }} />} />
        <Card title="Suppliers" value={totalSuppliers} link="/suppliers" color="#31B44C" icon={<FaUserTie size={50} style={{ fill: "#fff" }} />} />
        <Card title="Clients" value={totalClients} link="/information/clients" color="#006CB7" icon={<FaClipboardList size={50} style={{ fill: "#fff" }} />} />
        <Card 
          title="Total Revenue" 
          value={`₱ ${Number(totalRevenue).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
          link="/Sales" 
          color="#31B44C" 
          icon={<FaChartLine size={50} style={{ fill: "#fff" }} />} 
        />
      </div>

      {/* 📅 Year Selection Dropdown */}
      <div className="mt-3 text-center">
        <label htmlFor="yearFilter" style={{ fontWeight: "bold", fontSize: "18px" }}>Select Year: </label>
        <select 
          id="yearFilter"
          className="form-select d-inline-block w-auto ms-2"
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
        >
          {availableYears.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      {/* 📊 Annual Sales Trend (Line Chart) */}
      <div className="chart-container mt-4" style={{ width: "100%", maxWidth: "900px", height: "400px", margin: "0 auto", padding: "15px", background: "#f8f9fa", borderRadius: "10px" }}>
  <h2 style={{ textAlign: "center", fontWeight: "bold", color: "#333" }}>Annual Sales Trend ({selectedYear})</h2>
  <div style={{ height: "350px" }}> {/* Fixed Height Wrapper for Chart */}
    <Line 
      data={processSalesTrend()} 
      options={{ 
        responsive: true, 
        maintainAspectRatio: false, // This ensures height remains fixed
        plugins: {
          legend: { display: true, position: "top" },
          tooltip: { backgroundColor: "rgba(0, 0, 0, 0.8)", titleColor: "#fff", bodyColor: "#fff" }
        },
        scales: {
          y: { beginAtZero: true, grid: { color: "rgba(0,0,0,0.1)" } },
          x: { grid: { color: "rgba(0,0,0,0.1)" } }
        }
      }} 
    />
  </div>
</div>

    </div>
  );
};

export default Dashboard;
