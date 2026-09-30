import { useEffect, useState } from "react";

function Sales() {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [productId, setProductId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [quantity, setQuantity] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(null);
  const [error, setError] = useState("");

  const fetchSales = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:5000/api/sales",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch sales"
        );
      }

      setSales(data.sales);
    } catch (error) {
      setError(error.message);
    }
  };

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:5000/api/products",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch products"
        );
      }

      setProducts(data.products);
    } catch (error) {
      setError(error.message);
    }
  };

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:5000/api/customers",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch customers"
        );
      }

      setCustomers(data.customers);
    } catch (error) {
      setError(error.message);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchSales(),
        fetchProducts(),
        fetchCustomers(),
      ]);

      setLoading(false);
    };

    loadData();
  }, []);

  const handleRecordSale = async (e) => {
    e.preventDefault();

    setSaving(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:5000/api/sales",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            product_id: Number(productId),
            quantity: Number(quantity),
            customer_id: Number(customerId),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to record sale"
        );
      }

      setProductId("");
      setCustomerId("");
      setQuantity("");
      setShowForm(false);

      await fetchSales();
      await fetchProducts();
    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleInvoice = async (saleId) => {
    setInvoiceLoading(saleId);
    setError("");

    try {
      const token = localStorage.getItem("token");

      // Create invoice if it doesn't exist
      const createResponse = await fetch(
        `http://localhost:5000/api/invoices/sale/${saleId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const createData =
        await createResponse.json();

      if (
        !createResponse.ok &&
        createResponse.status !== 409
      ) {
        throw new Error(
          createData.message ||
            "Failed to create invoice"
        );
      }

      // Fetch complete invoice
      const invoiceResponse = await fetch(
        `http://localhost:5000/api/invoices/sale/${saleId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
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

      const printWindow =
        window.open(
          "",
          "_blank",
          "width=800,height=900"
        );

      if (!printWindow) {
        throw new Error(
          "Please allow pop-ups to print the invoice."
        );
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${invoice.invoice_number}</title>

          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 40px;
              color: #111827;
            }

            .invoice {
              max-width: 700px;
              margin: auto;
            }

            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #111827;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }

            .brand h1 {
              margin: 0;
              font-size: 30px;
            }

            .brand p {
              margin: 5px 0 0;
              color: #6b7280;
            }

            .invoice-info {
              text-align: right;
            }

            .invoice-info h2 {
              margin: 0 0 8px;
            }

            .invoice-info p {
              margin: 4px 0;
              color: #4b5563;
            }

            .customer {
              margin-bottom: 30px;
            }

            .customer h3 {
              margin-bottom: 8px;
            }

            .customer p {
              margin: 4px 0;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }

            th,
            td {
              padding: 12px;
              border-bottom: 1px solid #e5e7eb;
              text-align: left;
            }

            th {
              background: #f3f4f6;
            }

            .total {
              margin-top: 25px;
              display: flex;
              justify-content: flex-end;
            }

            .total-box {
              width: 250px;
              padding: 15px;
              background: #f3f4f6;
              border-radius: 8px;
            }

            .total-row {
              display: flex;
              justify-content: space-between;
              font-size: 18px;
              font-weight: bold;
            }

            .footer {
              margin-top: 50px;
              text-align: center;
              color: #6b7280;
              font-size: 13px;
            }

            @media print {
              body {
                padding: 20px;
              }
            }
          </style>
        </head>

        <body>

          <div class="invoice">

            <div class="header">

              <div class="brand">
                <h1>BizManager</h1>
                <p>Business Suite</p>
              </div>

              <div class="invoice-info">
                <h2>INVOICE</h2>
                <p>
                  <strong>
                    ${invoice.invoice_number}
                  </strong>
                </p>
                <p>
                  ${new Date(
                    invoice.created_at
                  ).toLocaleString()}
                </p>
              </div>

            </div>

            <div class="customer">

              <h3>Bill To</h3>

              <p>
                <strong>
                  ${invoice.customer_name}
                </strong>
              </p>

              ${
                invoice.customer_phone
                  ? `<p>${invoice.customer_phone}</p>`
                  : ""
              }

              ${
                invoice.customer_email
                  ? `<p>${invoice.customer_email}</p>`
                  : ""
              }

            </div>

            <table>

              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>

              <tbody>

                <tr>
                  <td>
                    ${invoice.product_name}
                  </td>

                  <td>
                    ${invoice.quantity}
                  </td>

                  <td>
                    KSh ${Number(
                      invoice.unit_price
                    ).toLocaleString()}
                  </td>

                  <td>
                    KSh ${Number(
                      invoice.total_amount
                    ).toLocaleString()}
                  </td>
                </tr>

              </tbody>

            </table>

            <div class="total">

              <div class="total-box">

                <div class="total-row">
                  <span>Total</span>

                  <span>
                    KSh ${Number(
                      invoice.total_amount
                    ).toLocaleString()}
                  </span>
                </div>

              </div>

            </div>

            <div class="footer">
              <p>Thank you for your business!</p>
              <p>Generated by BizManager</p>
            </div>

          </div>

          <script>
            window.onload = function() {
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

  if (loading) {
    return <p>Loading sales...</p>;
  }

  return (
    <div className="sales-section">

      <div className="sales-header">

        <div>
          <h2>Sales</h2>

          <p>
            Manage your business sales.
          </p>
        </div>

        <button
          className="add-product-btn"
          onClick={() =>
            setShowForm(!showForm)
          }
        >
          {showForm
            ? "Cancel"
            : "+ Record Sale"}
        </button>

      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {showForm && (
        <form
          className="product-form"
          onSubmit={handleRecordSale}
        >

          <h3>
            Record New Sale
          </h3>

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

          <label>
            Product
          </label>

          <select
            value={productId}
            onChange={(e) =>
              setProductId(e.target.value)
            }
            required
          >

            <option value="">
              Select a product
            </option>

            {products
              .filter(
                (product) =>
                  product.stock_quantity > 0
              )
              .map(
                (product) => (
                  <option
                    key={product.id}
                    value={product.id}
                  >
                    {product.name} — KSh{" "}
                    {Number(
                      product.price
                    ).toLocaleString()}{" "}
                    — Stock:{" "}
                    {product.stock_quantity}
                  </option>
                )
              )}

          </select>

          <label>
            Quantity
          </label>

          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) =>
              setQuantity(e.target.value)
            }
            placeholder="Enter quantity"
            required
          />

          <button
            type="submit"
            disabled={saving}
          >
            {saving
              ? "Recording..."
              : "Record Sale"}
          </button>

        </form>
      )}

      {sales.length === 0 ? (
        <div className="empty-sales">

          <h3>
            No sales yet
          </h3>

          <p>
            Your recorded sales
            will appear here.
          </p>

        </div>
      ) : (

        <div className="sales-table-container">

          <table className="sales-table">

            <thead>

              <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>Product</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
                <th>Date</th>
                <th>Invoice</th>
              </tr>

            </thead>

            <tbody>

              {sales.map(
                (sale) => (
                  <tr key={sale.id}>

                    <td>
                      #{sale.id}
                    </td>

                    <td>
                      {sale.customer_name}
                    </td>

                    <td>
                      {sale.product_name}
                    </td>

                    <td>
                      {sale.quantity}
                    </td>

                    <td>
                      KSh{" "}
                      {Number(
                        sale.unit_price
                      ).toLocaleString()}
                    </td>

                    <td>
                      <strong>
                        KSh{" "}
                        {Number(
                          sale.total_amount
                        ).toLocaleString()}
                      </strong>
                    </td>

                    <td>
                      {new Date(
                        sale.created_at
                      ).toLocaleString()}
                    </td>

                    <td>

                      <button
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

export default Sales;