import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";
import Leaves from "./pages/Leaves";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Assignments from "./pages/Assignments";
import WorkingRules from "./pages/WorkingRules";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Pods from "./pages/Pods";
import Brands from "./pages/Brands";
import Processes from "./pages/Processes";
import Roster from "./pages/Roster";
import Conflicts from "./pages/Conflicts";
import "./App.css";

function App() {

  return (

    <BrowserRouter>

      <div className="app-layout">

        <Sidebar />

        <main className="main-content">

          <Navbar />

          <div className="page-content">

            <Routes>

              <Route
                path="/"
                element={<Navigate to="/dashboard" />}
              />

              <Route
                path="/dashboard"
                element={<Dashboard />}
              />

              <Route
                path="/employees"
                element={<Employees />}
              />

              <Route
                path="/pods"
                element={<Pods />}
              />
              <Route path="/brands" element={<Brands />} />

              <Route path="/processes" element={<Processes />} />
              <Route path="/assignments" element={<Assignments />} />

              <Route path="/working-rules" element={<WorkingRules />} />
              <Route path="/leaves" element={<Leaves />} />
              <Route path="/roster" element={<Roster />} />
              <Route path="/conflicts" element={<Conflicts />} />
            </Routes>

          </div>

        </main>

      </div>

    </BrowserRouter>

  );
}

export default App;