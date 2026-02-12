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

  const planData = data.plan || {};
  const macros = planData.macros || {};
  const totals = data.nutrition_totals || {};
  const minutes = data.minutes ?? 0;
  const badge = data.badge || "";
  const netKcal = data.net_kcal ?? Math.round((totals.kcal || 0) - (data.burned_kcal || 0));

  const buildStat = (label, v, t) => {
    // If target is explicitly null, show only value (no limit/bar)
    if (t === null) {
      return { label, val: `${Math.round(v || 0)}`, pct: null, widthPct: 0 };
    }
    if (!t) return null;
    const rawPct = Math.round(((v || 0) / t) * 100);
    const pct = isFinite(rawPct) ? rawPct : 0;
    // Allow bar to show "full" but text shows >100%
    const widthPct = Math.min(100, Math.max(0, pct));
    return { label, val: `${Math.round(v || 0)} / ${Math.round(t)}`, pct, widthPct };
  };

  const stats = [
    // buildStat("Calories Intake", totals.kcal, macros.kcal || planData.tdee), // Handle separately
    buildStat("Carbs (g)", totals.carb_g, macros.carb_g),
    buildStat("Protein (g)", totals.protein_g, macros.protein_g),
    buildStat("Fat (g)", totals.fat_g, macros.fat_g),
    buildStat("Sugar (g)", totals.sugar_g, 50),
  ].filter(Boolean);

  const intakeStat = buildStat("Calories Intake", totals.kcal, macros.kcal || planData.tdee);

  const scoreColor =
    data.score >= 80
      ? "text-pm-accent"
      : data.score >= 60
      ? "text-amber-400"
      : "text-red-400";

  const badgeColor =
    data.score >= 90
      ? "bg-yellow-500/10 text-yellow-400 ring-yellow-500/20"
      : data.score >= 80
      ? "bg-slate-300/10 text-slate-300 ring-slate-300/20"
      : data.score >= 70
      ? "bg-amber-600/10 text-amber-500 ring-amber-600/20"
      : "bg-white/5 text-slate-400 ring-white/10";

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
          <div className="text-right space-y-1">
            {/* Badge */}
            {badge && (
              <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ring-1 ${badgeColor}`}>
                {badge}
              </div>
            )}
            {/* Net Calories */}
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Net Calories</div>
              <div className="mt-0.5 text-lg font-black text-white">
                <span className="text-pm-cyan">{netKcal}</span>
                <span className="ml-1 text-[10px] font-medium text-slate-500 uppercase tracking-tighter">kcal net</span>
              </div>
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
              {data.score >= 90 ? 'Outstanding' : data.score >= 80 ? 'Excellent Balance' : data.score >= 60 ? 'Good Progress' : 'Needs Focus'}
            </p>
          </div>

          {/* Stats List */}
          <div className="lg:col-span-3 space-y-4">
            {/* 1. Intake Bar */}
            {intakeStat && <Stat {...intakeStat} delay={0} />}

            {/* 3. Macros */}
            {stats.map((s, i) => (
              <Stat key={i} {...s} delay={0.3 + i * 0.08} />
            ))}

            {/* 2. Activity & Burned Grid (moved to bottom) */}
            <div className="grid grid-cols-2 gap-3 my-1">
                 {/* Activity Card */}
                 <div className="p-3 bg-white/[0.03] rounded-2xl ring-1 ring-white/5 flex flex-col items-center justify-center text-center group/card hover:bg-white/[0.05] transition-colors animate-fade-in" style={{animationDelay: '0.6s'}}>
                     <div className="mb-1.5 flex h-8 w-8 items-center justify-center rounded-lg bg-pm-accent/10 text-pm-accent">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                           <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                     </div>
                     <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Activity</span>
                     <span className="text-xl font-black text-white mt-0.5 tracking-tight">
                        {minutes} <span className="text-[10px] font-bold text-slate-500 align-middle ml-0.5">MIN</span>
                     </span>
                 </div>

                 {/* Burned Card */}
                 <div className="p-3 bg-white/[0.03] rounded-2xl ring-1 ring-white/5 flex flex-col items-center justify-center text-center group/card hover:bg-white/[0.05] transition-colors animate-fade-in" style={{animationDelay: '0.7s'}}>
                     <div className="mb-1.5 flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                           <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                        </svg>
                     </div>
                     <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Burned</span>
                     <span className="text-xl font-black text-white mt-0.5 tracking-tight">
                        {Math.round(data.burned_kcal||0)} <span className="text-[10px] font-bold text-slate-500 align-middle ml-0.5">KCAL</span>
                     </span>
                 </div>
            </div>
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
    intake:   { color: "bg-pm-cyan",   icon: <path d="M3 6l3 18h12l3-18H3z" /> },
    burned:   { color: "bg-orange-400", icon: <path d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /> },
    carbs:    { color: "bg-amber-400", icon: <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /> },
    protein:  { color: "bg-pm-purple", icon: <path d="M12 21l-8.2-5.4L2 7l10-5 10 5-1.8 8.6L12 21z" /> },
    fat:      { color: "bg-rose-500",  icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /> },
    sugar:    { color: "bg-pink-400",  icon: <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /> },
    activity: { color: "bg-pm-accent", icon: <path d="M13 10V3L4 14h7v7l9-11h-7z" /> },
  };

  const type = key.includes("intake") ? "intake" : 
               key.includes("burned") ? "burned" :
               key.includes("carbs") ? "carbs" : 
               key.includes("protein") ? "protein" : 
               key.includes("fat") && !key.includes("sugar") ? "fat" :
               key.includes("sugar") ? "sugar" : "activity";
  
  const { color, icon } = config[type];

  // Sugar is "good when low" — different color logic
  let barColor = color;
  if (type === "sugar") {
    barColor = pct <= 100 ? "bg-pm-accent" : pct <= 120 ? "bg-amber-400" : "bg-red-500";
  } else if (type === "burned") {
    barColor = pct >= 100 ? "bg-pm-accent" : pct >= 50 ? "bg-orange-400" : "bg-amber-400";
  }

  return (
    <div className="group/stat animate-fade-in" style={{ animationDelay: `${delay}s` }}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10">
             <svg className={`w-3.5 h-3.5 ${color.replace('bg-','text-')}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
               {icon}
             </svg>
          </div>
          <span className="text-xs font-semibold text-slate-400 group-hover/stat:text-white transition-colors">{label}</span>
        </div>
        <span className="text-xs font-bold text-white">
          {val} {pct !== null && <span className="ml-1 text-[10px] text-slate-500">({pct}%)</span>}
        </span>
      </div>
      {pct !== null && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
          <div
            className={`h-full rounded-full ${barColor} animate-bar-fill shadow-[0_0_8px_rgba(0,0,0,0.2)]`}
            style={{ "--bar-width": `${widthPct || 0}%`, width: `${widthPct || 0}%` }}
          />
        </div>
      )}
    </div>
  );
}
