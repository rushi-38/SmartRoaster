import React, { useState } from "react";

const getId = (value) => {
  if (!value) return "";
  return String(value._id || value);
};

const getName = (value) => {
  if (!value) return "N/A";
  return value.name || "N/A";
};

const RosterEditModal = ({
  allocation,
  employees,
  assignments,
  roster,
  approvedLeaves,
  onSave,
  onClose,
}) => {
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [error, setError] = useState("");

  if (!allocation) return null;

  const allocationEmployeeId = getId(allocation.employee);
  const allocationBrandId = getId(allocation.brand);
  const allocationProcessId = getId(allocation.process);

  // Find employees eligible for replacement
  const getEligibleEmployees = () => {
    return employees.filter((employee) => {
      const employeeId = getId(employee._id);

      // Employee must be active
      if (employee.status !== "Active") return false;

      // Exclude currently assigned employee
      if (employeeId === allocationEmployeeId) return false;

      // Employee must have the required assignment
      const hasAssignment = assignments.some((item) => {
        return (
          getId(item.employee) === employeeId &&
          getId(item.brand) === allocationBrandId &&
          getId(item.process) === allocationProcessId &&
          item.status === "Active"
        );
      });

      if (!hasAssignment) return false;

      // Find allocations for the selected date
      const currentDay = roster.find(
        (day) => day.date === allocation.date
      );

      // Employee cannot already be allocated to another process
      const alreadyAllocated = currentDay?.allocations.some(
        (item) => getId(item.employee) === employeeId
      );

      if (alreadyAllocated) return false;

      // Employee cannot work on weekly off
      const weekday = new Date(
        `${allocation.date}T00:00:00`
      ).toLocaleDateString("en-IN", { weekday: "long" });

      if (employee.weeklyOff === weekday) return false;

      // Employee cannot work during approved leave
      const onLeave = approvedLeaves.some((leave) => {
        const leaveEmployeeId = getId(leave.employee);

        const startDate = new Date(leave.startDate);
        const endDate = new Date(leave.endDate);
        const allocationDate = new Date(
          `${allocation.date}T00:00:00`
        );

        return (
          leaveEmployeeId === employeeId &&
          leave.status === "Approved" &&
          allocationDate >= new Date(
            startDate.getFullYear(),
            startDate.getMonth(),
            startDate.getDate()
          ) &&
          allocationDate <= new Date(
            endDate.getFullYear(),
            endDate.getMonth(),
            endDate.getDate()
          )
        );
      });

      if (onLeave) return false;

      return true;
    });
  };

  const eligibleEmployees = getEligibleEmployees();

  // Save replacement
  const handleSave = () => {
    if (!selectedEmployee) {
      setError("Please select an employee.");
      return;
    }

    const newEmployee = employees.find(
      (employee) => getId(employee._id) === selectedEmployee
    );

    if (
      !newEmployee ||
      !eligibleEmployees.some(
        (employee) => getId(employee._id) === selectedEmployee
      )
    ) {
      setError("This employee is not eligible for this allocation.");
      return;
    }

    onSave(allocation, newEmployee);
  };

  return (
    <div
      className="roster-modal-overlay"
      onClick={onClose}
    >
      <div
        className="roster-edit-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="roster-modal-header">
          <div>
            <h5>Edit Employee Allocation</h5>
            <p>Replace the employee assigned to this task.</p>
          </div>

          <button
            type="button"
            className="btn-close"
            onClick={onClose}
            aria-label="Close"
          ></button>
        </div>

        {/* Modal Body */}
        <div className="roster-modal-body">
          <div className="mb-3">
            <label className="form-label">Date</label>

            <input
              type="text"
              className="form-control"
              value={allocation.date}
              readOnly
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Brand</label>

            <input
              type="text"
              className="form-control"
              value={getName(allocation.brand)}
              readOnly
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Process</label>

            <input
              type="text"
              className="form-control"
              value={getName(allocation.process)}
              readOnly
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Current Employee</label>

            <input
              type="text"
              className="form-control"
              value={getName(allocation.employee)}
              readOnly
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Replace With</label>

            <select
              className="form-select"
              value={selectedEmployee}
              onChange={(e) => {
                setSelectedEmployee(e.target.value);
                setError("");
              }}
            >
              <option value="">Select Employee</option>

              {eligibleEmployees.map((employee) => (
                <option
                  key={employee._id}
                  value={employee._id}
                >
                  {employee.name} - {getName(employee.pod)}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="alert alert-danger">
              {error}
            </div>
          )}

          {eligibleEmployees.length === 0 && (
            <div className="alert alert-warning">
              No eligible replacement employees are available
              for this date and process.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="roster-modal-footer">
          <button
            type="button"
            className="btn btn-light"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
            disabled={!selectedEmployee || eligibleEmployees.length === 0}
          >
            <i className="bi bi-check-lg me-1"></i>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default RosterEditModal;