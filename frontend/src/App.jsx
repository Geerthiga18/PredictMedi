import {
  Routes,
  Route,
  NavLink,
  Navigate,
  useLocation,
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

/* ═══ Icons (inline SVGs) ═══ */
const Icon = ({ d, className = "" }) => (
  <svg className={`w-5 h-5 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);

const icons = {
  home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1",
  activity: "M13 10V3L4 14h7v7l9-11h-7z",
  meals: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z",
  diabetes: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  heart: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
  profile: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  logout: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1",
  menu: "M4 6h16M4 12h16M4 18h16",
  close: "M6 18L18 6M6 6l12 12",
  login: "M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1",
  register: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z",
};

function Protected({ token, children }) {
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

/* ═══ Sidebar Link ═══ */
function SideLink({ to, icon, label, collapsed, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
          isActive
            ? "bg-pm-accent/15 text-pm-accent shadow-sm"
            : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
        }`
      }
    >
      <Icon d={icon} className="shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </NavLink>
  );
}

/* ═══ Mobile Bottom Tab ═══ */
function BottomTab({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center gap-0.5 py-1.5 px-2 text-[10px] font-medium transition-colors ${
          isActive ? "text-pm-accent" : "text-slate-500"
        }`
      }
    >
      <Icon d={icon} className="w-5 h-5" />
      <span>{label}</span>
    </NavLink>
  );
}

/* ═══ Page Wrapper with fade-in ═══ */
function PageWrap({ children }) {
  const location = useLocation();
  return (
    <div key={location.pathname} className="animate-fade-in">
      {children}
    </div>
  );
}

export default function App() {
  const { token, setToken, user, setUser, logout } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function onAuth(t, u) {
    setToken(t);
    setUser(u);
    setRefreshKey((k) => k + 1);
  }

  function handleUserUpdate(u) {
    setUser(u);
    setRefreshKey((k) => k + 1);
  }

  const isAuthed = !!token;

  const navItems = [
    { to: "/", icon: icons.home, label: "Home" },
    { to: "/activity", icon: icons.activity, label: "Activity" },
    { to: "/meals", icon: icons.meals, label: "Meals" },
    { to: "/diabetes", icon: icons.diabetes, label: "Diabetes" },
    { to: "/heart", icon: icons.heart, label: "Heart" },
    { to: "/profile", icon: icons.profile, label: "Profile" },
  ];

  /* Auth screens — no sidebar */
  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-pm-dark relative overflow-hidden">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-pm-accent/5 blur-[120px]" />
          <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-pm-cyan/5 blur-[120px]" />
        </div>

        <div className="relative z-10">
          <Routes>
            <Route path="/register" element={<Register onAuth={onAuth} />} />
            <Route path="*" element={<Login onAuth={onAuth} />} />
          </Routes>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pm-dark flex">
      {/* ─── Mobile overlay ─── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ─── Sidebar ─── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/[0.06] bg-[#0d1220]/95 backdrop-blur-xl transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/[0.06]">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-pm-accent to-pm-cyan shadow-lg shadow-pm-accent/20">
            <span className="text-sm font-extrabold text-pm-dark">P</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-base font-bold text-white tracking-tight">
              PredictMedi
            </span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-pm-accent/80">
              Health Companion
            </span>
          </div>
          {/* Close on mobile */}
          <button
            className="ml-auto lg:hidden text-slate-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <Icon d={icons.close} />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <SideLink
              key={item.to}
              {...item}
              collapsed={false}
              onClick={() => setSidebarOpen(false)}
            />
          ))}
        </nav>

        {/* User & Logout */}
        <div className="border-t border-white/[0.06] px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pm-purple to-pm-cyan text-xs font-bold text-white">
              {(user?.name || user?.email || "U")[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">
                {user?.name || "User"}
              </p>
              <p className="truncate text-xs text-slate-500">
                {user?.email || ""}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              setRefreshKey((k) => k + 1);
            }}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
          >
            <Icon d={icons.logout} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-white/[0.06] bg-pm-dark/80 px-4 py-3 backdrop-blur-xl lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-slate-400 hover:text-white"
          >
            <Icon d={icons.menu} />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-pm-accent to-pm-cyan">
              <span className="text-[10px] font-extrabold text-pm-dark">P</span>
            </div>
            <span className="text-sm font-bold text-white">PredictMedi</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
          {/* Ambient glow */}
          <div className="pointer-events-none fixed inset-0 z-0">
            <div className="absolute top-0 right-0 h-[400px] w-[400px] rounded-full bg-pm-accent/[0.03] blur-[100px]" />
            <div className="absolute bottom-0 left-1/4 h-[300px] w-[300px] rounded-full bg-pm-purple/[0.03] blur-[100px]" />
          </div>

          <div className="relative z-10 mx-auto max-w-5xl">
            <Routes>
              {/* Home / Dashboard */}
              <Route
                path="/"
                element={
                  <Protected token={token}>
                    <PageWrap>
                      <div className="space-y-6">
                        {/* Header */}
                        <div className="glass-card p-6 md:p-8">
                          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-pm-accent">
                            Today&apos;s health snapshot
                          </p>
                          <h2 className="mt-2 text-2xl md:text-3xl font-bold text-white">
                            Welcome back{" "}
                            <span className="gradient-text">
                              {user?.name || user?.email}
                            </span>
                          </h2>
                          <p className="mt-2 text-sm text-slate-400 max-w-xl">
                            Log your meals and movement. We&apos;ll turn it into a
                            clear daily coach, risk insights, and weekly trends.
                          </p>

                          {user && (
                            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                              <span className="rounded-full bg-white/5 px-3 py-1 ring-1 ring-white/10">
                                Goal:{" "}
                                <span className="font-semibold text-pm-accent">
                                  {user.goal || "maintain"}
                                </span>
                              </span>
                              {user.weightKg && user.heightCm && (
                                <span className="rounded-full bg-white/5 px-3 py-1 ring-1 ring-white/10">
                                  {user.weightKg} kg • {user.heightCm} cm
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Content */}
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
                    </PageWrap>
                  </Protected>
                }
              />

              {/* Profile */}
              <Route
                path="/profile"
                element={
                  <Protected token={token}>
                    <PageWrap>
                      <Profile
                        token={token}
                        user={user}
                        onUpdate={handleUserUpdate}
                      />
                    </PageWrap>
                  </Protected>
                }
              />

              {/* Other pages */}
              <Route
                path="/activity"
                element={
                  <Protected token={token}>
                    <PageWrap><ActivityLog token={token} /></PageWrap>
                  </Protected>
                }
              />
              <Route
                path="/meals"
                element={
                  <Protected token={token}>
                    <PageWrap><MealsLog token={token} /></PageWrap>
                  </Protected>
                }
              />
              <Route
                path="/diabetes"
                element={
                  <Protected token={token}>
                    <PageWrap><DiabetesCheck token={token} /></PageWrap>
                  </Protected>
                }
              />
              <Route
                path="/heart"
                element={
                  <Protected token={token}>
                    <PageWrap><HeartCheck token={token} /></PageWrap>
                  </Protected>
                }
              />

              {/* Auth */}
              <Route
                path="/login"
                element={<Navigate to="/" replace />}
              />
              <Route
                path="/register"
                element={<Navigate to="/" replace />}
              />
            </Routes>
          </div>
        </main>

        {/* ─── Mobile Bottom Nav ─── */}
        <nav className="sticky bottom-0 z-30 flex items-center justify-around border-t border-white/[0.06] bg-[#0d1220]/95 backdrop-blur-xl px-2 py-1 lg:hidden">
          {navItems.slice(0, 5).map((item) => (
            <BottomTab key={item.to} {...item} />
          ))}
        </nav>
      </div>
    </div>
  );
}
