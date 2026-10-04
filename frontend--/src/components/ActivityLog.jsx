import { useEffect, useState } from "react";

function ActivityLog() {
  // =================================================
  // DATA
  // =================================================

  const [logs, setLogs] = useState([]);

  // =================================================
  // UI STATE
  // =================================================

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] =
    useState("ALL");

  // =================================================
  // TOKEN
  // =================================================

  const getToken = () => {
    return localStorage.getItem("token");
  };

  // =================================================
  // FETCH AUDIT LOGS
  // =================================================

  const fetchLogs = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "http://localhost:5000/api/audit-logs",
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
            "Failed to fetch activity logs"
        );
      }

      setLogs(data.logs || []);
    } catch (error) {
      console.error(error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // =================================================
  // LOAD LOGS
  // =================================================

  useEffect(() => {
    fetchLogs();
  }, []);

  // =================================================
  // FILTER LOGS
  // =================================================

  const filteredLogs = logs.filter((log) => {
    const searchText =
      search.trim().toLowerCase();

    const matchesSearch =
      !searchText ||
      String(log.user_name || "")
        .toLowerCase()
        .includes(searchText) ||
      String(log.user_email || "")
        .toLowerCase()
        .includes(searchText) ||
      String(log.action || "")
        .toLowerCase()
        .includes(searchText) ||
      String(log.entity || "")
        .toLowerCase()
        .includes(searchText) ||
      String(log.description || "")
        .toLowerCase()
        .includes(searchText);

    const matchesAction =
      actionFilter === "ALL" ||
      log.action === actionFilter;

    return (
      matchesSearch &&
      matchesAction
    );
  });

  // =================================================
  // FORMAT DATE
  // =================================================

  const formatDate = (date) => {
    if (!date) {
      return "Unknown";
    }

    return new Date(date).toLocaleString(
      "en-KE",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  };

  // =================================================
  // ACTION LABEL
  // =================================================

  const getActionLabel = (action) => {
    switch (action) {
      case "CREATE":
        return "Created";

      case "UPDATE":
        return "Updated";

      case "DELETE":
        return "Deleted";

      case "LOGIN":
        return "Logged In";

      case "LOGOUT":
        return "Logged Out";

      default:
        return action || "Action";
    }
  };

  // =================================================
  // ACTION STYLE
  // =================================================

  const getActionStyle = (action) => {
    if (action === "CREATE") {
      return {
        background: "#dcfce7",
        color: "#166534",
      };
    }

    if (action === "UPDATE") {
      return {
        background: "#dbeafe",
        color: "#1d4ed8",
      };
    }

    if (action === "DELETE") {
      return {
        background: "#fee2e2",
        color: "#b91c1c",
      };
    }

    return {
      background: "#f3f4f6",
      color: "#374151",
    };
  };

  // =================================================
  // LOADING
  // =================================================

  if (loading) {
    return (
      <div className="users-section">
        <p>
          Loading activity logs...
        </p>
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
          <h2>
            Activity Log
          </h2>

          <p>
            Monitor important actions performed
            in BizManager.
          </p>
        </div>

        <button
          type="button"
          className="add-product-btn"
          onClick={fetchLogs}
          disabled={loading}
        >
          🔄 Refresh
        </button>

      </div>

      {/* ============================================
          ERROR
      ============================================ */}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* ============================================
          FILTERS
      ============================================ */}

      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >

        <input
          type="text"
          placeholder="Search activity..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          style={{
            flex: "1",
            minWidth: "220px",
          }}
        />

        <select
          value={actionFilter}
          onChange={(e) =>
            setActionFilter(e.target.value)
          }
          style={{
            minWidth: "150px",
          }}
        >
          <option value="ALL">
            All Actions
          </option>

          <option value="CREATE">
            Create
          </option>

          <option value="UPDATE">
            Update
          </option>

          <option value="DELETE">
            Delete
          </option>

          <option value="LOGIN">
            Login
          </option>

          <option value="LOGOUT">
            Logout
          </option>
        </select>

      </div>

      {/* ============================================
          RESULT COUNT
      ============================================ */}

      <div
        style={{
          marginBottom: "14px",
          color: "#6b7280",
          fontSize: "14px",
        }}
      >
        Showing {filteredLogs.length} of{" "}
        {logs.length} activities
      </div>

      {/* ============================================
          EMPTY STATE
      ============================================ */}

      {filteredLogs.length === 0 ? (

        <div className="empty-products">

          <h3>
            No activity found
          </h3>

          <p>
            {logs.length === 0
              ? "No activity has been recorded yet."
              : "Try changing your search or filter."}
          </p>

        </div>

      ) : (

        /* ==========================================
           TABLE
        ========================================== */

        <div className="sales-table-container">

          <table className="sales-table">

            <thead>

              <tr>
                <th>
                  User
                </th>

                <th>
                  Action
                </th>

                <th>
                  Entity
                </th>

                <th>
                  Description
                </th>

                <th>
                  Date & Time
                </th>
              </tr>

            </thead>

            <tbody>

              {filteredLogs.map(
                (log) => {

                  const actionStyle =
                    getActionStyle(
                      log.action
                    );

                  return (
                    <tr
                      key={log.id}
                    >

                      {/* USER */}

                      <td>

                        <div
                          style={{
                            fontWeight:
                              "600",
                            color:
                              "#111827",
                          }}
                        >
                          {log.user_name ||
                            "Unknown User"}
                        </div>

                        {log.user_email && (
                          <div
                            style={{
                              marginTop:
                                "3px",
                              fontSize:
                                "12px",
                              color:
                                "#6b7280",
                            }}
                          >
                            {log.user_email}
                          </div>
                        )}

                      </td>

                      {/* ACTION */}

                      <td>

                        <span
                          style={{
                            display:
                              "inline-block",
                            padding:
                              "6px 10px",
                            borderRadius:
                              "999px",
                            fontSize:
                              "11px",
                            fontWeight:
                              "700",
                            textTransform:
                              "uppercase",
                            background:
                              actionStyle.background,
                            color:
                              actionStyle.color,
                          }}
                        >
                          {getActionLabel(
                            log.action
                          )}
                        </span>

                      </td>

                      {/* ENTITY */}

                      <td>

                        <strong>
                          {log.entity ||
                            "—"}
                        </strong>

                        {log.entity_id && (
                          <div
                            style={{
                              marginTop:
                                "3px",
                              fontSize:
                                "12px",
                              color:
                                "#6b7280",
                            }}
                          >
                            ID #{log.entity_id}
                          </div>
                        )}

                      </td>

                      {/* DESCRIPTION */}

                      <td>
                        {log.description ||
                          "—"}
                      </td>

                      {/* DATE */}

                      <td>
                        {formatDate(
                          log.created_at
                        )}
                      </td>

                    </tr>
                  );
                }
              )}

            </tbody>

          </table>

        </div>
      )}

    </div>
  );
}

export default ActivityLog;