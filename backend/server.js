const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./config/db");

const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const salesRoutes = require("./routes/sales");
const customerRoutes = require("./routes/customers");
const usersRoutes = require("./routes/users");
const invoicesRoutes = require("./routes/invoices");

const authMiddleware = require("./middleware/auth");

const app = express();

app.use(cors());
app.use(express.json());

// =========================
// API ROUTES
// =========================

app.use("/api/auth", authRoutes);

app.use("/api/products", productRoutes);

app.use("/api/sales", salesRoutes);

app.use("/api/customers", customerRoutes);

app.use("/api/users", usersRoutes);

app.use("/api/invoices", invoicesRoutes);

// =========================
// TEST ROUTE
// =========================

app.get("/", (req, res) => {
  res.json({
    message: "Business Management System API is running 🚀"
  });
});

// =========================
// PROTECTED PROFILE ROUTE
// =========================

app.get("/api/profile", authMiddleware, (req, res) => {
  res.json({
    message: "You accessed a protected route ✅",
    user: req.user
  });
});

// =========================
// SERVER
// =========================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});