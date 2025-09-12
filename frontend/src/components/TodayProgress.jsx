import { useEffect, useState } from "react";
import { api } from "../lib/api";

const Bar = ({ label, value, target, unit = "", goodLow = false }) => {
  const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
  // color logic (overdosing goes amber/red; under-shoot okay for sugar if goodLow=true)
  const color =
    goodLow
      ? (value <= target ? "bg-emerald-500" : pct <= 120 ? "bg-amber-500" : "bg-red-500")
      : (pct <= 100 ? "bg-blue-600" : pct <= 120 ? "bg-amber-500" : "bg-red-500");

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm text-slate-600">
        <span>{label}</span>
        <span>
          <b>{Math.round(value)}</b> / {Math.round(target)} {unit} ({pct}%)
        </span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-slate-200">
        <div className={`h-2.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

export default function TodayProgress({ token, activity = "light", goal = "maintain" }) {
  const [plan, setPlan] = useState(null);
  const [totals, setTotals] = useState(null);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    (async () => {
      try {
        const p = await api(`/coach/plan?activity=${activity}&goal=${goal}`, { token });
        setPlan(p);
      } catch {}
      try {
        const s = await api(`/meals/summary?dateISO=${today}`, { token });
        setTotals(s?.totals || {});
      } catch {}
    })();
  }, [token, activity, goal, today]);

  if (!plan || !totals) return null;

  const t = plan.macros || {};
  const v = totals || {};

  return (
    <div className="mt-6 rounded-2xl bg-white p-5 shadow ring-1 ring-slate-100">
      <h3 className="text-lg font-semibold">Today vs Target</h3>
      <div className="mt-4 space-y-3">
        <Bar label="Calories" value={v.kcal || 0} target={t.kcal || plan.tdee || 0} unit="kcal" />
        <Bar label="Carbs" value={v.carb_g || 0} target={t.carb_g || 0} unit="g" />
        <Bar label="Protein" value={v.protein_g || 0} target={t.protein_g || 0} unit="g" />
        <Bar label="Fat" value={v.fat_g || 0} target={t.fat_g || 0} unit="g" />
        {/* sugar → lower can be good, so mark goodLow=true */}
        <Bar label="Sugar" value={v.sugar_g || 0} target={50} unit="g" goodLow />
      </div>
      <p className="mt-3 text-xs text-slate-500">Targets are estimates; adjust with a healthcare professional if needed.</p>
    </div>
  );
}
