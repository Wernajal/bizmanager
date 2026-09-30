const express = require("express");
const db = require("../config/db");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// Generate invoice for a sale
router.post(
  "/sale/:saleId",
  authMiddleware,
  async (req, res) => {
    try {
      const { saleId } = req.params;

      // Check if sale exists
      const saleResult = await db.query(
        `SELECT
          sales.id,
          sales.product_id,
          products.name AS product_name,
          sales.customer_id,
          customers.name AS customer_name,
          customers.phone AS customer_phone,
          customers.email AS customer_email,
          sales.quantity,
          sales.unit_price,
          sales.total_amount,
          sales.sold_by,
          sales.created_at
         FROM sales
         JOIN products
           ON products.id = sales.product_id
         JOIN customers
           ON customers.id = sales.customer_id
         WHERE sales.id = $1`,
        [saleId]
      );

      if (saleResult.rows.length === 0) {
        return res.status(404).json({
          message: "Sale not found"
        });
      }

      const sale = saleResult.rows[0];

      // Check if invoice already exists
      const existingInvoice =
        await db.query(
          `SELECT *
           FROM invoices
           WHERE sale_id = $1`,
          [saleId]
        );

      if (existingInvoice.rows.length > 0) {
        return res.json({
          message: "Invoice already exists",
          invoice: existingInvoice.rows[0]
        });
      }

      // Generate invoice number
      const invoiceNumber =
        `INV-${Date.now()}-${sale.id}`;

      // Create invoice
      const invoiceResult =
        await db.query(
          `INSERT INTO invoices
           (invoice_number, sale_id)
           VALUES ($1, $2)
           RETURNING *`,
          [
            invoiceNumber,
            sale.id
          ]
        );

      res.status(201).json({
        message: "Invoice created successfully",
        invoice: {
          ...invoiceResult.rows[0],
          sale
        }
      });

    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Server error"
      });
    }
  }
);

// Get invoice by sale ID
router.get(
  "/sale/:saleId",
  authMiddleware,
  async (req, res) => {
    try {
      const { saleId } = req.params;

      const result = await db.query(
        `SELECT
          invoices.id,
          invoices.invoice_number,
          invoices.sale_id,
          invoices.created_at,

          sales.product_id,
          products.name AS product_name,

          sales.customer_id,
          customers.name AS customer_name,
          customers.phone AS customer_phone,
          customers.email AS customer_email,

          sales.quantity,
          sales.unit_price,
          sales.total_amount,

          sales.sold_by,
          sales.created_at AS sale_date

         FROM invoices

         JOIN sales
           ON sales.id = invoices.sale_id

         JOIN products
           ON products.id = sales.product_id

         JOIN customers
           ON customers.id = sales.customer_id

         WHERE invoices.sale_id = $1`,
        [saleId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "Invoice not found"
        });
      }

      res.json({
        invoice: result.rows[0]
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