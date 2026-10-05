const express = require("express");
const db = require("../config/db");
const authMiddleware = require("../middleware/auth");
const logAction = require("../utils/auditLog");

const router = express.Router();

// =========================
// Create expense
// =========================

router.post(
  "/",
  authMiddleware,
  async (req, res) => {
    try {
      const {
        title,
        description,
        amount,
        category,
        expense_date,
      } = req.body;

      if (
        !title ||
        amount === undefined ||
        !category
      ) {
        return res.status(400).json({
          message:
            "Title, amount and category are required",
        });
      }

      if (Number(amount) <= 0) {
        return res.status(400).json({
          message:
            "Expense amount must be greater than 0",
        });
      }

      const result = await db.query(
        `INSERT INTO expenses
         (
           title,
           description,
           amount,
           category,
           expense_date,
           created_by
         )
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          title,
          description || null,
          amount,
          category,
          expense_date || null,
          req.user.id,
        ]
      );

      const expense = result.rows[0];

      // =========================
      // AUDIT LOG
      // =========================

      await logAction({
        userId: req.user.id,
        action: "CREATE",
        entity: "EXPENSE",
        entityId: expense.id,
        description:
          `Created expense "${expense.title}" ` +
          `for KSh ${Number(
            expense.amount || 0
          ).toLocaleString("en-KE", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
      });

      console.log(
        `AUDIT: Expense ${expense.title} created by user ${req.user.id}`
      );

      res.status(201).json({
        message: "Expense created successfully",
        expense,
      });
    } catch (error) {
      console.error(
        "CREATE EXPENSE ERROR:",
        error
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

// =========================
// Get all expenses
// =========================

router.get(
  "/",
  authMiddleware,
  async (req, res) => {
    try {
      const result = await db.query(
        `SELECT
           expenses.id,
           expenses.title,
           expenses.description,
           expenses.amount,
           expenses.category,
           expenses.expense_date,
           expenses.created_by,
           expenses.created_at,
           users.email AS created_by_email
         FROM expenses
         LEFT JOIN users
           ON users.id = expenses.created_by
         ORDER BY expenses.id DESC`
      );

      res.json({
        expenses: result.rows,
      });
    } catch (error) {
      console.error(
        "GET EXPENSES ERROR:",
        error
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

// =========================
// Get single expense
// =========================

router.get(
  "/:id",
  authMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;

      const result = await db.query(
        `SELECT
           expenses.id,
           expenses.title,
           expenses.description,
           expenses.amount,
           expenses.category,
           expenses.expense_date,
           expenses.created_by,
           expenses.created_at,
           users.email AS created_by_email
         FROM expenses
         LEFT JOIN users
           ON users.id = expenses.created_by
         WHERE expenses.id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "Expense not found",
        });
      }

      res.json({
        expense: result.rows[0],
      });
    } catch (error) {
      console.error(
        "GET EXPENSE ERROR:",
        error
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

// =========================
// Update expense
// =========================

router.put(
  "/:id",
  authMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;

      const {
        title,
        description,
        amount,
        category,
        expense_date,
      } = req.body;

      if (
        !title ||
        amount === undefined ||
        !category
      ) {
        return res.status(400).json({
          message:
            "Title, amount and category are required",
        });
      }

      if (Number(amount) <= 0) {
        return res.status(400).json({
          message:
            "Expense amount must be greater than 0",
        });
      }

      // ---------------------------------------------
      // CHECK EXPENSE EXISTS
      // ---------------------------------------------

      const existingExpense =
        await db.query(
          `SELECT *
           FROM expenses
           WHERE id = $1`,
          [id]
        );

      if (
        existingExpense.rows.length === 0
      ) {
        return res.status(404).json({
          message: "Expense not found",
        });
      }

      // ---------------------------------------------
      // UPDATE EXPENSE
      // ---------------------------------------------

      const result = await db.query(
        `UPDATE expenses
         SET title = $1,
             description = $2,
             amount = $3,
             category = $4,
             expense_date = $5
         WHERE id = $6
         RETURNING *`,
        [
          title,
          description || null,
          amount,
          category,
          expense_date || null,
          id,
        ]
      );

      const expense = result.rows[0];

      // =========================
      // AUDIT LOG
      // =========================

      await logAction({
        userId: req.user.id,
        action: "UPDATE",
        entity: "EXPENSE",
        entityId: expense.id,
        description:
          `Updated expense "${expense.title}" ` +
          `to KSh ${Number(
            expense.amount || 0
          ).toLocaleString("en-KE", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
      });

      console.log(
        `AUDIT: Expense ${expense.title} updated by user ${req.user.id}`
      );

      res.json({
        message: "Expense updated successfully",
        expense,
      });
    } catch (error) {
      console.error(
        "UPDATE EXPENSE ERROR:",
        error
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

// =========================
// Delete expense
// =========================

router.delete(
  "/:id",
  authMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;

      const result = await db.query(
        `DELETE FROM expenses
         WHERE id = $1
         RETURNING *`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "Expense not found",
        });
      }

      const deletedExpense =
        result.rows[0];

      // =========================
      // AUDIT LOG
      // =========================

      await logAction({
        userId: req.user.id,
        action: "DELETE",
        entity: "EXPENSE",
        entityId: deletedExpense.id,
        description:
          `Deleted expense "${deletedExpense.title}" ` +
          `worth KSh ${Number(
            deletedExpense.amount || 0
          ).toLocaleString("en-KE", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
      });

      console.log(
        `AUDIT: Expense ${deletedExpense.title} deleted by user ${req.user.id}`
      );

      res.json({
        message: "Expense deleted successfully",
        expense: deletedExpense,
      });
    } catch (error) {
      console.error(
        "DELETE EXPENSE ERROR:",
        error
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

module.exports = router;