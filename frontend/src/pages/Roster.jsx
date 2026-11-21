import React, { useEffect, useState } from "react";

import RosterEditModal from "../components/RosterEditModal";

import {
  generateMonthlyRoster,
  getRosterByMonth,
} from "../services/rosterService";

import { getEmployees } from "../services/employeeService";
import { getAssignments } from "../services/assignmentService";
import { getBrands } from "../services/brandService";
import { getPods } from "../services/podService";
import { getWorkingRules } from "../services/workingRuleService";
import { getLeaves } from "../services/leaveService";

// Get MongoDB ID
const getId = (value) => {
  if (!value) return "";
  return String(value._id || value);
};

// Get total days in selected month
const getDaysInMonth = (year, month) => {
  return new Date(year, month + 1, 0).getDate();
};

// Get weekday name
const getDayName = (year, month, day) => {
  return new Date(year, month, day).toLocaleDateString("en-IN", {
    weekday: "short",
  });
};

// Normalize MongoDB roster into frontend format
const normalizeRoster = (savedRoster) => {
  if (!savedRoster) return null;

  const days = savedRoster.days || [];

  const roster = days.map((day) => ({
    date: day.date,

    allocations: day.allocations.map((allocation) => ({
      ...allocation,
      date: day.date,

      employeeId: getId(allocation.employee),
      employeeName: allocation.employee?.name || "Unknown Employee",

      brandId: getId(allocation.brand),
      brandName: allocation.brand?.name || "Unknown Brand",

      processId: getId(allocation.process),
      processName: allocation.process?.name || "Unknown Process",
    })),
  }));

  return {
    ...savedRoster,
    roster,
    conflicts: savedRoster.conflicts || [],
    totalConflicts: (savedRoster.conflicts || []).filter(
      (conflict) => !conflict.resolved
    ).length,
  };
};

