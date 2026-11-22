import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();

  const { login, isAuthenticated, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await login(email, password);
      navigate("/dashboard", { replace: true });

    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Unable to login. Please try again."
      );
    }
  };

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light p-3">

      <div
        className="card border-0 shadow-lg"
        style={{ width: "100%", maxWidth: "430px", borderRadius: "16px" }}
      >

        <div className="card-body p-4 p-md-5">

          <div className="text-center mb-4">

            <div
              className="d-inline-flex align-items-center justify-content-center rounded-3 mb-3"
              style={{
                width: "60px",
                height: "60px",
                background: "#10264a",
                color: "white",
                fontSize: "26px",
              }}
            >
              <i className="bi bi-calendar2-week-fill"></i>
            </div>

            <h3 className="fw-bold mb-1">Smart Roster</h3>

            <p className="text-muted mb-0">
              Admin Login
            </p>

          </div>

          {error && (
            <div className="alert alert-danger py-2" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            <div className="mb-3">

              <label className="form-label fw-semibold">
                Email Address
              </label>

              <input
                type="email"
                className="form-control"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

            </div>

            <div className="mb-4">

              <label className="form-label fw-semibold">
                Password
              </label>

              <input
                type="password"
                className="form-control"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

            </div>

            <button
              type="submit"
              className="btn w-100 text-white fw-semibold py-2"
              style={{ background: "#10264a" }}
              disabled={loading}
            >

              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Signing in...
                </>
              ) : (
                "Login"
              )}

            </button>

          </form>

          <div className="text-center mt-4">

            <small className="text-muted">
              Smart Roster Management System
            </small>

          </div>

        </div>

      </div>

    </div>
  );
};

export default Login;