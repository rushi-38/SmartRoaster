import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";

import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";

import Login from "./pages/Login";
import Leaves from "./pages/Leaves";
import Assignments from "./pages/Assignments";
import WorkingRules from "./pages/WorkingRules";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Pods from "./pages/Pods";
import Brands from "./pages/Brands";
import Processes from "./pages/Processes";
import Roster from "./pages/Roster";
import Conflicts from "./pages/Conflicts";
import Reports from "./pages/Reports";

import "./App.css";

// Main application layout
const MainLayout = () => {
  return (
    <div className="app-layout">

      <Sidebar />

      <main className="main-content">

        <Navbar />

        <div className="page-content">
          <Outlet />
        </div>

      </main>

    </div>
  );
};

function App() {
  return (
    <BrowserRouter>

      <AuthProvider>

        <Routes>

          {/* Public Login Page */}
          <Route
            path="/login"
            element={<Login />}
          />

          {/* Protected Application */}
          <Route element={<ProtectedRoute />}>

            <Route element={<MainLayout />}>

              <Route
                path="/"
                element={<Navigate to="/dashboard" replace />}
              />

              <Route path="/dashboard" element={<Dashboard />} />

              <Route path="/employees" element={<Employees />} />

              <Route path="/pods" element={<Pods />} />

              <Route path="/brands" element={<Brands />} />

              <Route path="/processes" element={<Processes />} />

              <Route path="/assignments" element={<Assignments />} />

              <Route path="/working-rules" element={<WorkingRules />} />

              <Route path="/leaves" element={<Leaves />} />

              <Route path="/roster" element={<Roster />} />

              <Route path="/conflicts" element={<Conflicts />} />

              <Route path="/reports" element={<Reports />} />

            </Route>

          </Route>

          {/* Unknown routes */}
          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />

        </Routes>

      </AuthProvider>

    </BrowserRouter>
  );
}

export default App;