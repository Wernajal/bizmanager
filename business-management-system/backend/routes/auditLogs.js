const express = require("express");
const db = require("../config/db");
const authMiddleware = require("../middleware/auth");
const adminMiddleware = require("../middleware/admin");

const router = express.Router();

// =================================================
// GET AUDIT LOGS — ADMIN ONLY
// =================================================

router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const result = await db.query(
        `SELECT
           id,
           user_id,
           user_name,
           user_email,
           action,
           entity,
           entity_id,
           description,
           created_at
         FROM audit_logs
         ORDER BY created_at DESC
         LIMIT 500`
      );

      res.json({
        logs: result.rows,
      });
    } catch (error) {
      console.error(
        "GET AUDIT LOGS ERROR:",
        error
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

module.exports = router;