import { useEffect, useState } from "react";

function Settings() {
  // =================================================
  // SETTINGS
  // =================================================

  const [settings, setSettings] = useState({
    business_name: "",
    business_subtitle: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    country: "",
    tax_number: "",
    currency: "",
    invoice_footer: "",
  });

  // =================================================
  // USER / ROLE
  // =================================================

  const [isAdmin, setIsAdmin] = useState(false);
  const [roleLoading, setRoleLoading] = useState(true);

  // =================================================
  // UI STATE
  // =================================================

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // =================================================
  // TOKEN
  // =================================================

  const getToken = () => {
    return localStorage.getItem("token");
  };

  // =================================================
  // GET CURRENT USER ROLE FROM JWT
  // =================================================

  const getUserRole = () => {
    try {
      const token = getToken();

      if (!token) {
        return null;
      }

      const parts = token.split(".");

      if (parts.length !== 3) {
        return null;
      }

      const payload = JSON.parse(
        atob(
          parts[1]
            .replace(/-/g, "+")
            .replace(/_/g, "/")
        )
      );

      return payload.role || null;
    } catch (error) {
      console.error(
        "Failed to read user role:",
        error
      );

      return null;
    }
  };

  // =================================================
  // CHECK ADMIN ACCESS
  // =================================================

  useEffect(() => {
    const role = getUserRole();

    setIsAdmin(role === "admin");
    setRoleLoading(false);
  }, []);

  // =================================================
  // FETCH SETTINGS
  // ADMIN ONLY
  // =================================================

  const fetchSettings = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "http://localhost:5000/api/settings",
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
            "Failed to load business settings"
        );
      }

      if (data.settings) {
        setSettings({
          business_name:
            data.settings.business_name || "",

          business_subtitle:
            data.settings.business_subtitle || "",

          phone:
            data.settings.phone || "",

          email:
            data.settings.email || "",

          address:
            data.settings.address || "",

          city:
            data.settings.city || "",

          country:
            data.settings.country || "",

          tax_number:
            data.settings.tax_number || "",

          currency:
            data.settings.currency || "",

          invoice_footer:
            data.settings.invoice_footer || "",
        });
      }
    } catch (error) {
      console.error(error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // =================================================
  // LOAD SETTINGS ONLY FOR ADMIN
  // =================================================

  useEffect(() => {
    if (!roleLoading && isAdmin) {
      fetchSettings();
    } else if (!roleLoading && !isAdmin) {
      setLoading(false);
    }
  }, [roleLoading, isAdmin]);

  // =================================================
  // UPDATE FIELD
  // =================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setSettings((previousSettings) => ({
      ...previousSettings,
      [name]: value,
    }));
  };

  // =================================================
  // SAVE SETTINGS
  // ADMIN ONLY
  // =================================================

  const handleSave = async (e) => {
    e.preventDefault();

    // Extra frontend protection
    if (!isAdmin) {
      setError(
        "Only administrators can change business settings."
      );

      return;
    }

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        "http://localhost:5000/api/settings",
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${getToken()}`,
          },

          body: JSON.stringify(settings),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to save settings"
        );
      }

      setSettings({
        business_name:
          data.settings.business_name || "",

        business_subtitle:
          data.settings.business_subtitle || "",

        phone:
          data.settings.phone || "",

        email:
          data.settings.email || "",

        address:
          data.settings.address || "",

        city:
          data.settings.city || "",

        country:
          data.settings.country || "",

        tax_number:
          data.settings.tax_number || "",

        currency:
          data.settings.currency || "",

        invoice_footer:
          data.settings.invoice_footer || "",
      });

      setMessage(
        "Business settings saved successfully."
      );
    } catch (error) {
      console.error(error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  // =================================================
  // ROLE LOADING
  // =================================================

  if (roleLoading) {
    return (
      <div className="settings-section">
        <p>Checking permissions...</p>
      </div>
    );
  }

  // =================================================
  // STAFF ACCESS DENIED
  // =================================================

  if (!isAdmin) {
    return (
      <div className="settings-section">

        <div className="settings-header">
          <div>
            <h2>
              Business Settings
            </h2>

            <p>
              Manage your business information
              used throughout BizManager.
            </p>
          </div>
        </div>

        <div className="error-message">
          <strong>
            Access Restricted
          </strong>

          <p style={{ marginBottom: 0 }}>
            Only administrators can view and
            change business settings.
          </p>
        </div>

      </div>
    );
  }

  // =================================================
  // LOADING SETTINGS
  // =================================================

  if (loading) {
    return (
      <div className="settings-section">
        <p>Loading settings...</p>
      </div>
    );
  }

  // =================================================
  // ADMIN PAGE
  // =================================================

  return (
    <div className="settings-section">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="settings-header">

        <div>
          <h2>
            Business Settings
          </h2>

          <p>
            Manage your business information
            used throughout BizManager.
          </p>
        </div>

      </div>

      {/* =================================================
          SUCCESS
      ================================================= */}

      {message && (
        <div className="success-message">
          {message}
        </div>
      )}

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* =================================================
          SETTINGS FORM
      ================================================= */}

      <form
        className="settings-form"
        onSubmit={handleSave}
      >

        {/* =================================================
            BUSINESS INFORMATION
        ================================================= */}

        <div className="settings-card">

          <div className="settings-card-header">

            <div>
              <h3>
                Business Information
              </h3>

              <p>
                This information will appear
                on your invoices.
              </p>
            </div>

          </div>

          <div className="settings-grid">

            {/* BUSINESS NAME */}

            <div className="settings-field">

              <label>
                Business Name
              </label>

              <input
                type="text"
                name="business_name"
                value={
                  settings.business_name
                }
                onChange={handleChange}
                placeholder="BizManager"
                required
              />

            </div>

            {/* SUBTITLE */}

            <div className="settings-field">

              <label>
                Business Subtitle
              </label>

              <input
                type="text"
                name="business_subtitle"
                value={
                  settings.business_subtitle
                }
                onChange={handleChange}
                placeholder="Business Management Suite"
              />

            </div>

            {/* PHONE */}

            <div className="settings-field">

              <label>
                Phone
              </label>

              <input
                type="text"
                name="phone"
                value={
                  settings.phone
                }
                onChange={handleChange}
                placeholder="+254 700 000 000"
              />

            </div>

            {/* EMAIL */}

            <div className="settings-field">

              <label>
                Email
              </label>

              <input
                type="email"
                name="email"
                value={
                  settings.email
                }
                onChange={handleChange}
                placeholder="business@example.com"
              />

            </div>

            {/* ADDRESS */}

            <div className="settings-field">

              <label>
                Address
              </label>

              <input
                type="text"
                name="address"
                value={
                  settings.address
                }
                onChange={handleChange}
                placeholder="Your business address"
              />

            </div>

            {/* CITY */}

            <div className="settings-field">

              <label>
                City
              </label>

              <input
                type="text"
                name="city"
                value={
                  settings.city
                }
                onChange={handleChange}
                placeholder="Nakuru"
              />

            </div>

            {/* COUNTRY */}

            <div className="settings-field">

              <label>
                Country
              </label>

              <input
                type="text"
                name="country"
                value={
                  settings.country
                }
                onChange={handleChange}
                placeholder="Kenya"
              />

            </div>

            {/* TAX NUMBER */}

            <div className="settings-field">

              <label>
                Tax / VAT Number
              </label>

              <input
                type="text"
                name="tax_number"
                value={
                  settings.tax_number
                }
                onChange={handleChange}
                placeholder="Optional"
              />

            </div>

          </div>

        </div>

        {/* =================================================
            INVOICE SETTINGS
        ================================================= */}

        <div className="settings-card">

          <div className="settings-card-header">

            <div>

              <h3>
                Invoice Settings
              </h3>

              <p>
                Customize how your invoices
                display financial information.
              </p>

            </div>

          </div>

          <div className="settings-grid">

            {/* CURRENCY */}

            <div className="settings-field">

              <label>
                Currency
              </label>

              <select
                name="currency"
                value={
                  settings.currency
                }
                onChange={handleChange}
              >

                <option value="KSh">
                  KSh — Kenyan Shilling
                </option>

                <option value="$">
                  $ — US Dollar
                </option>

                <option value="€">
                  € — Euro
                </option>

                <option value="£">
                  £ — British Pound
                </option>

              </select>

            </div>

          </div>

          {/* FOOTER */}

          <div className="settings-field full-width">

            <label>
              Invoice Footer
            </label>

            <textarea
              name="invoice_footer"
              value={
                settings.invoice_footer
              }
              onChange={handleChange}
              placeholder="Thank you for your business!"
              rows="4"
            />

            <small>
              This message appears at the
              bottom of printed invoices.
            </small>

          </div>

        </div>

        {/* =================================================
            SAVE BUTTON
        ================================================= */}

        <div className="settings-actions">

          <button
            type="submit"
            className="save-settings-btn"
            disabled={saving}
          >

            {saving
              ? "Saving..."
              : "Save Business Settings"}

          </button>

        </div>

      </form>

    </div>
  );
}

export default Settings;