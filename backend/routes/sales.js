const express = require("express");
const db = require("../config/db");
const authMiddleware = require("../middleware/auth");
const logAction = require("../utils/auditLog");

const router = express.Router();

// =====================================================
// CREATE SALE WITH MULTIPLE PRODUCTS
// =====================================================

router.post(
  "/",
  authMiddleware,
  async (req, res) => {
    const client = await db.connect();

    try {
      const {
        customer_id,
        items,
      } = req.body;

      // -------------------------------------------------
      // VALIDATE REQUEST
      // -------------------------------------------------

      if (!customer_id) {
        return res.status(400).json({
          message: "Customer is required",
        });
      }

      if (
        !Array.isArray(items) ||
        items.length === 0
      ) {
        return res.status(400).json({
          message:
            "At least one product is required",
        });
      }

      await client.query("BEGIN");

      // -------------------------------------------------
      // CHECK CUSTOMER
      // -------------------------------------------------

      const customerResult =
        await client.query(
          `SELECT *
           FROM customers
           WHERE id = $1`,
          [customer_id]
        );

      if (customerResult.rows.length === 0) {
        await client.query("ROLLBACK");

        return res.status(404).json({
          message: "Customer not found",
        });
      }

      const customer =
        customerResult.rows[0];

      // -------------------------------------------------
      // CREATE EMPTY SALE FIRST
      // -------------------------------------------------

      const saleResult =
        await client.query(
          `INSERT INTO sales
           (
             product_id,
             quantity,
             unit_price,
             total_amount,
             sold_by,
             customer_id
           )
           VALUES
           (
             $1,
             $2,
             $3,
             $4,
             $5,
             $6
           )
           RETURNING *`,
          [
            items[0].product_id,
            items[0].quantity,
            0,
            0,
            req.user.id,
            customer_id,
          ]
        );

      const sale = saleResult.rows[0];

      let grandTotal = 0;

      // Used for the audit description
      const soldProducts = [];

      // -------------------------------------------------
      // PROCESS EVERY PRODUCT
      // -------------------------------------------------

      for (const item of items) {
        const productId =
          Number(item.product_id);

        const quantity =
          Number(item.quantity);

        if (
          !productId ||
          !quantity ||
          quantity <= 0
        ) {
          await client.query("ROLLBACK");

          return res.status(400).json({
            message:
              "Each product must have a valid product and quantity",
          });
        }

        // -----------------------------------------------
        // GET PRODUCT + LOCK ROW
        // -----------------------------------------------

        const productResult =
          await client.query(
            `SELECT *
             FROM products
             WHERE id = $1
             FOR UPDATE`,
            [productId]
          );

        if (
          productResult.rows.length === 0
        ) {
          await client.query("ROLLBACK");

          return res.status(404).json({
            message:
              `Product with ID ${productId} not found`,
          });
        }

        const product =
          productResult.rows[0];

        // -----------------------------------------------
        // CHECK STOCK
        // -----------------------------------------------

        if (
          Number(
            product.stock_quantity
          ) < quantity
        ) {
          await client.query("ROLLBACK");

          return res.status(400).json({
            message:
              `Insufficient stock for ${product.name}. ` +
              `Available: ${product.stock_quantity}`,
          });
        }

        // -----------------------------------------------
        // CALCULATE ITEM TOTAL
        // -----------------------------------------------

        const unitPrice =
          Number(product.price);

        const itemTotal =
          unitPrice * quantity;

        grandTotal += itemTotal;

        // Keep product information for audit log
        soldProducts.push(
          `${product.name} x${quantity}`
        );

        // -----------------------------------------------
        // INSERT SALE ITEM
        // -----------------------------------------------

        await client.query(
          `INSERT INTO sale_items
           (
             sale_id,
             product_id,
             quantity,
             unit_price,
             total_amount
           )
           VALUES
           ($1, $2, $3, $4, $5)`,
          [
            sale.id,
            productId,
            quantity,
            unitPrice,
            itemTotal,
          ]
        );

        // -----------------------------------------------
        // REDUCE STOCK
        // -----------------------------------------------

        await client.query(
          `UPDATE products
           SET stock_quantity =
             stock_quantity - $1
           WHERE id = $2`,
          [
            quantity,
            productId,
          ]
        );
      }

      // -------------------------------------------------
      // UPDATE MAIN SALE
      // -------------------------------------------------

      const firstItem = items[0];

      await client.query(
        `UPDATE sales
         SET
           product_id = $1,
           quantity = $2,
           unit_price = $3,
           total_amount = $4
         WHERE id = $5`,
        [
          firstItem.product_id,
          firstItem.quantity,
          Number(
            (
              grandTotal /
              items.reduce(
                (sum, item) =>
                  sum +
                  Number(
                    item.quantity
                  ),
                0
              )
            ).toFixed(2)
          ),
          grandTotal,
          sale.id,
        ]
      );

      // -------------------------------------------------
      // COMMIT
      // -------------------------------------------------

      await client.query("COMMIT");

      // -------------------------------------------------
      // RETURN CREATED SALE
      // -------------------------------------------------

      const finalSaleResult =
        await client.query(
          `SELECT
             sales.id,
             sales.customer_id,
             customers.name AS customer_name,
             sales.total_amount,
             sales.created_at
           FROM sales
           JOIN customers
             ON customers.id =
                sales.customer_id
           WHERE sales.id = $1`,
          [sale.id]
        );

      const finalSale =
        finalSaleResult.rows[0];

      // -------------------------------------------------
      // AUDIT LOG
      // -------------------------------------------------

      await logAction({
        userId: req.user.id,
        action: "CREATE",
        entity: "SALE",
        entityId: sale.id,
        description:
          `Recorded sale #${sale.id} for ${customer.name}. ` +
          `Products: ${soldProducts.join(", ")}. ` +
          `Total: KSh ${Number(
            grandTotal
          ).toLocaleString("en-KE", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
      });

      console.log(
        `AUDIT: Sale #${sale.id} recorded by user ${req.user.id}`
      );

      // -------------------------------------------------
      // RESPONSE
      // -------------------------------------------------

      res.status(201).json({
        message:
          "Sale recorded successfully",
        sale: finalSale,
      });
    } catch (error) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error(
          "ROLLBACK ERROR:",
          rollbackError
        );
      }

      console.error(
        "CREATE SALE ERROR:",
        error
      );

      res.status(500).json({
        message: "Server error",
      });
    } finally {
      client.release();
    }
  }
);

