const express = require("express");
const cors = require("cors");

// Only load local .env during local development
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

// Import database configuration
require("./db"); // Adjust path if your db file is in config/ (e.g., './config/db')

// =================================================
// ROUTES
// =================================================
const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const salesRoutes = require("./routes/sales");
const customerRoutes = require("./routes/customers");
const usersRoutes = require("./routes/users");
const invoicesRoutes = require("./routes/invoices");
const expenseRoutes = require("./routes/expenses");
const reportsRoutes = require("./routes/reports");
const settingsRoutes = require("./routes/settings");
const auditLogsRoutes = require("./routes/auditLogs");

const authMiddleware = require("./middleware/auth");

// =================================================
// APP
// =================================================
const app = express();

// =================================================
// MIDDLEWARE
// =================================================
const allowedOrigins = [
  "https://bizmanager-gamma.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000"
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, or Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());

// =================================================
// API ROUTES
// =================================================
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/invoices", invoicesRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/audit-logs", auditLogsRoutes);

// =================================================
// TEST ROUTE
// =================================================
app.get("/", (req, res) => {
  res.json({
    message: "Business Management System API is running 🚀",
  });
});

// =================================================
// PROTECTED PROFILE ROUTE
// =================================================
app.get("/api/profile", authMiddleware, (req, res) => {
  res.json({
    message: "You accessed a protected route ✅",
    user: req.user,
  });
});

// =================================================
// SERVER
// =================================================
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});