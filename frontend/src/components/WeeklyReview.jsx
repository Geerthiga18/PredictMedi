import { useEffect, useState } from "react";
import { api } from "../lib/api";

export default function WeeklyReview({ token, refreshKey = 0 }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        setErr("");
        setLoading(true);
        const endISO = new Date().toISOString().slice(0, 10);
        const res = await api(`/coach/weekly?endISO=${endISO}`, { token });
        setData(res);
      } catch (e) {
        setErr(e.message || "Failed to load weekly review");
      } finally {
        setLoading(false);
      }
    })();
  }, [token, refreshKey]);

  if (!token) return null;

  if (loading) {
    return (
      <div className="glass-card p-5 text-sm text-slate-500">
        <div className="flex items-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-pm-accent/30 border-t-pm-accent" />
          Calculating your weekly review…
        </div>
      </div>
    );
  }

  if (err || !data) {
    return (
      <div className="glass-card p-5 text-sm text-red-400">
        {err || "Unable to load weekly review."}
      </div>
    );
  }

  // Build the 7 dates for the week
  const startDate = new Date(data.startISO + "T00:00:00");
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    return d.toISOString().slice(0, 10);
  });

  const weeklyScore = data.weekly_score || 0;
  const scoreColor =
    weeklyScore >= 80 ? "text-pm-accent" :
    weeklyScore >= 60 ? "text-amber-400" : "text-red-400";

  const trendIcon = data.trend === "improving" ? "📈" : data.trend === "declining" ? "📉" : "➡️";
  const trendLabel = data.trend === "improving" ? "Improving" : data.trend === "declining" ? "Declining" : "Stable";
  const trendColor = data.trend === "improving" ? "text-pm-accent" : data.trend === "declining" ? "text-red-400" : "text-slate-400";

  // Find max kcal for bar chart scaling
  const maxKcal = Math.max(
    1,
    ...(data.days || []).map(d => Math.max(d.kcal || 0, d.burned_kcal || 0))
  );

  return (
    <div className="glass-card overflow-hidden relative group">
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-pm-purple/10 blur-[100px]" />
      
      <div className="p-6">
        {/* Header with weekly score ring */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Mini Score Ring */}
            <div className="relative h-16 w-16 shrink-0">
              <svg className="h-full w-full transform -rotate-90">
                <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="5" className="text-white/5" />
                <circle
                  cx="32" cy="32" r="28"
                  fill="none" stroke="currentColor" strokeWidth="5"
                  strokeDasharray={176}
                  strokeDashoffset={176 - (176 * weeklyScore) / 100}
                  strokeLinecap="round"
                  className={`${scoreColor} transition-all duration-1000 ease-out`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-sm font-black ${scoreColor}`}>{weeklyScore}</span>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-pm-purple">Performance Review</p>
              <h3 className="text-xl font-bold text-white tracking-tight">Last 7 Days Recap</h3>
              <p className="mt-0.5 text-xs text-slate-500 font-medium">
                {data.startISO} — {data.endISO}
              </p>
            </div>
          </div>

          {/* Streak & Trend Badges */}
          <div className="flex flex-col items-end gap-2">
            {data.streak >= 2 && (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-pm-accent/10 px-3 py-1 ring-1 ring-pm-accent/20">
                <span className="text-sm">🔥</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-pm-accent">{data.streak}-day streak</span>
              </div>
            )}
            <div className={`inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 ring-1 ring-white/10`}>
              <span className="text-sm">{trendIcon}</span>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${trendColor}`}>{trendLabel}</span>
            </div>
          </div>
        </div>

        {/* Day Indicator Dots — fixed to use date matching */}
        <div className="mt-4 flex items-center justify-center gap-2">
          {weekDates.map((iso, i) => {
            const dayData = data.days?.find(d => d.dateISO === iso);
            const hasData = !!dayData;
            const isGood = dayData?.score >= 70;
            const dayLabel = new Date(iso + "T00:00:00").toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2);
            return (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className={`h-2.5 w-2.5 rounded-full ring-2 ring-pm-dark transition-all ${
                  isGood ? 'bg-pm-accent shadow-[0_0_6px_rgba(6,214,160,0.4)]' : 
                  hasData ? 'bg-amber-400' : 'bg-white/10'
                }`} />
                <span className={`text-[9px] font-bold ${hasData ? 'text-slate-400' : 'text-slate-600'}`}>{dayLabel}</span>
              </div>
            );
          })}
        </div>

        {/* Weekly Stats Grid */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          <WeeklyStat label="Avg Intake" value={data.avg_kcal} target={data.target_kcal} unit="kcal" color="text-pm-cyan" />
          <WeeklyStat label="Avg Burned" value={data.avg_burned_kcal} unit="kcal" color="text-orange-400" />
          <WeeklyStat label="Avg Activity" value={data.avg_minutes} unit="min" color="text-pm-accent" />
          <WeeklyStat label="Good Days" value={data.good_days} target={data.days_logged} unit={`/ ${data.days_logged}`} color="text-pm-purple" />
        </div>

        {/* Macro Averages vs Targets */}
        {data.avg_macros && data.target_macros && (
          <div className="mt-6">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-3">Macro Averages</span>
            <div className="grid grid-cols-3 gap-3">
              <MacroBar label="Carbs" value={data.avg_macros.carb_g} target={data.target_macros.carb_g} color="bg-amber-400" />
              <MacroBar label="Protein" value={data.avg_macros.protein_g} target={data.target_macros.protein_g} color="bg-pm-purple" />
              <MacroBar label="Fat" value={data.avg_macros.fat_g} target={data.target_macros.fat_g} color="bg-rose-500" />
            </div>
          </div>
        )}

        {/* Dual-Bar Chart: Intake vs Burned per day */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
             <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Daily Calories</span>
             <div className="flex gap-4 text-[10px] uppercase tracking-tighter font-bold">
                <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-pm-cyan" /> Intake</div>
                <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-orange-400" /> Burned</div>
             </div>
          </div>
          <div className="flex items-end justify-between h-36 gap-1.5 bg-white/[0.02] rounded-2xl p-4 ring-1 ring-white/5">
             {weekDates.map((iso, i) => {
                const dayData = data.days?.find(d => d.dateISO === iso);
                const intake = dayData?.kcal || 0;
                const burned = dayData?.burned_kcal || 0;
                const intakeH = maxKcal > 0 ? Math.max(4, (intake / maxKcal) * 100) : 4;
                const burnedH = maxKcal > 0 ? Math.max(4, (burned / maxKcal) * 100) : 4;
                const dayLabel = new Date(iso + "T00:00:00").toLocaleDateString('en-US', { weekday: 'short' })[0];
                const isBest = data.best_day?.dateISO === iso;

                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group/day">
                    {isBest && <span className="text-[10px]">👑</span>}
                    <div className="relative w-full flex justify-center gap-0.5">
                      {/* Intake bar */}
                      <div 
                        className="w-[6px] rounded-t-md bg-pm-cyan/80 transition-all duration-700 ease-out hover:bg-pm-cyan"
                        style={{ height: `${dayData ? intakeH : 0}%` }}
                        title={`Intake: ${Math.round(intake)} kcal`}
                      />
                      {/* Burned bar */}
                      <div 
                        className="w-[6px] rounded-t-md bg-orange-400/80 transition-all duration-700 ease-out hover:bg-orange-400"
                        style={{ height: `${dayData ? burnedH : 0}%` }}
                        title={`Burned: ${Math.round(burned)} kcal`}
                      />
                    </div>
                    <span className={`text-[10px] font-bold ${dayData ? 'text-slate-300' : 'text-slate-600'}`}>{dayLabel}</span>
                  </div>
                );
             })}
          </div>
        </div>

        {/* Best Day Highlight */}
        {data.best_day && (
          <div className="mt-4 flex items-center gap-3 p-3 rounded-xl bg-pm-accent/5 ring-1 ring-pm-accent/10">
            <span className="text-lg">👑</span>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-pm-accent">Best Day</span>
              <p className="text-sm font-semibold text-white">
                {new Date(data.best_day.dateISO + "T00:00:00").toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                <span className="ml-2 text-pm-accent">Score {data.best_day.score}</span>
                <span className="ml-2 text-slate-400 text-xs">{data.best_day.badge}</span>
              </p>
            </div>
          </div>
        )}

        {/* Insights */}
        <div className="mt-6 space-y-2.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Weekly Insights</span>
          {(data.messages || []).map((m, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] animate-slide-up" style={{ animationDelay: `${0.6 + i * 0.08}s` }}>
              <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-pm-purple shadow-[0_0_8px_rgba(167,139,250,0.4)]" />
              <p className="text-sm text-slate-300 font-medium leading-relaxed">{m}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* --- Sub-components --- */

function WeeklyStat({ label, value, target, unit, color }) {
  return (
    <div className="p-3 rounded-2xl bg-white/[0.03] ring-1 ring-white/5 hover:bg-white/[0.05] transition-colors">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className={`text-lg font-black ${color}`}>{Math.round(value || 0)}</span>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{unit}</span>
      </div>
      {target > 0 && (
        <div className="mt-2 h-1 w-full bg-white/5 rounded-full overflow-hidden">
           <div 
             className={`h-full ${color.replace('text-','bg-')} opacity-60 rounded-full transition-all duration-700`} 
             style={{ width: `${Math.min(100, ((value || 0) / target) * 100)}%` }} 
           />
        </div>
      )}
    </div>
  );
}

function MacroBar({ label, value, target, color }) {
  if (!target || target <= 0) return null;
  const pct = Math.round((value / target) * 100);
  const widthPct = Math.min(100, Math.max(0, pct));

  return (
    <div className="p-3 rounded-xl bg-white/[0.02] ring-1 ring-white/5">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-bold text-slate-400 uppercase">{label}</span>
        <span className="text-[10px] font-bold text-white">{Math.round(value)}g <span className="text-slate-500">/ {Math.round(target)}g</span></span>
      </div>
      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} rounded-full transition-all duration-700 opacity-70`} 
          style={{ width: `${widthPct}%` }} 
        />
      </div>
      <div className="mt-1 text-right">
        <span className={`text-[9px] font-bold ${pct >= 85 && pct <= 115 ? 'text-pm-accent' : pct > 115 ? 'text-amber-400' : 'text-slate-500'}`}>
          {pct}%
        </span>
      </div>
    </div>
  );
}
