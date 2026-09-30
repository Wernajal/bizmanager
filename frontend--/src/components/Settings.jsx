import { useEffect, useState } from "react";

function Settings() {
  const [user, setUser] = useState(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/me",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load profile"
        );
      }

      setUser(data.user);
      setName(data.user.name);
      setEmail(data.user.email);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();

    setSavingProfile(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/me",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name,
            email,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to update profile"
        );
      }

      setUser(data.user);

      setMessage(
        "Profile updated successfully."
      );
    } catch (error) {
      setError(error.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setChangingPassword(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/change-password",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to change password"
        );
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setMessage(
        "Password changed successfully."
      );
    } catch (error) {
      setError(error.message);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  if (loading) {
    return <p>Loading settings...</p>;
  }

  return (
    <div className="settings-section">

      <div className="products-header">
        <div>
          <h2>Settings</h2>

          <p>
            Manage your account and application settings.
          </p>
        </div>
      </div>

      {message && (
        <div className="success-message">
          {message}
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Profile */}
      <div className="settings-card">

        <div className="settings-card-header">
          <div>
            <h3>👤 Profile Information</h3>

            <p>
              Update your account information.
            </p>
          </div>
        </div>

        <form
          className="settings-form"
          onSubmit={handleProfileUpdate}
        >
          <label>Name</label>

          <input
            type="text"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            required
          />

          <label>Email</label>

          <input
            type="email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            required
          />

          <div className="account-info">
            <p>
              <strong>Role:</strong>{" "}
              {user?.role || "User"}
            </p>

            <p>
              <strong>Account ID:</strong>{" "}
              #{user?.id}
            </p>
          </div>

          <button
            type="submit"
            disabled={savingProfile}
          >
            {savingProfile
              ? "Saving..."
              : "Save Profile"}
          </button>
        </form>

      </div>

      {/* Password */}
      <div className="settings-card">

        <div className="settings-card-header">
          <div>
            <h3>🔐 Change Password</h3>

            <p>
              Keep your account secure by updating
              your password.
            </p>
          </div>
        </div>

        <form
          className="settings-form"
          onSubmit={handlePasswordChange}
        >
          <label>Current Password</label>

          <input
            type="password"
            value={currentPassword}
            onChange={(e) =>
              setCurrentPassword(e.target.value)
            }
            required
          />

          <label>New Password</label>

          <input
            type="password"
            value={newPassword}
            onChange={(e) =>
              setNewPassword(e.target.value)
            }
            minLength="6"
            required
          />

          <label>Confirm New Password</label>

          <input
            type="password"
            value={confirmPassword}
            onChange={(e) =>
              setConfirmPassword(e.target.value)
            }
            minLength="6"
            required
          />

          <button
            type="submit"
            disabled={changingPassword}
          >
            {changingPassword
              ? "Changing..."
              : "Change Password"}
          </button>
        </form>

      </div>

      {/* Business */}
      <div className="settings-card">

        <div className="settings-card-header">
          <div>
            <h3>🏢 Business Information</h3>

            <p>
              Business details will be configured
              in a future update.
            </p>
          </div>
        </div>

        <div className="coming-soon">
          <span>🚀</span>

          <div>
            <h4>Business Profile</h4>

            <p>
              Business name, phone, location,
              logo and other business information
              will be added here.
            </p>
          </div>
        </div>

      </div>

      {/* Application */}
      <div className="settings-card">

        <div className="settings-card-header">
          <div>
            <h3>⚙️ Application</h3>

            <p>
              Application preferences.
            </p>
          </div>
        </div>

        <div className="settings-option">
          <div>
            <strong>Application Version</strong>

            <p>
              BizManager v1.0
            </p>
          </div>
        </div>

      </div>

      {/* Logout */}
      <div className="settings-card danger-card">

        <div className="settings-card-header">
          <div>
            <h3>🚪 Logout</h3>

            <p>
              Sign out of your BizManager account.
            </p>
          </div>
        </div>

        <button
          className="logout-btn"
          onClick={handleLogout}
        >
          Logout
        </button>

      </div>

    </div>
  );
}

export default Settings;