import { useEffect, useState } from "react";

function Users() {
  // =================================================
  // USERS
  // =================================================

  const [users, setUsers] = useState([]);

  // =================================================
  // UI STATE
  // =================================================

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);

  // =================================================
  // STAFF FORM
  // =================================================

  const [staffForm, setStaffForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  // =================================================
  // TOKEN
  // =================================================

  const getToken = () => {
    return localStorage.getItem("token");
  };

  // =================================================
  // FETCH USERS
  // =================================================

  const fetchUsers = async () => {
    try {
      const token = getToken();

      const response = await fetch(
        "http://localhost:5000/api/users",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to fetch users"
        );
      }

      setUsers(data.users || []);
    } catch (error) {
      console.error(error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // =================================================
  // LOAD USERS
  // =================================================

  useEffect(() => {
    fetchUsers();
  }, []);

  // =================================================
  // FORM CHANGE
  // =================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setStaffForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =================================================
  // RESET FORM
  // =================================================

  const resetForm = () => {
    setStaffForm({
      name: "",
      email: "",
      password: "",
    });

    setEditingUserId(null);
    setShowForm(false);
  };

  // =================================================
  // OPEN ADD STAFF FORM
  // =================================================

  const openAddForm = () => {
    setError("");
    setSuccess("");

    setStaffForm({
      name: "",
      email: "",
      password: "",
    });

    setEditingUserId(null);
    setShowForm(true);
  };

  // =================================================
  // OPEN EDIT FORM
  // =================================================

  const openEditForm = (user) => {
    setError("");
    setSuccess("");

    setStaffForm({
      name: user.name || "",
      email: user.email || "",
      password: "",
    });

    setEditingUserId(user.id);
    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =================================================
  // ADD / EDIT STAFF
  // =================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const token = getToken();

      const name = staffForm.name.trim();
      const email = staffForm.email
        .trim()
        .toLowerCase();

      if (!name || !email) {
        throw new Error(
          "Name and email are required."
        );
      }

      // =================================================
      // ADD STAFF
      // =================================================

      if (!editingUserId) {
        const password = staffForm.password;

        if (!password) {
          throw new Error(
            "Password is required when creating staff."
          );
        }

        if (password.length < 6) {
          throw new Error(
            "Password must be at least 6 characters."
          );
        }

        const response = await fetch(
          "http://localhost:5000/api/users",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              name,
              email,
              password,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to create staff account"
          );
        }

        setSuccess(
          `${name} was added as a staff member successfully.`
        );
      }

      // =================================================
      // EDIT STAFF
      // =================================================

      else {
        const response = await fetch(
          `http://localhost:5000/api/users/${editingUserId}`,
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              name,
              email,
              password:
                staffForm.password || undefined,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to update staff account"
          );
        }

        setSuccess(
          `${name}'s staff account was updated successfully.`
        );
      }

      // =================================================
      // RESET + REFRESH
      // =================================================

      setStaffForm({
        name: "",
        email: "",
        password: "",
      });

      setEditingUserId(null);
      setShowForm(false);

      await fetchUsers();
    } catch (error) {
      console.error(error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  // =================================================
  // DELETE STAFF
  // =================================================

  const handleDelete = async (user) => {
    const confirmed = window.confirm(
      `Delete staff account for ${user.name}?\n\nThis action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const token = getToken();

      const response = await fetch(
        `http://localhost:5000/api/users/${user.id}`,
        {
          method: "DELETE",

          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to delete staff account"
        );
      }

      setSuccess(
        `${user.name}'s account was deleted successfully.`
      );

      await fetchUsers();
    } catch (error) {
      console.error(error);
      setError(error.message);
    }
  };

  // =================================================
  // LOADING
  // =================================================

  if (loading) {
    return (
      <div className="users-section">
        <p>Loading users...</p>
      </div>
    );
  }

  // =================================================
  // PAGE
  // =================================================

  return (
    <div className="users-section">

      {/* ============================================
          HEADER
      ============================================ */}

      <div className="products-header">

        <div>
          <h2>Users</h2>

          <p>
            Manage users and staff accounts.
          </p>
        </div>

        <button
          className="add-product-btn"
          onClick={() => {
            if (showForm) {
              resetForm();
              setError("");
              setSuccess("");
            } else {
              openAddForm();
            }
          }}
        >
          {showForm
            ? "Cancel"
            : "+ Add Staff"}
        </button>

      </div>

      {/* ============================================
          SUCCESS MESSAGE
      ============================================ */}

      {success && (
        <div className="success-message">
          {success}
        </div>
      )}

      {/* ============================================
          ERROR MESSAGE
      ============================================ */}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* ============================================
          STAFF FORM
      ============================================ */}

      {showForm && (
        <form
          className="product-form"
          onSubmit={handleSubmit}
        >

          <h3>
            {editingUserId
              ? "Edit Staff Member"
              : "Add Staff Member"}
          </h3>

          <p className="form-description">
            {editingUserId
              ? "Update the staff member's account details."
              : "Create a new staff account for your business."}
          </p>

          {/* NAME */}

          <label>
            Full Name
          </label>

          <input
            type="text"
            name="name"
            placeholder="Enter staff name"
            value={staffForm.name}
            onChange={handleChange}
            required
          />

          {/* EMAIL */}

          <label>
            Email Address
          </label>

          <input
            type="email"
            name="email"
            placeholder="staff@example.com"
            value={staffForm.email}
            onChange={handleChange}
            required
          />

          {/* PASSWORD */}

          <label>
            {editingUserId
              ? "New Password"
              : "Password"}
          </label>

          <input
            type="password"
            name="password"
            placeholder={
              editingUserId
                ? "Leave blank to keep current password"
                : "Minimum 6 characters"
            }
            value={staffForm.password}
            onChange={handleChange}
            minLength={6}
            required={!editingUserId}
          />

          {/* ROLE */}

          <label>
            Role
          </label>

          <input
            type="text"
            value="Staff"
            disabled
          />

          {/* SUBMIT */}

          <button
            type="submit"
            className="record-sale-btn"
            disabled={saving}
          >
            {saving
              ? editingUserId
                ? "Updating Staff..."
                : "Creating Staff..."
              : editingUserId
              ? "Update Staff Account"
              : "Create Staff Account"}
          </button>

        </form>
      )}

      {/* ============================================
          USERS TABLE
      ============================================ */}

      {users.length === 0 ? (
        <div className="empty-products">

          <h3>
            No users found
          </h3>

          <p>
            Registered users will appear here.
          </p>

        </div>
      ) : (
        <div className="sales-table-container">

          <table className="sales-table">

            <thead>

              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>

            </thead>

            <tbody>

              {users.map((user) => (

                <tr key={user.id}>

                  <td>
                    #{user.id}
                  </td>

                  <td>
                    {user.name}
                  </td>

                  <td>
                    {user.email}
                  </td>

                  <td>
                    <strong>
                      {user.role}
                    </strong>
                  </td>

                  <td>
                    {new Date(
                      user.created_at
                    ).toLocaleString()}
                  </td>

                  <td>

                    {user.role === "staff" ? (
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          flexWrap: "wrap",
                        }}
                      >

                        <button
                          type="button"
                          className="invoice-btn"
                          onClick={() =>
                            openEditForm(user)
                          }
                        >
                          ✏️ Edit
                        </button>

                        <button
                          type="button"
                          className="remove-sale-item"
                          onClick={() =>
                            handleDelete(user)
                          }
                          title="Delete staff"
                        >
                          🗑️
                        </button>

                      </div>
                    ) : (
                      <span>
                        Admin
                      </span>
                    )}

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

export default Users;