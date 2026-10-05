import { useEffect, useState } from "react";

function Expenses() {
  const [expenses, setExpenses] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [expenseDate, setExpenseDate] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchExpenses = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:5000/api/expenses",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch expenses"
        );
      }

      setExpenses(data.expenses || []);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setAmount("");
    setCategory("");
    setExpenseDate("");
    setEditingExpense(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      const url = editingExpense
        ? `http://localhost:5000/api/expenses/${editingExpense.id}`
        : "http://localhost:5000/api/expenses";

      const method = editingExpense ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          amount: Number(amount),
          category,
          expense_date: expenseDate || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            `Failed to ${
              editingExpense ? "update" : "create"
            } expense`
        );
      }

      resetForm();
      await fetchExpenses();
    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);

    setTitle(expense.title);
    setDescription(expense.description || "");
    setAmount(expense.amount);
    setCategory(expense.category);
    setExpenseDate(
      expense.expense_date
        ? expense.expense_date.substring(0, 10)
        : ""
    );

    setShowForm(true);
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this expense?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:5000/api/expenses/${id}`,
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
          data.message || "Failed to delete expense"
        );
      }

      await fetchExpenses();
    } catch (error) {
      setError(error.message);
    }
  };

  const totalExpenses = expenses.reduce(
    (total, expense) =>
      total + Number(expense.amount),
    0
  );

  if (loading) {
    return <p>Loading expenses...</p>;
  }

  return (
    <div className="products-section">

      {/* Header */}
      <div className="products-header">
        <div>
          <h2>Expenses</h2>
          <p>
            Track and manage your business expenses.
          </p>
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
          {showForm
            ? "Cancel"
            : "+ Add Expense"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Total */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-icon">
            💸
          </span>

          <div>
            <p>Total Expenses</p>

            <h2>
              KSh{" "}
              {totalExpenses.toLocaleString()}
            </h2>
          </div>
        </div>

        <div className="stat-card">
          <span className="stat-icon">
            🧾
          </span>

          <div>
            <p>Expense Records</p>

            <h2>{expenses.length}</h2>
          </div>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <form
          className="product-form"
          onSubmit={handleSubmit}
        >
          <h3>
            {editingExpense
              ? "Edit Expense"
              : "Add New Expense"}
          </h3>

          <label>Expense Title</label>

          <input
            type="text"
            value={title}
            onChange={(e) =>
              setTitle(e.target.value)
            }
            placeholder="e.g. Internet Subscription"
            required
          />

          <label>Description</label>

          <textarea
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
            placeholder="Optional description"
          />

          <label>Amount</label>

          <input
            type="number"
            min="1"
            step="0.01"
            value={amount}
            onChange={(e) =>
              setAmount(e.target.value)
            }
            placeholder="Enter amount"
            required
          />

          <label>Category</label>

          <select
            value={category}
            onChange={(e) =>
              setCategory(e.target.value)
            }
            required
          >
            <option value="">
              Select category
            </option>

            <option value="Utilities">
              Utilities
            </option>

            <option value="Rent">
              Rent
            </option>

            <option value="Transport">
              Transport
            </option>

            <option value="Supplies">
              Supplies
            </option>

            <option value="Salaries">
              Salaries
            </option>

            <option value="Marketing">
              Marketing
            </option>

            <option value="Maintenance">
              Maintenance
            </option>

            <option value="Other">
              Other
            </option>
          </select>

          <label>Expense Date</label>

          <input
            type="date"
            value={expenseDate}
            onChange={(e) =>
              setExpenseDate(e.target.value)
            }
          />

          <button
            type="submit"
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : editingExpense
              ? "Update Expense"
              : "Save Expense"}
          </button>
        </form>
      )}

      {/* Expenses */}
      {expenses.length === 0 ? (
        <div className="empty-products">
          <h3>No expenses yet</h3>

          <p>
            Add your first business expense
            to start tracking your spending.
          </p>
        </div>
      ) : (
        <div className="sales-table-container">
          <table className="sales-table">

            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Created By</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {expenses.map((expense) => (
                <tr key={expense.id}>

                  <td>
                    #{expense.id}
                  </td>

                  <td>
                    <strong>
                      {expense.title}
                    </strong>

                    {expense.description && (
                      <small>
                        {expense.description}
                      </small>
                    )}
                  </td>

                  <td>
                    {expense.category}
                  </td>

                  <td>
                    <strong>
                      KSh{" "}
                      {Number(
                        expense.amount
                      ).toLocaleString()}
                    </strong>
                  </td>

                  <td>
                    {expense.expense_date
                      ? new Date(
                          expense.expense_date
                        ).toLocaleDateString()
                      : "-"}
                  </td>

                  <td>
                    {expense.created_by_email ||
                      "-"}
                  </td>

                  <td>
                    <button
                      className="edit-btn"
                      onClick={() =>
                        handleEdit(expense)
                      }
                    >
                      Edit
                    </button>

                    <button
                      className="delete-btn"
                      onClick={() =>
                        handleDelete(
                          expense.id
                        )
                      }
                    >
                      Delete
                    </button>
                  </td>

                </tr>
              ))}
            </tbody>

          </table>
        </div>
      )}
    </div>
  );
}

export default Expenses;