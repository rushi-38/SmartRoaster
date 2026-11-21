import { useEffect, useState } from "react";

import {
  getBrands,
  createBrand,
  updateBrand,
  deleteBrand,
} from "../services/brandService";

import { getEmployees } from "../services/employeeService";

const emptyForm = {
  name: "",
  industry: "",
  manager: "",
  status: "Active",
  description: "",
};

function Brands() {
  const [brands, setBrands] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);

  const [formData, setFormData] = useState(emptyForm);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Get ID from employee or populated manager
  const getId = (item) => {
    if (!item) return "";
    return typeof item === "object" ? item._id : item;
  };

  // Get employee name safely
  const getManagerName = (manager) => {
    if (!manager) return "Not assigned";

    if (typeof manager === "object") {
      return manager.name || "Not assigned";
    }

    return "Not assigned";
  };

  // Load brands and employees
  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [brandResponse, employeeResponse] = await Promise.all([
        getBrands(),
        getEmployees(),
      ]);

      setBrands(
        Array.isArray(brandResponse)
          ? brandResponse
          : brandResponse.brands || []
      );

      setEmployees(
        Array.isArray(employeeResponse)
          ? employeeResponse
          : employeeResponse.employees || []
      );
    } catch (err) {
      console.error("Error fetching brand data:", err);

      setError(
        err.response?.data?.message ||
          "Failed to load brands. Please check your backend connection."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Statistics
  const activeBrands = brands.filter(
    (brand) => brand.status === "Active"
  ).length;

  const inactiveBrands = brands.filter(
    (brand) => brand.status === "Inactive"
  ).length;

  // Search and filter
  const filteredBrands = brands.filter((brand) => {
    const searchValue = search.toLowerCase();

    const matchesSearch =
      (brand.name || "").toLowerCase().includes(searchValue) ||
      (brand.code || "").toLowerCase().includes(searchValue) ||
      (brand.industry || "").toLowerCase().includes(searchValue);

    const matchesStatus =
      statusFilter === "All" || brand.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Open add modal
  const handleAdd = () => {
    setEditingId(null);
    setFormData({ ...emptyForm });
    setError("");
    setShowModal(true);
  };

  // Open edit modal
  const handleEdit = (brand) => {
    setEditingId(brand._id);

    setFormData({
      name: brand.name || "",
      industry: brand.industry || "",
      manager: getId(brand.manager),
      status: brand.status || "Active",
      description: brand.description || "",
    });

    setError("");
    setShowModal(true);
  };

  // Handle form input
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Create or update brand
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      setError("");

      const payload = {
        ...formData,
        manager: formData.manager || null,
      };

      if (editingId) {
        await updateBrand(editingId, payload);
        alert("Brand updated successfully!");
      } else {
        await createBrand(payload);
        alert("Brand added successfully!");
      }

      setShowModal(false);
      setFormData({ ...emptyForm });
      setEditingId(null);

      await fetchData();
    } catch (err) {
      console.error("Error saving brand:", err);

      setError(
        err.response?.data?.message || "Failed to save brand."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Delete brand
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this brand?")) {
      return;
    }

    try {
      await deleteBrand(id);

      alert("Brand deleted successfully!");

      if (selectedBrand?._id === id) {
        setSelectedBrand(null);
      }

      await fetchData();
    } catch (err) {
      console.error("Error deleting brand:", err);

      alert(
        err.response?.data?.message || "Failed to delete brand."
      );
    }
  };

  return (
    <div>
      {/* Header */}

      <div className="page-heading">
        <div>
          <h3>Brand Management</h3>
          <p>
            Manage client brands and their operational information.
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleAdd}>
          <i className="bi bi-plus-lg me-2"></i>
          Add Brand
        </button>
      </div>

      {/* Statistics */}

      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="employee-stat-card">
            <div>
              <p>Total Brands</p>
              <h3>{brands.length}</h3>
            </div>

            <div className="employee-stat-icon blue">
              <i className="bi bi-shop"></i>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="employee-stat-card">
            <div>
              <p>Active Brands</p>
              <h3>{activeBrands}</h3>
            </div>

            <div className="employee-stat-icon green">
              <i className="bi bi-check-circle"></i>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="employee-stat-card">
            <div>
              <p>Inactive Brands</p>
              <h3>{inactiveBrands}</h3>
            </div>

            <div className="employee-stat-icon orange">
              <i className="bi bi-pause-circle"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Brand Table */}

      <div className="employee-table-card">
        <div className="employee-table-header">
          <div>
            <h5>All Client Brands</h5>
            <p>View and manage all registered brands.</p>
          </div>

          <span className="employee-count">
            {filteredBrands.length} Brands
          </span>
        </div>

        {/* Search and Filter */}

        <div className="employee-filters">
          <div className="employee-search">
            <i className="bi bi-search"></i>

            <input
              placeholder="Search brands..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        {/* Error Message */}

        {error && !showModal && (
          <div className="alert alert-danger mx-3">
            {error}
          </div>
        )}

        {/* Table */}

        <div className="table-responsive">
          <table className="table employee-table align-middle">
            <thead>
              <tr>
                <th>BRAND</th>
                <th>BRAND ID</th>
                <th>INDUSTRY</th>
                <th>ACCOUNT MANAGER</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-5">
                    <div className="spinner-border text-primary"></div>
                    <p className="mt-2 mb-0">Loading brands...</p>
                  </td>
                </tr>
              ) : filteredBrands.length > 0 ? (
                filteredBrands.map((brand) => (
                  <tr key={brand._id}>
                    <td>
                      <div className="pod-name-cell">
                        <div className="pod-icon">
                          <i className="bi bi-shop"></i>
                        </div>

                        <strong>{brand.name}</strong>
                      </div>
                    </td>

                    <td>{brand.code}</td>

                    <td>{brand.industry}</td>

                    <td>{getManagerName(brand.manager)}</td>

                    <td>
                      <span
                        className={`status-badge ${
                          brand.status === "Active"
                            ? "active-status"
                            : "inactive-status"
                        }`}
                      >
                        {brand.status}
                      </span>
                    </td>

                    <td>
                      <div className="employee-actions">
                        <button
                          title="View"
                          onClick={() => setSelectedBrand(brand)}
                        >
                          <i className="bi bi-eye"></i>
                        </button>

                        <button
                          title="Edit"
                          onClick={() => handleEdit(brand)}
                        >
                          <i className="bi bi-pencil-square"></i>
                        </button>

                        <button
                          className="delete-action"
                          title="Delete"
                          onClick={() => handleDelete(brand._id)}
                        >
                          <i className="bi bi-trash3"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-5">
                    No brands found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}

      {showModal && (
        <div className="custom-modal-overlay">
          <div className="custom-employee-modal">
            <div className="modal-header-custom">
              <div>
                <h5>
                  {editingId ? "Edit Brand" : "Add New Brand"}
                </h5>

                <p>Enter client brand information.</p>
              </div>

              <button
                type="button"
                className="modal-close-btn"
                onClick={() => {
                  setShowModal(false);
                  setError("");
                }}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {error && (
                <div className="alert alert-danger">
                  {error}
                </div>
              )}

              <div className="mb-3">
                <label className="form-label">Brand Name *</label>

                <input
                  className="form-control"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter brand name"
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Industry *</label>

                <select
                  className="form-select"
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select industry</option>
                  <option value="Fashion">Fashion</option>
                  <option value="Beauty">Beauty</option>
                  <option value="Health">Health</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Food">Food</option>
                  <option value="Home Decor">Home Decor</option>
                  <option value="Lifestyle">Lifestyle</option>
                  <option value="Pet Care">Pet Care</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">
                  Account Manager
                </label>

                <select
                  className="form-select"
                  name="manager"
                  value={formData.manager}
                  onChange={handleChange}
                >
                  <option value="">Select account manager</option>

                  {employees
                    .filter((employee) => employee.status === "Active")
                    .map((employee) => (
                      <option
                        key={employee._id}
                        value={employee._id}
                      >
                        {employee.name} ({employee.employeeCode})
                      </option>
                    ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">Status</label>

                <select
                  className="form-select"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">Description</label>

                <textarea
                  className="form-control"
                  name="description"
                  rows="3"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter brand description"
                />
              </div>

              <div className="modal-footer-custom">
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={() => {
                    setShowModal(false);
                    setError("");
                  }}
                  disabled={submitting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting
                    ? "Saving..."
                    : editingId
                    ? "Save Changes"
                    : "Add Brand"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Brand Details Modal */}

      {selectedBrand && (
        <div className="custom-modal-overlay">
          <div className="custom-employee-modal">
            <div className="modal-header-custom">
              <div>
                <h5>{selectedBrand.name}</h5>
                <p>Brand information</p>
              </div>

              <button
                className="modal-close-btn"
                onClick={() => setSelectedBrand(null)}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="brand-detail-list">
              <p>
                <strong>Brand ID:</strong> {selectedBrand.code}
              </p>

              <p>
                <strong>Industry:</strong> {selectedBrand.industry}
              </p>

              <p>
                <strong>Manager:</strong>{" "}
                {getManagerName(selectedBrand.manager)}
              </p>

              <p>
                <strong>Status:</strong> {selectedBrand.status}
              </p>

              <p>
                <strong>Description:</strong>{" "}
                {selectedBrand.description || "No description"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Brands;