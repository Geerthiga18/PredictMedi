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
  }, [token, refreshKey = 0]);

  if (!token) return null;

  if (loading) {
    return (
      <div className="mt-6 rounded-2xl bg-white p-5 shadow ring-1 ring-slate-100 text-sm text-slate-500">
        Calculating your weekly review…
      </div>
    );
  }

  if (err || !data) {
    return (
      <div className="mt-6 rounded-2xl bg-white p-5 shadow ring-1 ring-slate-100 text-sm text-red-600">
        {err || "Unable to load weekly review."}
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-2xl bg-white p-5 shadow ring-1 ring-slate-100">
      <h3 className="text-lg font-semibold">Weekly Health Review</h3>
      <p className="mt-1 text-xs text-slate-500">
        {data.startISO} → {data.endISO}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <Stat
          label="Avg Calories"
          value={data.avg_kcal}
          target={data.target_kcal}
          unit="kcal"
        />
        <Stat
          label="Avg Activity"
          value={data.avg_minutes}
          target={data.target_minutes}
          unit="min/day"
        />
        <div className="col-span-2 text-xs text-slate-600">
          <b>Balanced days:</b> {data.good_days} / 7<br />
          <b>Needs improvement:</b> {data.bad_days} / 7
        </div>
      </div>

      <ul className="mt-3 list-disc pl-5 text-sm text-slate-700">
        {(data.messages || []).map((m, i) => (
          <li key={i}>{m}</li>
        ))}
      </ul>
    </div>
  );
}

function Stat({ label, value, target, unit }) {
  if (!target) return null;
  const pct = Math.round((value / target) * 100);
  return (
    <div>
      <div className="flex justify-between text-xs text-slate-600">
        <span>{label}</span>
        <span>
          <b>{Math.round(value || 0)}</b> / {Math.round(target)} {unit} (
          {pct}%)
        </span>
      </div>
      <div className="mt-1 h-2 w-full rounded bg-slate-200">
        <div
          className={`h-2 rounded ${
            pct <= 110 ? "bg-blue-600" : "bg-amber-500"
          }`}
          style={{ width: `${Math.min(130, pct)}%` }}
        />
      </div>
    </div>
  );
}
