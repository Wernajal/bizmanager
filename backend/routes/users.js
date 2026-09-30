const express = require("express");
const db = require("../config/db");
const authMiddleware = require("../middleware/auth");
const adminMiddleware = require("../middleware/admin");

const router = express.Router();

// Get all users — Admin only
router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const result = await db.query(
        `SELECT id, name, email, role, created_at
         FROM users
         ORDER BY id DESC`
      );

      res.json({
        users: result.rows
      });

    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Server error"
      });
    }
  }
);

module.exports = router;