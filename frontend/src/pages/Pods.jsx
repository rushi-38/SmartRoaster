import { useEffect, useState } from "react";

import {
  getPods,
  createPod,
  updatePod,
  deletePod,
} from "../services/podService";

import { getEmployees } from "../services/employeeService";

const emptyForm = {
  name: "",
  lead: "",
  members: [],
  description: "",
};

// Get employee ID whether populated or not
const getId = (employee) => {
  if (!employee) return "";
  return typeof employee === "object" ? employee._id : employee;
};

// Get employee name safely
const getName = (employee) => {
  if (!employee) return "Not Assigned";
  return typeof employee === "object"
    ? employee.name || "Unknown Employee"
    : employee;
};

const Pods = () => {
  const [pods, setPods] = useState([]);
  const [employeeOptions, setEmployeeOptions] = useState([]);

  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [selectedPod, setSelectedPod] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Fetch pods and employees
  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [podData, employeeData] = await Promise.all([
        getPods(),
        getEmployees(),
      ]);

      setPods(podData.pods || []);

      setEmployeeOptions(
        (employeeData.employees || []).filter(
          (employee) => employee.status === "Active"
        )
      );
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load pods."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Statistics
  const totalEmployees = new Set(
    pods.flatMap((pod) =>
      (pod.members || []).map((member) => getId(member))
    )
  ).size;

  const totalMembers = pods.reduce(
    (total, pod) => total + (pod.members || []).length,
    0
  );

  // Search pods
  const filteredPods = pods.filter((pod) => {
    const leadName = getName(pod.lead);

    return (
      pod.status !== "Inactive" &&
      (
        (pod.name || "").toLowerCase().includes(search.toLowerCase()) ||
        leadName.toLowerCase().includes(search.toLowerCase())
      )
    );
  });

  // Add pod
  const handleAdd = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setError("");
    setShowModal(true);
  };

  // Edit pod
  const handleEdit = (pod) => {
    setEditingId(pod._id);

    setFormData({
      name: pod.name || "",
      lead: getId(pod.lead),
      members: (pod.members || []).map((member) => getId(member)),
      description: pod.description || "",
    });

    setError("");
    setShowModal(true);
  };

  // Handle input
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle member selection
  const handleMemberChange = (e) => {
    const selected = Array.from(
      e.target.selectedOptions,
      (option) => option.value
    );

    setFormData((prev) => ({
      ...prev,
      members: selected,
    }));
  };

  // Save pod
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.lead) {
      setError("Please select a pod lead.");
      return;
    }

    if (!formData.members.includes(formData.lead)) {
      setError("Please include the pod lead in the team members.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const payload = {
        name: formData.name.trim(),
        lead: formData.lead,
        members: formData.members,
        description: formData.description.trim(),
      };

      if (editingId) {
        await updatePod(editingId, payload);
        setMessage("Pod updated successfully.");
      } else {
        await createPod(payload);
        setMessage("Pod created successfully.");
      }

      setShowModal(false);
      setFormData(emptyForm);

      await fetchData();
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to save pod."
      );
    } finally {
      setSaving(false);
    }
  };

  // Delete pod
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to deactivate this pod?")) {
      return;
    }

    try {
      setError("");
      setMessage("");

      await deletePod(id);

      setMessage("Pod deactivated successfully.");

      if (selectedPod?._id === id) {
        setSelectedPod(null);
      }

      await fetchData();
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to deactivate pod."
      );
    }
  };

  return (
    <div className="pods-page">

      {/* Header */}
      <div className="page-heading">
        <div>
          <h3>Pod Management</h3>
          <p>
            Organize employees into operational teams and assign pod leads.
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleAdd}>
          <i className="bi bi-plus-lg me-2"></i>
          Create New Pod
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

        <div className="col-md-4">
          <div className="employee-stat-card">
            <div>
              <p>Total Pods</p>
              <h3>
                {pods.filter((pod) => pod.status !== "Inactive").length}
              </h3>
            </div>
            <div className="employee-stat-icon blue">
              <i className="bi bi-diagram-3"></i>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="employee-stat-card">
            <div>
              <p>Total Team Members</p>
              <h3>{totalEmployees}</h3>
            </div>
            <div className="employee-stat-icon green">
              <i className="bi bi-people"></i>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="employee-stat-card">
            <div>
              <p>Total Pod Assignments</p>
              <h3>{totalMembers}</h3>
            </div>
            <div className="employee-stat-icon purple">
              <i className="bi bi-person-check"></i>
            </div>
          </div>
        </div>

      </div>

      {/* Pod List */}
      <div className="employee-table-card">

        <div className="employee-table-header">
          <div>
            <h5>All Operational Pods</h5>
            <p>Manage your teams and their responsibilities.</p>
          </div>

          <span className="employee-count">
            {filteredPods.length} Pods
          </span>
        </div>

        {/* Search */}
        <div className="employee-filters">
          <div className="employee-search">
            <i className="bi bi-search"></i>

            <input
              type="text"
              placeholder="Search pod or pod lead..."
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
                <th>POD NAME</th>
                <th>POD CODE</th>
                <th>POD LEAD</th>
                <th>TEAM MEMBERS</th>
                <th>DESCRIPTION</th>
                <th>ACTIONS</th>
              </tr>
            </thead>

            <tbody>

              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-5">
                    <div className="spinner-border text-primary"></div>
                    <p className="mt-2 mb-0">Loading pods...</p>
                  </td>
                </tr>
              ) : filteredPods.length > 0 ? (

                filteredPods.map((pod) => {
                  const leadName = getName(pod.lead);
                  const members = pod.members || [];

                  return (
                    <tr key={pod._id}>

                      <td>
                        <div className="pod-name-cell">
                          <div className="pod-icon">
                            <i className="bi bi-diagram-3"></i>
                          </div>
                          <strong>{pod.name}</strong>
                        </div>
                      </td>

                      <td>
                        <span className="employee-id">
                          {pod.code}
                        </span>
                      </td>

                      <td>
                        <div className="pod-lead-cell">
                          <div className="employee-avatar">
                            {leadName.charAt(0).toUpperCase()}
                          </div>
                          {leadName}
                        </div>
                      </td>

                      <td>
                        <button
                          className="members-count-btn"
                          onClick={() => setSelectedPod(pod)}
                        >
                          <i className="bi bi-people me-1"></i>
                          {members.length} Members
                        </button>
                      </td>

                      <td>{pod.description || "-"}</td>

                      <td>
                        <div className="employee-actions">

                          <button onClick={() => handleEdit(pod)}>
                            <i className="bi bi-pencil-square"></i>
                          </button>

                          <button
                            className="delete-action"
                            onClick={() => handleDelete(pod._id)}
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
                    No pods found.
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
                <h5>{editingId ? "Edit Pod" : "Create New Pod"}</h5>
                <p>Enter operational team information.</p>
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

              <div className="mb-3">
                <label className="form-label">Pod Name *</label>

                <input
                  type="text"
                  className="form-control"
                  name="name"
                  placeholder="Enter pod name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Pod Lead *</label>

                <select
                  className="form-select"
                  name="lead"
                  value={formData.lead}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select pod lead</option>

                  {employeeOptions.map((employee) => (
                    <option key={employee._id} value={employee._id}>
                      {employee.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">Team Members *</label>

                <select
                  className="form-select"
                  multiple
                  value={formData.members}
                  onChange={handleMemberChange}
                  required
                  style={{ minHeight: "120px" }}
                >
                  {employeeOptions.map((employee) => (
                    <option key={employee._id} value={employee._id}>
                      {employee.name}
                    </option>
                  ))}
                </select>

                <small className="text-muted">
                  Hold Ctrl to select multiple employees.
                </small>
              </div>

              <div className="mb-3">
                <label className="form-label">Description</label>

                <textarea
                  className="form-control"
                  name="description"
                  rows="3"
                  placeholder="Describe the pod responsibilities"
                  value={formData.description}
                  onChange={handleChange}
                />
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
                  disabled={saving || employeeOptions.length === 0}
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Save Changes"
                      : "Create Pod"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* View Team Modal */}
      {selectedPod && (

        <div className="custom-modal-overlay">

          <div className="custom-employee-modal">

            <div className="modal-header-custom">
              <div>
                <h5>{selectedPod.name} - Team</h5>
                <p>Pod lead: {getName(selectedPod.lead)}</p>
              </div>

              <button
                className="modal-close-btn"
                onClick={() => setSelectedPod(null)}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            {(selectedPod.members || []).length > 0 ? (
              selectedPod.members.map((member) => {
                const memberId = getId(member);
                const memberName = getName(member);
                const isLead = memberId === getId(selectedPod.lead);

                return (
                  <div className="pod-member-row" key={memberId}>

                    <div className="employee-avatar">
                      {memberName.charAt(0).toUpperCase()}
                    </div>

                    <span>{memberName}</span>

                    {isLead && (
                      <span className="employee-count ms-auto">
                        Pod Lead
                      </span>
                    )}

                  </div>
                );
              })
            ) : (
              <p className="text-muted text-center py-4">
                No team members assigned.
              </p>
            )}

          </div>

        </div>
      )}

    </div>
  );
};

export default Pods;