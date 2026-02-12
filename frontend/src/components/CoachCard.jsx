import { useEffect, useState } from "react";
import { api } from "../lib/api";

export default function CoachCard({ token, dateISO, refreshKey = 0 }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, dateISO, refreshKey]);

  async function load() {
    try {
      setErr("");
      setLoading(true);
      const qs = dateISO ? `?dateISO=${encodeURIComponent(dateISO)}` : "";
      const r = await api(`/coach/motivate${qs}`, { token });
      setData(r);
    } catch (e) {
      setErr(e.message || "Failed to load coach");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  if (!token) return null;

  if (loading || !data) {
    return (
      <div className="glass-card p-5">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-white/5 animate-pulse shimmer-bg" />
          <div className="space-y-2 flex-1">
            <div className="h-3 w-32 rounded-full bg-white/5 animate-pulse shimmer-bg" />
            <div className="h-3 w-52 rounded-full bg-white/3 animate-pulse shimmer-bg" />
          </div>
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="glass-card p-5 text-sm text-red-400">
        {err}
      </div>
    );
  }

  const plan = data.plan || {};
  const macros = plan.macros || {};
  const totals = data.nutrition_totals || {};
  const minutes = data.minutes ?? 0;

  const buildStat = (label, v, t) => {
    if (!t) return null;
    const rawPct = Math.round(((v || 0) / t) * 100);
    const pct = isFinite(rawPct) ? rawPct : 0;
    const widthPct = Math.min(100, Math.max(0, pct));
    return { label, val: `${Math.round(v || 0)} / ${Math.round(t)}`, pct, widthPct };
  };

  const stats = [
    buildStat("Calories Intake", totals.kcal, macros.kcal || plan.tdee),
    buildStat("Carbs (g)", totals.carb_g, macros.carb_g),
    buildStat("Protein (g)", totals.protein_g, macros.protein_g),
    buildStat("Fat (g)", totals.fat_g, macros.fat_g),
    buildStat("Activity (min)", minutes, data.activity_target || 45),
  ].filter(Boolean);

  const scoreColor =
    data.score >= 75
      ? "text-pm-accent"
      : data.score >= 50
      ? "text-amber-400"
      : "text-red-400";

  return (
    <div className="glass-card overflow-hidden relative group">
      {/* Background Decor */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-pm-cyan/10 blur-[100px] transition-all group-hover:bg-pm-cyan/20" />
      <div className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-pm-purple/10 blur-[100px]" />

      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10 ${scoreColor}`}>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-pm-accent">AI Health Coach</p>
              <h3 className="text-xl font-bold text-white tracking-tight">Today's Performance</h3>
            </div>
          </div>
          <div className="text-right">
             <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Net Calories</div>
             <div className="mt-0.5 text-lg font-black text-white">
                <span className="text-pm-cyan">{Math.round((totals.kcal || 0) - (data.burned_kcal || 0))}</span>
                <span className="ml-1 text-[10px] font-medium text-slate-500 uppercase tracking-tighter">kcal net</span>
             </div>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-5 items-center">
          {/* Circular Score */}
          <div className="lg:col-span-2 flex flex-col items-center justify-center py-4 border-r border-white/5">
            <div className="relative h-32 w-32">
              <svg className="h-full w-full transform -rotate-90">
                <circle
                  cx="64" cy="64" r="58"
                  fill="none" stroke="currentColor" strokeWidth="8"
                  className="text-white/5"
                />
                <circle
                  cx="64" cy="64" r="58"
                  fill="none" stroke="currentColor" strokeWidth="8"
                  strokeDasharray={364}
                  strokeDashoffset={364 - (364 * (data.score || 0)) / 100}
                  strokeLinecap="round"
                  className={`${scoreColor} transition-all duration-1000 ease-out`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl font-black ${scoreColor}`}>{data.score}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Score</span>
              </div>
            </div>
            <p className={`mt-4 text-xs font-bold uppercase tracking-widest ${scoreColor}`}>
              {data.score >= 80 ? 'Excellent Balance' : data.score >= 60 ? 'Good Progress' : 'Needs Focus'}
            </p>
          </div>

          {/* Stats List */}
          <div className="lg:col-span-3 space-y-5">
            {stats.map((s, i) => (
              <Stat key={i} {...s} delay={i * 0.1} />
            ))}
          </div>
        </div>

        {/* AI Insight Box */}
        <div className="mt-8 rounded-2xl bg-white/[0.03] p-5 ring-1 ring-white/10 hover:bg-white/[0.05] transition-colors">
          <div className="flex items-center gap-2 mb-3">
             <div className="h-1.5 w-1.5 rounded-full bg-pm-accent shadow-[0_0_8px_rgba(6,214,160,0.6)]" />
             <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Coach Insights</span>
          </div>
          <ul className="space-y-3">
            {(data.messages || []).map((m, i) => (
              <li key={i} className="flex items-start gap-3 animate-slide-up" style={{ animationDelay: `${0.5 + i * 0.1}s` }}>
                <div className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-white/20" />
                <p className="text-sm leading-relaxed text-slate-300">{m}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, val, pct, widthPct, delay }) {
  const key = label.toLowerCase();
  
  const config = {
    intake:   { color: "bg-pm-cyan",   icon: <path d="M3 6l3 18h12l3-18H3z" /> }, // Cup
    carbs:    { color: "bg-amber-400", icon: <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /> }, // Layers
    protein:  { color: "bg-pm-purple", icon: <path d="M12 21l-8.2-5.4L2 7l10-5 10 5-1.8 8.6L12 21z" /> }, // Muscle/Shield
    fat:      { color: "bg-rose-500",  icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /> }, // Droplet/Shield
    activity: { color: "bg-pm-accent", icon: <path d="M13 10V3L4 14h7v7l9-11h-7z" /> }, // Bolt
  };

  const type = key.includes("intake") ? "intake" : 
               key.includes("carbs") ? "carbs" : 
               key.includes("protein") ? "protein" : 
               key.includes("fat") ? "fat" : "activity";
  
  const { color, icon } = config[type];

  return (
    <div className="group/stat animate-fade-in" style={{ animationDelay: `${delay}s` }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`flex h-6 w-6 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10 group-hover/stat:ring-${type}`}>
             <svg className={`w-3.5 h-3.5 ${color.replace('bg-','text-')}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
               {icon}
             </svg>
          </div>
          <span className="text-xs font-semibold text-slate-400 group-hover/stat:text-white transition-colors">{label}</span>
        </div>
        <span className="text-xs font-bold text-white">
          {val} <span className="ml-1 text-[10px] text-slate-500">({pct}%)</span>
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
        <div
          className={`h-full rounded-full ${color} animate-bar-fill shadow-[0_0_8px_rgba(0,0,0,0.2)]`}
          style={{ "--bar-width": `${widthPct || 0}%`, width: `${widthPct || 0}%` }}
        />
      </div>
    </div>
  );
}
