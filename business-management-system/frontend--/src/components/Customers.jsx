import { useEffect, useState } from "react";

function Customers() {
  const [customers, setCustomers] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [purchaseSummary, setPurchaseSummary] = useState({
    totalPurchases: 0,
    orderCount: 0,
  });

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const resetForm = () => {
    setName("");
    setPhone("");
    setEmail("");
    setEditingCustomer(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      const url = editingCustomer
        ? `http://localhost:5000/api/customers/${editingCustomer.id}`
        : "http://localhost:5000/api/customers";

      const method = editingCustomer ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          phone,
          email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            `Failed to ${
              editingCustomer ? "update" : "create"
            } customer`
        );
      }

      resetForm();
      await fetchCustomers();
    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);

    setName(customer.name);
    setPhone(customer.phone || "");
    setEmail(customer.email || "");

    setShowForm(true);
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this customer?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:5000/api/customers/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to delete customer"
        );
      }

      if (selectedCustomer?.id === id) {
        setSelectedCustomer(null);
        setPurchaseHistory([]);
      }

      await fetchCustomers();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleViewHistory = async (customer) => {
    setSelectedCustomer(customer);
    setHistoryLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:5000/api/customers/${customer.id}/sales`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch purchase history"
        );
      }

      setPurchaseHistory(data.purchases);
      setPurchaseSummary(data.summary);
    } catch (error) {
      setError(error.message);
    } finally {
      setHistoryLoading(false);
    }
  };

  const closeHistory = () => {
    setSelectedCustomer(null);
    setPurchaseHistory([]);
    setPurchaseSummary({
      totalPurchases: 0,
      orderCount: 0,
    });
  };

  if (loading) {
    return <p>Loading customers...</p>;
  }

  return (
    <div className="customers-section">

      {/* CUSTOMER LIST */}
      {!selectedCustomer && (
        <>
          <div className="products-header">
            <div>
              <h2>Customers</h2>
              <p>Manage your business customers.</p>
            </div>

            <button
              className="add-product-btn"
              onClick={() => {
                if (showForm) {
                  resetForm();
                } else {
                  setShowForm(true);
                }
              }}
            >
              {showForm ? "Cancel" : "+ Add Customer"}
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
              onSubmit={handleSubmit}
            >
              <h3>
                {editingCustomer
                  ? "Edit Customer"
                  : "Add New Customer"}
              </h3>

              <label>Customer Name</label>

              <input
                type="text"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                required
              />

              <label>Phone</label>

              <input
                type="tel"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value)
                }
              />

              <label>Email</label>

              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
              />

              <button
                type="submit"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingCustomer
                  ? "Update Customer"
                  : "Save Customer"}
              </button>
            </form>
          )}

          {customers.length === 0 ? (
            <div className="empty-products">
              <h3>No customers yet</h3>

              <p>
                Add your first customer to get started.
              </p>
            </div>
          ) : (
            <div className="products-grid">
              {customers.map((customer) => (
                <div
                  className="product-card"
                  key={customer.id}
                >
                  <div className="avatar">
                    {customer.name
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <h3>{customer.name}</h3>

                  <p>
                    📞 {customer.phone || "No phone"}
                  </p>

                  <p>
                    ✉️ {customer.email || "No email"}
                  </p>

                  <div className="product-actions">
                    <button
                      className="edit-btn"
                      onClick={() =>
                        handleEdit(customer)
                      }
                    >
                      Edit
                    </button>

                    <button
                      className="delete-btn"
                      onClick={() =>
                        handleDelete(customer.id)
                      }
                    >
                      Delete
                    </button>

                    <button
                      className="view-btn"
                      onClick={() =>
                        handleViewHistory(customer)
                      }
                    >
                      View History
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* CUSTOMER PROFILE */}
      {selectedCustomer && (
        <div className="customer-profile">

          <button
            className="back-btn"
            onClick={closeHistory}
          >
            ← Back to Customers
          </button>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="customer-profile-header">
            <div className="avatar large-avatar">
              {selectedCustomer.name
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <h2>{selectedCustomer.name}</h2>

              <p>
                📞{" "}
                {selectedCustomer.phone ||
                  "No phone"}
              </p>

              <p>
                ✉️{" "}
                {selectedCustomer.email ||
                  "No email"}
              </p>
            </div>
          </div>

          {historyLoading ? (
            <p>Loading purchase history...</p>
          ) : (
            <>
              <div className="customer-stats">

                <div className="customer-stat-card">
                  <span>💰</span>
                  <div>
                    <p>Total Purchases</p>
                    <h3>
                      KSh{" "}
                      {Number(
                        purchaseSummary.totalPurchases
                      ).toLocaleString()}
                    </h3>
                  </div>
                </div>

                <div className="customer-stat-card">
                  <span>🛒</span>
                  <div>
                    <p>Total Orders</p>
                    <h3>
                      {purchaseSummary.orderCount}
                    </h3>
                  </div>
                </div>

              </div>

              <div className="purchase-history">
                <h3>Purchase History</h3>

                {purchaseHistory.length === 0 ? (
                  <div className="empty-products">
                    <h3>No purchases yet</h3>

                    <p>
                      This customer has not made
                      any purchases.
                    </p>
                  </div>
                ) : (
                  <div className="sales-table-container">
                    <table className="sales-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Product</th>
                          <th>Quantity</th>
                          <th>Unit Price</th>
                          <th>Total</th>
                          <th>Date</th>
                        </tr>
                      </thead>

                      <tbody>
                        {purchaseHistory.map(
                          (purchase) => (
                            <tr key={purchase.id}>
                              <td>
                                #{purchase.id}
                              </td>

                              <td>
                                {
                                  purchase.product_name
                                }
                              </td>

                              <td>
                                {purchase.quantity}
                              </td>

                              <td>
                                KSh{" "}
                                {Number(
                                  purchase.unit_price
                                ).toLocaleString()}
                              </td>

                              <td>
                                <strong>
                                  KSh{" "}
                                  {Number(
                                    purchase.total_amount
                                  ).toLocaleString()}
                                </strong>
                              </td>

                              <td>
                                {new Date(
                                  purchase.created_at
                                ).toLocaleString()}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default Customers;