// =====================================================
// GET ALL SALES
// =====================================================

router.get(
  "/",
  authMiddleware,
  async (req, res) => {
    try {
      const result = await db.query(
        `SELECT
           sales.id,
           sales.customer_id,
           customers.name AS customer_name,
           sales.total_amount,
           sales.sold_by,
           sales.created_at
         FROM sales
         JOIN customers
           ON customers.id =
              sales.customer_id
         ORDER BY sales.id DESC`
      );

      res.json({
        sales: result.rows,
      });
    } catch (error) {
      console.error(
        "GET SALES ERROR:",
        error
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

// =====================================================
// GET ONE SALE WITH ALL ITEMS
// =====================================================

router.get(
  "/:id",
  authMiddleware,
  async (req, res) => {
    try {
      const saleId =
        Number(req.params.id);

      // -----------------------------------------------
      // SALE
      // -----------------------------------------------

      const saleResult =
        await db.query(
          `SELECT
             sales.id,
             sales.customer_id,
             customers.name AS customer_name,
             customers.phone AS customer_phone,
             customers.email AS customer_email,
             sales.total_amount,
             sales.sold_by,
             sales.created_at
           FROM sales
           JOIN customers
             ON customers.id =
                sales.customer_id
           WHERE sales.id = $1`,
          [saleId]
        );

      if (
        saleResult.rows.length === 0
      ) {
        return res.status(404).json({
          message: "Sale not found",
        });
      }

      // -----------------------------------------------
      // ITEMS
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

      res.json({
        sale: saleResult.rows[0],
        items: itemsResult.rows,
      });
    } catch (error) {
      console.error(
        "GET SALE ERROR:",
        error
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

module.exports = router;