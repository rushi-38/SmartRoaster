import React, { useEffect, useState } from "react";
import { getRosters } from "../services/rosterService";

const Conflicts = () => {
  const [conflicts, setConflicts] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Get a name from a populated MongoDB reference
  const getName = (value) => {
    if (!value) return "N/A";
    if (typeof value === "object") {
      return value.name || "N/A";
    }
    return value;
  };

  // Fetch conflicts from MongoDB through roster API
  const loadConflicts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getRosters();

      const rosters = response.rosters || [];

      // Extract conflicts from every generated roster
      const allConflicts = rosters.flatMap((roster) =>
        (roster.conflicts || []).map((conflict) => ({
          ...conflict,
          brandName: getName(conflict.brand),
          processName: getName(conflict.process),
        }))
      );

      setConflicts(allConflicts);
    } catch (err) {
      console.error("Error fetching conflicts:", err);
      setError(
        err.response?.data?.message || "Failed to load conflicts."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConflicts();
  }, []);

  // Search and filter
  const filteredConflicts = conflicts.filter((conflict) => {
    const searchText = search.toLowerCase();

    const searchMatch =
      conflict.brandName.toLowerCase().includes(searchText) ||
      conflict.processName.toLowerCase().includes(searchText) ||
      String(conflict.date || "").includes(searchText) ||
      String(conflict.message || "").toLowerCase().includes(searchText);

    const typeMatch =
      selectedType === "All" || conflict.type === selectedType;

    return searchMatch && typeMatch;
  });

  const totalConflicts = conflicts.length;

  const staffShortages = conflicts.filter(
    (item) => item.type === "STAFF_SHORTAGE"
  ).length;

  const unresolvedConflicts = conflicts.filter(
    (item) => !item.resolved
  ).length;

  const formatDate = (date) => {
    if (!date) return "N/A";

    return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatConflictType = (type) => {
    if (type === "STAFF_SHORTAGE") return "Staffing Shortage";
    return (type || "Unknown").replaceAll("_", " ");
  };

  return (
    <div className="conflicts-page">

      {/* Heading */}
      <div className="page-heading">
        <div>
          <h2>Conflicts & Issues</h2>
          <p>Review scheduling problems detected during roster generation.</p>
        </div>

        <button
          className="btn btn-outline-primary"
          onClick={loadConflicts}
          disabled={loading}
        >
          <i className="bi bi-arrow-clockwise me-2"></i>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="roster-stats">

        <div className="roster-stat-card">
          <div className="roster-stat-icon red">
            <i className="bi bi-exclamation-triangle"></i>
          </div>

          <div>
            <h3>{totalConflicts}</h3>
            <p>Total Conflicts</p>
          </div>
        </div>

        <div className="roster-stat-card">
          <div className="roster-stat-icon orange">
            <i className="bi bi-people"></i>
          </div>

          <div>
            <h3>{staffShortages}</h3>
            <p>Staffing Shortages</p>
          </div>
        </div>

        <div className="roster-stat-card">
          <div className="roster-stat-icon green">
            <i className="bi bi-check-circle"></i>
          </div>

          <div>
            <h3>
              {unresolvedConflicts === 0 ? "Clear" : "Action Required"}
            </h3>
            <p>Roster Status</p>
          </div>
        </div>

      </div>

      {/* Filters */}
      <div className="roster-filter-card">

        <div>
          <label>Search</label>

          <input
            type="text"
            className="form-control"
            placeholder="Search brand, process or date..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div>
          <label>Conflict Type</label>

          <select
            className="form-select"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="All">All Conflicts</option>
            <option value="STAFF_SHORTAGE">Staffing Shortage</option>
          </select>
        </div>

      </div>

      {/* Error */}
      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      {/* Conflict Table */}
      <div className="roster-table-card">

        <div className="roster-table-heading">
          <div>
            <h5>Detected Conflicts</h5>
            <p>Problems identified by the scheduling engine</p>
          </div>

          <span>{filteredConflicts.length} Results</span>
        </div>

        <div className="table-responsive">

          <table className="table conflict-table">

            <thead>
              <tr>
                <th>Date</th>
                <th>Brand</th>
                <th>Process</th>
                <th>Conflict Type</th>
                <th>Required Staff</th>
                <th>Available Staff</th>
                <th>Issue</th>
              </tr>
            </thead>

            <tbody>

              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-5">
                    <div className="spinner-border text-primary"></div>
                    <p className="mt-2 mb-0">Loading conflicts...</p>
                  </td>
                </tr>
              ) : filteredConflicts.length > 0 ? (
                filteredConflicts.map((conflict, index) => (
                  <tr key={conflict._id || index}>

                    <td>{formatDate(conflict.date)}</td>

                    <td>{conflict.brandName}</td>

                    <td>{conflict.processName}</td>

                    <td>
                      <span className="conflict-badge">
                        {formatConflictType(conflict.type)}
                      </span>
                    </td>

                    <td>{conflict.required}</td>

                    <td>{conflict.available}</td>

                    <td>{conflict.message || "Staffing requirement not met"}</td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-5">
                    <i className="bi bi-check-circle-fill conflict-empty-icon"></i>

                    <h6 className="mt-2">No conflicts found</h6>

                    <p className="text-muted mb-0">
                      {search || selectedType !== "All"
                        ? "Try changing your search or filter."
                        : "Generate a roster to check for scheduling conflicts."}
                    </p>
                  </td>
                </tr>
              )}

            </tbody>

          </table>

        </div>
      </div>

    </div>
  );
};

export default Conflicts;