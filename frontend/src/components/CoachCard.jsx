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
      <div className="rounded-2xl bg-white p-5 shadow ring-1 ring-slate-100 text-sm text-slate-500">
        Loading your daily coach...
      </div>
    );
  }

  if (err) {
    return (
      <div className="rounded-2xl bg-white p-5 shadow ring-1 ring-slate-100 text-sm text-red-600">
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
    const pct = Math.min(130, Math.round(((v || 0) / t) * 100));
    return { label, val: `${Math.round(v || 0)} / ${Math.round(t)}`, bar: pct };
  };

  const stats = [
    buildStat("Calories", totals.kcal, macros.kcal || plan.tdee),
    buildStat("Carbs (g)", totals.carb_g, macros.carb_g),
    buildStat("Protein (g)", totals.protein_g, macros.protein_g),
    buildStat("Fat (g)", totals.fat_g, macros.fat_g),
    buildStat("Activity (min)", minutes, 30),
  ].filter(Boolean);

  return (
    <div className="rounded-2xl bg-white p-5 shadow ring-1 ring-slate-100">
      <div className="flex items-baseline justify-between">
        <h3 className="text-xl font-semibold">Daily Coach</h3>
        <span className="text-xs text-slate-500">{data.dateISO}</span>
      </div>

      {stats.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-3 text-xs sm:text-sm">
          {stats.map((s, i) => (
            <Stat key={i} {...s} />
          ))}
        </div>
      )}

      <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-800">
        <div><b>Score:</b> {data.score}/100</div>
        <ul className="mt-1 list-disc pl-5">
          {(data.messages || []).map((m, i) => (
            <li key={i}>{m}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Stat({ label, val, bar }) {
  return (
    <div>
      <div className="flex justify-between text-slate-600">
        <span>{label}</span>
        <span className="font-medium text-slate-800">{val}</span>
      </div>
      <div className="mt-1 h-2 w-full rounded bg-slate-200">
        <div className="h-2 rounded bg-blue-600" style={{ width: `${bar || 0}%` }} />
      </div>
    </div>
  );
}
