import { useEffect, useState } from "react";
import { api } from "../lib/api";

export default function ActivityLog({ token }) {
  const today = new Date().toISOString().slice(0,10);
  const [date, setDate] = useState(today);
  const [minutes, setMinutes] = useState(30);
  const [steps, setSteps] = useState("");
  const [type, setType] = useState("walk");
  const [logs, setLogs] = useState([]);
  const [msg, setMsg] = useState("");
  const [userProfile, setUserProfile] = useState(null);

  const METS = {
    walk_easy: 2.5, walk: 3.3, walk_brisk: 3.8,
    run_easy: 8.0, run: 9.8,
    cycle_easy: 4.0, cycle_moderate: 6.8, cycle_vigorous: 8.0,
    strength: 3.5, yoga: 2.5, hiit: 8.0,
  };

  const estKcal = (() => {
    const met = METS[(type || "").toLowerCase()] || 3.3;
    const weight = userProfile?.weightKg || 70;
    const hours = (Number(minutes) || 0) / 60;
    return Math.round(met * weight * hours);
  })();

  async function load() {
    try {
      const res = await api("/activity/logs", { token });
      setLogs(res.logs);
      // Also get profile for weight
      const u = await api("/users/me", { token });
      setUserProfile(u.user);
    } catch (e) { setMsg(e.message); }
  }
  useEffect(() => {
    if (!token) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function submit(e) {
    e.preventDefault();
    setMsg("");
    try {
      await api("/activity/log/upsert", {
        method: "POST",
        token,
        body: { date, minutes: Number(minutes), steps: steps ? Number(steps) : undefined, type }
      });
      setMsg("Saved!");
      load();
      setTimeout(() => setMsg(""), 2000);
    } catch (e) { setMsg(e.message); }
  }

  const typeColors = {
    walk: "bg-pm-accent/15 text-pm-accent ring-pm-accent/20",
    run: "bg-pm-cyan/15 text-pm-cyan ring-pm-cyan/20",
    gym: "bg-pm-purple/15 text-pm-purple ring-pm-purple/20",
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Form card */}
      <div className="glass-card p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-pm-accent">
          Activity Tracker
        </p>
        <h2 className="mt-1 text-2xl font-bold text-white">
          Log Activity
        </h2>

        <form onSubmit={submit} className="mt-5 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">Date</label>
            <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="pm-input" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">Minutes</label>
            <input type="number" placeholder="30" value={minutes} onChange={e=>setMinutes(e.target.value)} className="pm-input" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">Steps (optional)</label>
            <input type="number" placeholder="5000" value={steps} onChange={e=>setSteps(e.target.value)} className="pm-input" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">Type</label>
            <input placeholder="walk / run / gym…" value={type} onChange={e=>setType(e.target.value)} className="pm-input" />
          </div>
          <div className="col-span-2 flex items-center justify-between rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
            <div className="text-xs text-slate-400">
              Estimated Burn: <span className="text-sm font-bold text-pm-accent">{estKcal} kcal</span>
            </div>
            <div className="text-[10px] text-slate-500 italic">
              Based on {userProfile?.weightKg || 70}kg profile
            </div>
          </div>
          <div className="col-span-2 mt-1">
            <button className="pm-btn w-full">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Save Activity
            </button>
          </div>
        </form>

        {msg && (
          <div className={`mt-3 rounded-xl px-4 py-2.5 text-sm ring-1 animate-slide-up ${
            msg === "Saved!"
              ? "bg-pm-accent/10 text-pm-accent ring-pm-accent/20"
              : "bg-red-500/10 text-red-400 ring-red-500/20"
          }`}>
            {msg}
          </div>
        )}
      </div>

      {/* History */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-bold text-white">Recent Activity</h3>

        <div className="mt-4 overflow-hidden rounded-xl ring-1 ring-white/[0.06]">
          <table className="min-w-full divide-y divide-white/[0.06]">
            <thead>
              <tr className="bg-white/[0.02]">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Minutes</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Calories</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Steps</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {logs.map((r, i) => (
                <tr key={i} className="transition-colors hover:bg-white/[0.03]">
                  <td className="px-4 py-3 text-sm text-slate-300">{r.dateISO || r.date}</td>
                  <td className="px-4 py-3 text-sm font-medium text-white">{r.minutes}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-pm-accent">{Math.round(r.kcal || 0)}</td>
                  <td className="px-4 py-3 text-sm text-slate-300">{r.steps ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${
                      typeColors[r.type] || "bg-white/5 text-slate-400 ring-white/10"
                    }`}>
                      {r.type ?? "—"}
                    </span>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td className="px-4 py-8 text-center text-sm text-slate-500" colSpan={5}>
                    No activity logged yet. Start tracking above!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
