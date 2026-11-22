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

import { getReport } from "../services/reportService";

const Reports = () => {
  const today = new Date();

  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const monthNames = [
    "January", "February", "March", "April",
    "May", "June", "July", "August",
    "September", "October", "November", "December",
  ];

  // Generate report
  const generateReport = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getReport(month, year);

      // Handle both possible API response structures:
      // { success: true, report: {...} }
      // or { report: {...} } with the same report fields.
      setReport(data?.report || null);

    } catch (err) {
      console.error("Report error:", err);

      setReport(null);

      setError(
        err.response?.data?.message ||
        "Unable to generate report."
      );

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateReport();
  }, []);

  // Safe arrays: prevent undefined.map() errors
  const brandData = Array.isArray(report?.brandReport)
    ? report.brandReport
    : [];

  const processData = Array.isArray(report?.processReport)
    ? report.processReport
    : [];

  const conflictData = Array.isArray(report?.conflicts)
    ? report.conflicts
    : [];

  // Download CSV
  const downloadCSV = () => {
    if (!report) {
      alert("Generate a report first.");
      return;
    }

    const rows = [
      ["SMART ROSTER MANAGEMENT REPORT"],
      ["Month", monthNames[month - 1]],
      ["Year", year],
      [],
      ["SUMMARY"],
      ["Total Scheduled Staff", report.totalScheduled ?? 0],
      ["Total Required Staff", report.totalRequired ?? 0],
      ["Total Shortage", report.totalShortage ?? 0],
      ["Coverage Percentage", `${report.coveragePercentage ?? 0}%`],
      ["Total Conflicts", report.totalConflicts ?? conflictData.length],
      [],
      ["BRAND-WISE REPORT"],
      ["Brand", "Scheduled Staff"],

      ...brandData.map((item) => [
        item.brand || "Unknown",
        item.scheduledStaff ?? 0,
      ]),

      [],
      ["PROCESS-WISE REPORT"],
      ["Process", "Brand", "Scheduled Staff"],

      ...processData.map((item) => [
        item.process || "Unknown",
        item.brand || "Unknown",
        item.scheduledStaff ?? 0,
      ]),

      [],
      ["CONFLICT REPORT"],
      ["Date", "Brand", "Process", "Required", "Available", "Shortage"],

      ...conflictData.map((item) => [
        item.date || "",
        item.brand || "Unknown",
        item.process || "Unknown",
        item.required ?? 0,
        item.available ?? 0,
        item.shortage ?? 0,
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `Roster_Report_${month}_${year}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  return (
    <div className="container-fluid p-4">

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <div>
          <h3 className="fw-bold mb-1">Reports & Analytics</h3>
          <p className="text-muted mb-0">
            View monthly roster performance and staffing reports.
          </p>
        </div>

        <button
          className="btn btn-success"
          onClick={downloadCSV}
          disabled={!report}
        >
          <i className="bi bi-download me-2"></i>
          Download CSV
        </button>
      </div>

      {/* Filters */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">

          <div className="row align-items-end g-3">

            <div className="col-md-4">
              <label className="form-label fw-semibold">
                Month
              </label>

              <select
                className="form-select"
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
              >
                {monthNames.map((name, index) => (
                  <option key={name} value={index + 1}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label fw-semibold">
                Year
              </label>

              <select
                className="form-select"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
              >
                {[2025, 2026, 2027, 2028].map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-4">
              <button
                className="btn btn-primary w-100"
                onClick={generateReport}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Generating...
                  </>
                ) : (
                  <>
                    <i className="bi bi-file-earmark-bar-graph me-2"></i>
                    Generate Report
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-circle me-2"></i>
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary"></div>
          <p className="mt-2 text-muted">
            Generating report...
          </p>
        </div>
      )}

      {/* No Report */}
      {!loading && !error && !report && (
        <div className="alert alert-info">
          Select a month and year, then generate a report.
        </div>
      )}

      {/* Report Content */}
      {!loading && report && (
        <>
          {/* Summary Cards */}
          <div className="row g-3 mb-4">

            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <p className="text-muted mb-2">
                    Scheduled Staff
                  </p>
                  <h3 className="fw-bold text-primary">
                    {report.totalScheduled ?? 0}
                  </h3>
                </div>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <p className="text-muted mb-2">
                    Required Staff Slots
                  </p>
                  <h3 className="fw-bold">
                    {report.totalRequired ?? 0}
                  </h3>
                </div>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <p className="text-muted mb-2">
                    Staff Shortage
                  </p>
                  <h3 className="fw-bold text-danger">
                    {report.totalShortage ?? 0}
                  </h3>
                </div>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <p className="text-muted mb-2">
                    Roster Coverage
                  </p>
                  <h3 className="fw-bold text-success">
                    {report.coveragePercentage ?? 0}%
                  </h3>
                </div>
              </div>
            </div>

          </div>

          {/* Brand Chart */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body">

              <h5 className="fw-bold mb-3">
                Brand-wise Staff Allocation
              </h5>

              {brandData.length > 0 ? (
                <div style={{ width: "100%", height: 300 }}>
                  <ResponsiveContainer>
                    <BarChart data={brandData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="brand" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />

                      <Bar
                        dataKey="scheduledStaff"
                        fill="#0d6efd"
                        name="Scheduled Staff"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-muted">
                  No allocation data available.
                </p>
              )}

            </div>
          </div>

          {/* Brand Report */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body">

              <h5 className="fw-bold mb-3">
                Brand-wise Report
              </h5>

              <div className="table-responsive">
                <table className="table table-hover align-middle">

                  <thead className="table-light">
                    <tr>
                      <th>Brand</th>
                      <th>Scheduled Staff</th>
                    </tr>
                  </thead>

                  <tbody>
                    {brandData.map((item, index) => (
                      <tr key={index}>
                        <td>{item.brand || "Unknown"}</td>
                        <td>{item.scheduledStaff ?? 0}</td>
                      </tr>
                    ))}

                    {brandData.length === 0 && (
                      <tr>
                        <td colSpan="2" className="text-center text-muted">
                          No brand data available.
                        </td>
                      </tr>
                    )}
                  </tbody>

                </table>
              </div>

            </div>
          </div>

          {/* Process Report */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body">

              <h5 className="fw-bold mb-3">
                Process-wise Report
              </h5>

              <div className="table-responsive">
                <table className="table table-hover align-middle">

                  <thead className="table-light">
                    <tr>
                      <th>Process</th>
                      <th>Brand</th>
                      <th>Scheduled Staff</th>
                    </tr>
                  </thead>

                  <tbody>
                    {processData.map((item, index) => (
                      <tr key={index}>
                        <td>{item.process || "Unknown"}</td>
                        <td>{item.brand || "Unknown"}</td>
                        <td>{item.scheduledStaff ?? 0}</td>
                      </tr>
                    ))}

                    {processData.length === 0 && (
                      <tr>
                        <td colSpan="3" className="text-center text-muted">
                          No process data available.
                        </td>
                      </tr>
                    )}
                  </tbody>

                </table>
              </div>

            </div>
          </div>

          {/* Conflict Report */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body">

              <h5 className="fw-bold mb-3">
                Staffing Conflicts

                <span className="badge bg-danger ms-2">
                  {report.totalConflicts ?? conflictData.length}
                </span>
              </h5>

              <div className="table-responsive">
                <table className="table table-hover align-middle">

                  <thead className="table-light">
                    <tr>
                      <th>Date</th>
                      <th>Brand</th>
                      <th>Process</th>
                      <th>Required</th>
                      <th>Available</th>
                      <th>Shortage</th>
                    </tr>
                  </thead>

                  <tbody>
                    {conflictData.map((item, index) => (
                      <tr key={index}>
                        <td>
                          {item.date
                            ? new Date(item.date).toLocaleDateString()
                            : "-"}
                        </td>

                        <td>{item.brand || "Unknown"}</td>
                        <td>{item.process || "Unknown"}</td>
                        <td>{item.required ?? 0}</td>
                        <td>{item.available ?? 0}</td>

                        <td>
                          <span className="badge bg-danger">
                            {item.shortage ?? 0}
                          </span>
                        </td>
                      </tr>
                    ))}

                    {conflictData.length === 0 && (
                      <tr>
                        <td colSpan="6" className="text-center text-success">
                          No staffing conflicts found.
                        </td>
                      </tr>
                    )}
                  </tbody>

                </table>
              </div>

            </div>
          </div>
        </>
      )}

    </div>
  );
};

export default Reports;