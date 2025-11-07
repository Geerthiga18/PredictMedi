import {
  Routes,
  Route,
  NavLink,
  Navigate,
} from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { useState } from "react";
import ActivityLog from "./pages/ActivityLog";
import MealsLog from "./pages/MealsLog";
import "./index.css";
import DiabetesCheck from "./pages/DiabetesCheck";
import HeartCheck from "./pages/HeartCheck";
import CoachCard from "./components/CoachCard";
import TodayProgress from "./components/TodayProgress";
import WeeklyReview from "./components/WeeklyReview";
import AiLogInput from "./components/AiLogInput";
import Profile from "./pages/Profile";

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

export default function App() {
  const { token, setToken, user, setUser, logout } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  function onAuth(t, u) {
    setToken(t);
    setUser(u);
    setRefreshKey((k) => k + 1);
  }

  function handleUserUpdate(u) {
    setUser(u);
    setRefreshKey((k) => k + 1);
  }

  return (
    <div className={shell}>
      {/* Top nav */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-slate-200 shadow-sm">
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
              to="/meals"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : ""}`
              }
            >
              Meals
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
              to="/profile"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : ""}`
              }
            >
              Profile
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
              <button
                className={btnPrimary}
                onClick={() => {
                  logout();
                  setRefreshKey((k) => k + 1);
                }}
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className={container}>
        <Routes>
          {/* Home / Dashboard */}
          <Route
            path="/"
            element={
              <Protected token={token}>
                <div className={card}>
                  <h2 className="text-2xl font-semibold tracking-tight">
                    Welcome {user?.name || user?.email}
                  </h2>
                  <p className="mt-2 text-slate-600">
                    Log today&apos;s meals and activities to get your personalized health review.
                  </p>

                  <div className="mt-6 space-y-6">
                    <AiLogInput
                      token={token}
                      onLogged={() => setRefreshKey((k) => k + 1)}
                    />
                    <CoachCard
                      token={token}
                      dateISO={new Date().toISOString().slice(0, 10)}
                      refreshKey={refreshKey}
                    />
                    <TodayProgress
                      token={token}
                      goal={user?.goal || "maintain"}
                      refreshKey={refreshKey}
                    />
                    <WeeklyReview
                      token={token}
                      refreshKey={refreshKey}
                    />
                  </div>
                </div>
              </Protected>
            }
          />

          {/* Profile */}
          <Route
            path="/profile"
            element={
              <Protected token={token}>
                <Profile
                  token={token}
                  user={user}
                  onUpdate={handleUserUpdate}
                />
              </Protected>
            }
          />

          {/* Other pages */}
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

          {/* Auth */}
          <Route
            path="/login"
            element={
              token ? (
                <Navigate to="/" replace />
              ) : (
                <Login onAuth={onAuth} />
              )
            }
          />
          <Route
            path="/register"
            element={
              token ? (
                <Navigate to="/" replace />
              ) : (
                <Register onAuth={onAuth} />
              )
            }
          />
        </Routes>
      </main>
    </div>
  );
}
