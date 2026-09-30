const express = require("express");
const db = require("../config/db");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// Create customer
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { name, phone, email } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Customer name is required"
      });
    }

    const result = await db.query(
      `INSERT INTO customers
       (name, phone, email)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [
        name,
        phone || null,
        email || null
      ]
    );

    res.status(201).json({
      message: "Customer created successfully",
      customer: result.rows[0]
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error"
    });
  }
});

// Get all customers
router.get("/", authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM customers ORDER BY id DESC"
    );

    res.json({
      customers: result.rows
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error"
    });
  }
});

// Get single customer
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      "SELECT * FROM customers WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Customer not found"
      });
    }

    res.json({
      customer: result.rows[0]
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error"
    });
  }
});

// Get customer purchase history
router.get("/:id/sales", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Check customer exists
    const customerResult = await db.query(
      "SELECT * FROM customers WHERE id = $1",
      [id]
    );

    if (customerResult.rows.length === 0) {
      return res.status(404).json({
        message: "Customer not found"
      });
    }

    // Get customer's purchases
    const salesResult = await db.query(
      `SELECT
         sales.id,
         sales.product_id,
         products.name AS product_name,
         sales.quantity,
         sales.unit_price,
         sales.total_amount,
         sales.created_at
       FROM sales
       JOIN products
         ON products.id = sales.product_id
       WHERE sales.customer_id = $1
       ORDER BY sales.created_at DESC`,
      [id]
    );

    // Calculate customer purchase summary
    const totalPurchases = salesResult.rows.reduce(
      (sum, sale) => sum + Number(sale.total_amount),
      0
    );

    const orderCount = salesResult.rows.length;

    res.json({
      customer: customerResult.rows[0],

      summary: {
        totalPurchases,
        orderCount
      },

      purchases: salesResult.rows
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error"
    });
  }
});

// Update customer
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Customer name is required"
      });
    }

    const result = await db.query(
      `UPDATE customers
       SET name = $1,
           phone = $2,
           email = $3
       WHERE id = $4
       RETURNING *`,
      [
        name,
        phone || null,
        email || null,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Customer not found"
      });
    }

    res.json({
      message: "Customer updated successfully",
      customer: result.rows[0]
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error"
    });
  }
});

// Delete customer
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      "DELETE FROM customers WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Customer not found"
      });
    }

    res.json({
      message: "Customer deleted successfully",
      customer: result.rows[0]
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error"
    });
  }
});

module.exports = router;