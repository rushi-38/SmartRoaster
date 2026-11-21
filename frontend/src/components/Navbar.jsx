import { useLocation } from "react-router-dom";

const Navbar = () => {

  const location = useLocation();

  const pageName = location.pathname
    .split("/")
    .filter(Boolean)
    .pop()
    ?.replace(/-/g, " ");

  const title = pageName
    ? pageName.replace(/\b\w/g, char => char.toUpperCase())
    : "Dashboard";

  return (

    <nav className="top-navbar">

      <div className="navbar-left">

        <h5>{title}</h5>

        <span>Welcome back! Here's your overview.</span>

      </div>

      <div className="navbar-right">

        <div className="search-box">
          <i className="bi bi-search"></i>
          <input
            type="text"
            placeholder="Search anything..."
          />
        </div>

        <button className="notification-btn">
          <i className="bi bi-bell"></i>
          <span></span>
        </button>

        <div className="navbar-profile">
          RK
        </div>

      </div>

    </nav>

  );
};

export default Navbar;