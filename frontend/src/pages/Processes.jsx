import { useEffect, useState } from "react";

import {
  getProcesses,
  createProcess,
  updateProcess,
  deleteProcess,
} from "../services/processService";

import { getBrands } from "../services/brandService";

const emptyForm = {
  name: "",
  code: "",
  category: "",
  brand: "",
  description: "",
  status: "Active",
};

function Processes() {
  const [processes, setProcesses] = useState([]);
  const [brands, setBrands] = useState([]);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Fetch processes and brands
  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [processResponse, brandResponse] = await Promise.all([
        getProcesses(),
        getBrands(),
      ]);

      setProcesses(
        Array.isArray(processResponse)
          ? processResponse
          : processResponse.processes || []
      );

      setBrands(
        Array.isArray(brandResponse)
          ? brandResponse
          : brandResponse.brands || []
      );
    } catch (err) {
      console.error("Error fetching process data:", err);

      setError(
        err.response?.data?.message ||
          "Failed to load processes. Please check your backend connection."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Statistics
  const activeCount = processes.filter(
    (p) => p.status === "Active"
  ).length;

  const inactiveCount = processes.length - activeCount;

  // Filter processes
  const filteredProcesses = processes.filter((process) => {
    const matchesSearch =
      process.name?.toLowerCase().includes(search.toLowerCase()) ||
      process.code?.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      categoryFilter === "All" ||
      process.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  // Open add modal
  const handleAdd = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setError("");
    setShowModal(true);
  };

  // Open edit modal
  const handleEdit = (process) => {
    setEditingId(process._id);

    setFormData({
      name: process.name || "",
      code: process.code || "",
      category: process.category || "",
      brand: process.brand?._id || process.brand || "",
      description: process.description || "",
      status: process.status || "Active",
    });

    setError("");
    setShowModal(true);
  };

  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      setError("");

      const processData = {
        ...formData,
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
      };

      if (editingId) {
        await updateProcess(editingId, processData);
        alert("Process updated successfully!");
      } else {
        await createProcess(processData);
        alert("Process added successfully!");
      }

      setShowModal(false);
      setFormData(emptyForm);
      setEditingId(null);

      await fetchData();
    } catch (err) {
      console.error("Error saving process:", err);

      setError(
        err.response?.data?.message ||
          "Unable to save process. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Delete process
  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this process?"
      )
    ) {
      return;
    }

    try {
      await deleteProcess(id);

      alert("Process deleted successfully!");

      await fetchData();
    } catch (err) {
      console.error("Error deleting process:", err);

      alert(
        err.response?.data?.message ||
          "Unable to delete process."
      );
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="page-heading">
        <div>
          <h3>Process Management</h3>
          <p>
            Configure and manage operational processes across brands.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={handleAdd}
          disabled={brands.length === 0}
          title={
            brands.length === 0
              ? "Add an active brand before creating a process"
              : ""
          }
        >
          <i className="bi bi-plus-lg me-2"></i>
          Add Process
        </button>
      </div>

      {/* Statistics */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="employee-stat-card">
            <div>
              <p>Total Processes</p>
              <h3>{processes.length}</h3>
            </div>

            <div className="employee-stat-icon blue">
              <i className="bi bi-diagram-2"></i>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="employee-stat-card">
            <div>
              <p>Active Processes</p>
              <h3>{activeCount}</h3>
            </div>

            <div className="employee-stat-icon green">
              <i className="bi bi-check-circle"></i>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="employee-stat-card">
            <div>
              <p>Inactive Processes</p>
              <h3>{inactiveCount}</h3>
            </div>

            <div className="employee-stat-icon orange">
              <i className="bi bi-pause-circle"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Process Table */}
      <div className="employee-table-card">
        <div className="employee-table-header">
          <div>
            <h5>All Operational Processes</h5>
            <p>
              Define the processes performed for different client brands.
            </p>
          </div>

          <span className="employee-count">
            {filteredProcesses.length} Processes
          </span>
        </div>

        {/* Search and Filter */}
        <div className="employee-filters">
          <div className="employee-search">
            <i className="bi bi-search"></i>

            <input
              placeholder="Search processes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="form-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="All">All Categories</option>
            <option value="Customer Service">Customer Service</option>
            <option value="Sales">Sales</option>
            <option value="Operations">Operations</option>
          </select>
        </div>

        {/* Error */}
        {error && !showModal && (
          <div className="alert alert-danger mx-3">
            {error}
            <button
              className="btn btn-sm btn-outline-danger ms-3"
              onClick={fetchData}
            >
              Retry
            </button>
          </div>
        )}

        {/* Table */}
        <div className="table-responsive">
          <table className="table employee-table align-middle">
            <thead>
              <tr>
                <th>PROCESS NAME</th>
                <th>PROCESS CODE</th>
                <th>BRAND</th>
                <th>CATEGORY</th>
                <th>DESCRIPTION</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-5">
                    <div className="spinner-border text-primary"></div>
                    <p className="mt-2 mb-0">Loading processes...</p>
                  </td>
                </tr>
              ) : filteredProcesses.length > 0 ? (
                filteredProcesses.map((process) => (
                  <tr key={process._id}>
                    <td>
                      <div className="pod-name-cell">
                        <div className="pod-icon">
                          <i className="bi bi-gear"></i>
                        </div>

                        <strong>{process.name}</strong>
                      </div>
                    </td>

                    <td>
                      <span className="employee-id">
                        {process.code}
                      </span>
                    </td>

                    <td>
                      <span className="pod-badge">
                        {process.brand?.name || "Unknown Brand"}
                      </span>
                    </td>

                    <td>
                      <span className="pod-badge">
                        {process.category}
                      </span>
                    </td>

                    <td
                      style={{
                        maxWidth: "250px",
                        whiteSpace: "normal",
                      }}
                    >
                      {process.description || "—"}
                    </td>

                    <td>
                      <span
                        className={`status-badge ${
                          process.status === "Active"
                            ? "active-status"
                            : "inactive-status"
                        }`}
                      >
                        {process.status}
                      </span>
                    </td>

                    <td>
                      <div className="employee-actions">
                        <button
                          title="Edit"
                          onClick={() => handleEdit(process)}
                        >
                          <i className="bi bi-pencil-square"></i>
                        </button>

                        <button
                          className="delete-action"
                          title="Delete"
                          onClick={() => handleDelete(process._id)}
                        >
                          <i className="bi bi-trash3"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-5">
                    No processes found.
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
                  {editingId ? "Edit Process" : "Add New Process"}
                </h5>

                <p>Configure operational process details.</p>
              </div>

              <button
                className="modal-close-btn"
                onClick={() => setShowModal(false)}
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
                <label className="form-label">
                  Process Name *
                </label>

                <input
                  className="form-control"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter process name"
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">
                  Process Code *
                </label>

                <input
                  className="form-control"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  placeholder="Example: CS, ACC, NDR"
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">
                  Brand *
                </label>

                <select
                  className="form-select"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select brand</option>

                  {brands
                    .filter((brand) => brand.status === "Active")
                    .map((brand) => (
                      <option key={brand._id} value={brand._id}>
                        {brand.name} ({brand.code})
                      </option>
                    ))}
                </select>

                {brands.length === 0 && (
                  <small className="text-danger">
                    Add a brand before creating a process.
                  </small>
                )}
              </div>

              <div className="mb-3">
                <label className="form-label">
                  Category *
                </label>

                <select
                  className="form-select"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select category</option>
                  <option value="Customer Service">
                    Customer Service
                  </option>
                  <option value="Sales">Sales</option>
                  <option value="Operations">Operations</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">
                  Description
                </label>

                <textarea
                  className="form-control"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Describe the process"
                />
              </div>

              <div className="mb-3">
                <label className="form-label">
                  Status
                </label>

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

              <div className="modal-footer-custom">
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={() => setShowModal(false)}
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
                    : "Add Process"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Processes;