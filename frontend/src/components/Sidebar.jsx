import { NavLink } from "react-router-dom";

const Sidebar = () => {

  const menuItems = [
    { name: "Dashboard", icon: "bi-grid", path: "/dashboard" },
    { name: "Employees", icon: "bi-people", path: "/employees" },
    { name: "Pods", icon: "bi-diagram-3", path: "/pods" },
    { name: "Brands", icon: "bi-shop", path: "/brands" },
    { name: "Processes", icon: "bi-gear", path: "/processes" },
    { name: "Assignments", icon: "bi-person-workspace", path: "/assignments" },
    { name: "Working Rules", icon: "bi-calendar-check", path: "/working-rules" },
    { name: "Leaves & Holidays", icon: "bi-calendar-x", path: "/leaves" },
    { name: "Monthly Roster", icon: "bi-calendar3", path: "/roster" },
    { name: "Conflicts", icon: "bi-exclamation-triangle", path: "/conflicts" },
    { name: "Reports", icon: "bi-bar-chart", path: "/reports" },
  ];

  return (
    <aside className="sidebar">

      <div className="sidebar-brand">
        <i className="bi bi-calendar2-week-fill"></i>
        <span>DataStraw</span>
      </div>

      <div className="sidebar-subtitle">
        SMART ROSTER MANAGEMENT
      </div>

      <div className="sidebar-menu">

        <p className="menu-heading">MAIN MENU</p>

        {menuItems.map((item) => (

          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
          >

            <i className={`bi ${item.icon}`}></i>

            <span>{item.name}</span>

          </NavLink>
          

        ))}

      </div>

      <div className="sidebar-footer">

        <div className="profile-avatar">RK</div>

        <div>
          <h6>Admin User</h6>
          <small>Operations Manager</small>
        </div>

      </div>

    </aside>
  );
};

export default Sidebar;