import React, { useEffect, useState } from "react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import { getEmployees } from "../services/employeeService";
import { getBrands } from "../services/brandService";
import { getPods } from "../services/podService";
import { getAssignments } from "../services/assignmentService";
import { getWorkingRules } from "../services/workingRuleService";
import { getLeaves } from "../services/leaveService";
import {
  getRosters,
  generateMonthlyRoster,
} from "../services/rosterService";

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const [employees, setEmployees] = useState([]);
  const [brands, setBrands] = useState([]);
  const [pods, setPods] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [workingRules, setWorkingRules] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [rosters, setRosters] = useState([]);

  // Get MongoDB reference ID
  const getId = (value) => {
    if (!value) return "";
    return typeof value === "object" ? value._id : value;
  };

  // Get populated reference name
  const getName = (value) => {
    if (!value) return "Unknown";
    return typeof value === "object" ? value.name || "Unknown" : "Unknown";
  };

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        employeeResponse,
        brandResponse,
        podResponse,
        assignmentResponse,
        workingRuleResponse,
        leaveResponse,
        rosterResponse,
      ] = await Promise.all([
        getEmployees(),
        getBrands(),
        getPods(),
        getAssignments(),
        getWorkingRules(),
        getLeaves(),
        getRosters(),
      ]);

      const employeeData = employeeResponse.employees || [];
      const brandData = brandResponse.brands || [];
      const podData = podResponse.pods || [];
      const assignmentData = assignmentResponse.assignments || [];
      const workingRuleData = workingRuleResponse.workingRules || [];
      const leaveData = leaveResponse.leaves || [];
      const rosterData = rosterResponse.rosters || [];

      setEmployees(employeeData);
      setBrands(brandData);
      setPods(podData);
      setAssignments(assignmentData);
      setWorkingRules(workingRuleData);
      setLeaves(leaveData);
      setRosters(rosterData);

      const allConflicts = rosterData.flatMap((roster) =>
        (roster.conflicts || []).map((conflict) => ({
          ...conflict,
          rosterMonth: roster.month,
          rosterYear: roster.year,
        }))
      );

      setConflicts(allConflicts);
    } catch (err) {
      console.error("Dashboard loading error:", err);
      setError(
        err.response?.data?.message || "Unable to load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Active records
  const activeEmployees = employees.filter(
    (employee) => employee.status === "Active"
  );

  const activeBrands = brands.filter(
    (brand) => brand.status === "Active"
  );

  const activePods = pods.filter(
    (pod) => pod.status === "Active"
  );

  const activeAssignments = assignments.filter(
    (assignment) => assignment.status === "Active"
  );

  const pendingLeaves = leaves.filter(
    (leave) => leave.status === "Pending"
  );

  const unresolvedConflicts = conflicts.filter(
    (conflict) => !conflict.resolved
  );

  // Brand coverage calculation
  const chartData = activeBrands.map((brand) => {
    const brandRules = workingRules.filter(
      (rule) =>
        getId(rule.brand) === brand._id &&
        rule.status === "Active"
    );

    let required = 0;
    let covered = 0;

    brandRules.forEach((rule) => {
      required += Number(rule.minimumStaff || 0);

      const assignedEmployees = activeAssignments.filter(
        (assignment) =>
          getId(assignment.brand) === brand._id &&
          getId(assignment.process) === getId(rule.process)
      );

      const uniqueEmployeeIds = new Set(
        assignedEmployees.map((assignment) =>
          getId(assignment.employee)
        )
      );

      covered += uniqueEmployeeIds.size;
    });

    return {
      brand: brand.name,
      required,
      covered,
    };
  }).filter((item) => item.required > 0 || item.covered > 0);

  const totalRequired = chartData.reduce(
    (sum, item) => sum + item.required,
    0
  );

  const totalCovered = chartData.reduce(
    (sum, item) => sum + Math.min(item.covered, item.required),
    0
  );

  const coveragePercentage =
    totalRequired > 0
      ? Math.round((totalCovered / totalRequired) * 100)
      : 0;

  // Generate current month's roster
  const handleGenerateRoster = async () => {
    try {
      setGenerating(true);
      setError("");

      const currentDate = new Date();

      const response = await generateMonthlyRoster(
        currentDate.getMonth() + 1,
        currentDate.getFullYear()
      );

      alert(response.message || "Roster generated successfully!");

      await fetchDashboardData();
    } catch (err) {
      console.error("Roster generation error:", err);

      alert(
        err.response?.data?.message || "Failed to generate roster."
      );
    } finally {
      setGenerating(false);
    }
  };

  // Recent alerts
  const alerts = [];

  unresolvedConflicts.slice(0, 3).forEach((conflict) => {
    alerts.push({
      title: "Coverage Issue",
      description:
        conflict.message ||
        `Staff shortage detected on ${conflict.date}.`,
      type: "danger",
      icon: "bi-exclamation-circle",
    });
  });

  pendingLeaves.slice(0, 3).forEach((leave) => {
    alerts.push({
      title: "Leave Request",
      description: `${
        getName(leave.employee)
      } has a pending leave request.`,
      type: "warning",
      icon: "bi-calendar-event",
    });
  });

  const currentDate = new Date();

  const currentMonthRoster = rosters.find(
    (roster) =>
      roster.month === currentDate.getMonth() + 1 &&
      roster.year === currentDate.getFullYear()
  );

  if (!currentMonthRoster) {
    alerts.push({
      title: "Roster Pending",
      description: "The current month's roster has not been generated.",
      type: "info",
      icon: "bi-info-circle",
    });
  }

  const stats = [
    {
      title: "Total Employees",
      value: activeEmployees.length,
      icon: "bi-people",
      color: "blue",
      change: `${employees.length - activeEmployees.length} inactive`,
    },
    {
      title: "Total Brands",
      value: activeBrands.length,
      icon: "bi-shop",
      color: "green",
      change: `${brands.length - activeBrands.length} inactive`,
    },
    {
      title: "Operational Pods",
      value: activePods.length,
      icon: "bi-diagram-3",
      color: "purple",
      change: `${pods.length - activePods.length} inactive`,
    },
    {
      title: "Coverage Issues",
      value: unresolvedConflicts.length,
      icon: "bi-exclamation-triangle",
      color: "orange",
      change: unresolvedConflicts.length > 0
        ? "Needs attention"
        : "No unresolved issues",
    },
  ];

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary"></div>
        <p className="mt-2">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">

      {/* Page Heading */}
      <div className="page-heading">
        <div>
          <h3>Dashboard Overview</h3>
          <p>Monitor your workforce and roster operations.</p>
        </div>

        <button
          className="btn btn-primary"
          onClick={handleGenerateRoster}
          disabled={generating}
        >
          <i className="bi bi-plus-lg me-2"></i>
          {generating ? "Generating..." : "Generate Roster"}
        </button>
      </div>

      {error && (
        <div className="alert alert-danger">
          {error}
          <button
            className="btn btn-sm btn-outline-danger ms-3"
            onClick={fetchDashboardData}
          >
            Retry
          </button>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="row g-4 mb-4">
        {stats.map((item, index) => (
          <div className="col-xl-3 col-md-6" key={index}>
            <div className="stat-card">
              <div className="stat-card-top">
                <div>
                  <p>{item.title}</p>
                  <h2>{item.value}</h2>
                </div>

                <div className={`stat-icon ${item.color}`}>
                  <i className={`bi ${item.icon}`}></i>
                </div>
              </div>

              <small>{item.change}</small>
            </div>
          </div>
        ))}
      </div>

      {/* Coverage and Chart */}
      <div className="row g-4 mb-4">

        <div className="col-lg-4">
          <div className="dashboard-card coverage-card">
            <h5>Overall Coverage</h5>
            <p>Assigned staff compared with minimum requirements</p>

            <div className="coverage-circle">
              <div>
                <h2>{coveragePercentage}%</h2>
                <small>Coverage</small>
              </div>
            </div>

            <div className="coverage-status">
              <i className={`bi ${
                coveragePercentage >= 100
                  ? "bi-check-circle-fill"
                  : "bi-exclamation-circle-fill"
              }`}></i>

              {coveragePercentage >= 100
                ? "Requirements Covered"
                : "Coverage Gap Detected"}
            </div>

            <small className="text-muted">
              {totalCovered} of {totalRequired} required staff positions covered
            </small>
          </div>
        </div>

        <div className="col-lg-8">
          <div className="dashboard-card">
            <h5>Brand Coverage Overview</h5>
            <p>Required vs assigned employee coverage</p>

            <div style={{ width: "100%", height: 280 }}>
              {chartData.length > 0 ? (
                <ResponsiveContainer>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="brand" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />

                    <Bar
                      dataKey="required"
                      fill="#cbd5e1"
                      name="Required"
                      radius={[4, 4, 0, 0]}
                    />

                    <Bar
                      dataKey="covered"
                      fill="#2563eb"
                      name="Assigned"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-muted py-5">
                  No working rules available for coverage calculation.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Alerts */}
      <div className="dashboard-card">

        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h5>Recent Alerts</h5>
            <p>Issues requiring your attention</p>
          </div>

          <button
            className="btn btn-outline-primary btn-sm"
            onClick={fetchDashboardData}
          >
            <i className="bi bi-arrow-clockwise me-1"></i>
            Refresh
          </button>
        </div>

        {alerts.length > 0 ? (
          alerts.slice(0, 6).map((alert, index) => (
            <div
              className={`alert-item ${alert.type}`}
              key={index}
            >
              <div className="alert-icon">
                <i className={`bi ${alert.icon}`}></i>
              </div>

              <div className="flex-grow-1">
                <h6>{alert.title}</h6>
                <p>{alert.description}</p>
              </div>

              <i className="bi bi-chevron-right"></i>
            </div>
          ))
        ) : (
          <div className="text-center py-4">
            <i className="bi bi-check-circle-fill text-success fs-2"></i>
            <h6 className="mt-2">All caught up!</h6>
            <p className="text-muted mb-0">
              No recent alerts requiring attention.
            </p>
          </div>
        )}

      </div>

    </div>
  );
};

export default Dashboard;