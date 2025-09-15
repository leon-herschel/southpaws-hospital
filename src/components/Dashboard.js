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

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const res = await axios.get("http://localhost/api/Settings/get_time_appointments.php");
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
      .get(`http://localhost:80/api/orders.php?t=${new Date().getTime()}`)
      .then((res) => {
        if (Array.isArray(res.data.orders)) {
          // fix to remove duplicate orders that wrecks revenue calculation
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
        const res = await axios.get(`http://localhost:80/api/analytics.php?days=${analyticsRangeDays}`);
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

  return (
    <div className="container mt-2">
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

      {/* Annual Sales Trend */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="card-title fw-bold text-dark mb-0">
              Annual Sales Trend ({selectedYear})
            </h5>
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

          <div style={{ height: "400px" }}>
            <Line 
              data={buildAnnualSalesTrend()}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { 
                    display: true, 
                    position: "top",
                    labels: {
                      usePointStyle: true,
                      padding: 20
                    }
                  },
                  tooltip: {
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                    titleColor: "#fff",
                    bodyColor: "#fff",
                    padding: 10,
                    boxPadding: 5,
                    usePointStyle: true
                  },
                },
                scales: {
                  y: { 
                    beginAtZero: true, 
                    grid: { 
                      color: "rgba(0,0,0,0.05)" 
                    },
                    ticks: {
                      callback: function(value) {
                        return '₱' + value.toLocaleString();
                      }
                    }
                  },
                  x: { 
                    grid: { 
                      color: "rgba(0,0,0,0.05)" 
                    } 
                  },
                },
                elements: {
                  line: {
                    tension: 0.3,
                    borderWidth: 2
                  },
                  point: {
                    radius: 3,
                    hoverRadius: 6
                  }
                }
              }}
            />
          </div>
        </div>
      </div>
      
      {/* Appointment trend + Cancellation KPI */}
      <div className="row g-4">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="card-title fw-bold mb-0">Appointments Over Time</h5>
                <div className="d-flex align-items-center gap-2">
                  <select
                    className="form-select form-select-sm"
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
              <div style={{ height: 320 }}>
                <Line
                  data={buildAppointmentsOverTime()}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { 
                        display: true,
                        position: 'top',
                        labels: {
                          usePointStyle: true
                        }
                      },
                      tooltip: { 
                        mode: 'index', 
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
                          stepSize: 1,
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
                        tension: 0.2,
                        borderWidth: 2
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body d-flex flex-column">
              <h5 className="card-title fw-bold">Cancellation Rate</h5>
              {analytics ? (
                <div className="text-center my-auto">
                  <div className="position-relative" style={{ height: "180px" }}>
                    <Doughnut 
                      data={buildCancellationDoughnut()} 
                      options={{
                        maintainAspectRatio: false,
                        cutout: '70%',
                        plugins: { 
                          legend: { 
                            display: false 
                          },
                          tooltip: {
                            backgroundColor: "rgba(0, 0, 0, 0.8)",
                            titleColor: "#fff",
                            bodyColor: "#fff"
                          }
                        }
                      }} 
                    />
                    <div className="position-absolute top-50 start-50 translate-middle text-center">
                      <div className="fs-2 fw-bold">{analytics.cancellation.rate_percent}%</div>
                    </div>
                  </div>
                  <div className="mt-4 small">
                    <span className="d-inline-block me-3">
                      <span className="d-inline-block rounded-circle me-1" style={{ width: "10px", height: "10px", backgroundColor: "#4e73df" }}></span>
                      Completed: {analytics.cancellation.total - analytics.cancellation.cancelled}
                    </span>
                    <span className="d-inline-block">
                      <span className="d-inline-block rounded-circle me-1" style={{ width: "10px", height: "10px", backgroundColor: "#e74a3b" }}></span>
                      Cancelled: {analytics.cancellation.cancelled}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center my-auto">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Top Services + Peak Hours */}
      <div className="row g-4 mt-2">
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h5 className="card-title fw-bold">Top Services (by bookings)</h5>
              <div style={{ height: 320 }}>
                <Bar
                  data={buildTopServices()}
                  options={{
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { 
                      legend: { 
                        display: false 
                      }, 
                      tooltip: { 
                        mode: 'nearest',
                        backgroundColor: "rgba(0, 0, 0, 0.8)",
                        titleColor: "#fff",
                        bodyColor: "#fff"
                      } 
                    },
                    scales: {
                      x: {
                        ticks: { stepSize: 1 },
                        beginAtZero: true, 
                        grid: { 
                          color: "rgba(0,0,0,0.05)" 
                        } 
                      },
                      y: { 
                        grid: { 
                          display: false 
                        } 
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h5 className="card-title fw-bold">Peak Hours</h5>
              <div style={{ height: 320 }}>
                <Bar
                  data={buildPeakHours()}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { 
                      legend: { display: false },
                      tooltip: {
                        backgroundColor: "rgba(0, 0, 0, 0.8)",
                        titleColor: "#fff",
                        bodyColor: "#fff",
                        callbacks: {
                          label: (ctx) => {
                            const value = ctx.raw;
                            const peak = Math.max(...analytics?.peak_hours?.data ?? []);
                            return value === peak 
                              ? `Peak Hour: ${value} appointments` 
                              : `${value} appointments`;
                          }
                        }
                      }
                    },
                    scales: {
                      y: { 
                        beginAtZero: true,
                        ticks: {
                          stepSize: 1,
                          callback: (value) => Number.isInteger(value) ? value : null
                        },
                        grid: { color: "rgba(0,0,0,0.05)" } 
                      },
                      x: { 
                        ticks: { maxRotation: 45, minRotation: 0 },
                        grid: { color: "rgba(0,0,0,0.05)" } 
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;