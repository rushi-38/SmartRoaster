import { useEffect, useState } from "react";

import {
  getLeaves,
  createLeave,
  updateLeaveStatus,
  deleteLeave,
  toBackendLeaveType,
  toFrontendLeaveType,
} from "../services/leaveService";

import { getEmployees } from "../services/employeeService";

const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const initialHolidays = [
  {
    id: 1,
    name: "Christmas",
    date: "2026-12-25",
    description: "National holiday",
  },
  {
    id: 2,
    name: "New Year",
    date: "2027-01-01",
    description: "New Year celebration",
  },
];

const emptyLeave = {
  employee: "",
  type: "Planned Leave",
  from: "",
  to: "",
  reason: "",
};

function Leaves() {
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [holidays, setHolidays] = useState(initialHolidays);

  const [activeTab, setActiveTab] = useState("leaves");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(emptyLeave);

  const [holidayForm, setHolidayForm] = useState({
    name: "",
    date: "",
    description: "",
  });

  const [showHolidayForm, setShowHolidayForm] = useState(false);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Fetch leaves and employees
  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [leaveResponse, employeeResponse] = await Promise.all([
        getLeaves(),
        getEmployees(),
      ]);

      setLeaves(leaveResponse.leaves || []);
      setEmployees(employeeResponse.employees || []);
    } catch (err) {
      console.error("Error fetching leave data:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load leave data. Please check your backend."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Statistics
  const approved = leaves.filter(
    (leave) => leave.status === "Approved"
  ).length;

  const pending = leaves.filter(
    (leave) => leave.status === "Pending"
  ).length;

  const rejected = leaves.filter(
    (leave) => leave.status === "Rejected"
  ).length;

  // Convert backend leave into frontend format
  const formatLeave = (leave) => ({
    ...leave,
    employeeName: leave.employee?.name || "Unknown Employee",
    type: toFrontendLeaveType(leave.leaveType),
    from: leave.startDate
      ? new Date(leave.startDate).toISOString().split("T")[0]
      : "",
    to: leave.endDate
      ? new Date(leave.endDate).toISOString().split("T")[0]
      : "",
  });

  // Submit leave request
  const handleLeaveSubmit = async (e) => {
    e.preventDefault();

    if (formData.to < formData.from) {
      alert("End date cannot be before start date.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        employee: formData.employee,
        leaveType: toBackendLeaveType(formData.type),
        startDate: formData.from,
        endDate: formData.to,
        reason: formData.reason,
      };

      await createLeave(payload);

      await fetchData();

      setShowModal(false);
      setFormData(emptyLeave);
    } catch (err) {
      console.error("Error creating leave:", err);

      setError(
        err.response?.data?.message || "Unable to submit leave request."
      );
    } finally {
      setSaving(false);
    }
  };

  // Approve or reject leave
  const updateStatus = async (id, status) => {
    try {
      setError("");

      await updateLeaveStatus(id, status);

      await fetchData();
    } catch (err) {
      console.error("Error updating leave status:", err);

      setError(
        err.response?.data?.message || "Unable to update leave status."
      );
    }
  };

  // Delete leave
  const handleDeleteLeave = async (id) => {
    if (!window.confirm("Delete this leave request?")) {
      return;
    }

    try {
      setError("");

      await deleteLeave(id);

      await fetchData();
    } catch (err) {
      console.error("Error deleting leave:", err);

      setError(
        err.response?.data?.message || "Unable to delete leave request."
      );
    }
  };

  // Add holiday (local for now)
  const handleHolidaySubmit = (e) => {
    e.preventDefault();

    if (holidays.some((h) => h.date === holidayForm.date)) {
      alert("A holiday already exists on this date.");
      return;
    }

    setHolidays((prev) => [
      ...prev,
      {
        id: Date.now(),
        ...holidayForm,
      },
    ]);

    setHolidayForm({
      name: "",
      date: "",
      description: "",
    });

    setShowHolidayForm(false);
  };

  // Weekly off display uses employee records
  const updateWeeklyOff = async (employeeId, day) => {
    try {
      setError("");

      // This will be connected to the employee update API
      // when we implement persistent weekly-off management.
      setEmployees((prev) =>
        prev.map((employee) =>
          employee._id === employeeId
            ? { ...employee, weeklyOff: day }
            : employee
        )
      );
    } catch (err) {
      setError("Unable to update weekly off.");
    }
  };

  const filteredLeaves = leaves
    .map(formatLeave)
    .filter((leave) =>
      leave.employeeName.toLowerCase().includes(search.toLowerCase())
    );

  const getStatusClass = (status) => {
    if (status === "Approved") return "active-status";
    if (status === "Pending") return "pending-status";

    return "inactive-status";
  };

  return (
    <div>
      {/* HEADER */}
      <div className="page-heading">
        <div>
          <h3>Leaves & Holidays</h3>
          <p>Manage employee availability, weekly offs and holidays.</p>
        </div>

        {activeTab === "leaves" && (
          <button
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
          >
            <i className="bi bi-plus-lg me-2"></i>
            Add Leave
          </button>
        )}
      </div>

      {/* ERROR MESSAGE */}
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

      {/* STATISTICS */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="employee-stat-card">
            <div>
              <p>Total Requests</p>
              <h3>{leaves.length}</h3>
            </div>
            <div className="employee-stat-icon blue">
              <i className="bi bi-calendar-event"></i>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="employee-stat-card">
            <div>
              <p>Approved</p>
              <h3>{approved}</h3>
            </div>
            <div className="employee-stat-icon green">
              <i className="bi bi-check-circle"></i>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="employee-stat-card">
            <div>
              <p>Pending</p>
              <h3>{pending}</h3>
            </div>
            <div className="employee-stat-icon purple">
              <i className="bi bi-hourglass-split"></i>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="employee-stat-card">
            <div>
              <p>Rejected</p>
              <h3>{rejected}</h3>
            </div>
            <div className="employee-stat-icon orange">
              <i className="bi bi-x-circle"></i>
            </div>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="leave-tabs">
        <button
          className={activeTab === "leaves" ? "active" : ""}
          onClick={() => setActiveTab("leaves")}
        >
          <i className="bi bi-calendar-check me-2"></i>
          Leave Requests
        </button>

        <button
          className={activeTab === "weekly" ? "active" : ""}
          onClick={() => setActiveTab("weekly")}
        >
          <i className="bi bi-calendar-week me-2"></i>
          Weekly Offs
        </button>

        <button
          className={activeTab === "holidays" ? "active" : ""}
          onClick={() => setActiveTab("holidays")}
        >
          <i className="bi bi-calendar-heart me-2"></i>
          Public Holidays
        </button>
      </div>

      {/* LEAVE REQUESTS */}
      {activeTab === "leaves" && (
        <div className="employee-table-card">
          <div className="employee-table-header">
            <div>
              <h5>Employee Leave Requests</h5>
              <p>Review and manage employee leave applications.</p>
            </div>

            <span className="employee-count">
              {filteredLeaves.length} Requests
            </span>
          </div>

          <div className="employee-filters">
            <div className="employee-search">
              <i className="bi bi-search"></i>

              <input
                placeholder="Search employee..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="table-responsive">
            <table className="table employee-table align-middle">
              <thead>
                <tr>
                  <th>EMPLOYEE</th>
                  <th>LEAVE TYPE</th>
                  <th>FROM</th>
                  <th>TO</th>
                  <th>REASON</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-4">
                      Loading leave requests...
                    </td>
                  </tr>
                ) : (
                  <>
                    {filteredLeaves.map((leave) => (
                      <tr key={leave._id}>
                        <td>
                          <strong>{leave.employeeName}</strong>
                        </td>

                        <td>{leave.type}</td>
                        <td>{leave.from}</td>
                        <td>{leave.to}</td>
                        <td>{leave.reason || "-"}</td>

                        <td>
                          <span
                            className={`status-badge ${getStatusClass(
                              leave.status
                            )}`}
                          >
                            {leave.status}
                          </span>
                        </td>

                        <td>
                          <div className="employee-actions">
                            {leave.status === "Pending" && (
                              <>
                                <button
                                  title="Approve"
                                  onClick={() =>
                                    updateStatus(leave._id, "Approved")
                                  }
                                >
                                  <i className="bi bi-check-lg text-success"></i>
                                </button>

                                <button
                                  title="Reject"
                                  onClick={() =>
                                    updateStatus(leave._id, "Rejected")
                                  }
                                >
                                  <i className="bi bi-x-lg text-danger"></i>
                                </button>
                              </>
                            )}

                            <button
                              className="delete-action"
                              onClick={() => handleDeleteLeave(leave._id)}
                            >
                              <i className="bi bi-trash3"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {filteredLeaves.length === 0 && (
                      <tr>
                        <td colSpan="7" className="text-center py-4">
                          No leave requests found.
                        </td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* WEEKLY OFFS */}
      {activeTab === "weekly" && (
        <div className="employee-table-card">
          <div className="employee-table-header">
            <div>
              <h5>Employee Weekly Off Configuration</h5>
              <p>Assign different weekly off days to employees.</p>
            </div>

            <span className="employee-count">
              {employees.length} Employees
            </span>
          </div>

          <div className="table-responsive">
            <table className="table employee-table align-middle">
              <thead>
                <tr>
                  <th>EMPLOYEE</th>
                  <th>WEEKLY OFF DAY</th>
                </tr>
              </thead>

              <tbody>
                {employees.map((employee) => (
                  <tr key={employee._id}>
                    <td>
                      <strong>{employee.name}</strong>
                    </td>

                    <td>
                      <select
                        className="form-select weekly-off-select"
                        value={employee.weeklyOff || ""}
                        onChange={(e) =>
                          updateWeeklyOff(employee._id, e.target.value)
                        }
                      >
                        <option value="">Select weekly off</option>

                        {days.map((day) => (
                          <option key={day} value={day}>
                            {day}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}

                {employees.length === 0 && (
                  <tr>
                    <td colSpan="2" className="text-center py-4">
                      No employees found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PUBLIC HOLIDAYS */}
      {activeTab === "holidays" && (
        <div className="employee-table-card">
          <div className="employee-table-header">
            <div>
              <h5>Public Holiday Calendar</h5>
              <p>Manage organization-wide public holidays.</p>
            </div>

            <button
              className="btn btn-primary"
              onClick={() => setShowHolidayForm(true)}
            >
              <i className="bi bi-plus-lg me-2"></i>
              Add Holiday
            </button>
          </div>

          <div className="table-responsive">
            <table className="table employee-table align-middle">
              <thead>
                <tr>
                  <th>HOLIDAY NAME</th>
                  <th>DATE</th>
                  <th>DESCRIPTION</th>
                  <th>ACTION</th>
                </tr>
              </thead>

              <tbody>
                {holidays.map((holiday) => (
                  <tr key={holiday.id}>
                    <td>
                      <strong>{holiday.name}</strong>
                    </td>

                    <td>{holiday.date}</td>
                    <td>{holiday.description}</td>

                    <td>
                      <button
                        className="delete-holiday-btn"
                        onClick={() =>
                          setHolidays((prev) =>
                            prev.filter((h) => h.id !== holiday.id)
                          )
                        }
                      >
                        <i className="bi bi-trash3"></i>
                      </button>
                    </td>
                  </tr>
                ))}

                {holidays.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center py-4">
                      No holidays added.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD LEAVE MODAL */}
      {showModal && (
        <div className="custom-modal-overlay">
          <div className="custom-employee-modal">
            <div className="modal-header-custom">
              <div>
                <h5>Add Leave Request</h5>
                <p>Enter employee leave details.</p>
              </div>

              <button
                className="modal-close-btn"
                onClick={() => setShowModal(false)}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <form onSubmit={handleLeaveSubmit}>
              <div className="mb-3">
                <label className="form-label">Employee *</label>

                <select
                  className="form-select"
                  value={formData.employee}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      employee: e.target.value,
                    })
                  }
                  required
                >
                  <option value="">Select employee</option>

                  {employees
                    .filter((emp) => emp.status === "Active")
                    .map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.name} ({emp.employeeCode})
                      </option>
                    ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">Leave Type *</label>

                <select
                  className="form-select"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type: e.target.value,
                    })
                  }
                >
                  <option>Planned Leave</option>
                  <option>Sick Leave</option>
                  <option>Comp-Off</option>
                </select>
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Start Date *</label>

                  <input
                    type="date"
                    className="form-control"
                    value={formData.from}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        from: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label">End Date *</label>

                  <input
                    type="date"
                    className="form-control"
                    value={formData.to}
                    min={formData.from || undefined}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        to: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Reason</label>

                <textarea
                  className="form-control"
                  rows="3"
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      reason: e.target.value,
                    })
                  }
                  placeholder="Enter reason..."
                />
              </div>

              <div className="modal-footer-custom">
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>

                <button
                  className="btn btn-primary"
                  disabled={saving || employees.length === 0}
                >
                  {saving ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD HOLIDAY MODAL */}
      {showHolidayForm && (
        <div className="custom-modal-overlay">
          <div className="custom-employee-modal">
            <div className="modal-header-custom">
              <div>
                <h5>Add Public Holiday</h5>
                <p>Add a holiday to the organization calendar.</p>
              </div>

              <button
                className="modal-close-btn"
                onClick={() => setShowHolidayForm(false)}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <form onSubmit={handleHolidaySubmit}>
              <div className="mb-3">
                <label className="form-label">Holiday Name *</label>

                <input
                  className="form-control"
                  value={holidayForm.name}
                  onChange={(e) =>
                    setHolidayForm({
                      ...holidayForm,
                      name: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Date *</label>

                <input
                  type="date"
                  className="form-control"
                  value={holidayForm.date}
                  onChange={(e) =>
                    setHolidayForm({
                      ...holidayForm,
                      date: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Description</label>

                <input
                  className="form-control"
                  value={holidayForm.description}
                  onChange={(e) =>
                    setHolidayForm({
                      ...holidayForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="Optional description"
                />
              </div>

              <div className="modal-footer-custom">
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={() => setShowHolidayForm(false)}
                >
                  Cancel
                </button>

                <button className="btn btn-primary">
                  Save Holiday
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Leaves;