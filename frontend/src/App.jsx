import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  Navigate,
} from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { api } from "./lib/api";
import { useState } from "react";
import ActivityLog from "./pages/ActivityLog";
import MealsLog from "./pages/MealsLog";
import "./index.css";
import DiabetesCheck from "./pages/DiabetesCheck";
import HeartCheck from "./pages/HeartCheck";
import CoachCard from "./components/CoachCard";
import TodayProgress from "./components/TodayProgress";

function Protected({ token, children }) {
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

const linkBase =
  "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100";
const linkActive = "text-blue-700 bg-blue-100 hover:bg-blue-100";
const btnPrimary =
  "inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-white font-medium shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50";
const shell = "min-h-screen bg-slate-50 text-slate-900";
const container = "container mx-auto p-4 md:p-6";
const card =
  "mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow ring-1 ring-slate-100";

function Home({ user, token }) {
  const [msg, setMsg] = useState("");
  async function whoAmI() {
    try {
      const res = await api("/users/me", { token });
      setMsg(`Hello ${res.user.name} (${res.user.email})`);
    } catch (e) {
      setMsg(e.message);
    }
  }
  return (
    <div className={card}>
      <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>
      <p className="mt-2 text-slate-600">
        Signed in as: <span className="font-medium">{user?.email}</span>
      </p>
      <button className={`${btnPrimary} mt-4`} onClick={whoAmI}>
        Check /users/me
      </button>
      {msg && <p className="mt-3 text-sm text-slate-700">{msg}</p>}
    </div>
  );
}

export default function App() {
  const { token, setToken, user, setUser, logout } = useAuth();
  function onAuth(t, u) {
    setToken(t);
    setUser(u);
  }

  return (
    <div className={shell}>
      {/* Top nav */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-slate-200 shadow-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-slate-900">
              PredictMedi
            </span>
          </div>
          <div className="flex items-center gap-2">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : ""}`
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/activity"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : ""}`
              }
            >
              Activity
            </NavLink>
            <NavLink
              to="/diabetes"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : ""}`
              }
            >
              Diabetes
            </NavLink>
            <NavLink
              to="/heart"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : ""}`
              }
            >
              Heart Disease
            </NavLink>

            <NavLink
              to="/meals"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : ""}`
              }
            >
              Meals
            </NavLink>
            {!token && (
              <>
                <NavLink
                  to="/login"
                  className={({ isActive }) =>
                    `${linkBase} ${isActive ? linkActive : ""}`
                  }
                >
                  Login
                </NavLink>
                <NavLink
                  to="/register"
                  className={({ isActive }) =>
                    `${linkBase} ${isActive ? linkActive : ""}`
                  }
                >
                  Register
                </NavLink>
              </>
            )}
            {token && (
              <button className={btnPrimary} onClick={logout}>
                Logout
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className={container}>
        <Routes>
     <Route
  path="/"
  element={
    <Protected token={token}>
      <div className={card}>
        <h2 className="text-2xl font-semibold tracking-tight">
          Welcome {user?.name || user?.email}
        </h2>
        <p className="mt-2 text-slate-600">
          Use the nav to log Activity & Meals.
        </p>

        {/* Coach card */}
        <div className="mt-6">
          <CoachCard
            token={token}
            activity="light"
            goal="maintain"
            sugarG={0}
            activityMinutes={30}
          />
          <div className="mt-6">
  <TodayProgress token={token} activity="light" goal="maintain" />
</div>
        </div>
      </div>
    </Protected>
  }
/>

          <Route
            path="/activity"
            element={
              <Protected token={token}>
                <ActivityLog token={token} />
              </Protected>
            }
          />
          <Route
            path="/meals"
            element={
              <Protected token={token}>
                <MealsLog token={token} />
              </Protected>
            }
          />
          <Route
            path="/diabetes"
            element={
              <Protected token={token}>
                <DiabetesCheck token={token} />
              </Protected>
            }
          />
          <Route
            path="/heart"
            element={
              <Protected token={token}>
                <HeartCheck token={token} />
              </Protected>
            }
          />
        <Route
  path="/login"
  element={token ? <Navigate to="/" replace /> : <Login onAuth={onAuth} />}
/>
<Route
  path="/register"
  element={token ? <Navigate to="/" replace /> : <Register onAuth={onAuth} />}
/>

          
        </Routes>
      </main>
    </div>
  );
}
