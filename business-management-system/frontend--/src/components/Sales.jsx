import { useEffect, useState } from "react";

function Sales() {
  // =================================================
  // SALES DATA
  // =================================================

  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);

  // =================================================
  // SALE FORM
  // =================================================

  const [showForm, setShowForm] = useState(false);
  const [customerId, setCustomerId] = useState("");

  // =================================================
  // MULTIPLE SALE ITEMS
  // =================================================

  const [saleItems, setSaleItems] = useState([
    {
      product_id: "",
      quantity: 1,
    },
  ]);

  // =================================================
  // UI STATE
  // =================================================

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [invoiceLoading, setInvoiceLoading] =
    useState(null);

  const [error, setError] = useState("");

  // =================================================
  // TOKEN
  // =================================================

  const getToken = () => {
    return localStorage.getItem("token");
  };

  // =================================================
  // FETCH SALES
  // =================================================

  const fetchSales = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/sales",
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to fetch sales"
        );
      }

      setSales(data.sales || []);
    } catch (error) {
      setError(error.message);
    }
  };

  // =================================================
  // FETCH PRODUCTS
  // =================================================

  const fetchProducts = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/products",
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to fetch products"
        );
      }

      setProducts(data.products || []);
    } catch (error) {
      setError(error.message);
    }
  };

  // =================================================
  // FETCH CUSTOMERS
  // =================================================

  const fetchCustomers = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/customers",
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to fetch customers"
        );
      }

      setCustomers(
        data.customers || []
      );
    } catch (error) {
      setError(error.message);
    }
  };

  // =================================================
  // LOAD ALL DATA
  // =================================================

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError("");

      await Promise.all([
        fetchSales(),
        fetchProducts(),
        fetchCustomers(),
      ]);

      setLoading(false);
    };

    loadData();
  }, []);

  // =================================================
  // UPDATE SALE ITEM
  // =================================================

  const updateSaleItem = (
    index,
    field,
    value
  ) => {
    setSaleItems((previousItems) => {
      const updatedItems = [
        ...previousItems,
      ];

      updatedItems[index] = {
        ...updatedItems[index],
        [field]: value,
      };

      return updatedItems;
    });
  };

  // =================================================
  // ADD ANOTHER PRODUCT
  // =================================================

  const addSaleItem = () => {
    setSaleItems((previousItems) => [
      ...previousItems,
      {
        product_id: "",
        quantity: 1,
      },
    ]);
  };

  // =================================================
  // REMOVE PRODUCT
  // =================================================

  const removeSaleItem = (index) => {
    setSaleItems((previousItems) => {
      if (previousItems.length === 1) {
        return previousItems;
      }

      return previousItems.filter(
        (_, itemIndex) =>
          itemIndex !== index
      );
    });
  };

  // =================================================
  // GET PRODUCT
  // =================================================

  const getProduct = (productId) => {
    return products.find(
      (product) =>
        Number(product.id) ===
        Number(productId)
    );
  };

  // =================================================
  // CALCULATE TOTAL
  // =================================================

  const calculateSaleTotal = () => {
    return saleItems.reduce(
      (total, item) => {
        const product = getProduct(
          item.product_id
        );

        if (!product) {
          return total;
        }

        const quantity =
          Number(item.quantity) || 0;

        const price =
          Number(product.price) || 0;

        return (
          total +
          price * quantity
        );
      },
      0
    );
  };

  // =================================================
  // RECORD MULTI-PRODUCT SALE
  // =================================================

  const handleRecordSale = async (e) => {
    e.preventDefault();

    setSaving(true);
    setError("");

    try {
      // ---------------------------------------------
      // VALIDATE CUSTOMER
      // ---------------------------------------------

      if (!customerId) {
        throw new Error(
          "Please select a customer."
        );
      }

      // ---------------------------------------------
      // VALIDATE PRODUCTS
      // ---------------------------------------------

      const validItems =
        saleItems.filter(
          (item) =>
            item.product_id &&
            Number(item.quantity) > 0
        );

      if (validItems.length === 0) {
        throw new Error(
          "Please add at least one product."
        );
      }

      // ---------------------------------------------
      // CHECK DUPLICATE PRODUCTS
      // ---------------------------------------------

      const productIds =
        validItems.map(
          (item) =>
            Number(item.product_id)
        );

      const hasDuplicates =
        new Set(productIds).size !==
        productIds.length;

      if (hasDuplicates) {
        throw new Error(
          "You cannot add the same product more than once."
        );
      }

      // ---------------------------------------------
      // CHECK STOCK
      // ---------------------------------------------

      for (const item of validItems) {
        const product = getProduct(
          item.product_id
        );

        if (!product) {
          throw new Error(
            "One of the selected products could not be found."
          );
        }

        if (
          Number(item.quantity) >
          Number(product.stock_quantity)
        ) {
          throw new Error(
            `${product.name} only has ${product.stock_quantity} in stock.`
          );
        }
      }

      // ---------------------------------------------
      // SEND SALE TO BACKEND
      // ---------------------------------------------

      const response = await fetch(
        "http://localhost:5000/api/sales",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${getToken()}`,
          },

          body: JSON.stringify({
            customer_id:
              Number(customerId),

            items: validItems.map(
              (item) => ({
                product_id:
                  Number(
                    item.product_id
                  ),

                quantity:
                  Number(
                    item.quantity
                  ),
              })
            ),
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to record sale"
        );
      }

      // ---------------------------------------------
      // RESET FORM
      // ---------------------------------------------

      setCustomerId("");

      setSaleItems([
        {
          product_id: "",
          quantity: 1,
        },
      ]);

      setShowForm(false);

      // ---------------------------------------------
      // REFRESH DATA
      // ---------------------------------------------

      await fetchSales();
      await fetchProducts();

    } catch (error) {
      setError(error.message);

    } finally {
      setSaving(false);
    }
  };

  // =================================================
  // CREATE / PRINT PROFESSIONAL INVOICE
  // =================================================

  const handleInvoice = async (saleId) => {
    setInvoiceLoading(saleId);
    setError("");

    try {
      const token = getToken();

      // =================================================
      // FETCH LATEST BUSINESS SETTINGS
      // =================================================

      const settingsResponse = await fetch(
        "http://localhost:5000/api/settings",
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      const settingsData =
        await settingsResponse.json();

      if (!settingsResponse.ok) {
        throw new Error(
          settingsData.message ||
            "Failed to load business settings"
        );
      }

      const business =
        settingsData.settings || {};

      // =================================================
      // BUSINESS INFORMATION
      // =================================================

      const businessName =
        business.business_name ||
        "BizManager";

      const businessSubtitle =
        business.business_subtitle ||
        "Business Management Suite";

      const businessPhone =
        business.phone ||
        "";

      const businessEmail =
        business.email ||
        "";

      const businessAddress =
        business.address ||
        "";

      const businessCity =
        business.city ||
        "";

      const businessCountry =
        business.country ||
        "";

      const taxNumber =
        business.tax_number ||
        "";

      const currency =
        business.currency ||
        "KSh";

      const invoiceFooter =
        business.invoice_footer ||
        "Thank you for your business!";

      // =================================================
      // BUILD BUSINESS LOCATION
      // =================================================

      const locationParts = [
        businessAddress,
        businessCity,
        businessCountry,
      ].filter(
        (value) =>
          value &&
          String(value).trim() !== ""
      );

      const businessLocation =
        locationParts.length > 0
          ? locationParts.join(", ")
          : "";

      // =================================================
      // CREATE INVOICE
      // =================================================

      const createResponse = await fetch(
        `http://localhost:5000/api/invoices/sale/${saleId}`,
        {
          method: "POST",

          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      const createData =
        await createResponse.json();

      // 409 means invoice already exists.
      // Continue and fetch the existing invoice.

      if (
        !createResponse.ok &&
        createResponse.status !== 409
      ) {
        throw new Error(
          createData.message ||
            "Failed to create invoice"
        );
      }

      // =================================================
      // FETCH COMPLETE INVOICE
      // =================================================

      const invoiceResponse =
        await fetch(
          `http://localhost:5000/api/invoices/sale/${saleId}`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      const invoiceData =
        await invoiceResponse.json();

      if (!invoiceResponse.ok) {
        throw new Error(
          invoiceData.message ||
            "Failed to fetch invoice"
        );
      }

      const invoice =
        invoiceData.invoice;

      if (!invoice) {
        throw new Error(
          "Invoice data was not returned."
        );
      }

      // =================================================
      // GET ALL SALE ITEMS
      // =================================================

      const items =
        Array.isArray(invoice.items)
          ? invoice.items
          : [];

      if (items.length === 0) {
        throw new Error(
          "This invoice has no products."
        );
      }

      // =================================================
      // CALCULATE SUBTOTAL
      // =================================================

      const subtotal =
        items.reduce(
          (total, item) =>
            total +
            Number(
              item.total_amount || 0
            ),
          0
        );

      // =================================================
      // DISCOUNT
      // =================================================

      const discount =
        Number(invoice.discount) || 0;

      // =================================================
      // TAX / VAT
      // =================================================

      const tax =
        Number(invoice.tax) || 0;

      // =================================================
      // GRAND TOTAL
      // =================================================

      const grandTotal =
        subtotal -
        discount +
        tax;

      // =================================================
      // MONEY FORMATTER
      // =================================================

      const money = (amount) =>
        Number(amount || 0).toLocaleString(
          "en-KE",
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }
        );

      // =================================================
      // DATE FORMATTER
      // =================================================

      const invoiceDate =
        new Date(
          invoice.created_at
        );

      const formattedDate =
        invoiceDate.toLocaleDateString(
          "en-GB",
          {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }
        );

      const dueDate =
        formattedDate;

      // =================================================
      // BUSINESS DETAILS HTML
      // =================================================

      const businessDetailsHtml = `
        ${
          businessLocation
            ? `
              <div>
                ${businessLocation}
              </div>
            `
            : ""
        }

        ${
          businessPhone
            ? `
              <div>
                Phone: ${businessPhone}
              </div>
            `
            : ""
        }

        ${
          businessEmail
            ? `
              <div>
                Email: ${businessEmail}
              </div>
            `
            : ""
        }

        ${
          taxNumber
            ? `
              <div>
                Tax / VAT: ${taxNumber}
              </div>
            `
            : ""
        }
      `;

      // =================================================
      // BUILD INVOICE ITEM ROWS
      // =================================================

      const itemRows =
        items
          .map(
            (item) => `
              <tr>

                <td>

                  <div class="item-name">
                    ${
                      item.product_name ||
                      "Product"
                    }
                  </div>

                  ${
                    item.description
                      ? `
                        <div class="item-description">
                          ${item.description}
                        </div>
                      `
                      : ""
                  }

                </td>

                <td class="center">
                  ${Number(
                    item.quantity
                  )}
                </td>

                <td class="right">
                  ${currency} ${money(
                    item.unit_price
                  )}
                </td>

                <td class="right">
                  ${currency} ${money(
                    item.total_amount
                  )}
                </td>

              </tr>
            `
          )
          .join("");

      // =================================================
      // OPEN PRINT WINDOW
      // =================================================

      const printWindow =
        window.open(
          "",
          "_blank",
          "width=900,height=900"
        );

      if (!printWindow) {
        throw new Error(
          "Please allow pop-ups to print the invoice."
        );
      }

      // =================================================
      // PROFESSIONAL INVOICE HTML
      // =================================================

      printWindow.document.write(`
        <!DOCTYPE html>

        <html>

          <head>

            <meta charset="UTF-8">

            <meta
              name="viewport"
              content="width=device-width, initial-scale=1.0"
            >

            <title>
              Invoice ${invoice.invoice_number}
            </title>

            <style>

              * {
                box-sizing: border-box;
              }

              body {
                margin: 0;
                padding: 30px;

                background: #eef1f5;

                font-family:
                  Arial,
                  Helvetica,
                  sans-serif;

                color: #111827;
              }

              .invoice {
                width: 794px;

                max-width: 100%;

                min-height: 1123px;

                margin: 0 auto;

                background: #ffffff;

                padding: 50px;

                box-shadow:
                  0 8px 30px
                  rgba(
                    0,
                    0,
                    0,
                    0.08
                  );
              }

              /* =====================================
                 HEADER
              ===================================== */

              .header {
                display: flex;

                justify-content:
                  space-between;

                align-items:
                  flex-start;

                gap: 30px;

                padding-bottom: 28px;

                border-bottom:
                  3px solid #111827;
              }

              .business-name {
                margin: 0;

                font-size: 32px;

                font-weight: 800;

                letter-spacing:
                  0.5px;
              }

              .business-subtitle {
                margin:
                  6px 0;

                color: #6b7280;

                font-size: 14px;
              }

              .business-details {
                margin-top: 14px;

                color: #4b5563;

                font-size: 13px;

                line-height: 1.7;
              }

              .invoice-heading {
                text-align: right;

                min-width: 220px;
              }

              .invoice-heading h2 {
                margin:
                  0 0 15px;

                font-size: 34px;

                letter-spacing:
                  2px;
              }

              .invoice-meta {
                font-size: 13px;

                line-height: 1.8;

                color: #4b5563;
              }

              .invoice-meta strong {
                color: #111827;
              }

              /* =====================================
                 PAYMENT STATUS
              ===================================== */

              .status {
                display: inline-block;

                margin-top: 10px;

                padding:
                  6px 13px;

                border-radius: 20px;

                background: #dcfce7;

                color: #166534;

                font-size: 12px;

                font-weight: bold;

                text-transform:
                  uppercase;
              }

              /* =====================================
                 BILL TO / FROM
              ===================================== */

              .parties {
                display: flex;

                justify-content:
                  space-between;

                gap: 40px;

                margin-top: 35px;

                margin-bottom: 35px;
              }

              .party {
                width: 50%;
              }

              .party-label {
                margin:
                  0 0 10px;

                color: #6b7280;

                font-size: 11px;

                font-weight: bold;

                letter-spacing:
                  1.2px;

                text-transform:
                  uppercase;
              }

              .party-name {
                margin:
                  0 0 7px;

                font-size: 16px;

                font-weight: bold;

                color: #111827;
              }

              .party p {
                margin:
                  5px 0;

                color: #4b5563;

                font-size: 13px;
              }

              /* =====================================
                 ITEMS
              ===================================== */

              .items-title {
                margin-bottom: 10px;

                font-size: 14px;

                font-weight: bold;

                color: #111827;
              }

              table {
                width: 100%;

                border-collapse:
                  collapse;
              }

              thead th {
                padding:
                  13px 12px;

                background: #111827;

                color: #ffffff;

                text-align: left;

                font-size: 12px;

                text-transform:
                  uppercase;

                letter-spacing:
                  0.3px;
              }

              tbody td {
                padding:
                  15px 12px;

                border-bottom:
                  1px solid #e5e7eb;

                font-size: 13px;

                color: #374151;

                vertical-align:
                  top;
              }

              .item-name {
                font-weight: 600;

                color: #111827;
              }

              .item-description {
                margin-top: 4px;

                color: #6b7280;

                font-size: 11px;

                line-height: 1.4;
              }

              .right {
                text-align: right;
              }

              .center {
                text-align: center;
              }

              /* =====================================
                 TOTALS
              ===================================== */

              .totals {
                width: 330px;

                margin-left: auto;

                margin-top: 28px;
              }

              .total-row {
                display: flex;

                justify-content:
                  space-between;

                padding:
                  7px 0;

                font-size: 13px;

                color: #4b5563;
              }

              .grand-total {
                display: flex;

                justify-content:
                  space-between;

                margin-top: 10px;

                padding:
                  15px 0;

                border-top:
                  2px solid #111827;

                border-bottom:
                  2px solid #111827;

                font-size: 19px;

                font-weight: 800;

                color: #111827;
              }

              /* =====================================
                 PAYMENT INFORMATION
              ===================================== */

              .payment {
                margin-top: 35px;

                padding: 18px;

                background: #f8fafc;

                border:
                  1px solid #e5e7eb;

                border-radius: 6px;
              }

              .payment-title {
                margin:
                  0 0 12px;

                font-size: 13px;

                font-weight: bold;

                text-transform:
                  uppercase;

                letter-spacing:
                  0.7px;
              }

              .payment-row {
                display: flex;

                justify-content:
                  space-between;

                gap: 20px;

                padding: 5px 0;

                font-size: 13px;
              }

              /* =====================================
                 NOTES
              ===================================== */

              .notes {
                margin-top: 30px;
              }

              .notes h3 {
                margin:
                  0 0 8px;

                font-size: 13px;
              }

              .notes p {
                margin: 0;

                color: #6b7280;

                font-size: 12px;

                line-height: 1.6;
              }

              /* =====================================
                 SIGNATURES
              ===================================== */

              .signatures {
                display: flex;

                justify-content:
                  space-between;

                gap: 50px;

                margin-top: 55px;
              }

              .signature {
                width: 50%;
              }

              .signature-line {
                border-bottom:
                  1px solid #9ca3af;

                height: 35px;
              }

              .signature-label {
                margin-top: 8px;

                color: #6b7280;

                font-size: 11px;
              }

              /* =====================================
                 FOOTER
              ===================================== */

              .footer {
                margin-top: 60px;

                padding-top: 20px;

                border-top:
                  1px solid #e5e7eb;

                text-align: center;

                color: #6b7280;

                font-size: 11px;

                line-height: 1.6;
              }

              .footer strong {
                color: #374151;
              }

              /* =====================================
                 PRINT
              ===================================== */

              @media print {

                body {
                  padding: 0;

                  background: #ffffff;
                }

                .invoice {
                  width: 100%;

                  min-height: auto;

                  padding: 35px;

                  box-shadow: none;
                }

              }

            </style>

          </head>

          <body>

            <div class="invoice">

              <!-- ==================================
                   HEADER
              =================================== -->

              <div class="header">

                <div>

                  <h1 class="business-name">
                    ${businessName}
                  </h1>

                  <p class="business-subtitle">
                    ${businessSubtitle}
                  </p>

                  <div class="business-details">

                    ${businessDetailsHtml}

                  </div>

                </div>

                <div class="invoice-heading">

                  <h2>
                    INVOICE
                  </h2>

                  <div class="invoice-meta">

                    <div>
                      <strong>
                        Invoice #:
                      </strong>

                      ${invoice.invoice_number}
                    </div>

                    <div>
                      <strong>
                        Issue Date:
                      </strong>

                      ${formattedDate}
                    </div>

                    <div>
                      <strong>
                        Due Date:
                      </strong>

                      ${dueDate}
                    </div>

                  </div>

                  <div class="status">
                    PAID
                  </div>

                </div>

              </div>

              <!-- ==================================
                   BILL TO / FROM
              =================================== -->

              <div class="parties">

                <div class="party">

                  <p class="party-label">
                    Bill To
                  </p>

                  <p class="party-name">
                    ${
                      invoice.customer_name ||
                      "Walk-in Customer"
                    }
                  </p>

                  ${
                    invoice.customer_phone
                      ? `
                        <p>
                          ${invoice.customer_phone}
                        </p>
                      `
                      : ""
                  }

                  ${
                    invoice.customer_email
                      ? `
                        <p>
                          ${invoice.customer_email}
                        </p>
                      `
                      : ""
                  }

                </div>

                <div class="party">

                  <p class="party-label">
                    From
                  </p>

                  <p class="party-name">
                    ${businessName}
                  </p>

                  ${
                    businessSubtitle
                      ? `
                        <p>
                          ${businessSubtitle}
                        </p>
                      `
                      : ""
                  }

                  ${
                    businessLocation
                      ? `
                        <p>
                          ${businessLocation}
                        </p>
                      `
                      : ""
                  }

                  ${
                    businessPhone
                      ? `
                        <p>
                          ${businessPhone}
                        </p>
                      `
                      : ""
                  }

                  ${
                    businessEmail
                      ? `
                        <p>
                          ${businessEmail}
                        </p>
                      `
                      : ""
                  }

                  ${
                    taxNumber
                      ? `
                        <p>
                          Tax / VAT:
                          ${taxNumber}
                        </p>
                      `
                      : ""
                  }

                </div>

              </div>

              <!-- ==================================
                   ITEMS TABLE
              =================================== -->

              <div class="items-title">
                Items
              </div>

              <table>

                <thead>

                  <tr>

                    <th>
                      Description
                    </th>

                    <th class="center">
                      Qty
                    </th>

                    <th class="right">
                      Unit Price
                    </th>

                    <th class="right">
                      Amount
                    </th>

                  </tr>

                </thead>

                <tbody>

                  ${itemRows}

                </tbody>

              </table>

              <!-- ==================================
                   TOTALS
              =================================== -->

              <div class="totals">

                <div class="total-row">

                  <span>
                    Subtotal
                  </span>

                  <span>
                    ${currency}
                    ${money(subtotal)}
                  </span>

                </div>

                <div class="total-row">

                  <span>
                    Discount
                  </span>

                  <span>
                    ${currency}
                    ${money(discount)}
                  </span>

                </div>

                <div class="total-row">

                  <span>
                    Tax / VAT
                  </span>

                  <span>
                    ${currency}
                    ${money(tax)}
                  </span>

                </div>

                <div class="grand-total">

                  <span>
                    GRAND TOTAL
                  </span>

                  <span>
                    ${currency}
                    ${money(grandTotal)}
                  </span>

                </div>

              </div>

              <!-- ==================================
                   PAYMENT INFORMATION
              =================================== -->

              <div class="payment">

                <h3 class="payment-title">
                  Payment Information
                </h3>

                <div class="payment-row">

                  <span>
                    Payment Method
                  </span>

                  <strong>
                    Recorded Sale
                  </strong>

                </div>

                <div class="payment-row">

                  <span>
                    Payment Status
                  </span>

                  <strong>
                    Paid
                  </strong>

                </div>

                <div class="payment-row">

                  <span>
                    Amount Paid
                  </span>

                  <strong>
                    ${currency}
                    ${money(grandTotal)}
                  </strong>

                </div>

                <div class="payment-row">

                  <span>
                    Balance Due
                  </span>

                  <strong>
                    ${currency} 0.00
                  </strong>

                </div>

                <div class="payment-row">

                  <span>
                    Transaction Reference
                  </span>

                  <span>
                    —
                  </span>

                </div>

              </div>

              <!-- ==================================
                   NOTES & TERMS
              =================================== -->

              <div class="notes">

                <h3>
                  Notes &amp; Terms
                </h3>

                <p>
                  ${invoiceFooter}
                </p>

              </div>

              <!-- ==================================
                   SIGNATURES
              =================================== -->

              <div class="signatures">

                <div class="signature">

                  <div class="signature-line"></div>

                  <div class="signature-label">
                    Authorized By
                  </div>

                </div>

                <div class="signature">

                  <div class="signature-line"></div>

                  <div class="signature-label">
                    Customer Signature
                  </div>

                </div>

              </div>

              <!-- ==================================
                   FOOTER
              =================================== -->

              <div class="footer">

                <p>
                  <strong>
                    ${invoiceFooter}
                  </strong>
                </p>

                <p>
                  This invoice was generated by
                  ${businessName}.
                </p>

                <p>
                  Invoice:
                  ${invoice.invoice_number}
                </p>

              </div>

            </div>

            <script>

              window.onload = function () {
                window.print();
              };

            </script>

          </body>

        </html>
      `);

      printWindow.document.close();

    } catch (error) {

      setError(error.message);

    } finally {

      setInvoiceLoading(null);
    }
  };

  // =================================================
  // LOADING SCREEN
  // =================================================

  if (loading) {
    return (
      <div className="sales-section">

        <p>
          Loading sales...
        </p>

      </div>
    );
  }

  // =================================================
  // PAGE
  // =================================================

  return (
    <div className="sales-section">

      {/* ============================================
          PAGE HEADER
      ============================================ */}

      <div className="sales-header">

        <div>

          <h2>
            Sales
          </h2>

          <p>
            Manage your business sales.
          </p>

        </div>

        <button
          className="add-product-btn"
          onClick={() => {
            setShowForm(!showForm);
            setError("");
          }}
        >
          {showForm
            ? "Cancel"
            : "+ Record Sale"}
        </button>

      </div>

      {/* ============================================
          ERROR MESSAGE
      ============================================ */}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* ============================================
          SALE FORM
      ============================================ */}

      {showForm && (

        <form
          className="product-form sale-form"
          onSubmit={handleRecordSale}
        >

          <h3>
            Record New Sale
          </h3>

          <p className="form-description">
            Select a customer and add one or more
            products to this sale.
          </p>

          {/* CUSTOMER */}

          <label>
            Customer
          </label>

          <select
            value={customerId}
            onChange={(e) =>
              setCustomerId(e.target.value)
            }
            required
          >

            <option value="">
              Select a customer
            </option>

            {customers.map(
              (customer) => (

                <option
                  key={customer.id}
                  value={customer.id}
                >
                  {customer.name}
                </option>

              )
            )}

          </select>

          {/* PRODUCTS */}

          <div className="sale-products-header">

            <h4>
              Products
            </h4>

            <span>
              {saleItems.length}{" "}
              {saleItems.length === 1
                ? "item"
                : "items"}
            </span>

          </div>

          {/* PRODUCT ROWS */}

          <div className="sale-items-container">

            {saleItems.map(
              (item, index) => {

                const product =
                  getProduct(
                    item.product_id
                  );

                const quantity =
                  Number(
                    item.quantity
                  ) || 0;

                const itemTotal =
                  product
                    ? Number(
                        product.price
                      ) * quantity
                    : 0;

                return (
                  <div
                    className="sale-item-row"
                    key={index}
                  >

                    {/* PRODUCT */}

                    <div className="sale-item-product">

                      <label>
                        Product
                      </label>

                      <select
                        value={
                          item.product_id
                        }
                        onChange={(e) =>
                          updateSaleItem(
                            index,
                            "product_id",
                            e.target.value
                          )
                        }
                        required
                      >

                        <option value="">
                          Select product
                        </option>

                        {products
                          .filter(
                            (productOption) =>
                              Number(
                                productOption.stock_quantity
                              ) > 0
                          )
                          .map(
                            (
                              productOption
                            ) => (

                              <option
                                key={
                                  productOption.id
                                }
                                value={
                                  productOption.id
                                }
                              >

                                {
                                  productOption.name
                                }

                                {" — "}

                                {currencySafe(
                                  productOption.price
                                )}

                                {" — Stock: "}

                                {
                                  productOption.stock_quantity
                                }

                              </option>

                            )
                          )}

                      </select>

                    </div>

                    {/* QUANTITY */}

                    <div className="sale-item-quantity">

                      <label>
                        Qty
                      </label>

                      <input
                        type="number"
                        min="1"
                        max={
                          product
                            ? product.stock_quantity
                            : undefined
                        }
                        value={
                          item.quantity
                        }
                        onChange={(e) =>
                          updateSaleItem(
                            index,
                            "quantity",
                            e.target.value
                          )
                        }
                        required
                      />

                    </div>

                    {/* ITEM TOTAL */}

                    <div className="sale-item-total">

                      <label>
                        Amount
                      </label>

                      <strong>
                        KSh{" "}

                        {itemTotal.toLocaleString(
                          "en-KE",
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}

                      </strong>

                    </div>

                    {/* REMOVE */}

                    <button
                      type="button"
                      className="remove-sale-item"
                      onClick={() =>
                        removeSaleItem(
                          index
                        )
                      }
                      disabled={
                        saleItems.length === 1
                      }
                      title="Remove product"
                    >
                      🗑️
                    </button>

                  </div>
                );
              }
            )}

          </div>

          {/* ADD PRODUCT */}

          <button
            type="button"
            className="add-sale-item-btn"
            onClick={addSaleItem}
          >
            + Add Another Product
          </button>

          {/* SALE TOTAL */}

          <div className="sale-total-box">

            <span>
              Total
            </span>

            <strong>
              KSh{" "}

              {calculateSaleTotal().toLocaleString(
                "en-KE",
                {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }
              )}

            </strong>

          </div>

          {/* SUBMIT */}

          <button
            type="submit"
            className="record-sale-btn"
            disabled={saving}
          >

            {saving
              ? "Recording Sale..."
              : "Record Sale"}

          </button>

        </form>
      )}

      {/* ============================================
          SALES TABLE
      ============================================ */}

      {sales.length === 0 ? (

        <div className="empty-sales">

          <h3>
            No sales yet
          </h3>

          <p>
            Your recorded sales will
            appear here.
          </p>

        </div>

      ) : (

        <div className="sales-table-container">

          <table className="sales-table">

            <thead>

              <tr>

                <th>
                  ID
                </th>

                <th>
                  Customer
                </th>

                <th>
                  Total
                </th>

                <th>
                  Date
                </th>

                <th>
                  Invoice
                </th>

              </tr>

            </thead>

            <tbody>

              {sales.map(
                (sale) => (

                  <tr
                    key={sale.id}
                  >

                    <td>
                      #{sale.id}
                    </td>

                    <td>
                      {sale.customer_name ||
                        "Unknown Customer"}
                    </td>

                    <td>

                      <strong>
                        KSh{" "}

                        {Number(
                          sale.total_amount ||
                            0
                        ).toLocaleString(
                          "en-KE",
                          {
                            minimumFractionDigits:
                              2,

                            maximumFractionDigits:
                              2,
                          }
                        )}

                      </strong>

                    </td>

                    <td>

                      {new Date(
                        sale.created_at
                      ).toLocaleString(
                        "en-KE",
                        {
                          dateStyle:
                            "medium",

                          timeStyle:
                            "short",
                        }
                      )}

                    </td>

                    <td>

                      <button
                        type="button"
                        className="invoice-btn"
                        onClick={() =>
                          handleInvoice(
                            sale.id
                          )
                        }
                        disabled={
                          invoiceLoading ===
                          sale.id
                        }
                      >

                        {invoiceLoading ===
                        sale.id
                          ? "Loading..."
                          : "🧾 Invoice"}

                      </button>

                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

        </div>

      )}

    </div>
  );
}

// =================================================
// HELPER
// =================================================

function currencySafe(price) {
  return `KSh ${Number(
    price || 0
  ).toLocaleString("en-KE")}`;
}

export default Sales;