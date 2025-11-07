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

/** Shared styles - lighter + bigger **/

const linkBase =
  "inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm md:text-base font-medium text-slate-600 transition-colors hover:text-slate-900 hover:bg-slate-100";
const linkActive =
  "text-blue-700 bg-blue-100 shadow-sm hover:bg-blue-100";
const btnPrimary =
  "inline-flex items-center rounded-full bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-500 px-5 py-2.5 text-sm md:text-base font-semibold text-white shadow-md hover:shadow-lg hover:from-blue-700 hover:via-sky-600 hover:to-indigo-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50";

const shell =
  "min-h-screen bg-slate-50 bg-[radial-gradient(circle_at_top,_rgba(148,163,253,0.14),_transparent_60%),radial-gradient(circle_at_bottom,_rgba(56,189,248,0.12),_transparent_55%)] text-slate-900";
const container =
  "container mx-auto px-4 pb-10 pt-4 md:px-8 md:pt-8";
const card =
  "mx-auto max-w-5xl rounded-3xl bg-white/95 px-5 py-6 md:px-8 md:py-7 shadow-[0_18px_60px_rgba(15,23,42,0.12)] ring-1 ring-slate-200 backdrop-blur-sm";

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
      <nav className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md shadow-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-3 md:px-8">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-sky-400 to-emerald-400 shadow-md">
              <span className="text-base font-black text-white">P</span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-lg font-semibold tracking-tight text-slate-900">
                PredictMedi
              </span>
              <span className="text-[10px] uppercase tracking-[0.18em] text-sky-500">
                Health Insight Companion
              </span>
            </div>
          </div>

          {/* Nav links */}
          <div className="flex items-center gap-1.5 md:gap-3">
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
              Heart
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
                  Sign up
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
                  {/* Header */}
                  <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 md:flex-row md:items-end md:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-500">
                        Today&apos;s health snapshot
                      </p>
                      <h2 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">
                        Welcome back{" "}
                        <span className="text-sky-600">
                          {user?.name || user?.email}
                        </span>
                      </h2>
                      <p className="mt-2 text-sm md:text-base text-slate-600">
                        Log your meals and movement. We&apos;ll turn it into a
                        clear daily coach, risk insights, and weekly trends.
                      </p>
                    </div>

                    {user && (
                      <div className="mt-1 flex flex-col items-start md:items-end text-xs md:text-sm text-slate-500">
                        <span>
                          Goal:{" "}
                          <span className="font-semibold text-sky-600">
                            {user.goal || "maintain"}
                          </span>
                        </span>
                        {user.weightKg && user.heightCm && (
                          <span className="mt-0.5">
                            {user.weightKg} kg • {user.heightCm} cm
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Content */}
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
