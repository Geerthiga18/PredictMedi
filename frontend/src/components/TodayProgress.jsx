import { useEffect, useState } from "react";
import { api } from "../lib/api";

const Bar = ({ label, value, target, unit = "", goodLow = false }) => {
  const safeTarget = target > 0 ? target : 0;
  const pct =
    safeTarget > 0 ? Math.min(130, Math.round((value / safeTarget) * 100)) : 0;

  const lower = label.toLowerCase();

  let color;
  if (goodLow) {
    // e.g. Sugar (less is better)
    color =
      value <= safeTarget
        ? "bg-emerald-500"
        : pct <= 120
        ? "bg-amber-500"
        : "bg-red-500";
  } else if (lower.includes("activity")) {
    // For activity: >=100% is GOOD
    color =
      pct < 70 ? "bg-amber-500"
      : pct <= 130 ? "bg-emerald-500"
      : "bg-emerald-600";
  } else {
    // Default: more than 100% (a lot more) is not ideal → red
    color =
      pct <= 100
        ? "bg-blue-600"
        : pct <= 120
        ? "bg-amber-500"
        : "bg-red-500";
  }


   return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs sm:text-sm text-slate-600">
        <span>{label}</span>
        {safeTarget > 0 && (
          <span>
            <b>{Math.round(value || 0)}</b> / {Math.round(safeTarget)} {unit} (
            {pct}%)
          </span>
        )}
      </div>
      <div className="h-2.5 w-full rounded-full bg-slate-200">
        <div
          className={`h-2.5 rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

export default function TodayProgress({
  token,
  goal = "maintain",
  refreshKey = 0,
}) {
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
        // Reuse the same logic as Daily Coach so targets & totals match
        const res = await api(
          `/coach/motivate?dateISO=${today}&goal=${goal}`,
          { token }
        );
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
      <div className="mt-6 rounded-2xl bg-white p-5 shadow ring-1 ring-slate-100 text-sm text-slate-500">
        Calculating your daily progress…
      </div>
    );
  }

  if (err) {
    return (
      <div className="mt-6 rounded-2xl bg-white p-5 shadow ring-1 ring-slate-100 text-sm text-red-600">
        {err}
      </div>
    );
  }

  const plan = data.plan || {};
  const macros = plan.macros || {};
  const totals = data.nutrition_totals || {};
  const minutes = data.minutes ?? 0;

  return (
    <div className="mt-6 rounded-2xl bg-white p-5 shadow ring-1 ring-slate-100">
      <h3 className="text-lg font-semibold">Today vs Target</h3>
      <div className="mt-4 space-y-3">
        <Bar
          label="Calories"
          value={totals.kcal || 0}
          target={macros.kcal || plan.tdee || 0}
          unit="kcal"
        />
        <Bar
          label="Carbs"
          value={totals.carb_g || 0}
          target={macros.carb_g || 0}
          unit="g"
        />
        <Bar
          label="Protein"
          value={totals.protein_g || 0}
          target={macros.protein_g || 0}
          unit="g"
        />
        <Bar
          label="Fat"
          value={totals.fat_g || 0}
          target={macros.fat_g || 0}
          unit="g"
        />
        <Bar
          label="Sugar"
          value={totals.sugar_g || 0}
          target={50}
          unit="g"
          goodLow
        />
        <Bar
          label="Activity (min)"
          value={minutes}
          target={30}
          unit="min"
        />
      </div>
      <p className="mt-3 text-xs text-slate-500">
        Targets use your profile and estimated activity level from today&apos;s
        logs. For medical decisions, always confirm with a healthcare professional.
      </p>
    </div>
  );
}
