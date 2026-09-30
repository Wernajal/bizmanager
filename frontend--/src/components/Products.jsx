import { useEffect, useState } from "react";

function Products() {
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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
        throw new Error(data.message || "Failed to fetch products");
      }

      setProducts(data.products);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const resetForm = () => {
    setName("");
    setDescription("");
    setPrice("");
    setStockQuantity("");
    setEditingProduct(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      const url = editingProduct
        ? `http://localhost:5000/api/products/${editingProduct.id}`
        : "http://localhost:5000/api/products";

      const method = editingProduct ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          description,
          price: Number(price),
          stock_quantity: Number(stockQuantity),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            `Failed to ${editingProduct ? "update" : "create"} product`
        );
      }

      resetForm();
      fetchProducts();
    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);

    setName(product.name);
    setDescription(product.description || "");
    setPrice(product.price);
    setStockQuantity(product.stock_quantity);

    setShowForm(true);
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:5000/api/products/${id}`,
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
          data.message || "Failed to delete product"
        );
      }

      fetchProducts();
    } catch (error) {
      setError(error.message);
    }
  };

  if (loading) {
    return <p>Loading products...</p>;
  }

  return (
    <div className="products-section">
      <div className="products-header">
        <div>
          <h2>Products</h2>
          <p>Manage your business products.</p>
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
          {showForm ? "Cancel" : "+ Add Product"}
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
            {editingProduct
              ? "Edit Product"
              : "Add New Product"}
          </h3>

          <label>Product Name</label>

          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <label>Description</label>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <label>Price</label>

          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />

          <label>Stock Quantity</label>

          <input
            type="number"
            value={stockQuantity}
            onChange={(e) =>
              setStockQuantity(e.target.value)
            }
            required
          />

          <button type="submit" disabled={saving}>
            {saving
              ? "Saving..."
              : editingProduct
              ? "Update Product"
              : "Save Product"}
          </button>
        </form>
      )}

      {products.length === 0 ? (
        <div className="empty-products">
          <h3>No products yet</h3>
          <p>Add your first product to get started.</p>
        </div>
      ) : (
        <div className="products-grid">
          {products.map((product) => (
            <div
              className="product-card"
              key={product.id}
            >
              <h3>{product.name}</h3>

              <p>{product.description}</p>

              <strong>
                KSh{" "}
                {Number(product.price).toLocaleString()}
              </strong>

              <span>
                Stock: {product.stock_quantity}
              </span>

              <div className="product-actions">
                <button
                  className="edit-btn"
                  onClick={() => handleEdit(product)}
                >
                  Edit
                </button>

                <button
                  className="delete-btn"
                  onClick={() => handleDelete(product.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Products;