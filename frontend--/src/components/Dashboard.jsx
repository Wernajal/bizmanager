import { useEffect, useState } from "react";
import Customers from "./Customers";
import Products from "./Products";
import Sales from "./Sales";
import Reports from "./Reports";
import Settings from "./Settings";
import Users from "./Users";

function Dashboard({ user, onLogout }) {
  const [productCount, setProductCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [customerCount, setCustomerCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [recentSales, setRecentSales] = useState([]);

  const [activePage, setActivePage] = useState("overview");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("token");

        // Products
        const productsResponse = await fetch(
          "http://localhost:5000/api/products",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const productsData =
          await productsResponse.json();

        if (productsResponse.ok) {
          const products =
            productsData.products || [];

          setProductCount(products.length);

          const lowStock =
            products.filter(
              (product) =>
                Number(product.stock_quantity) <= 5
            );

          setLowStockCount(
            lowStock.length
          );
        }

        // Sales
        const salesResponse = await fetch(
          "http://localhost:5000/api/sales",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const salesData =
          await salesResponse.json();

        if (salesResponse.ok) {
          const sales =
            salesData.sales || [];

          const revenue =
            sales.reduce(
              (total, sale) =>
                total +
                Number(sale.total_amount),
              0
            );

          setTotalSales(revenue);
          setOrderCount(sales.length);

          setRecentSales(
            [...sales]
              .sort(
                (a, b) =>
                  new Date(b.created_at) -
                  new Date(a.created_at)
              )
              .slice(0, 5)
          );
        }

        // Customers
        const customersResponse =
          await fetch(
            "http://localhost:5000/api/customers",
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

        const customersData =
          await customersResponse.json();

        if (customersResponse.ok) {
          const customers =
            customersData.customers || [];

          setCustomerCount(
            customers.length
          );
        }
      } catch (error) {
        console.error(
          "Failed to fetch dashboard data:",
          error
        );
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="app-layout">

      {/* Sidebar */}
      <aside className="sidebar">

        <div className="sidebar-logo">

          <div className="logo-icon">
            B
          </div>

          <div>
            <h2>BizManager</h2>
            <span>
              Business Suite
            </span>
          </div>

        </div>

        <nav className="sidebar-nav">

          <button
            className={
              activePage === "overview"
                ? "sidebar-link active"
                : "sidebar-link"
            }
            onClick={() =>
              setActivePage("overview")
            }
          >
            <span>📊</span>
            Overview
          </button>

          <button
            className={
              activePage === "products"
                ? "sidebar-link active"
                : "sidebar-link"
            }
            onClick={() =>
              setActivePage("products")
            }
          >
            <span>📦</span>
            Products
          </button>

          <button
            className={
              activePage === "sales"
                ? "sidebar-link active"
                : "sidebar-link"
            }
            onClick={() =>
              setActivePage("sales")
            }
          >
            <span>💰</span>
            Sales
          </button>

          <button
            className={
              activePage === "customers"
                ? "sidebar-link active"
                : "sidebar-link"
            }
            onClick={() =>
              setActivePage("customers")
            }
          >
            <span>👥</span>
            Customers
          </button>

          {/* Reports */}
          <button
            className={
              activePage === "reports"
                ? "sidebar-link active"
                : "sidebar-link"
            }
            onClick={() =>
              setActivePage("reports")
            }
          >
            <span>📈</span>
            Reports
          </button>

          {/* Users - Admin Only */}
          {user.role === "admin" && (
            <button
              className={
                activePage === "users"
                  ? "sidebar-link active"
                  : "sidebar-link"
              }
              onClick={() =>
                setActivePage("users")
              }
            >
              <span>👤</span>
              Users
            </button>
          )}

          {/* Settings */}
          <button
            className={
              activePage === "settings"
                ? "sidebar-link active"
                : "sidebar-link"
            }
            onClick={() =>
              setActivePage("settings")
            }
          >
            <span>⚙️</span>
            Settings
          </button>

        </nav>

        <div className="sidebar-bottom">

          <div className="user-mini">

            <div className="avatar">
              {user.email
                ? user.email
                    .charAt(0)
                    .toUpperCase()
                : "U"}
            </div>

            <div>
              <strong>
                {user.email}
              </strong>

              <span>
                {user.role}
              </span>
            </div>

          </div>

          <button
            className="logout-btn"
            onClick={onLogout}
          >
            🚪 Logout
          </button>

        </div>

      </aside>

      {/* Main Area */}
      <div className="main-area">

        {/* Top Bar */}
        <header className="topbar">

          <div>

            <h1>

              {activePage === "overview" &&
                "Dashboard"}

              {activePage === "products" &&
                "Products"}

              {activePage === "sales" &&
                "Sales"}

              {activePage === "customers" &&
                "Customers"}

              {activePage === "reports" &&
                "Reports"}

              {activePage === "users" &&
                "Users"}

              {activePage === "settings" &&
                "Settings"}

            </h1>

            <p>
              Manage your business with ease.
            </p>

          </div>

          <div className="topbar-user">

            <span>
              {user.email}
            </span>

            <div className="avatar">
              {user.email
                ? user.email
                    .charAt(0)
                    .toUpperCase()
                : "U"}
            </div>

          </div>

        </header>

        {/* Main Content */}
        <main className="main-content">

          {/* Overview */}
          {activePage === "overview" && (
            <>

              <div className="welcome-card">

                <h2>
                  Welcome back 👋
                </h2>

                <p>
                  Here's what's happening
                  with your business today.
                </p>

              </div>

              <div className="stats-grid">

                <div className="stat-card">

                  <span className="stat-icon">
                    📦
                  </span>

                  <div>
                    <p>
                      Total Products
                    </p>

                    <h2>
                      {productCount}
                    </h2>
                  </div>

                </div>

                <div className="stat-card">

                  <span className="stat-icon">
                    💰
                  </span>

                  <div>
                    <p>
                      Total Revenue
                    </p>

                    <h2>
                      KSh{" "}
                      {totalSales.toLocaleString()}
                    </h2>
                  </div>

                </div>

                <div className="stat-card">

                  <span className="stat-icon">
                    🛒
                  </span>

                  <div>
                    <p>
                      Total Orders
                    </p>

                    <h2>
                      {orderCount}
                    </h2>
                  </div>

                </div>

                <div className="stat-card">

                  <span className="stat-icon">
                    👥
                  </span>

                  <div>
                    <p>
                      Customers
                    </p>

                    <h2>
                      {customerCount}
                    </h2>
                  </div>

                </div>

              </div>

              <div className="stats-grid">

                <div className="stat-card">

                  <span className="stat-icon">
                    ⚠️
                  </span>

                  <div>
                    <p>
                      Low Stock Products
                    </p>

                    <h2>
                      {lowStockCount}
                    </h2>
                  </div>

                </div>

                <div className="stat-card">

                  <span className="stat-icon">
                    📊
                  </span>

                  <div>
                    <p>
                      Average Order
                    </p>

                    <h2>
                      KSh{" "}
                      {orderCount > 0
                        ? Math.round(
                            totalSales /
                              orderCount
                          ).toLocaleString()
                        : "0"}
                    </h2>
                  </div>

                </div>

              </div>

              {/* Recent Sales */}

              <div className="dashboard-section">

                <div className="section-header">

                  <div>
                    <h2>
                      Recent Sales
                    </h2>

                    <p>
                      Your latest business
                      transactions.
                    </p>
                  </div>

                  <button
                    className="add-product-btn"
                    onClick={() =>
                      setActivePage("sales")
                    }
                  >
                    View All Sales
                  </button>

                </div>

                {recentSales.length ===
                0 ? (
                  <div className="empty-products">

                    <h3>
                      No sales yet
                    </h3>

                    <p>
                      Your recent sales
                      will appear here.
                    </p>

                  </div>
                ) : (
                  <div className="sales-table-container">

                    <table className="sales-table">

                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>
                            Customer
                          </th>
                          <th>
                            Product
                          </th>
                          <th>
                            Quantity
                          </th>
                          <th>
                            Total
                          </th>
                          <th>
                            Date
                          </th>
                        </tr>
                      </thead>

                      <tbody>

                        {recentSales.map(
                          (sale) => (
                            <tr
                              key={sale.id}
                            >

                              <td>
                                #{sale.id}
                              </td>

                              <td>
                                {
                                  sale.customer_name
                                }
                              </td>

                              <td>
                                {
                                  sale.product_name
                                }
                              </td>

                              <td>
                                {sale.quantity}
                              </td>

                              <td>
                                <strong>
                                  KSh{" "}
                                  {Number(
                                    sale.total_amount
                                  ).toLocaleString()}
                                </strong>
                              </td>

                              <td>
                                {new Date(
                                  sale.created_at
                                ).toLocaleString()}
                              </td>

                            </tr>
                          )
                        )}

                      </tbody>

                    </table>

                  </div>
                )}

              </div>

            </>
          )}

          {/* Products */}
          {activePage === "products" && (
            <Products />
          )}

          {/* Sales */}
          {activePage === "sales" && (
            <Sales />
          )}

          {/* Customers */}
          {activePage === "customers" && (
            <Customers />
          )}

          {/* Reports */}
          {activePage === "reports" && (
            <Reports />
          )}

          {/* Users */}
          {activePage === "users" &&
            user.role === "admin" && (
              <Users />
            )}

          {/* Settings */}
          {activePage === "settings" && (
            <Settings />
          )}

        </main>

      </div>

    </div>
  );
}

export default Dashboard;