const express = require("express");
const db = require("../config/db");
const authMiddleware = require("../middleware/auth");
const logAction = require("../utils/auditLog");

const router = express.Router();

// =====================================================
// CREATE CUSTOMER
// =====================================================

router.post(
  "/",
  authMiddleware,
  async (req, res) => {
    try {
      const {
        name,
        phone,
        email,
      } = req.body;

      if (!name) {
        return res.status(400).json({
          message: "Customer name is required",
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
          email || null,
        ]
      );

      const customer = result.rows[0];

      // =================================================
      // AUDIT LOG
      // =================================================

      await logAction({
        userId: req.user.id,
        action: "CREATE",
        entity: "CUSTOMER",
        entityId: customer.id,
        description:
          `Created customer "${customer.name}"`,
      });

      console.log(
        `AUDIT: Customer ${customer.name} created by user ${req.user.id}`
      );

      res.status(201).json({
        message:
          "Customer created successfully",
        customer,
      });
    } catch (error) {
      console.error(
        "CREATE CUSTOMER ERROR:",
        error
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

// =====================================================
// GET ALL CUSTOMERS
// =====================================================

router.get(
  "/",
  authMiddleware,
  async (req, res) => {
    try {
      const result = await db.query(
        "SELECT * FROM customers ORDER BY id DESC"
      );

      res.json({
        customers: result.rows,
      });
    } catch (error) {
      console.error(
        "GET CUSTOMERS ERROR:",
        error
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

// =====================================================
// GET SINGLE CUSTOMER
// =====================================================

router.get(
  "/:id",
  authMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;

      const result = await db.query(
        "SELECT * FROM customers WHERE id = $1",
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "Customer not found",
        });
      }

      res.json({
        customer: result.rows[0],
      });
    } catch (error) {
      console.error(
        "GET CUSTOMER ERROR:",
        error
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

// =====================================================
// GET CUSTOMER PURCHASE HISTORY
// =====================================================

router.get(
  "/:id/sales",
  authMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;

      // -----------------------------------------------
      // CHECK CUSTOMER EXISTS
      // -----------------------------------------------

      const customerResult =
        await db.query(
          "SELECT * FROM customers WHERE id = $1",
          [id]
        );

      if (
        customerResult.rows.length === 0
      ) {
        return res.status(404).json({
          message: "Customer not found",
        });
      }

      // -----------------------------------------------
      // GET CUSTOMER PURCHASES
      // -----------------------------------------------

      const salesResult =
        await db.query(
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
             ON products.id =
                sales.product_id
           WHERE sales.customer_id = $1
           ORDER BY sales.created_at DESC`,
          [id]
        );

      // -----------------------------------------------
      // PURCHASE SUMMARY
      // -----------------------------------------------

      const totalPurchases =
        salesResult.rows.reduce(
          (sum, sale) =>
            sum +
            Number(
              sale.total_amount || 0
            ),
          0
        );

      const orderCount =
        salesResult.rows.length;

      res.json({
        customer:
          customerResult.rows[0],

        summary: {
          totalPurchases,
          orderCount,
        },

        purchases:
          salesResult.rows,
      });
    } catch (error) {
      console.error(
        "GET CUSTOMER SALES ERROR:",
        error
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

// =====================================================
// UPDATE CUSTOMER
// =====================================================

router.put(
  "/:id",
  authMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;

      const {
        name,
        phone,
        email,
      } = req.body;

      if (!name) {
        return res.status(400).json({
          message:
            "Customer name is required",
        });
      }

      // -----------------------------------------------
      // CHECK CUSTOMER EXISTS
      // -----------------------------------------------

      const existingCustomer =
        await db.query(
          `SELECT *
           FROM customers
           WHERE id = $1`,
          [id]
        );

      if (
        existingCustomer.rows.length === 0
      ) {
        return res.status(404).json({
          message: "Customer not found",
        });
      }

      // -----------------------------------------------
      // UPDATE CUSTOMER
      // -----------------------------------------------

      const result = await db.query(
        `UPDATE customers
         SET
           name = $1,
           phone = $2,
           email = $3
         WHERE id = $4
         RETURNING *`,
        [
          name,
          phone || null,
          email || null,
          id,
        ]
      );

      const customer = result.rows[0];

      // =================================================
      // AUDIT LOG
      // =================================================

      await logAction({
        userId: req.user.id,
        action: "UPDATE",
        entity: "CUSTOMER",
        entityId: customer.id,
        description:
          `Updated customer "${customer.name}"`,
      });

      console.log(
        `AUDIT: Customer ${customer.name} updated by user ${req.user.id}`
      );

      res.json({
        message:
          "Customer updated successfully",
        customer,
      });
    } catch (error) {
      console.error(
        "UPDATE CUSTOMER ERROR:",
        error
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

// =====================================================
// DELETE CUSTOMER
// =====================================================

router.delete(
  "/:id",
  authMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;

      const result = await db.query(
        `DELETE FROM customers
         WHERE id = $1
         RETURNING *`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "Customer not found",
        });
      }

      const deletedCustomer =
        result.rows[0];

      // =================================================
      // AUDIT LOG
      // =================================================

      await logAction({
        userId: req.user.id,
        action: "DELETE",
        entity: "CUSTOMER",
        entityId: deletedCustomer.id,
        description:
          `Deleted customer "${deletedCustomer.name}"`,
      });

      console.log(
        `AUDIT: Customer ${deletedCustomer.name} deleted by user ${req.user.id}`
      );

      res.json({
        message:
          "Customer deleted successfully",
        customer: deletedCustomer,
      });
    } catch (error) {
      console.error(
        "DELETE CUSTOMER ERROR:",
        error
      );

      // -----------------------------------------------
      // CUSTOMER HAS SALES HISTORY
      // -----------------------------------------------

      if (error.code === "23503") {
        return res.status(409).json({
          message:
            "Cannot delete this customer because they have sales history.",
        });
      }

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

module.exports = router;