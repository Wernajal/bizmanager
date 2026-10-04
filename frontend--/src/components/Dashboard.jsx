import { useEffect, useState } from "react";

import Customers from "./Customers";
import Products from "./Products";
import Sales from "./Sales";
import Expenses from "./Expenses";
import Reports from "./Reports";
import Settings from "./Settings";
import Users from "./Users";
import ActivityLog from "./ActivityLog";

function Dashboard({ user, onLogout }) {
  const [productCount, setProductCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [customerCount, setCustomerCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [recentSales, setRecentSales] = useState([]);

  const [activePage, setActivePage] = useState("overview");

  // =================================================
  // ROLE
  // =================================================

  const isAdmin =
    String(user?.role || "").toLowerCase() === "admin";

  // =================================================
  // FETCH DASHBOARD DATA
  // =================================================

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("token");

        // =================================================
        // PRODUCTS
        // =================================================

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

          const lowStock = products.filter(
            (product) =>
              Number(product.stock_quantity) <= 5
          );

          setLowStockCount(lowStock.length);
        }

        // =================================================
        // SALES
        // =================================================

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

          const revenue = sales.reduce(
            (total, sale) =>
              total +
              Number(sale.total_amount || 0),
            0
          );

          setTotalSales(revenue);

          setOrderCount(sales.length);

          const sortedSales = [...sales]
            .sort(
              (a, b) =>
                new Date(b.created_at) -
                new Date(a.created_at)
            )
            .slice(0, 5);

          setRecentSales(sortedSales);
        }

        // =================================================
        // CUSTOMERS
        // =================================================

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

  // =================================================
  // PAGE TITLE
  // =================================================

  const getPageTitle = () => {
    switch (activePage) {
      case "overview":
        return "Dashboard";

      case "products":
        return "Products";

      case "sales":
        return "Sales";

      case "expenses":
        return "Expenses";

      case "customers":
        return "Customers";

      case "reports":
        return "Reports";

      case "users":
        return "Users";

      case "settings":
        return "Settings";

      case "activity":
        return "Activity Log";

      default:
        return "Dashboard";
    }
  };

  // =================================================
  // PAGE DESCRIPTION
  // =================================================

  const getPageDescription = () => {
    switch (activePage) {
      case "overview":
        return "Manage your business with ease.";

      case "products":
        return "Manage your products and inventory.";

      case "sales":
        return "Manage your business sales.";

      case "expenses":
        return "Track and manage your business expenses.";

      case "customers":
        return "Manage your customers.";

      case "reports":
        return "View business performance and reports.";

      case "users":
        return "Manage system users and access.";

      case "settings":
        return "Manage your account and application settings.";

      case "activity":
        return "Monitor important actions performed in BizManager.";

      default:
        return "Manage your business with ease.";
    }
  };

  // =================================================
  // NAVIGATION BUTTON
  // =================================================

  const renderNavButton = (
    page,
    icon,
    label
  ) => {
    return (
      <button
        type="button"
        className={
          activePage === page
            ? "sidebar-link active"
            : "sidebar-link"
        }
        onClick={() => setActivePage(page)}
      >
        <span>{icon}</span>
        {label}
      </button>
    );
  };

  // =================================================
  // DASHBOARD
  // =================================================

  return (
    <div className="app-layout">

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside className="sidebar">

        {/* LOGO */}

        <div className="sidebar-logo">

          <div className="logo-icon">
            B
          </div>

          <div>
            <h2>
              BizManager
            </h2>

            <span>
              Business Suite
            </span>
          </div>

        </div>

        {/* NAVIGATION */}

        <nav className="sidebar-nav">

          {renderNavButton(
            "overview",
            "📊",
            "Overview"
          )}

          {renderNavButton(
            "products",
            "📦",
            "Products"
          )}

          {renderNavButton(
            "sales",
            "💰",
            "Sales"
          )}

          {renderNavButton(
            "expenses",
            "💸",
            "Expenses"
          )}

          {renderNavButton(
            "customers",
            "👥",
            "Customers"
          )}

          {renderNavButton(
            "reports",
            "📈",
            "Reports"
          )}

          {/* ADMIN ONLY */}

          {isAdmin &&
            renderNavButton(
              "users",
              "👤",
              "Users"
            )}

          {isAdmin &&
            renderNavButton(
              "activity",
              "🕵️",
              "Activity Log"
            )}

          {isAdmin &&
            renderNavButton(
              "settings",
              "⚙️",
              "Settings"
            )}

        </nav>

        {/* =================================================
            SIDEBAR BOTTOM
        ================================================= */}

        <div className="sidebar-bottom">

          <div className="user-mini">

            <div className="avatar">
              {user?.email
                ? user.email
                    .charAt(0)
                    .toUpperCase()
                : "U"}
            </div>

            <div>

              <strong>
                {user?.email || "User"}
              </strong>

              <span>
                {user?.role || "Staff"}
              </span>

            </div>

          </div>

          <button
            type="button"
            className="logout-btn"
            onClick={onLogout}
          >
            🚪 Logout
          </button>

        </div>

      </aside>

      {/* =================================================
          MAIN AREA
      ================================================= */}

      <div className="main-area">

        {/* TOP BAR */}

        <header className="topbar">

          <div>

            <h1>
              {getPageTitle()}
            </h1>

            <p>
              {getPageDescription()}
            </p>

          </div>

          <div className="topbar-user">

            <span>
              {user?.email || "User"}
            </span>

            <div className="avatar">

              {user?.email
                ? user.email
                    .charAt(0)
                    .toUpperCase()
                : "U"}

            </div>

          </div>

        </header>

        {/* =================================================
            MAIN CONTENT
        ================================================= */}

        <main className="main-content">

          {/* =================================================
              OVERVIEW
          ================================================= */}

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

              {/* MAIN STATISTICS */}

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

              {/* SECONDARY STATISTICS */}

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

              {/* RECENT SALES */}

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
                    type="button"
                    className="add-product-btn"
                    onClick={() =>
                      setActivePage("sales")
                    }
                  >
                    View All Sales
                  </button>

                </div>

                {recentSales.length === 0 ? (

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

                          <th>
                            ID
                          </th>

                          <th>
                            Customer
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
                                {sale.customer_name ||
                                  "Walk-in Customer"}
                              </td>

                              <td>

                                <strong>
                                  KSh{" "}

                                  {Number(
                                    sale.total_amount ||
                                      0
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

          {/* PRODUCTS */}

          {activePage === "products" && (
            <Products />
          )}

          {/* SALES */}

          {activePage === "sales" && (
            <Sales />
          )}

          {/* EXPENSES */}

          {activePage === "expenses" && (
            <Expenses />
          )}

          {/* CUSTOMERS */}

          {activePage === "customers" && (
            <Customers />
          )}

          {/* REPORTS */}

          {activePage === "reports" && (
            <Reports />
          )}

          {/* USERS — ADMIN ONLY */}

          {activePage === "users" && isAdmin && (
            <Users />
          )}

          {/* ACTIVITY LOG — ADMIN ONLY */}

          {activePage === "activity" &&
            isAdmin && (
              <ActivityLog />
            )}

          {/* SETTINGS — ADMIN ONLY */}

          {activePage === "settings" &&
            isAdmin && (
              <Settings />
            )}

        </main>

      </div>

    </div>
  );
}

export default Dashboard;