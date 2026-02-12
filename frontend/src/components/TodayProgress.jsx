import { useEffect, useState } from "react";
import { api } from "../lib/api";

const Bar = ({ label, value, target, unit = "", goodLow = false }) => {
  const safeTarget = target > 0 ? target : 0;
  const rawPct = safeTarget > 0 ? Math.round((value / safeTarget) * 100) : 0;
  const pct = safeTarget > 0 ? Math.max(0, rawPct) : 0;
  const widthPct = Math.min(100, pct || 0);

  const lower = label.toLowerCase();
  let color;

  if (goodLow) {
    color = value <= safeTarget ? "bg-pm-accent" : pct <= 120 ? "bg-amber-400" : "bg-red-500";
  } else if (lower.includes("activity")) {
    color = pct < 70 ? "bg-amber-400" : pct <= 130 ? "bg-pm-accent" : "bg-emerald-400";
  } else {
    color = pct <= 100 ? "bg-pm-cyan" : pct <= 120 ? "bg-amber-400" : "bg-red-500";
  }

  return (
    <div className="space-y-2 animate-fade-in">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-300">{label}</span>
        {safeTarget > 0 && (
          <span className="text-xs text-slate-400">
            <span className="font-semibold text-white">{Math.round(value || 0)}</span> / {Math.round(safeTarget)} {unit}
            <span className="ml-1 text-slate-500">({pct}%)</span>
          </span>
        )}
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/5">
        <div
          className={`h-2.5 rounded-full ${color} transition-all duration-700 ease-out ${pct > 100 ? "animate-pulse-glow" : ""}`}
          style={{ width: `${widthPct}%` }}
        />
      </div>
    </div>
  );
};

export default function TodayProgress({ token, goal = "maintain", refreshKey = 0 }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        setErr("");
        setLoading(true);
        const res = await api(`/coach/motivate?dateISO=${today}&goal=${goal}`, { token });
        setData(res);
      } catch (e) {
        setErr(e.message || "Failed to load today progress");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, goal, today, refreshKey]);

  if (!token) return null;

  if (loading || !data) {
    return (
      <div className="glass-card p-5 text-sm text-slate-500">
        <div className="flex items-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-pm-accent/30 border-t-pm-accent" />
          Calculating your daily progress…
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

  return (
    <div className="glass-card p-5 md:p-6">
      <div className="flex items-baseline justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-pm-accent">
            Today vs Target
          </p>
          <h3 className="text-lg font-bold text-white">
            How your intake compares
          </h3>
        </div>
        <span className="text-xs text-slate-500">
          Based on your profile &amp; goal
        </span>
      </div>

      <div className="mt-5 space-y-4 stagger-children">
        <Bar label="Calories" value={totals.kcal || 0} target={macros.kcal || plan.tdee || 0} unit="kcal" />
        <Bar label="Carbs" value={totals.carb_g || 0} target={macros.carb_g || 0} unit="g" />
        <Bar label="Protein" value={totals.protein_g || 0} target={macros.protein_g || 0} unit="g" />
        <Bar label="Fat" value={totals.fat_g || 0} target={macros.fat_g || 0} unit="g" />
        <Bar label="Sugar" value={totals.sugar_g || 0} target={50} unit="g" goodLow />
        <Bar label="Activity (min)" value={minutes} target={data.activity_target || 45} unit="min" />
      </div>

      <p className="mt-4 text-[10px] text-slate-500">
        Targets adapt using your current weight, height, age, sex, and selected
        goal. For medical decisions, always confirm with a healthcare
        professional.
      </p>
    </div>
  );
}
