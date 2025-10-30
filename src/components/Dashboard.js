import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { FaBox, FaUserTie, FaTags, FaClipboardList } from "react-icons/fa";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title,
  PointElement,
  BarElement,
  ArcElement,
} from "chart.js";

ChartJS.register(LineElement, CategoryScale, LinearScale, Tooltip, Legend, Title, PointElement, BarElement, ArcElement);

const Card = ({ title, value, link, color, icon }) => (
  <Link
    to={link}
    className={`card text-white ${color} status-card text-decoration-none`}
    style={{
      flex: 1,
      minWidth: "160px",
      cursor: "pointer",
      transition: "transform .12s ease-in-out"
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
  const [analytics, setAnalytics] = useState(null);
  const [analyticsRangeDays, setAnalyticsRangeDays] = useState(30); // default last 30 days
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("17:00");
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/Settings/get_time_appointments.php`);
        if (res.data.start_time && res.data.end_time) {
          setStartTime(res.data.start_time.slice(0, 5));
          setEndTime(res.data.end_time.slice(0, 5));
        }
      } catch (err) {
        console.error("Failed to fetch schedule", err);
      }
    };
    fetchSchedule();
  }, []);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/category.php/`)
      .then((res) => setTotalCategories(res.data.total_categories))
      .catch((err) => console.error("Error fetching categories:", err));
  }, []);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/products.php/`)
      .then((res) => setTotalProducts(res.data.total_products))
      .catch((err) => console.error("Error fetching products:", err));
  }, []);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/suppliers.php/`)
      .then((res) => setTotalSuppliers(res.data.total_suppliers))
      .catch((err) => console.error("Error fetching suppliers:", err));
  }, []);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/clients.php/`)
      .then((res) => setTotalClients(res.data.total_clients))
      .catch((err) => console.error("Error fetching clients:", err));
  }, []);

  function deduplicateOrders(orders) {
    const seen = new Set();
    return orders.filter(order => {
      if (seen.has(order.order_id)) {
        return false;
      }
      seen.add(order.order_id);
      return true;
    });
  }

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/api/orders.php?t=${new Date().getTime()}`)
      .then((res) => {
        if (Array.isArray(res.data.orders)) {
          // removes duplicate orders to prevent revenue miscalculation
          const uniqueOrders = deduplicateOrders(res.data.orders);

          setSalesData(uniqueOrders);

          const years = [
            ...new Set(
              uniqueOrders.map((order) =>
                new Date(order.order_date).getFullYear()
              )
            ),
          ];
          setAvailableYears(years.sort((a, b) => b - a));

          setTotalRevenue(calculateRevenue(uniqueOrders, selectedYear).toFixed(2));
        } else {
          console.error("Orders data is not an array");
        }
      })
      .catch((err) => console.error("Error fetching orders:", err));
  }, []);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/analytics.php?days=${analyticsRangeDays}`);
        if (res.data && res.data.success) {
          setAnalytics(res.data);
        } else {
          console.error("Analytics fetch failure:", res.data);
        }
      } catch (err) {
        console.error("Error fetching analytics:", err);
      }
    };
    fetchAnalytics();
  }, [analyticsRangeDays]);

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

  // Chart data builders for analytics
  const buildTopProducts = () => {
    const productSales = {};

    salesData.forEach((row) => {
      const { product_name, quantity, price, type, order_date } = row;
      const orderYear = new Date(order_date).getFullYear();

      if (type === "product" && orderYear === selectedYear && product_name && quantity && price) {
        const sales = parseFloat(quantity) * parseFloat(price);
        productSales[product_name] = (productSales[product_name] || 0) + sales;
      }
    });

    const sorted = Object.entries(productSales)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    return {
      labels: sorted.map(([name]) => name),
      datasets: [
        {
          label: `Product Sales in ${selectedYear} (₱)`,
          data: sorted.map(([_, sales]) => sales.toFixed(2)),
          borderWidth: 0,
          borderRadius: 6,
          backgroundColor: ["#3498db"],
        },
      ],
    };
  };

  const buildAppointmentsOverTime = () => {
    const labels = analytics?.appointments_over_time?.labels ?? [];
    const data = analytics?.appointments_over_time?.data ?? [];
    return {
      labels: Array.isArray(labels) ? labels : [],
      datasets: [
        {
          label: analytics?.range
            ? `Appointments (${analytics.range.start} → ${analytics.range.end})`
            : "Appointments",
          data: Array.isArray(data) ? data : [],
          borderColor: "#1f8ef1",
          backgroundColor: "rgba(31,142,241,0.12)",
          fill: true,
          tension: 0.35,
          pointRadius: 3,
        },
      ],
    };
  };

  // Top Services
  const buildTopServices = () => {
    const labels = analytics?.top_services?.labels ?? [];
    const data = analytics?.top_services?.data ?? [];
    return {
      labels: Array.isArray(labels) ? labels : [],
      datasets: [
        {
          label: "Bookings",
          data: Array.isArray(data) ? data : [],
          borderWidth: 0,
          borderRadius: 6,
          backgroundColor: "#3498db",
        },
      ],
    };
  };

  // Peak Hours
  const buildPeakHours = () => {
    const labels = analytics?.peak_hours?.labels ?? [];
    const data = analytics?.peak_hours?.data ?? [];

    if (!labels.length || !data.length) return { labels: [], datasets: [] };

    const startHour = parseInt(startTime.split(":")[0], 10);
    const endHour = parseInt(endTime.split(":")[0], 10);

    const filteredLabels = labels.slice(startHour, endHour + 1);
    const filteredData = data.slice(startHour, endHour + 1);

    const maxVal = Math.max(...filteredData);

    return {
      labels: filteredLabels,
      datasets: [
        {
          label: "Appointments",
          data: filteredData,
          borderRadius: 5,
          backgroundColor: filteredData.map((val) =>
            val === maxVal ? "#e74c3c" : "#9b59b6"
          ),
        },
      ],
    };
  };

  // Cancellation Rate
  const buildCancellationDoughnut = () => {
    const cancelled = analytics?.cancellation?.cancelled ?? 0;
    const total = analytics?.cancellation?.total ?? 0;
    return {
      labels: ["Cancelled", "Other"],
      datasets: [
        {
          data: [cancelled, Math.max(0, total - cancelled)],
          backgroundColor: ["#e74c3c", "#2ecc71"],
        },
      ],
    };
  };

  const buildAnnualSalesTrend = () => {
    const monthlySales = {
      Jan: 0, Feb: 0, Mar: 0, Apr: 0, May: 0, Jun: 0,
      Jul: 0, Aug: 0, Sep: 0, Oct: 0, Nov: 0, Dec: 0,
    };
    salesData.forEach((order) => {
      const date = new Date(order.order_date);
      if (date.getFullYear() === selectedYear) {
        const month = date.toLocaleString("default", { month: "short" });
        monthlySales[month] += parseFloat(order.grand_total || 0);
      }
    });
    return {
      labels: Object.keys(monthlySales),
      datasets: [
        {
          label: `Total Sales in ${selectedYear} (₱)`,
          data: Object.values(monthlySales),
          borderColor: "#31B44C",
          backgroundColor: "rgba(49,180,76,0.2)",
          fill: true,
          tension: 0.4,
          pointBackgroundColor: "#218838",
        },
      ],
    };
  };

  const sharedLineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top",
        labels: { usePointStyle: true }
      },
      tooltip: {
        mode: "index",
        intersect: false,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "#fff",
        bodyColor: "#fff"
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => Number.isInteger(value) ? value : null
        },
        grid: { color: "rgba(0,0,0,0.05)" }
      },
      x: {
        ticks: { maxRotation: 45, minRotation: 0 },
        grid: { color: "rgba(0,0,0,0.05)" }
      }
    },
    elements: {
      line: {
        tension: 0.3,
        borderWidth: 2
      },
      point: {
        radius: 3,
        hoverRadius: 5
      }
    }
  };

  return (
    <div className="container mt-2">
      {/* Dashboard Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="fw-bold text-dark">Dashboard</h1>
        <div className="text-muted small">
          Last updated: {new Date().toLocaleDateString()}
        </div>
      </div>

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
        />
      </div>

      {/* Sales Analytics Card */}
      <div className="card border-0 shadow-sm mb-5">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="fw-bold text-dark">Sales Analytics</h4>
            <div className="d-flex align-items-center gap-2">
              <label className="small text-muted">Filter by Year:</label>
              <select
                id="yearFilter"
                className="form-select form-select-sm w-auto"
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
          </div>

          <div className="row g-4">
            <div className="col-lg-6">
              <h6 className="fw-bold mb-2">Annual Sales Trend</h6>
              <div style={{ height: "330px" }}>
                <Line data={buildAnnualSalesTrend()} options={sharedLineOptions} />
              </div>
            </div>

            <div className="col-lg-6">
              <h6 className="fw-bold mb-2">Top Products (Sales)</h6>
              <div style={{ height: "330px" }}>
                <Bar
                  data={buildTopProducts()}
                  options={{
                    indexAxis: "y",
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { x: { beginAtZero: true } },
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Appointment Analytics Card */}
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="fw-bold text-dark">Booking Analytics</h4>
            <div className="d-flex align-items-center gap-2">
              <label className="small text-muted">Filter by Range:</label>
              <select
                className="form-select form-select-sm w-auto"
                value={analyticsRangeDays}
                onChange={(e) => setAnalyticsRangeDays(Number(e.target.value))}
              >
                <option value={7}>Last 7 days</option>
                <option value={14}>Last 14 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>
            </div>
          </div>
          
          <div className="row g-4">
            <div className="col-lg-8">
              <h6 className="fw-bold mb-2">Appointments Over Time</h6>
              <div style={{ height: 320 }}>
                <Line data={buildAppointmentsOverTime()} options={sharedLineOptions} />
              </div>
            </div>

            <div className="col-lg-4">
              <div className="card border-0 h-100">
                <div className="card-body d-flex flex-column">
                  <h6 className="card-title fw-bold mb-3">Cancellation Rate</h6>
                  {analytics ? (
                    <div className="d-flex flex-column align-items-center justify-content-center" style={{ height: "320px" }}>
                      <div className="position-relative" style={{ height: "200px", width: "200px" }}>
                        <Doughnut
                          data={buildCancellationDoughnut()}
                          options={{
                            maintainAspectRatio: false,
                            cutout: '70%',
                            plugins: { legend: { display: false } }
                          }}
                        />
                        <div className="position-absolute top-50 start-50 translate-middle text-center">
                          <div className="fs-2 fw-bold">{analytics.cancellation.rate_percent}%</div>
                        </div>
                      </div>

                      {/* Legend below */}
                      <div className="mt-3 small text-center">
                        <span className="d-inline-block me-3">
                          <span className="d-inline-block rounded-circle me-1" 
                            style={{ width: "10px", height: "10px", backgroundColor: "#4e73df" }}></span>
                          Completed: {analytics.cancellation.total - analytics.cancellation.cancelled}
                        </span>
                        <span className="d-inline-block">
                          <span className="d-inline-block rounded-circle me-1" 
                            style={{ width: "10px", height: "10px", backgroundColor: "#e74a3b" }}></span>
                          Cancelled: {analytics.cancellation.cancelled}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="d-flex justify-content-center align-items-center" style={{ height: "320px" }}>
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="col-lg-6">
              <h6 className="fw-bold mb-2">Top Services (by bookings)</h6>
              <div style={{ height: 320 }}>
                <Bar data={buildTopServices()} options={{ indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
              </div>
            </div>

            <div className="col-lg-6">
              <h6 className="fw-bold mb-2">Peak Hours</h6>
              <div style={{ height: 320 }}>
                <Bar data={buildPeakHours()} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

};

export default Dashboard;