const Roster = () => {
  const today = new Date();

  // Selected month and year
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());

  // Filters
  const [selectedPod, setSelectedPod] = useState("All");
  const [selectedBrand, setSelectedBrand] = useState("All");

  // Database records
  const [employees, setEmployees] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [brands, setBrands] = useState([]);
  const [pods, setPods] = useState([]);
  const [approvedLeaves, setApprovedLeaves] = useState([]);

  // Generated roster
  const [rosterResult, setRosterResult] = useState(null);

  // Modal
  const [selectedAllocation, setSelectedAllocation] = useState(null);

  // Loading and error
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const daysInMonth = getDaysInMonth(year, month);

  const monthName = new Date(year, month).toLocaleDateString("en-IN", {
    month: "long",
  });

  // Fetch all required database records
  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        employeeResponse,
        assignmentResponse,
        brandResponse,
        podResponse,
        leaveResponse,
      ] = await Promise.all([
        getEmployees(),
        getAssignments(),
        getBrands(),
        getPods(),
        getLeaves(),
      ]);

      setEmployees(employeeResponse.employees || []);
      setAssignments(assignmentResponse.assignments || []);
      setBrands(brandResponse.brands || []);
      setPods(podResponse.pods || []);

      const leaves = leaveResponse.leaves || [];

      setApprovedLeaves(
        leaves.filter((leave) => leave.status === "Approved")
      );
    } catch (err) {
      console.error("Error fetching roster data:", err);

      setError(
        err.response?.data?.message ||
        "Unable to load roster data. Please check the backend."
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch previously generated roster
  const fetchExistingRoster = async () => {
    try {
      setError("");

      const response = await getRosterByMonth(year, month + 1);

      if (response.success && response.roster) {
        setRosterResult(normalizeRoster(response.roster));
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setRosterResult(null);
        return;
      }

      console.error("Error fetching existing roster:", err);

      setError(
        err.response?.data?.message ||
        "Unable to fetch the saved roster."
      );
    }
  };

  // Initial database loading
  useEffect(() => {
    fetchData();
  }, []);

  // Load roster whenever selected month or year changes
  useEffect(() => {
    fetchExistingRoster();
  }, [month, year]);

  // Filter employees
  const filteredEmployees = employees.filter((employee) => {
    const podMatch =
      selectedPod === "All" ||
      getId(employee.pod) === selectedPod;

    const brandMatch =
      selectedBrand === "All" ||
      assignments.some(
        (assignment) =>
          getId(assignment.employee) === getId(employee._id) &&
          getId(assignment.brand) === selectedBrand
      );

    return podMatch && brandMatch;
  });

  // Generate monthly roster through backend
  const handleGenerateRoster = async () => {
    try {
      setGenerating(true);
      setError("");
      setSelectedAllocation(null);

      const response = await generateMonthlyRoster(
        month + 1,
        year
      );

      if (response.success) {
        setRosterResult(normalizeRoster(response.roster));

        alert(response.message);
      }
    } catch (err) {
      console.error("Roster generation error:", err);

      setError(
        err.response?.data?.message ||
        "Failed to generate roster."
      );
    } finally {
      setGenerating(false);
    }
  };

  // Manual replacement will be connected to the backend next
  const handleReplaceEmployee = () => {
    alert(
      "Manual replacement API is the next step. Your existing roster has not been changed."
    );

    setSelectedAllocation(null);
  };

  // Get employee status for a particular date
  const getEmployeeStatus = (employee, day) => {
    const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;

    // Approved leave
    const leave = approvedLeaves.some((item) => {
      const leaveEmployeeId = getId(item.employee);

      const start = new Date(item.startDate);
      const end = new Date(item.endDate);

      const current = new Date(`${date}T00:00:00`);

      const normalizedStart = new Date(
        start.getFullYear(),
        start.getMonth(),
        start.getDate()
      );

      const normalizedEnd = new Date(
        end.getFullYear(),
        end.getMonth(),
        end.getDate()
      );

      return (
        leaveEmployeeId === getId(employee._id) &&
        current >= normalizedStart &&
        current <= normalizedEnd
      );
    });

    if (leave) return "Leave";

    // Weekly off
    const weekday = new Date(year, month, day).toLocaleDateString(
      "en-IN",
      { weekday: "long" }
    );

    if (employee.weeklyOff === weekday) {
      return "Weekly Off";
    }

    if (!rosterResult) {
      return "Not Generated";
    }

    // Find employee allocation
    const allocation = rosterResult.roster
      .find((item) => item.date === date)
      ?.allocations.find(
        (item) => item.employeeId === getId(employee._id)
      );

    return allocation ? "Working" : "Not Allocated";
  };

  // Calculate total allocations
  const totalAllocations = rosterResult
    ? rosterResult.roster.reduce(
        (total, day) => total + day.allocations.length,
        0
      )
    : 0;

  // Calculate brand and process coverage
  const getCoverage = () => {
    const coverage = {};

    if (!rosterResult) return [];

    rosterResult.roster.forEach((day) => {
      day.allocations.forEach((allocation) => {
        const key = `${allocation.brandId}-${allocation.processId}`;

        if (!coverage[key]) {
          coverage[key] = {
            brand: allocation.brandName,
            process: allocation.processName,
            allocations: 0,
          };
        }

        coverage[key].allocations++;
      });
    });

    return Object.values(coverage);
  };

  const coverageData = getCoverage();

  // Loading screen
  if (loading) {
    return (
      <div className="text-center p-5">
        <div className="spinner-border text-primary"></div>
        <p className="mt-3">Loading roster data...</p>
      </div>
    );
  }

  return (
    <div className="roster-page">

      {/* Heading */}
      <div className="page-heading">
        <div>
          <h2>Monthly Roster</h2>
          <p>Manage employee schedules and daily allocations.</p>
        </div>

        <button
          className="btn btn-primary"
          onClick={handleGenerateRoster}
          disabled={generating || employees.length === 0}
        >
          {generating ? (
            <>
              <span className="spinner-border spinner-border-sm me-2"></span>
              Generating...
            </>
          ) : (
            <>
              <i className="bi bi-calendar-check me-2"></i>
              Generate Roster
            </>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      {/* Roster Status */}
      {!rosterResult && (
        <div className="roster-notice">
          <i className="bi bi-info-circle"></i>
          Select your month and generate the roster.
        </div>
      )}

      {rosterResult && (
        <div className="roster-success">
          <i className="bi bi-check-circle-fill"></i>
          Roster generated for {monthName} {year}.
        </div>
      )}

      {/* Filters */}
      <div className="roster-filter-card">

        <div>
          <label>Month</label>

          <select
            className="form-select"
            value={month}
            onChange={(e) => {
              setMonth(Number(e.target.value));
              setSelectedAllocation(null);
            }}
          >
            {Array.from({ length: 12 }, (_, index) => (
              <option key={index} value={index}>
                {new Date(2000, index).toLocaleDateString("en-IN", {
                  month: "long",
                })}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Year</label>

          <select
            className="form-select"
            value={year}
            onChange={(e) => {
              setYear(Number(e.target.value));
              setSelectedAllocation(null);
            }}
          >
            {[2025, 2026, 2027, 2028].map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Pod</label>

          <select
            className="form-select"
            value={selectedPod}
            onChange={(e) => setSelectedPod(e.target.value)}
          >
            <option value="All">All Pods</option>

            {pods.map((pod) => (
              <option key={pod._id} value={pod._id}>
                {pod.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Brand</label>

          <select
            className="form-select"
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
          >
            <option value="All">All Brands</option>

            {brands.map((brand) => (
              <option key={brand._id} value={brand._id}>
                {brand.name}
              </option>
            ))}
          </select>
        </div>

      </div>

      {/* Summary Cards */}
      <div className="roster-stats">

        <div className="roster-stat-card">
          <div className="roster-stat-icon blue">
            <i className="bi bi-people"></i>
          </div>

          <div>
            <h3>{filteredEmployees.length}</h3>
            <p>Total Employees</p>
          </div>
        </div>

        <div className="roster-stat-card">
          <div className="roster-stat-icon green">
            <i className="bi bi-calendar-check"></i>
          </div>

          <div>
            <h3>{totalAllocations}</h3>
            <p>Monthly Allocations</p>
          </div>
        </div>

        <div className="roster-stat-card">
          <div className="roster-stat-icon orange">
            <i className="bi bi-exclamation-triangle"></i>
          </div>

          <div>
            <h3>{rosterResult?.totalConflicts ?? 0}</h3>
            <p>Staffing Conflicts</p>
          </div>
        </div>

        <div className="roster-stat-card">
          <div className="roster-stat-icon red">
            <i className="bi bi-calendar3"></i>
          </div>

          <div>
            <h3>{daysInMonth}</h3>
            <p>Days in Month</p>
          </div>
        </div>

      </div>

      {/* Legend */}
      <div className="roster-legend">
        <span>
          <i className="legend-dot working"></i>
          Working
        </span>

        <span>
          <i className="legend-dot weekly-off"></i>
          Weekly Off
        </span>

        <span>
          <i className="legend-dot leave"></i>
          Leave
        </span>

        <span>
          <i className="legend-dot holiday"></i>
          Holiday
        </span>
      </div>

      {/* Monthly Calendar */}
      <div className="roster-table-card">

        <div className="roster-table-heading">
          <div>
            <h5>{monthName} {year}</h5>
            <p>Employee-wise monthly schedule</p>
          </div>

          <span>{filteredEmployees.length} employees</span>
        </div>

        <div className="roster-calendar-scroll">
          <table className="roster-calendar">

            <thead>
              <tr>
                <th className="employee-sticky">Employee</th>

                {Array.from({ length: daysInMonth }, (_, index) => (
                  <th key={index}>
                    <div>{index + 1}</div>

                    <small>
                      {getDayName(year, month, index + 1)}
                    </small>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filteredEmployees.map((employee) => (
                <tr key={employee._id}>

                  <td className="employee-sticky">
                    <strong>{employee.name}</strong>
                    <small>{employee.pod?.name || "No Pod"}</small>
                  </td>

                  {Array.from({ length: daysInMonth }, (_, index) => {
                    const day = index + 1;
                    const status = getEmployeeStatus(employee, day);

                    return (
                      <td key={day}>
                        <span
                          className={`roster-cell ${status
                            .toLowerCase()
                            .replace(" ", "-")}`}
                        >
                          {status === "Working"
                            ? "W"
                            : status === "Weekly Off"
                            ? "WO"
                            : status === "Leave"
                            ? "L"
                            : status === "Holiday"
                            ? "H"
                            : status === "Not Allocated"
                            ? "NA"
                            : "-"}
                        </span>
                      </td>
                    );
                  })}

                </tr>
              ))}

              {filteredEmployees.length === 0 && (
                <tr>
                  <td
                    colSpan={daysInMonth + 1}
                    className="text-center p-4"
                  >
                    No employees found.
                  </td>
                </tr>
              )}
            </tbody>

          </table>
        </div>
      </div>

      {/* Brand and Process Coverage */}
      <div className="roster-table-card coverage-card">

        <div className="roster-table-heading">
          <div>
            <h5>Brand & Process Coverage</h5>
            <p>
              Total employee allocations during the selected month
            </p>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table roster-coverage-table">

            <thead>
              <tr>
                <th>Brand</th>
                <th>Process</th>
                <th>Total Allocations</th>
              </tr>
            </thead>

            <tbody>
              {coverageData.map((item, index) => (
                <tr key={index}>
                  <td>{item.brand}</td>
                  <td>{item.process}</td>
                  <td>{item.allocations}</td>
                </tr>
              ))}

              {coverageData.length === 0 && (
                <tr>
                  <td colSpan="3" className="text-center">
                    Generate the roster to view coverage.
                  </td>
                </tr>
              )}
            </tbody>

          </table>
        </div>
      </div>

      {/* Daily Employee Allocations */}
      <div className="roster-table-card">

        <div className="roster-table-heading">
          <div>
            <h5>Daily Employee Allocations</h5>
            <p>
              View and manually modify employee assignments.
            </p>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table roster-coverage-table">

            <thead>
              <tr>
                <th>Date</th>
                <th>Employee</th>
                <th>Brand</th>
                <th>Process</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {rosterResult?.roster.flatMap((day) =>
                day.allocations.map((allocation, index) => (
                  <tr
                    key={`${allocation.date}-${allocation.employeeId}-${index}`}
                  >
                    <td>{allocation.date}</td>
                    <td>{allocation.employeeName}</td>
                    <td>{allocation.brandName}</td>
                    <td>{allocation.processName}</td>

                    <td>
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => setSelectedAllocation(allocation)}
                      >
                        <i className="bi bi-pencil-square me-1"></i>
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}

              {(!rosterResult ||
                rosterResult.roster.every(
                  (day) => day.allocations.length === 0
                )) && (
                <tr>
                  <td colSpan="5" className="text-center">
                    Generate a roster to view employee allocations.
                  </td>
                </tr>
              )}
            </tbody>

          </table>
        </div>
      </div>

      {/* Edit Allocation Modal */}
      {selectedAllocation && rosterResult && (
        <RosterEditModal
          allocation={selectedAllocation}
          employees={employees}
          assignments={assignments}
          roster={rosterResult.roster}
          approvedLeaves={approvedLeaves}
          onSave={handleReplaceEmployee}
          onClose={() => setSelectedAllocation(null)}
        />
      )}

    </div>
  );
};

export default Roster;