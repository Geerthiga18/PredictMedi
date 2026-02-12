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
    <div className="glass-card p-5 md:p-6 relative overflow-hidden">
      <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-pm-cyan/5 blur-3xl" />
      <div className="pointer-events-none absolute -left-12 bottom-0 h-24 w-24 rounded-full bg-pm-purple/5 blur-2xl" />

      <div className="flex items-baseline justify-between gap-2 relative">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-pm-accent">
            Daily Coach
          </p>
          <h3 className="mt-0.5 text-lg font-bold text-white">
            How today stacks up
          </h3>
        </div>
        <span className="rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-medium text-slate-400 ring-1 ring-white/10">
          {data.dateISO}
        </span>
      </div>

      {stats.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3 stagger-children">
          {stats.map((s, i) => (
            <Stat key={i} {...s} />
          ))}
        </div>
      )}

      <div className="mt-5 rounded-xl bg-white/[0.03] p-4 ring-1 ring-white/[0.06]">
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-3">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Balance score
            </span>
            <span className={`text-xl font-bold ${scoreColor}`}>
              {data.score}/100
            </span>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-slate-500">Net Calories</div>
            <div className="text-sm font-bold text-white">
              {Math.round(totals.kcal || 0)} - {Math.round(data.burned_kcal || 0)} = 
              <span className="ml-1 text-pm-cyan">{Math.round((totals.kcal || 0) - (data.burned_kcal || 0))}</span>
            </div>
          </div>
        </div>
        <ul className="mt-2 space-y-1 text-sm text-slate-300">
          {(data.messages || []).map((m, i) => (
            <li key={i} className="flex items-start gap-2 animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-pm-accent/60" />
              {m}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Stat({ label, val, pct, widthPct }) {
  const key = label.toLowerCase();

  const accent =
    key.includes("activity")
      ? "bg-pm-accent"
      : key.includes("protein")
      ? "bg-pm-purple"
      : key.includes("fat")
      ? "bg-rose-500"
      : key.includes("carb")
      ? "bg-amber-400"
      : "bg-pm-cyan";

  return (
    <div className="space-y-1.5 animate-fade-in">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-slate-300">{label}</span>
        <span className="font-semibold text-white">
          {val} <span className="text-slate-500">({pct}%)</span>
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
        <div
          className={`h-2 rounded-full ${accent} animate-bar-fill`}
          style={{ "--bar-width": `${widthPct || 0}%`, width: `${widthPct || 0}%` }}
        />
      </div>
    </div>
  );
}
