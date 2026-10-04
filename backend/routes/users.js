const express = require("express");
const bcrypt = require("bcrypt");
const db = require("../config/db");
const authMiddleware = require("../middleware/auth");
const adminMiddleware = require("../middleware/admin");
const logAction = require("../utils/auditLog");

const router = express.Router();

// =================================================
// GET ALL USERS — ADMIN ONLY
// =================================================

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
        users: result.rows,
      });
    } catch (error) {
      console.error("GET USERS ERROR:", error);

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

// =================================================
// ADD STAFF — ADMIN ONLY
// =================================================

router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { name, email, password } = req.body;

      // ---------------------------------------------
      // VALIDATION
      // ---------------------------------------------

      if (!name || !email || !password) {
        return res.status(400).json({
          message:
            "Name, email and password are required",
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          message:
            "Password must be at least 6 characters",
        });
      }

      const cleanName = String(name).trim();

      const cleanEmail = String(email)
        .trim()
        .toLowerCase();

      if (!cleanName) {
        return res.status(400).json({
          message: "Name cannot be empty",
        });
      }

      if (!cleanEmail) {
        return res.status(400).json({
          message: "Email cannot be empty",
        });
      }

      // ---------------------------------------------
      // CHECK EMAIL
      // ---------------------------------------------

      const existingUser = await db.query(
        `SELECT id
         FROM users
         WHERE email = $1`,
        [cleanEmail]
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({
          message: "Email already exists",
        });
      }

      // ---------------------------------------------
      // HASH PASSWORD
      // ---------------------------------------------

      const hashedPassword = await bcrypt.hash(
        password,
        10
      );

      // ---------------------------------------------
      // CREATE STAFF
      // ---------------------------------------------

      const result = await db.query(
        `INSERT INTO users
         (
           name,
           email,
           password,
           role
         )
         VALUES
         (
           $1,
           $2,
           $3,
           $4
         )
         RETURNING
           id,
           name,
           email,
           role,
           created_at`,
        [
          cleanName,
          cleanEmail,
          hashedPassword,
          "staff",
        ]
      );

      const newStaff = result.rows[0];

      // ---------------------------------------------
      // AUDIT LOG
      // ---------------------------------------------

      await logAction({
        userId: req.user.id,
        action: "CREATE",
        entity: "STAFF",
        entityId: newStaff.id,
        description:
          `Created staff account for ${newStaff.name}`,
      });

      console.log(
        `AUDIT: Staff ${newStaff.name} created by user ${req.user.id}`
      );

      // ---------------------------------------------
      // RESPONSE
      // ---------------------------------------------

      res.status(201).json({
        message:
          "Staff account created successfully",
        user: newStaff,
      });
    } catch (error) {
      console.error("ADD STAFF ERROR:", error);

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

// =================================================
// EDIT STAFF — ADMIN ONLY
// =================================================

router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const userId = Number(req.params.id);

      const {
        name,
        email,
        password,
      } = req.body;

      // ---------------------------------------------
      // VALIDATE ID
      // ---------------------------------------------

      if (!Number.isInteger(userId)) {
        return res.status(400).json({
          message: "Invalid user ID",
        });
      }

      // ---------------------------------------------
      // GET TARGET USER
      // ---------------------------------------------

      const targetUser = await db.query(
        `SELECT id, name, email, role
         FROM users
         WHERE id = $1`,
        [userId]
      );

      if (targetUser.rows.length === 0) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      const user = targetUser.rows[0];

      if (user.role !== "staff") {
        return res.status(403).json({
          message:
            "Only staff accounts can be edited here",
        });
      }

      // ---------------------------------------------
      // VALIDATE NAME + EMAIL
      // ---------------------------------------------

      if (!name || !email) {
        return res.status(400).json({
          message:
            "Name and email are required",
        });
      }

      const cleanName = String(name).trim();

      const cleanEmail = String(email)
        .trim()
        .toLowerCase();

      if (!cleanName) {
        return res.status(400).json({
          message: "Name cannot be empty",
        });
      }

      if (!cleanEmail) {
        return res.status(400).json({
          message: "Email cannot be empty",
        });
      }

      // ---------------------------------------------
      // CHECK EMAIL
      // ---------------------------------------------

      const existingUser = await db.query(
        `SELECT id
         FROM users
         WHERE email = $1
         AND id != $2`,
        [cleanEmail, userId]
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({
          message: "Email already exists",
        });
      }

      // ---------------------------------------------
      // UPDATE WITHOUT PASSWORD
      // ---------------------------------------------

      if (!password) {
        const result = await db.query(
          `UPDATE users
           SET
             name = $1,
             email = $2
           WHERE id = $3
           RETURNING
             id,
             name,
             email,
             role,
             created_at`,
          [
            cleanName,
            cleanEmail,
            userId,
          ]
        );

        const updatedStaff =
          result.rows[0];

        await logAction({
          userId: req.user.id,
          action: "UPDATE",
          entity: "STAFF",
          entityId: userId,
          description:
            `Updated staff account for ${updatedStaff.name}`,
        });

        console.log(
          `AUDIT: Staff ${updatedStaff.name} updated by user ${req.user.id}`
        );

        return res.json({
          message:
            "Staff account updated successfully",
          user: updatedStaff,
        });
      }

      // ---------------------------------------------
      // VALIDATE PASSWORD
      // ---------------------------------------------

      if (password.length < 6) {
        return res.status(400).json({
          message:
            "Password must be at least 6 characters",
        });
      }

      // ---------------------------------------------
      // HASH PASSWORD
      // ---------------------------------------------

      const hashedPassword = await bcrypt.hash(
        password,
        10
      );

      // ---------------------------------------------
      // UPDATE WITH PASSWORD
      // ---------------------------------------------

      const result = await db.query(
        `UPDATE users
         SET
           name = $1,
           email = $2,
           password = $3
         WHERE id = $4
         RETURNING
           id,
           name,
           email,
           role,
           created_at`,
        [
          cleanName,
          cleanEmail,
          hashedPassword,
          userId,
        ]
      );

      const updatedStaff =
        result.rows[0];

      await logAction({
        userId: req.user.id,
        action: "UPDATE",
        entity: "STAFF",
        entityId: userId,
        description:
          `Updated staff account and password for ${updatedStaff.name}`,
      });

      console.log(
        `AUDIT: Staff ${updatedStaff.name} and password updated by user ${req.user.id}`
      );

      res.json({
        message:
          "Staff account updated successfully",
        user: updatedStaff,
      });
    } catch (error) {
      console.error("EDIT STAFF ERROR:", error);

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

// =================================================
// DELETE STAFF — ADMIN ONLY
// =================================================

router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const userId = Number(req.params.id);

      // ---------------------------------------------
      // VALIDATE ID
      // ---------------------------------------------

      if (!Number.isInteger(userId)) {
        return res.status(400).json({
          message: "Invalid user ID",
        });
      }

      // ---------------------------------------------
      // PREVENT SELF DELETE
      // ---------------------------------------------

      if (userId === Number(req.user.id)) {
        return res.status(400).json({
          message:
            "You cannot delete your own account",
        });
      }

      // ---------------------------------------------
      // GET TARGET USER
      // ---------------------------------------------

      const targetUser = await db.query(
        `SELECT id, name, email, role
         FROM users
         WHERE id = $1`,
        [userId]
      );

      if (targetUser.rows.length === 0) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      const user = targetUser.rows[0];

      // ---------------------------------------------
      // ONLY STAFF CAN BE DELETED
      // ---------------------------------------------

      if (user.role !== "staff") {
        return res.status(403).json({
          message:
            "Only staff accounts can be deleted here",
        });
      }

      // ---------------------------------------------
      // DELETE STAFF
      // ---------------------------------------------

      await db.query(
        `DELETE FROM users
         WHERE id = $1`,
        [userId]
      );

      // ---------------------------------------------
      // AUDIT LOG
      // ---------------------------------------------

      await logAction({
        userId: req.user.id,
        action: "DELETE",
        entity: "STAFF",
        entityId: userId,
        description:
          `Deleted staff account for ${user.name}`,
      });

      console.log(
        `AUDIT: Staff ${user.name} deleted by user ${req.user.id}`
      );

      // ---------------------------------------------
      // RESPONSE
      // ---------------------------------------------

      res.json({
        message:
          "Staff account deleted successfully",
      });
    } catch (error) {
      console.error(
        "DELETE STAFF ERROR:",
        error
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

module.exports = router;