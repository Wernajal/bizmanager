const express = require("express");
const db = require("../config/db");
const authMiddleware = require("../middleware/auth");
const adminMiddleware = require("../middleware/admin");

const router = express.Router();

// =====================================================
// GET BUSINESS SETTINGS
// Staff + Admin can read settings
// Needed for invoices
// =====================================================

router.get(
  "/",
  authMiddleware,
  async (req, res) => {
    try {
      let result = await db.query(
        `SELECT *
         FROM business_settings
         ORDER BY id ASC
         LIMIT 1`
      );

      // Create default settings if none exist
      if (result.rows.length === 0) {
        result = await db.query(
          `INSERT INTO business_settings
           (
             business_name,
             business_subtitle,
             phone,
             email,
             address,
             city,
             country,
             currency,
             invoice_footer
           )
           VALUES
           (
             'BizManager',
             'Business Management Suite',
             '+254 XXX XXX XXX',
             'business@email.com',
             'Your Business Address',
             'Nakuru',
             'Kenya',
             'KSh',
             'Thank you for your business!'
           )
           RETURNING *`
        );
      }

      res.json({
        settings: result.rows[0],
      });
    } catch (error) {
      console.error(
        "GET SETTINGS ERROR:",
        error
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

// =====================================================
// UPDATE BUSINESS SETTINGS
// ADMIN ONLY
// =====================================================

router.put(
  "/",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const {
        business_name,
        business_subtitle,
        phone,
        email,
        address,
        city,
        country,
        tax_number,
        currency,
        invoice_footer,
      } = req.body;

      if (!business_name) {
        return res.status(400).json({
          message: "Business name is required",
        });
      }

      // Check if settings already exist
      const existing = await db.query(
        `SELECT id
         FROM business_settings
         ORDER BY id ASC
         LIMIT 1`
      );

      let result;

      if (existing.rows.length === 0) {
        // -----------------------------------------------
        // CREATE SETTINGS
        // -----------------------------------------------

        result = await db.query(
          `INSERT INTO business_settings
           (
             business_name,
             business_subtitle,
             phone,
             email,
             address,
             city,
             country,
             tax_number,
             currency,
             invoice_footer,
             updated_at
           )
           VALUES
           (
             $1,
             $2,
             $3,
             $4,
             $5,
             $6,
             $7,
             $8,
             $9,
             $10,
             CURRENT_TIMESTAMP
           )
           RETURNING *`,
          [
            business_name,
            business_subtitle || "",
            phone || "",
            email || "",
            address || "",
            city || "",
            country || "Kenya",
            tax_number || "",
            currency || "KSh",
            invoice_footer ||
              "Thank you for your business!",
          ]
        );
      } else {
        // -----------------------------------------------
        // UPDATE SETTINGS
        // -----------------------------------------------

        result = await db.query(
          `UPDATE business_settings
           SET
             business_name = $1,
             business_subtitle = $2,
             phone = $3,
             email = $4,
             address = $5,
             city = $6,
             country = $7,
             tax_number = $8,
             currency = $9,
             invoice_footer = $10,
             updated_at = CURRENT_TIMESTAMP
           WHERE id = $11
           RETURNING *`,
          [
            business_name,
            business_subtitle || "",
            phone || "",
            email || "",
            address || "",
            city || "",
            country || "Kenya",
            tax_number || "",
            currency || "KSh",
            invoice_footer ||
              "Thank you for your business!",
            existing.rows[0].id,
          ]
        );
      }

      res.json({
        message: "Business settings saved successfully",
        settings: result.rows[0],
      });
    } catch (error) {
      console.error(
        "UPDATE SETTINGS ERROR:",
        error
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

module.exports = router;