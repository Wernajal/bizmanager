const express = require("express");
const db = require("../config/db");
const authMiddleware = require("../middleware/auth");
const logAction = require("../utils/auditLog");

const router = express.Router();

// =========================
// Create product
// =========================

router.post(
  "/",
  authMiddleware,
  async (req, res) => {
    try {
      const {
        name,
        description,
        price,
        stock_quantity,
      } = req.body;

      if (!name || price === undefined) {
        return res.status(400).json({
          message: "Name and price are required",
        });
      }

      const result = await db.query(
        `INSERT INTO products
         (name, description, price, stock_quantity)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [
          name,
          description || null,
          price,
          stock_quantity || 0,
        ]
      );

      const product = result.rows[0];

      // =========================
      // AUDIT LOG
      // =========================

      await logAction({
        userId: req.user.id,
        action: "CREATE",
        entity: "PRODUCT",
        entityId: product.id,
        description:
          `Created product "${product.name}"`,
      });

      res.status(201).json({
        message: "Product created successfully",
        product,
      });
    } catch (error) {
      console.error(
        "CREATE PRODUCT ERROR:",
        error
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

// =========================
// Get all products
// =========================

router.get(
  "/",
  authMiddleware,
  async (req, res) => {
    try {
      const result = await db.query(
        "SELECT * FROM products ORDER BY id DESC"
      );

      res.json({
        products: result.rows,
      });
    } catch (error) {
      console.error(
        "GET PRODUCTS ERROR:",
        error
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

// =========================
// Get single product
// =========================

router.get(
  "/:id",
  authMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;

      const result = await db.query(
        "SELECT * FROM products WHERE id = $1",
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "Product not found",
        });
      }

      res.json({
        product: result.rows[0],
      });
    } catch (error) {
      console.error(
        "GET PRODUCT ERROR:",
        error
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

// =========================
// Update product
// =========================

router.put(
  "/:id",
  authMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;

      const {
        name,
        description,
        price,
        stock_quantity,
      } = req.body;

      if (!name || price === undefined) {
        return res.status(400).json({
          message: "Name and price are required",
        });
      }

      // Get the existing product first
      const existingProduct = await db.query(
        "SELECT * FROM products WHERE id = $1",
        [id]
      );

      if (existingProduct.rows.length === 0) {
        return res.status(404).json({
          message: "Product not found",
        });
      }

      const result = await db.query(
        `UPDATE products
         SET name = $1,
             description = $2,
             price = $3,
             stock_quantity = $4
         WHERE id = $5
         RETURNING *`,
        [
          name,
          description || null,
          price,
          stock_quantity || 0,
          id,
        ]
      );

      const product = result.rows[0];

      // =========================
      // AUDIT LOG
      // =========================

      await logAction({
        userId: req.user.id,
        action: "UPDATE",
        entity: "PRODUCT",
        entityId: product.id,
        description:
          `Updated product "${product.name}"`,
      });

      res.json({
        message: "Product updated successfully",
        product,
      });
    } catch (error) {
      console.error(
        "UPDATE PRODUCT ERROR:",
        error
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

// =========================
// Delete product
// =========================

router.delete(
  "/:id",
  authMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;

      const result = await db.query(
        "DELETE FROM products WHERE id = $1 RETURNING *",
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "Product not found",
        });
      }

      const deletedProduct =
        result.rows[0];

      // =========================
      // AUDIT LOG
      // =========================

      await logAction({
        userId: req.user.id,
        action: "DELETE",
        entity: "PRODUCT",
        entityId: deletedProduct.id,
        description:
          `Deleted product "${deletedProduct.name}"`,
      });

      res.json({
        message: "Product deleted successfully",
        product: deletedProduct,
      });
    } catch (error) {
      console.error(
        "DELETE PRODUCT ERROR:",
        error
      );

      // Product has existing sales
      if (error.code === "23503") {
        return res.status(409).json({
          message:
            "Cannot delete this product because it has sales history.",
        });
      }

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

module.exports = router;