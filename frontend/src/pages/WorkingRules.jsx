import { useEffect, useState } from "react";

import {
  getWorkingRules,
  createWorkingRule,
  updateWorkingRule,
  deleteWorkingRule,
} from "../services/workingRuleService";

import { getBrands } from "../services/brandService";
import { getProcesses } from "../services/processService";

const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const emptyForm = {
  brand: "",
  process: "",
  operatingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  holidayWorking: false,
  minimumStaff: 1,
};

function WorkingRules() {
  const [rules, setRules] = useState([]);
  const [brands, setBrands] = useState([]);
  const [processes, setProcesses] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
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

  // Get ID from populated or unpopulated references
  const getId = (value) => {
    if (!value) return "";
    return typeof value === "object" ? value._id : value;
  };

  // Fetch working rules, brands and processes
  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [ruleResponse, brandResponse, processResponse] =
        await Promise.all([
          getWorkingRules(),
          getBrands(),
          getProcesses(),
        ]);

      setRules(getArray(ruleResponse, "rules"));
      setBrands(getArray(brandResponse, "brands"));
      setProcesses(getArray(processResponse, "processes"));
    } catch (err) {
      console.error("Error fetching working rules:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load working rules. Please check your backend."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Only active brands and processes
  const activeBrands = brands.filter(
    (brand) => brand.status === "Active"
  );

  const activeProcesses = processes.filter(
    (process) => process.status === "Active"
  );

  // Processes belonging to selected brand
  const availableProcesses = activeProcesses.filter(
    (process) => getId(process.brand) === formData.brand
  );

  // Statistics
  const fullTimeRules = rules.filter(
    (rule) => rule.workingDays?.length === 7
  ).length;

  const totalCoverage = rules.reduce(
    (total, rule) => total + Number(rule.minimumStaff || 0),
    0
  );

  // Search rules
  const filteredRules = rules.filter((rule) => {
    const brandName = rule.brand?.name || "";
    const processName = rule.process?.name || "";

    return (
      brandName.toLowerCase().includes(search.toLowerCase()) ||
      processName.toLowerCase().includes(search.toLowerCase())
    );
  });

  // Open add modal
  const handleAdd = () => {
    setEditingId(null);
    setFormData({
      ...emptyForm,
      operatingDays: [...emptyForm.operatingDays],
    });
    setFormError("");
    setShowModal(true);
  };

  // Open edit modal
  const handleEdit = (rule) => {
    setEditingId(rule._id);

    setFormData({
      brand: getId(rule.brand),
      process: getId(rule.process),
      operatingDays: [...(rule.workingDays || [])],

      // Backend stores the opposite value
      holidayWorking: !rule.publicHolidaysOff,

      minimumStaff: rule.minimumStaff,
    });

    setFormError("");
    setShowModal(true);
  };

  // Handle operating day selection
  const handleDayChange = (day) => {
    setFormData((prev) => {
      const exists = prev.operatingDays.includes(day);

      return {
        ...prev,
        operatingDays: exists
          ? prev.operatingDays.filter((d) => d !== day)
          : [...prev.operatingDays, day],
      };
    });
  };

  // Handle form changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormError("");

    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };

      // Reset process when brand changes
      if (name === "brand") {
        updated.process = "";
      }

      return updated;
    });
  };

  // Create or update working rule
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setFormError("");

      if (formData.operatingDays.length === 0) {
        setFormError("Please select at least one operating day.");
        return;
      }

      if (!formData.brand || !formData.process) {
        setFormError("Please select a brand and process.");
        return;
      }

      const payload = {
        brand: formData.brand,
        process: formData.process,

        // Frontend operatingDays -> Backend workingDays
        workingDays: formData.operatingDays,

        minimumStaff: Number(formData.minimumStaff),

        // Frontend holidayWorking -> Backend publicHolidaysOff
        publicHolidaysOff: !formData.holidayWorking,
      };

      if (editingId) {
        await updateWorkingRule(editingId, payload);
        alert("Working rule updated successfully!");
      } else {
        await createWorkingRule(payload);
        alert("Working rule created successfully!");
      }

      setShowModal(false);
      setFormData(emptyForm);
      setEditingId(null);

      await fetchData();
    } catch (err) {
      console.error("Error saving working rule:", err);

      setFormError(
        err.response?.data?.message ||
          "Unable to save working rule. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  // Delete working rule
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this working rule?")) return;

    try {
      await deleteWorkingRule(id);

      alert("Working rule deleted successfully!");

      await fetchData();
    } catch (err) {
      console.error("Error deleting working rule:", err);

      alert(
        err.response?.data?.message ||
          "Unable to delete working rule."
      );
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="page-heading">
        <div>
          <h3>Working Rules</h3>
          <p>
            Configure operating calendars and minimum staffing requirements.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={handleAdd}
          disabled={activeBrands.length === 0}
        >
          <i className="bi bi-plus-lg me-2"></i>
          Add Working Rule
        </button>
      </div>

      {/* Error */}
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
              <p>Total Rules</p>
              <h3>{rules.length}</h3>
            </div>

            <div className="employee-stat-icon blue">
              <i className="bi bi-calendar-check"></i>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="employee-stat-card">
            <div>
              <p>7-Day Operations</p>
              <h3>{fullTimeRules}</h3>
            </div>

            <div className="employee-stat-icon green">
              <i className="bi bi-calendar-week"></i>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="employee-stat-card">
            <div>
              <p>Total Minimum Staffing</p>
              <h3>{totalCoverage}</h3>
            </div>

            <div className="employee-stat-icon purple">
              <i className="bi bi-people"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Information Banner */}
      <div className="working-rule-info mb-4">
        <i className="bi bi-info-circle-fill"></i>

        <div>
          <strong>Client-specific operating schedules</strong>
          <p>
            Different brands and processes can have different operating
            days and staffing requirements.
          </p>
        </div>
      </div>

      {/* Rules Table */}
      <div className="employee-table-card">
        <div className="employee-table-header">
          <div>
            <h5>Configured Working Rules</h5>
            <p>
              Manage the operational requirements of each process.
            </p>
          </div>

          <span className="employee-count">
            {filteredRules.length} Rules
          </span>
        </div>

        {/* Search */}
        <div className="employee-filters">
          <div className="employee-search">
            <i className="bi bi-search"></i>

            <input
              placeholder="Search brand or process..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="table-responsive">
          <table className="table employee-table align-middle">
            <thead>
              <tr>
                <th>BRAND</th>
                <th>PROCESS</th>
                <th>OPERATING DAYS</th>
                <th>PUBLIC HOLIDAYS</th>
                <th>MINIMUM STAFF</th>
                <th>ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-5">
                    <div className="spinner-border text-primary"></div>
                    <p className="mt-2 mb-0">
                      Loading working rules...
                    </p>
                  </td>
                </tr>
              ) : filteredRules.length > 0 ? (
                filteredRules.map((rule) => {
                  const operatingDays = rule.workingDays || [];
                  const holidayWorking = !rule.publicHolidaysOff;

                  return (
                    <tr key={rule._id}>
                      <td>
                        <strong>
                          {rule.brand?.name || "Unknown Brand"}
                        </strong>
                      </td>

                      <td>
                        {rule.process?.name || "Unknown Process"}
                      </td>

                      <td>
                        <div className="working-days-list">
                          {operatingDays.length === 7 ? (
                            <span className="status-badge active-status">
                              All 7 Days
                            </span>
                          ) : (
                            operatingDays.map((day) => (
                              <span key={day} className="day-chip">
                                {day.slice(0, 3)}
                              </span>
                            ))
                          )}
                        </div>
                      </td>

                      <td>
                        <span
                          className={`status-badge ${
                            holidayWorking
                              ? "active-status"
                              : "inactive-status"
                          }`}
                        >
                          {holidayWorking ? "Working" : "Holiday Off"}
                        </span>
                      </td>

                      <td>
                        <span className="staff-count">
                          <i className="bi bi-people me-1"></i>
                          {rule.minimumStaff} Employee(s)
                        </span>
                      </td>

                      <td>
                        <div className="employee-actions">
                          <button onClick={() => handleEdit(rule)}>
                            <i className="bi bi-pencil-square"></i>
                          </button>

                          <button
                            className="delete-action"
                            onClick={() => handleDelete(rule._id)}
                          >
                            <i className="bi bi-trash3"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-5">
                    No working rules found.
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
          <div className="custom-employee-modal working-rule-modal">
            <div className="modal-header-custom">
              <div>
                <h5>
                  {editingId
                    ? "Edit Working Rule"
                    : "Create Working Rule"}
                </h5>

                <p>
                  Define operating requirements for a brand process.
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
                    No active processes available for this brand.
                  </small>
                )}
              </div>

              {/* Operating Days */}
              <div className="mb-3">
                <label className="form-label">
                  Operating Days *
                </label>

                <div className="operating-days-grid">
                  {days.map((day) => (
                    <label
                      key={day}
                      className={`operating-day-option ${
                        formData.operatingDays.includes(day)
                          ? "selected"
                          : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.operatingDays.includes(day)}
                        onChange={() => handleDayChange(day)}
                      />

                      {day.slice(0, 3)}
                    </label>
                  ))}
                </div>

                <small className="text-muted">
                  Select all days on which this process operates.
                </small>
              </div>

              {/* Holiday Working */}
              <div className="holiday-working-option mb-3">
                <div>
                  <strong>Public Holiday Operations</strong>
                  <p>
                    Should this process operate on public holidays?
                  </p>
                </div>

                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    name="holidayWorking"
                    checked={formData.holidayWorking}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Minimum Staff */}
              <div className="mb-3">
                <label className="form-label">
                  Minimum Required Employees *
                </label>

                <input
                  type="number"
                  className="form-control"
                  name="minimumStaff"
                  min="1"
                  value={formData.minimumStaff}
                  onChange={handleChange}
                  required
                />

                <small className="text-muted">
                  Minimum employees required to maintain process coverage.
                </small>
              </div>

              {/* Form Error */}
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
                    !formData.brand ||
                    !formData.process ||
                    formData.operatingDays.length === 0
                  }
                >
                  {saving
                    ? "Saving..."
                    : editingId
                    ? "Save Changes"
                    : "Create Rule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default WorkingRules;