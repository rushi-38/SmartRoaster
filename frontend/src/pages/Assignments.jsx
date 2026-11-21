import { useEffect, useState } from "react";

import {
  getAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
} from "../services/assignmentService";

import { getEmployees } from "../services/employeeService";
import { getBrands } from "../services/brandService";
import { getProcesses } from "../services/processService";
import { getPods } from "../services/podService";

const emptyForm = {
  employee: "",
  brand: "",
  process: "",
  pod: "",
};

function Assignments() {
  const [assignments, setAssignments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [brands, setBrands] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [pods, setPods] = useState([]);

  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("All");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  // Extract arrays from API responses
  const getArray = (response, key) => {
    if (Array.isArray(response)) return response;
    return response?.[key] || [];
  };

  // Get ID whether a reference is populated or not
  const getId = (value) => {
    if (!value) return "";
    return typeof value === "object" ? value._id : value;
  };

  // Fetch all required data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        assignmentResponse,
        employeeResponse,
        brandResponse,
        processResponse,
        podResponse,
      ] = await Promise.all([
        getAssignments(),
        getEmployees(),
        getBrands(),
        getProcesses(),
        getPods(),
      ]);

      setAssignments(getArray(assignmentResponse, "assignments"));
      setEmployees(getArray(employeeResponse, "employees"));
      setBrands(getArray(brandResponse, "brands"));
      setProcesses(getArray(processResponse, "processes"));
      setPods(getArray(podResponse, "pods"));
    } catch (err) {
      console.error("Error fetching assignment data:", err);

      setError(
        err.response?.data?.message ||
        "Unable to load assignment data. Please check your backend."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Only active records should be selectable
  const activeEmployees = employees.filter(
    (emp) => emp.status === "Active" && emp.pod
  );

  const activeBrands = brands.filter(
    (brand) => brand.status === "Active"
  );

  const activePods = pods.filter(
    (pod) => pod.status === "Active"
  );

  // Get processes belonging to selected brand
  const availableProcesses = processes.filter(
    (process) =>
      process.status === "Active" &&
      getId(process.brand) === formData.brand
  );

  // Statistics
  const uniqueEmployees = new Set(
    assignments.map((a) => getId(a.employee))
  ).size;

  const uniqueBrands = new Set(
    assignments.map((a) => getId(a.brand))
  ).size;

  // Search and filter
  const filteredAssignments = assignments.filter((a) => {
    const employeeName = a.employee?.name || "";
    const brandName = a.brand?.name || "";
    const processName = a.process?.name || "";

    const matchesSearch =
      employeeName.toLowerCase().includes(search.toLowerCase()) ||
      brandName.toLowerCase().includes(search.toLowerCase()) ||
      processName.toLowerCase().includes(search.toLowerCase());

    const matchesBrand =
      brandFilter === "All" ||
      getId(a.brand) === brandFilter;

    return matchesSearch && matchesBrand;
  });

  // Open add modal
  const handleAdd = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setFormError("");
    setShowModal(true);
  };

  // Open edit modal
  const handleEdit = (assignment) => {
    setEditingId(assignment._id);

    setFormData({
      employee: getId(assignment.employee),
      brand: getId(assignment.brand),
      process: getId(assignment.process),
      pod: getId(assignment.pod),
    });

    setFormError("");
    setShowModal(true);
  };

  // Handle dropdown changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormError("");

    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: value,
      };

      // Automatically select the employee's assigned Pod
      if (name === "employee") {
        const selectedEmployee = employees.find(
          (emp) => emp._id === value
        );

        updated.pod = getId(selectedEmployee?.pod);
      }

      // Reset process when brand changes
      if (name === "brand") {
        updated.process = "";
      }

      return updated;
    });
  };

  // Create or update assignment
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setFormError("");

      if (!formData.employee || !formData.brand ||
          !formData.process || !formData.pod) {
        setFormError("Please select all required fields.");
        return;
      }

      const payload = {
        employee: formData.employee,
        brand: formData.brand,
        process: formData.process,
        pod: formData.pod,
      };

      if (editingId) {
        await updateAssignment(editingId, payload);
        alert("Assignment updated successfully!");
      } else {
        await createAssignment(payload);
        alert("Assignment created successfully!");
      }

      setShowModal(false);
      setFormData(emptyForm);
      setEditingId(null);

      await fetchData();
    } catch (err) {
      console.error("Error saving assignment:", err);

      setFormError(
        err.response?.data?.message ||
        "Unable to save assignment. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  // Delete assignment
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this assignment?")) return;

    try {
      await deleteAssignment(id);

      alert("Assignment deleted successfully!");

      await fetchData();
    } catch (err) {
      console.error("Error deleting assignment:", err);

      alert(
        err.response?.data?.message ||
        "Unable to delete assignment."
      );
    }
  };

  // Find selected employee's Pod
  const selectedEmployee = employees.find(
    (emp) => emp._id === formData.employee
  );

  const selectedPod = pods.find(
    (pod) => pod._id === formData.pod
  );

  return (
    <div>
      {/* Header */}
      <div className="page-heading">
        <div>
          <h3>Resource Assignments</h3>
          <p>
            Manage employee allocation across brands and processes.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={handleAdd}
          disabled={activeEmployees.length === 0 || activeBrands.length === 0}
        >
          <i className="bi bi-plus-lg me-2"></i>
          New Assignment
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="alert alert-danger">
          {error}
          <button
            className="btn btn-sm btn-outline-danger ms-3"
            onClick={fetchData}
          >
            Retry
          </button>
        </div>
      )}

      {/* Statistics */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="employee-stat-card">
            <div>
              <p>Total Assignments</p>
              <h3>{assignments.length}</h3>
            </div>
            <div className="employee-stat-icon blue">
              <i className="bi bi-person-workspace"></i>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="employee-stat-card">
            <div>
              <p>Assigned Employees</p>
              <h3>{uniqueEmployees}</h3>
            </div>
            <div className="employee-stat-icon green">
              <i className="bi bi-people"></i>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="employee-stat-card">
            <div>
              <p>Assigned Brands</p>
              <h3>{uniqueBrands}</h3>
            </div>
            <div className="employee-stat-icon purple">
              <i className="bi bi-shop"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Assignment Table */}
      <div className="employee-table-card">
        <div className="employee-table-header">
          <div>
            <h5>All Resource Assignments</h5>
            <p>
              View which employees are responsible for each process.
            </p>
          </div>

          <span className="employee-count">
            {filteredAssignments.length} Assignments
          </span>
        </div>

        {/* Filters */}
        <div className="employee-filters">
          <div className="employee-search">
            <i className="bi bi-search"></i>

            <input
              placeholder="Search employee, brand or process..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="form-select"
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
          >
            <option value="All">All Brands</option>

            {activeBrands.map((brand) => (
              <option key={brand._id} value={brand._id}>
                {brand.name}
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="table-responsive">
          <table className="table employee-table align-middle">
            <thead>
              <tr>
                <th>EMPLOYEE</th>
                <th>BRAND</th>
                <th>PROCESS</th>
                <th>OPERATIONAL POD</th>
                <th>ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-5">
                    <div className="spinner-border text-primary"></div>
                    <p className="mt-2 mb-0">Loading assignments...</p>
                  </td>
                </tr>
              ) : filteredAssignments.length > 0 ? (
                filteredAssignments.map((a) => (
                  <tr key={a._id}>
                    <td>
                      <div className="pod-lead-cell">
                        <div className="employee-avatar">
                          {(a.employee?.name || "?").charAt(0)}
                        </div>
                        <strong>
                          {a.employee?.name || "Unknown Employee"}
                        </strong>
                      </div>
                    </td>

                    <td>
                      <strong>
                        {a.brand?.name || "Unknown Brand"}
                      </strong>
                    </td>

                    <td>
                      <span className="pod-badge">
                        {a.process?.name || "Unknown Process"}
                      </span>
                    </td>

                    <td>
                      {a.pod?.name || "Unknown Pod"}
                    </td>

                    <td>
                      <div className="employee-actions">
                        <button onClick={() => handleEdit(a)}>
                          <i className="bi bi-pencil-square"></i>
                        </button>

                        <button
                          className="delete-action"
                          onClick={() => handleDelete(a._id)}
                        >
                          <i className="bi bi-trash3"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-5">
                    No assignments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="custom-modal-overlay">
          <div className="custom-employee-modal">
            <div className="modal-header-custom">
              <div>
                <h5>
                  {editingId ? "Edit Assignment" : "Create Assignment"}
                </h5>
                <p>
                  Allocate an employee to a brand and process.
                </p>
              </div>

              <button
                className="modal-close-btn"
                onClick={() => setShowModal(false)}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Employee */}
              <div className="mb-3">
                <label className="form-label">Employee *</label>

                <select
                  className="form-select"
                  name="employee"
                  value={formData.employee}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select employee</option>

                  {activeEmployees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name}
                    </option>
                  ))}
                </select>

                {activeEmployees.length === 0 && (
                  <small className="text-danger">
                    No active employees assigned to Pods. Assign employees to Pods first.
                  </small>
                )}
              </div>

              {/* Brand */}
              <div className="mb-3">
                <label className="form-label">Brand *</label>

                <select
                  className="form-select"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select brand</option>

                  {activeBrands.map((brand) => (
                    <option key={brand._id} value={brand._id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Process */}
              <div className="mb-3">
                <label className="form-label">Process *</label>

                <select
                  className="form-select"
                  name="process"
                  value={formData.process}
                  onChange={handleChange}
                  required
                  disabled={!formData.brand}
                >
                  <option value="">Select process</option>

                  {availableProcesses.map((process) => (
                    <option key={process._id} value={process._id}>
                      {process.name}
                    </option>
                  ))}
                </select>

                {formData.brand && availableProcesses.length === 0 && (
                  <small className="text-danger">
                    No active processes found for this brand.
                  </small>
                )}
              </div>

              {/* Operational Pod */}
              <div className="mb-3">
                <label className="form-label">Operational Pod *</label>

                <select
                  className="form-select"
                  name="pod"
                  value={formData.pod}
                  disabled
                  required
                >
                  <option value="">
                    {formData.employee
                      ? "No Pod assigned"
                      : "Select employee first"}
                  </option>

                  {selectedPod && (
                    <option value={selectedPod._id}>
                      {selectedPod.name}
                    </option>
                  )}
                </select>

                {formData.employee && !selectedEmployee?.pod && (
                  <small className="text-danger">
                    This employee has not been assigned to a Pod.
                  </small>
                )}

                <small className="text-muted">
                  Pod is automatically selected based on the employee's current Pod.
                </small>
              </div>

              {formError && (
                <div className="alert alert-danger py-2">
                  {formError}
                </div>
              )}

              {/* Footer */}
              <div className="modal-footer-custom">
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={
                    saving ||
                    !formData.employee ||
                    !formData.brand ||
                    !formData.process ||
                    !formData.pod
                  }
                >
                  {saving ? (
                    "Saving..."
                  ) : editingId ? (
                    "Save Changes"
                  ) : (
                    "Create Assignment"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Assignments;