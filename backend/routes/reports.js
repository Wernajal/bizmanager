const express = require("express");
const db = require("../config/db");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// =====================================
// BUSINESS PROFIT & LOSS REPORT
// =====================================

router.get("/summary", authMiddleware, async (req, res) => {
  try {
    const revenueResult = await db.query(`
      SELECT
        COALESCE(SUM(total_amount), 0) AS total_revenue,
        COUNT(*) AS total_orders
      FROM sales
    `);

    const expenseResult = await db.query(`
      SELECT
        COALESCE(SUM(amount), 0) AS total_expenses,
        COUNT(*) AS total_expense_records
      FROM expenses
    `);

    const totalRevenue =
      Number(revenueResult.rows[0].total_revenue);

    const totalExpenses =
      Number(expenseResult.rows[0].total_expenses);

    const totalOrders =
      Number(revenueResult.rows[0].total_orders);

    const totalExpenseRecords =
      Number(
        expenseResult.rows[0].total_expense_records
      );

    const netProfit =
      totalRevenue - totalExpenses;

    const profitMargin =
      totalRevenue > 0
        ? (netProfit / totalRevenue) * 100
        : 0;

    res.json({
      report: {
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin,
        totalOrders,
        totalExpenseRecords
      }
    });

  } catch (error) {
    console.error(
      "Failed to generate report:",
      error
    );

    res.status(500).json({
      message: "Server error"
    });
  }
});

// =====================================
// EXPENSE BREAKDOWN BY CATEGORY
// =====================================

router.get(
  "/expenses-by-category",
  authMiddleware,
  async (req, res) => {
    try {
      const result = await db.query(`
        SELECT
          COALESCE(category, 'Uncategorized') AS category,
          COALESCE(SUM(amount), 0) AS total_amount,
          COUNT(*) AS expense_count
        FROM expenses
        GROUP BY category
        ORDER BY total_amount DESC
      `);

      const totalExpenses = result.rows.reduce(
        (total, expense) =>
          total + Number(expense.total_amount),
        0
      );

      const breakdown = result.rows.map(
        (expense) => {
          const amount =
            Number(expense.total_amount);

          const percentage =
            totalExpenses > 0
              ? (amount / totalExpenses) * 100
              : 0;

          return {
            category: expense.category,
            totalAmount: amount,
            expenseCount:
              Number(expense.expense_count),
            percentage
          };
        }
      );

      res.json({
        totalExpenses,
        breakdown
      });

    } catch (error) {
      console.error(
        "Failed to generate expense breakdown:",
        error
      );

      res.status(500).json({
        message: "Server error"
      });
    }
  }
);

module.exports = router;