import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [notificationLoading, setNotificationLoading] = useState(false);

  const profileRef = useRef(null);
  const notificationRef = useRef(null);
  const searchRef = useRef(null);

  const pageName = location.pathname
    .split("/")
    .filter(Boolean)
    .pop()
    ?.replace(/-/g, " ");

  const title = pageName
    ? pageName.replace(/\b\w/g, (char) => char.toUpperCase())
    : "Dashboard";

  const displayName = user?.name || "Admin User";

  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  // FETCH NOTIFICATIONS
  const fetchNotifications = useCallback(async () => {
    try {
      setNotificationLoading(true);

      const response = await API.get("/notifications");

      setNotifications(response.data.notifications || []);
    } catch (error) {
      console.error("Unable to fetch notifications:", error);
    } finally {
      setNotificationLoading(false);
    }
  }, []);

  // FETCH ON PAGE LOAD AND REFRESH EVERY 60 SECONDS
  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(() => {
      fetchNotifications();
    }, 60000);

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // GLOBAL SEARCH
  useEffect(() => {
    if (search.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearchLoading(true);

        const response = await API.get(
          `/search?q=${encodeURIComponent(search.trim())}`
        );

        setSearchResults(response.data.results || []);
      } catch (error) {
        console.error("Search failed:", error);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  // CLOSE DROPDOWNS WHEN CLICKING OUTSIDE
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!profileRef.current?.contains(event.target)) {
        setProfileOpen(false);
      }

      if (!notificationRef.current?.contains(event.target)) {
        setNotificationOpen(false);
      }

      if (!searchRef.current?.contains(event.target)) {
        setSearchResults([]);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // PROFILE DROPDOWN
  const handleProfileClick = () => {
    setProfileOpen((previous) => !previous);
    setNotificationOpen(false);
  };

  // NOTIFICATION DROPDOWN
  const handleNotificationClick = () => {
    const willOpen = !notificationOpen;

    setNotificationOpen(willOpen);
    setProfileOpen(false);

    if (willOpen) {
      fetchNotifications();
    }
  };

  // LOGOUT
  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  // SEARCH RESULT CLICK
  const handleSearchResultClick = (result) => {
    if (result.path) {
      navigate(result.path);
    }

    setSearch("");
    setSearchResults([]);
  };

  // MARK ALL AS READ
  const markAllAsRead = async () => {
    try {
      await API.patch("/notifications/read-all");

      setNotifications((previous) =>
        previous.map((notification) => ({
          ...notification,
          read: true,
        }))
      );
    } catch (error) {
      console.error("Unable to mark notifications as read:", error);
    }
  };

  // UNREAD COUNT
  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  return (
    <nav className="top-navbar">

      <div className="navbar-left">
        <h5>{title}</h5>
        <span>Welcome back! Here's your overview.</span>
      </div>

      <div className="navbar-right">

        {/* SEARCH */}
        <div className="search-box navbar-search" ref={searchRef}>
          <i className="bi bi-search"></i>

          <input
            type="text"
            placeholder="Search anything..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {search.trim().length >= 2 && (
            <div className="navbar-dropdown search-dropdown">

              {searchLoading ? (
                <p className="dropdown-message">Searching...</p>
              ) : searchResults.length > 0 ? (
                searchResults.map((result, index) => (
                  <button
                    key={result.id || index}
                    className="search-result"
                    onClick={() => handleSearchResultClick(result)}
                  >
                    <div>
                      <strong>{result.name}</strong>
                      <small>{result.type}</small>
                    </div>

                    <i className="bi bi-arrow-up-right"></i>
                  </button>
                ))
              ) : (
                <p className="dropdown-message">No results found.</p>
              )}

            </div>
          )}
        </div>

        {/* NOTIFICATIONS */}
        <div className="navbar-action-wrapper" ref={notificationRef}>

          <button
            className="notification-btn"
            onClick={handleNotificationClick}
            title="Notifications"
          >
            <i className="bi bi-bell"></i>

            {unreadCount > 0 && (
              <span className="notification-count">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {notificationOpen && (
            <div className="navbar-dropdown notification-dropdown">

              <div className="dropdown-header">
                <strong>Notifications</strong>

                {unreadCount > 0 && (
                  <button onClick={markAllAsRead}>
                    Mark all as read
                  </button>
                )}
              </div>

              {notificationLoading ? (
                <p className="dropdown-message">
                  Loading notifications...
                </p>
              ) : notifications.length > 0 ? (

                notifications.map((notification, index) => (
                  <div
                    className={`notification-item ${
                      notification.read ? "" : "unread"
                    }`}
                    key={notification._id || index}
                  >
                    <i className="bi bi-info-circle"></i>

                    <div>
                      <strong>{notification.title}</strong>

                      <p>{notification.message}</p>

                      <small>
                        {notification.date
                          ? new Date(notification.date).toLocaleDateString()
                          : "Recent"}
                      </small>
                    </div>
                  </div>
                ))

              ) : (
                <p className="dropdown-message">
                  You're all caught up!
                </p>
              )}

            </div>
          )}
        </div>

        {/* PROFILE */}
        <div className="navbar-action-wrapper" ref={profileRef}>

          <button
            className="navbar-profile"
            onClick={handleProfileClick}
            title="Admin profile"
          >
            {initials || "AD"}
          </button>

          {profileOpen && (
            <div className="navbar-dropdown profile-dropdown">

              <div className="profile-dropdown-header">

                <div className="profile-avatar-large">
                  {initials || "AD"}
                </div>

                <div>
                  <strong>{displayName}</strong>
                  <small>{user?.role || "Admin"}</small>
                </div>

              </div>

              <div className="profile-detail">
                <i className="bi bi-envelope"></i>
                <span>{user?.email || "No email available"}</span>
              </div>

              <hr />

              <button
                className="profile-menu-item logout-item"
                onClick={handleLogout}
              >
                <i className="bi bi-box-arrow-right"></i>
                Logout
              </button>

            </div>
          )}

        </div>

      </div>
    </nav>
  );
};

export default Navbar;