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
    <div className="glass-card p-5 md:p-6">
      <div className="flex items-baseline justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-pm-purple">
            Weekly Health Review
          </p>
          <h3 className="text-lg font-bold text-white">
            Your last 7 days at a glance
          </h3>
        </div>
        <p className="text-xs text-slate-500">
          {data.startISO} → {data.endISO}
        </p>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Stat label="Avg Calories" value={data.avg_kcal} target={data.target_kcal} unit="kcal" kind="kcal" />
        <Stat label="Avg Activity" value={data.avg_minutes} target={data.target_minutes} unit="min/day" kind="activity" />
      </div>

      {/* Day dots */}
      <div className="mt-4 flex items-center gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-white">Balanced:</span>
          <div className="flex gap-1">
            {Array.from({ length: 7 }).map((_, i) => (
              <span
                key={i}
                className={`h-2.5 w-2.5 rounded-full transition-all ${
                  i < (data.good_days ?? 0) ? "bg-pm-accent shadow-sm shadow-pm-accent/30" : "bg-white/10"
                }`}
              />
            ))}
          </div>
          <span>{data.good_days}/7</span>
        </div>
        <span className="text-slate-600">•</span>
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-white">Attention:</span>
          <span className="text-amber-400">{data.bad_days}/7</span>
        </div>
      </div>

      <ul className="mt-4 space-y-1.5 stagger-children">
        {(data.messages || []).map((m, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-slate-300 animate-slide-up">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-pm-purple/60" />
            {m}
          </li>
        ))}
      </ul>
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
