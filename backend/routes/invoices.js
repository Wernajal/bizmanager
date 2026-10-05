const express = require("express");
const db = require("../config/db");
const authMiddleware = require("../middleware/auth");
const logAction = require("../utils/auditLog");

const router = express.Router();

// =====================================================
// CREATE INVOICE FOR SALE
// =====================================================

router.post(
  "/sale/:saleId",
  authMiddleware,
  async (req, res) => {
    try {
      const saleId = Number(req.params.saleId);

      if (!saleId) {
        return res.status(400).json({
          message: "Invalid sale ID",
        });
      }

      // -----------------------------------------------
      // CHECK SALE EXISTS
      // -----------------------------------------------

      const saleResult = await db.query(
        `SELECT
           sales.id,
           sales.total_amount,
           customers.name AS customer_name
         FROM sales
         JOIN customers
           ON customers.id = sales.customer_id
         WHERE sales.id = $1`,
        [saleId]
      );

      if (saleResult.rows.length === 0) {
        return res.status(404).json({
          message: "Sale not found",
        });
      }

      const sale = saleResult.rows[0];

      // -----------------------------------------------
      // CHECK IF INVOICE ALREADY EXISTS
      // -----------------------------------------------

      const existingInvoice =
        await db.query(
          `SELECT *
           FROM invoices
           WHERE sale_id = $1`,
          [saleId]
        );

      if (existingInvoice.rows.length > 0) {
        return res.status(409).json({
          message: "Invoice already exists",
          invoice:
            existingInvoice.rows[0],
        });
      }

      // -----------------------------------------------
      // GENERATE INVOICE NUMBER
      // -----------------------------------------------

      const invoiceNumber =
        `INV-${Date.now()}-${saleId}`;

      // -----------------------------------------------
      // CREATE INVOICE
      // -----------------------------------------------

      const invoiceResult =
        await db.query(
          `INSERT INTO invoices
           (
             invoice_number,
             sale_id
           )
           VALUES
           ($1, $2)
           RETURNING *`,
          [
            invoiceNumber,
            saleId,
          ]
        );

      const invoice =
        invoiceResult.rows[0];

      // -----------------------------------------------
      // AUDIT LOG
      // -----------------------------------------------

      await logAction({
        userId: req.user.id,
        action: "CREATE",
        entity: "INVOICE",
        entityId: invoice.id,
        description:
          `Created invoice ${invoice.invoice_number} ` +
          `for sale #${saleId} ` +
          `for ${sale.customer_name}. ` +
          `Total: KSh ${Number(
            sale.total_amount || 0
          ).toLocaleString("en-KE", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
      });

      console.log(
        `AUDIT: Invoice ${invoice.invoice_number} created by user ${req.user.id}`
      );

      // -----------------------------------------------
      // RESPONSE
      // -----------------------------------------------

      res.status(201).json({
        message:
          "Invoice created successfully",
        invoice,
      });
    } catch (error) {
      console.error(
        "CREATE INVOICE ERROR:",
        error
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

// =====================================================
// GET INVOICE FOR SALE
// =====================================================

router.get(
  "/sale/:saleId",
  authMiddleware,
  async (req, res) => {
    try {
      const saleId =
        Number(req.params.saleId);

      if (!saleId) {
        return res.status(400).json({
          message: "Invalid sale ID",
        });
      }

      // -----------------------------------------------
      // GET INVOICE + SALE + CUSTOMER
      // -----------------------------------------------

      const invoiceResult =
        await db.query(
          `SELECT
             invoices.id,
             invoices.invoice_number,
             invoices.sale_id,
             invoices.created_at,

             sales.customer_id,
             sales.total_amount,
             sales.created_at AS sale_created_at,

             customers.name AS customer_name,
             customers.phone AS customer_phone,
             customers.email AS customer_email

           FROM invoices

           JOIN sales
             ON sales.id =
                invoices.sale_id

           JOIN customers
             ON customers.id =
                sales.customer_id

           WHERE invoices.sale_id = $1`,
          [saleId]
        );

      if (
        invoiceResult.rows.length === 0
      ) {
        return res.status(404).json({
          message: "Invoice not found",
        });
      }

      const invoice =
        invoiceResult.rows[0];

      // -----------------------------------------------
      // GET ALL SALE ITEMS
      // -----------------------------------------------

      const itemsResult =
        await db.query(
          `SELECT
             sale_items.id,
             sale_items.product_id,

             products.name AS product_name,
             products.description,

             sale_items.quantity,
             sale_items.unit_price,
             sale_items.total_amount

           FROM sale_items

           JOIN products
             ON products.id =
                sale_items.product_id

           WHERE sale_items.sale_id = $1

           ORDER BY sale_items.id ASC`,
          [saleId]
        );

      // -----------------------------------------------
      // CALCULATE SUBTOTAL
      // -----------------------------------------------

      const subtotal =
        itemsResult.rows.reduce(
          (sum, item) =>
            sum +
            Number(
              item.total_amount || 0
            ),
          0
        );

      // -----------------------------------------------
      // RETURN COMPLETE INVOICE
      // -----------------------------------------------

      res.json({
        invoice: {
          ...invoice,

          subtotal,

          discount: 0,

          tax: 0,

          grand_total: subtotal,

          items:
            itemsResult.rows,
        },
      });
    } catch (error) {
      console.error(
        "GET INVOICE ERROR:",
        error
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

module.exports = router;