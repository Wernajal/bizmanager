const express = require("express");
const db = require("../config/db");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// Create sale
router.post("/", authMiddleware, async (req, res) => {
  const client = await db.connect();

  try {
    const { product_id, quantity, customer_id } = req.body;

    if (!product_id || !quantity || !customer_id) {
      return res.status(400).json({
        message: "Product, quantity and customer are required"
      });
    }

    await client.query("BEGIN");

    // Check customer
    const customerResult = await client.query(
      "SELECT * FROM customers WHERE id = $1",
      [customer_id]
    );

    if (customerResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Customer not found"
      });
    }

    // Get product
    const productResult = await client.query(
      "SELECT * FROM products WHERE id = $1 FOR UPDATE",
      [product_id]
    );

    if (productResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Product not found"
      });
    }

    const product = productResult.rows[0];

    // Check stock
    if (product.stock_quantity < quantity) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        message: "Insufficient stock"
      });
    }

    const totalAmount =
      Number(product.price) * Number(quantity);

    // Create sale
    const saleResult = await client.query(
      `INSERT INTO sales
       (product_id, quantity, unit_price, total_amount, sold_by, customer_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        product_id,
        quantity,
        product.price,
        totalAmount,
        req.user.id,
        customer_id
      ]
    );

    // Reduce stock
    await client.query(
      `UPDATE products
       SET stock_quantity = stock_quantity - $1
       WHERE id = $2`,
      [quantity, product_id]
    );

    await client.query("COMMIT");

    res.status(201).json({
      message: "Sale recorded successfully",
      sale: saleResult.rows[0]
    });

  } catch (error) {
    await client.query("ROLLBACK");

    console.error(error);

    res.status(500).json({
      message: "Server error"
    });
  } finally {
    client.release();
  }
});

// Get all sales
router.get("/", authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT 
         sales.id,
         sales.product_id,
         products.name AS product_name,
         sales.customer_id,
         customers.name AS customer_name,
         sales.quantity,
         sales.unit_price,
         sales.total_amount,
         sales.sold_by,
         sales.created_at
       FROM sales
       JOIN products ON products.id = sales.product_id
       JOIN customers ON customers.id = sales.customer_id
       ORDER BY sales.id DESC`
    );

    res.json({
      sales: result.rows
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error"
    });
  }
});

module.exports = router;