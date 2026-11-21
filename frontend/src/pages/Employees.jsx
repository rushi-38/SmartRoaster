import { useEffect, useState } from "react";

import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from "../services/employeeService";

import { getPods } from "../services/podService";

const emptyForm = {
  name: "",
  email: "",
  pod: "",
  role: "Team Member",
  weeklyOff: "Sunday",
  status: "Active",
};

const getPodId = (pod) => {
  if (!pod) return "";
  return typeof pod === "object" ? pod._id : pod;
};

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [pods, setPods] = useState([]);

  const [search, setSearch] = useState("");
  const [podFilter, setPodFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Fetch employees and pods
  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [employeeData, podData] = await Promise.all([
        getEmployees(),
        getPods(),
      ]);

      setEmployees(employeeData.employees || []);
      setPods(podData.pods || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load employees and pods."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Statistics
  const totalEmployees = employees.length;

  const activeEmployees = employees.filter(
    (emp) => emp.status === "Active"
  ).length;

  const inactiveEmployees = employees.filter(
    (emp) => emp.status === "Inactive"
  ).length;

  const totalPods = pods.filter(
    (pod) => pod.status !== "Inactive"
  ).length;

  // Search and filters
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name?.toLowerCase().includes(search.toLowerCase()) ||
      emp.employeeCode?.toLowerCase().includes(search.toLowerCase()) ||
      emp.email?.toLowerCase().includes(search.toLowerCase());

    const employeePodId = getPodId(emp.pod);

    const matchesPod =
      podFilter === "All" || employeePodId === podFilter;

    const matchesStatus =
      statusFilter === "All" || emp.status === statusFilter;

    return matchesSearch && matchesPod && matchesStatus;
  });

  // Open Add Modal
  const handleAdd = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setError("");
    setShowModal(true);
  };

  // Open Edit Modal
  const handleEdit = (employee) => {
    setEditingId(employee._id);

    setFormData({
      name: employee.name || "",
      email: employee.email || "",
      pod: getPodId(employee.pod),
      role: employee.role || "Team Member",
      weeklyOff: employee.weeklyOff || "Sunday",
      status: employee.status || "Active",
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

  // Save employee
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      // Send Pod ObjectId, not Pod name.
      // Send null when no Pod is selected.
      const employeeData = {
        ...formData,
        pod: formData.pod || null,
      };

      if (editingId) {
        await updateEmployee(editingId, employeeData);
        setMessage("Employee updated successfully.");
      } else {
        await createEmployee({
          ...employeeData,
          employeeCode: `EMP${Date.now()}`,
        });

        setMessage("Employee added successfully.");
      }

      setShowModal(false);
      setFormData(emptyForm);

      await fetchData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to save employee."
      );
    } finally {
      setSaving(false);
    }
  };

  // Deactivate employee
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to deactivate this employee?"
    );

    if (!confirmDelete) return;

    try {
      setError("");
      setMessage("");

      await deleteEmployee(id);

      setMessage("Employee deactivated successfully.");

      await fetchData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to deactivate employee."
      );
    }
  };

  return (
    <div className="employees-page">

      {/* Page Header */}
      <div className="page-heading">
        <div>
          <h3>Employee Management</h3>
          <p>
            Manage your workforce, employee details and availability.
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleAdd}>
          <i className="bi bi-plus-lg me-2"></i>
          Add Employee
        </button>
      </div>

      {/* Notifications */}
      {message && (
        <div className="alert alert-success alert-dismissible fade show">
          {message}
          <button
            type="button"
            className="btn-close"
            onClick={() => setMessage("")}
          ></button>
        </div>
      )}

      {error && (
        <div className="alert alert-danger alert-dismissible fade show">
          {error}
          <button
            type="button"
            className="btn-close"
            onClick={() => setError("")}
          ></button>
        </div>
      )}

      {/* Statistics */}
      <div className="row g-3 mb-4">

        <div className="col-xl-3 col-md-6">
          <div className="employee-stat-card">
            <div>
              <p>Total Employees</p>
              <h3>{totalEmployees}</h3>
            </div>
            <div className="employee-stat-icon blue">
              <i className="bi bi-people"></i>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6">
          <div className="employee-stat-card">
            <div>
              <p>Active Employees</p>
              <h3>{activeEmployees}</h3>
            </div>
            <div className="employee-stat-icon green">
              <i className="bi bi-person-check"></i>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6">
          <div className="employee-stat-card">
            <div>
              <p>Inactive Employees</p>
              <h3>{inactiveEmployees}</h3>
            </div>
            <div className="employee-stat-icon orange">
              <i className="bi bi-person-dash"></i>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6">
          <div className="employee-stat-card">
            <div>
              <p>Total Pods</p>
              <h3>{totalPods}</h3>
            </div>
            <div className="employee-stat-icon purple">
              <i className="bi bi-diagram-3"></i>
            </div>
          </div>
        </div>

      </div>

      {/* Employee Table */}
      <div className="employee-table-card">

        <div className="employee-table-header">
          <div>
            <h5>All Employees</h5>
            <p>
              View and manage your organization employees.
            </p>
          </div>

          <span className="employee-count">
            {filteredEmployees.length} Employees
          </span>
        </div>

        {/* Filters */}
        <div className="employee-filters">

          <div className="employee-search">
            <i className="bi bi-search"></i>

            <input
              type="text"
              placeholder="Search by name, ID or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="form-select"
            value={podFilter}
            onChange={(e) => setPodFilter(e.target.value)}
          >
            <option value="All">All Pods</option>

            {pods
              .filter((pod) => pod.status !== "Inactive")
              .map((pod) => (
                <option key={pod._id} value={pod._id}>
                  {pod.name}
                </option>
              ))}
          </select>

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

        {/* Table */}
        <div className="table-responsive">

          <table className="table employee-table align-middle">

            <thead>
              <tr>
                <th>EMPLOYEE</th>
                <th>EMPLOYEE ID</th>
                <th>POD</th>
                <th>ROLE</th>
                <th>WEEKLY OFF</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>

            <tbody>

              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-5">
                    <div className="spinner-border text-primary"></div>
                    <p className="mt-2 mb-0">
                      Loading employees...
                    </p>
                  </td>
                </tr>
              ) : filteredEmployees.length > 0 ? (

                filteredEmployees.map((employee) => (

                  <tr key={employee._id}>

                    <td>
                      <div className="employee-name-cell">

                        <div className="employee-avatar">
                          {employee.name?.charAt(0).toUpperCase()}
                        </div>

                        <div>
                          <h6>{employee.name}</h6>
                          <small>{employee.email}</small>
                        </div>

                      </div>
                    </td>

                    <td>
                      <span className="employee-id">
                        {employee.employeeCode}
                      </span>
                    </td>

                    <td>
                      <span className="pod-badge">
                        {employee.pod?.name || "Not Assigned"}
                      </span>
                    </td>

                    <td>{employee.role}</td>

                    <td>
                      <i className="bi bi-calendar3 me-2 text-muted"></i>
                      {employee.weeklyOff}
                    </td>

                    <td>
                      <span
                        className={`status-badge ${
                          employee.status === "Active"
                            ? "active-status"
                            : "inactive-status"
                        }`}
                      >
                        {employee.status}
                      </span>
                    </td>

                    <td>
                      <div className="employee-actions">

                        <button
                          title="Edit"
                          onClick={() => handleEdit(employee)}
                        >
                          <i className="bi bi-pencil-square"></i>
                        </button>

                        {employee.status === "Active" && (
                          <button
                            title="Deactivate"
                            className="delete-action"
                            onClick={() => handleDelete(employee._id)}
                          >
                            <i className="bi bi-trash3"></i>
                          </button>
                        )}

                      </div>
                    </td>

                  </tr>

                ))

              ) : (

                <tr>
                  <td colSpan="7" className="text-center py-5">
                    <i className="bi bi-search fs-2 text-muted"></i>
                    <p className="mt-2 mb-0">
                      No employees found.
                    </p>
                  </td>
                </tr>

              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* Add / Edit Employee Modal */}
      {showModal && (

        <div className="custom-modal-overlay">

          <div className="custom-employee-modal">

            <div className="modal-header-custom">

              <div>
                <h5>
                  {editingId ? "Edit Employee" : "Add New Employee"}
                </h5>

                <p>Enter employee information below.</p>
              </div>

              <button
                className="modal-close-btn"
                onClick={() => setShowModal(false)}
                disabled={saving}
              >
                <i className="bi bi-x-lg"></i>
              </button>

            </div>

            <form onSubmit={handleSubmit}>

              <div className="row g-3">

                <div className="col-md-6">
                  <label className="form-label">
                    Employee Name *
                  </label>

                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    placeholder="Enter full name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">
                    Email Address *
                  </label>

                  <input
                    type="email"
                    className="form-control"
                    name="email"
                    placeholder="Enter email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">
                    Operational Pod
                  </label>

                  <select
                    className="form-select"
                    name="pod"
                    value={formData.pod}
                    onChange={handleChange}
                  >
                    <option value="">Not Assigned</option>

                    {pods
                      .filter((pod) => pod.status !== "Inactive")
                      .map((pod) => (
                        <option key={pod._id} value={pod._id}>
                          {pod.name}
                        </option>
                      ))}
                  </select>

                  <small className="text-muted">
                    You can assign a Pod later from Pod Management.
                  </small>
                </div>

                <div className="col-md-6">
                  <label className="form-label">
                    Employee Role *
                  </label>

                  <select
                    className="form-select"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                  >
                    <option value="Team Member">Team Member</option>
                    <option value="Pod Lead">Pod Lead</option>
                    <option value="Operations Manager">
                      Operations Manager
                    </option>
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label">
                    Weekly Off *
                  </label>

                  <select
                    className="form-select"
                    name="weeklyOff"
                    value={formData.weeklyOff}
                    onChange={handleChange}
                  >
                    {[
                      "Monday",
                      "Tuesday",
                      "Wednesday",
                      "Thursday",
                      "Friday",
                      "Saturday",
                      "Sunday",
                    ].map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label">
                    Employee Status
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

              </div>

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
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Save Changes"
                      : "Add Employee"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
};

export default Employees;