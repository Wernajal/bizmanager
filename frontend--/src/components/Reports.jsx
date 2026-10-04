import { useEffect, useState } from "react";

function Reports() {
  const [report, setReport] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    profitMargin: 0,
    totalOrders: 0,
    totalExpenseRecords: 0,
  });

  const [expenseBreakdown, setExpenseBreakdown] =
    useState([]);

  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          throw new Error(
            "No authentication token found. Please login again."
          );
        }

        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [
          summaryResponse,
          expenseResponse,
          salesResponse,
          productsResponse,
          customersResponse,
        ] = await Promise.all([
          fetch(
            "http://localhost:5000/api/reports/summary",
            { headers }
          ),

          fetch(
            "http://localhost:5000/api/reports/expenses-by-category",
            { headers }
          ),

          fetch(
            "http://localhost:5000/api/sales",
            { headers }
          ),

          fetch(
            "http://localhost:5000/api/products",
            { headers }
          ),

          fetch(
            "http://localhost:5000/api/customers",
            { headers }
          ),
        ]);

        const summaryData =
          await summaryResponse.json();

        const expenseData =
          await expenseResponse.json();

        const salesData =
          await salesResponse.json();

        const productsData =
          await productsResponse.json();

        const customersData =
          await customersResponse.json();

        // =====================================
        // CHECK RESPONSES
        // =====================================

        if (!summaryResponse.ok) {
          throw new Error(
            summaryData.message ||
              "Failed to fetch report summary"
          );
        }

        if (!expenseResponse.ok) {
          throw new Error(
            expenseData.message ||
              "Failed to fetch expense report"
          );
        }

        if (!salesResponse.ok) {
          throw new Error(
            salesData.message ||
              "Failed to fetch sales"
          );
        }

        if (!productsResponse.ok) {
          throw new Error(
            productsData.message ||
              "Failed to fetch products"
          );
        }

        if (!customersResponse.ok) {
          throw new Error(
            customersData.message ||
              "Failed to fetch customers"
          );
        }

        // =====================================
        // SET DATA
        // =====================================

        setReport(
          summaryData.report || {
            totalRevenue: 0,
            totalExpenses: 0,
            netProfit: 0,
            profitMargin: 0,
            totalOrders: 0,
            totalExpenseRecords: 0,
          }
        );

        setExpenseBreakdown(
          expenseData.breakdown || []
        );

        setSales(
          salesData.sales || []
        );

        setProducts(
          productsData.products || []
        );

        setCustomers(
          customersData.customers || []
        );

      } catch (error) {
        console.error(
          "Failed to fetch reports:",
          error
        );

        setError(error.message);

      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, []);

  // =====================================
  // LOADING
  // =====================================

  if (loading) {
    return (
      <div className="reports-section">
        <p>Loading reports...</p>
      </div>
    );
  }

  // =====================================
  // SALES CALCULATIONS
  // =====================================

  const totalItemsSold = sales.reduce(
    (total, sale) =>
      total + Number(sale.quantity || 0),
    0
  );

  const averageOrder =
    report.totalOrders > 0
      ? report.totalRevenue /
        report.totalOrders
      : 0;

  // =====================================
  // LOW STOCK PRODUCTS
  // =====================================

  const lowStockProducts =
    products.filter(
      (product) =>
        Number(product.stock_quantity) <= 5
    );

  // =====================================
  // BEST SELLING PRODUCTS
  // =====================================

  const productSales = {};

  sales.forEach((sale) => {
    const productId =
      sale.product_id;

    if (!productSales[productId]) {
      productSales[productId] = {
        name:
          sale.product_name ||
          "Unknown Product",
        quantity: 0,
        revenue: 0,
      };
    }

    productSales[productId].quantity +=
      Number(sale.quantity || 0);

    productSales[productId].revenue +=
      Number(sale.total_amount || 0);
  });

  const bestSellingProducts =
    Object.values(productSales)
      .sort(
        (a, b) =>
          b.quantity - a.quantity
      )
      .slice(0, 5);

  // =====================================
  // TOP CUSTOMERS
  // =====================================

  const customerSales = {};

  sales.forEach((sale) => {
    const customerId =
      sale.customer_id || "unknown";

    if (!customerSales[customerId]) {
      customerSales[customerId] = {
        name:
          sale.customer_name ||
          "Unknown Customer",
        orders: 0,
        spending: 0,
      };
    }

    customerSales[customerId].orders +=
      1;

    customerSales[customerId].spending +=
      Number(sale.total_amount || 0);
  });

  const topCustomers =
    Object.values(customerSales)
      .sort(
        (a, b) =>
          b.spending - a.spending
      )
      .slice(0, 5);

  return (
    <div className="reports-section">

      {/* =====================================
          HEADER
      ===================================== */}

      <div className="products-header">

        <div>
          <h2>Reports</h2>

          <p>
            Business performance and
            financial insights.
          </p>
        </div>

      </div>

      {/* =====================================
          ERROR
      ===================================== */}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* =====================================
          FINANCIAL SUMMARY
      ===================================== */}

      <div className="stats-grid">

        <div className="stat-card">

          <span className="stat-icon">
            💰
          </span>

          <div>
            <p>Total Revenue</p>

            <h2>
              KSh{" "}
              {Number(
                report.totalRevenue
              ).toLocaleString()}
            </h2>
          </div>

        </div>

        <div className="stat-card">

          <span className="stat-icon">
            💸
          </span>

          <div>
            <p>Total Expenses</p>

            <h2>
              KSh{" "}
              {Number(
                report.totalExpenses
              ).toLocaleString()}
            </h2>
          </div>

        </div>

        <div className="stat-card">

          <span className="stat-icon">
            📈
          </span>

          <div>
            <p>Net Profit</p>

            <h2>
              KSh{" "}
              {Number(
                report.netProfit
              ).toLocaleString()}
            </h2>
          </div>

        </div>

        <div className="stat-card">

          <span className="stat-icon">
            📊
          </span>

          <div>
            <p>Profit Margin</p>

            <h2>
              {Number(
                report.profitMargin
              ).toFixed(2)}
              %
            </h2>
          </div>

        </div>

      </div>

      {/* =====================================
          SALES SUMMARY
      ===================================== */}

      <div className="stats-grid">

        <div className="stat-card">

          <span className="stat-icon">
            🛒
          </span>

          <div>
            <p>Total Orders</p>

            <h2>
              {report.totalOrders}
            </h2>
          </div>

        </div>

        <div className="stat-card">

          <span className="stat-icon">
            📦
          </span>

          <div>
            <p>Items Sold</p>

            <h2>
              {totalItemsSold}
            </h2>
          </div>

        </div>

        <div className="stat-card">

          <span className="stat-icon">
            🧾
          </span>

          <div>
            <p>Expense Records</p>

            <h2>
              {report.totalExpenseRecords}
            </h2>
          </div>

        </div>

        <div className="stat-card">

          <span className="stat-icon">
            💵
          </span>

          <div>
            <p>Average Order</p>

            <h2>
              KSh{" "}
              {Math.round(
                averageOrder
              ).toLocaleString()}
            </h2>
          </div>

        </div>

      </div>

      {/* =====================================
          EXPENSE BREAKDOWN
      ===================================== */}

      <div className="dashboard-section">

        <div className="section-header">

          <div>
            <h2>
              💸 Expenses by Category
            </h2>

            <p>
              See where your business
              expenses are going.
            </p>
          </div>

        </div>

        {expenseBreakdown.length ===
        0 ? (
          <div className="empty-products">

            <h3>
              No expenses yet
            </h3>

            <p>
              Expense categories will
              appear here.
            </p>

          </div>
        ) : (
          <div className="sales-table-container">

            <table className="sales-table">

              <thead>

                <tr>
                  <th>Category</th>
                  <th>Records</th>
                  <th>Amount</th>
                  <th>Percentage</th>
                </tr>

              </thead>

              <tbody>

                {expenseBreakdown.map(
                  (expense, index) => (
                    <tr
                      key={index}
                    >

                      <td>
                        {expense.category}
                      </td>

                      <td>
                        {expense.expenseCount}
                      </td>

                      <td>
                        <strong>
                          KSh{" "}
                          {Number(
                            expense.totalAmount
                          ).toLocaleString()}
                        </strong>
                      </td>

                      <td>
                        {Number(
                          expense.percentage
                        ).toFixed(2)}
                        %
                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>

      {/* =====================================
          BEST SELLING PRODUCTS
      ===================================== */}

      <div className="dashboard-section">

        <div className="section-header">

          <div>
            <h2>
              🏆 Best-Selling Products
            </h2>

            <p>
              Products generating the
              most sales volume.
            </p>
          </div>

        </div>

        {bestSellingProducts.length ===
        0 ? (
          <div className="empty-products">

            <h3>
              No product sales yet
            </h3>

            <p>
              Best-selling products
              will appear here.
            </p>

          </div>
        ) : (
          <div className="sales-table-container">

            <table className="sales-table">

              <thead>

                <tr>
                  <th>Rank</th>
                  <th>Product</th>
                  <th>Units Sold</th>
                  <th>Revenue</th>
                </tr>

              </thead>

              <tbody>

                {bestSellingProducts.map(
                  (product, index) => (
                    <tr
                      key={index}
                    >

                      <td>
                        #{index + 1}
                      </td>

                      <td>
                        {product.name}
                      </td>

                      <td>
                        {product.quantity}
                      </td>

                      <td>
                        <strong>
                          KSh{" "}
                          {product.revenue.toLocaleString()}
                        </strong>
                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>

      {/* =====================================
          TOP CUSTOMERS
      ===================================== */}

      <div className="dashboard-section">

        <div className="section-header">

          <div>
            <h2>
              👥 Top Customers
            </h2>

            <p>
              Customers with the highest
              purchase value.
            </p>
          </div>

        </div>

        {topCustomers.length === 0 ? (
          <div className="empty-products">

            <h3>
              No customer purchases yet
            </h3>

            <p>
              Customer spending will
              appear here.
            </p>

          </div>
        ) : (
          <div className="sales-table-container">

            <table className="sales-table">

              <thead>

                <tr>
                  <th>Rank</th>
                  <th>Customer</th>
                  <th>Orders</th>
                  <th>Total Spent</th>
                </tr>

              </thead>

              <tbody>

                {topCustomers.map(
                  (customer, index) => (
                    <tr
                      key={index}
                    >

                      <td>
                        #{index + 1}
                      </td>

                      <td>
                        {customer.name}
                      </td>

                      <td>
                        {customer.orders}
                      </td>

                      <td>
                        <strong>
                          KSh{" "}
                          {customer.spending.toLocaleString()}
                        </strong>
                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>

      {/* =====================================
          LOW STOCK
      ===================================== */}

      <div className="dashboard-section">

        <div className="section-header">

          <div>
            <h2>
              ⚠️ Low Stock Report
            </h2>

            <p>
              Products that may need
              restocking.
            </p>
          </div>

        </div>

        {lowStockProducts.length ===
        0 ? (
          <div className="empty-products">

            <h3>
              Stock levels look good
            </h3>

            <p>
              No products are currently
              low on stock.
            </p>

          </div>
        ) : (
          <div className="sales-table-container">

            <table className="sales-table">

              <thead>

                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Stock</th>
                  <th>Price</th>
                </tr>

              </thead>

              <tbody>

                {lowStockProducts.map(
                  (product) => (
                    <tr
                      key={product.id}
                    >

                      <td>
                        {product.name}
                      </td>

                      <td>
                        {product.category ||
                          "—"}
                      </td>

                      <td>
                        <strong>
                          {
                            product.stock_quantity
                          }
                        </strong>
                      </td>

                      <td>
                        KSh{" "}
                        {Number(
                          product.price
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

      {/* =====================================
          CUSTOMER SUMMARY
      ===================================== */}

      <div className="dashboard-section">

        <p>
          👤 Total registered customers:{" "}
          <strong>
            {customers.length}
          </strong>
        </p>

      </div>

    </div>
  );
}

export default Reports;