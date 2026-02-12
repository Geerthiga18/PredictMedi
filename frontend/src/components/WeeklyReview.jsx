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

  return (
    <div className="glass-card overflow-hidden relative group">
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-pm-purple/10 blur-[100px]" />
      
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-pm-purple">Performance Review</p>
            <h3 className="text-xl font-bold text-white tracking-tight">Last 7 Days Recap</h3>
            <p className="mt-1 text-xs text-slate-500 font-medium">
              {data.startISO} — {data.endISO}
            </p>
          </div>
          <div className="flex -space-x-1.5">
            {Array.from({ length: 7 }).map((_, i) => {
               const day = data.days?.find(d => new Date(d.dateISO).getDay() === (new Date(data.startISO).getDay() + i) % 7);
               const hasData = !!day;
               return (
                 <div key={i} className={`h-2 w-2 rounded-full ring-2 ring-pm-dark ${hasData ? 'bg-pm-accent' : 'bg-white/10'}`} />
               )
            })}
          </div>
        </div>

        {/* Weekly Stats Grid */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <WeeklyStat label="Intake" value={data.avg_kcal} target={data.target_kcal} unit="kcal" color="text-pm-cyan" />
          <WeeklyStat label="Burned" value={data.avg_burned_kcal} unit="kcal" color="text-pm-accent" />
          <WeeklyStat label="Activity" value={data.avg_minutes} target={data.target_minutes} unit="min" color="text-pm-purple" />
        </div>

        {/* Trend Visualization */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
             <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Daily Balance Trend</span>
             <div className="flex gap-4 text-[10px] uppercase tracking-tighter font-bold">
                <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-pm-accent" /> Optimal</div>
                <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-white/10" /> Incomplete</div>
             </div>
          </div>
          <div className="flex items-end justify-between h-32 gap-2 bg-white/[0.02] rounded-2xl p-4 ring-1 ring-white/5">
             {Array.from({ length: 7 }).map((_, i) => {
                const date = new Date(data.startISO);
                date.setDate(date.getDate() + i);
                const iso = date.toISOString().slice(0, 10);
                const dayData = data.days?.find(d => d.dateISO === iso);
                const score = dayData?.score || 0;
                const height = Math.max(10, score);
                const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short' })[0];

                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group/day">
                    <div className="relative w-full flex justify-center">
                      <div 
                        className={`w-full max-w-[12px] rounded-t-lg transition-all duration-700 ease-out ${score >= 70 ? 'bg-pm-accent shadow-[0_0_10px_rgba(6,214,160,0.2)]' : 'bg-white/10'}`} 
                        style={{ height: `${height}%` }}
                      />
                    </div>
                    <span className={`text-[10px] font-bold ${dayData ? 'text-slate-300' : 'text-slate-600'}`}>{dayLabel}</span>
                  </div>
                );
             })}
          </div>
        </div>

        {/* Insights */}
        <div className="mt-8 space-y-3">
          {(data.messages || []).map((m, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] animate-slide-up" style={{ animationDelay: `${0.8 + i * 0.1}s` }}>
              <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-pm-purple shadow-[0_0_8px_rgba(167,139,250,0.4)]" />
              <p className="text-sm text-slate-300 font-medium leading-relaxed">{m}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, target, unit, kind }) {
  if (!target) return null;

  const rawPct = Math.round((value / target) * 100);
  const pct = isFinite(rawPct) ? rawPct : 0;
  const widthPct = Math.min(100, Math.max(0, pct));

  let color;
  if (kind === "activity") {
    color = pct < 70 ? "bg-amber-400" : pct <= 130 ? "bg-pm-accent" : "bg-emerald-400";
  } else {
    color = pct <= 110 ? "bg-pm-cyan" : pct <= 130 ? "bg-amber-400" : "bg-rose-500";
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-slate-300">{label}</span>
        <span className="text-xs text-slate-400">
          <span className="font-semibold text-white">{Math.round(value || 0)}</span> / {Math.round(target)} {unit}
          <span className="ml-1 text-slate-500">({pct}%)</span>
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/5">
        <div
          className={`h-2.5 rounded-full ${color} animate-bar-fill`}
          style={{ "--bar-width": `${widthPct}%`, width: `${widthPct}%` }}
        />
      </div>
    </div>
  );
}

function WeeklyStat({ label, value, target, unit, color }) {
  return (
    <div className="p-4 rounded-2xl bg-white/[0.03] ring-1 ring-white/5 hover:bg-white/[0.05] transition-colors">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">{label}</p>
      <div className="flex items-baseline gap-1.5">
        <span className={`text-xl font-black ${color}`}>{Math.round(value || 0)}</span>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{unit}</span>
      </div>
      {target > 0 && (
        <div className="mt-2 h-1 w-full bg-white/5 rounded-full overflow-hidden">
           <div 
             className={`h-full ${color.replace('text-','bg-')} opacity-60 rounded-full`} 
             style={{ width: `${Math.min(100, (value / target) * 100)}%` }} 
           />
        </div>
      )}
    </div>
  );
}
