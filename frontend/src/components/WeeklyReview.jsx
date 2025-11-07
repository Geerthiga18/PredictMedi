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
      <div className="mt-4 rounded-3xl bg-white/90 p-5 text-sm text-slate-500 ring-1 ring-slate-100 shadow-sm">
        Calculating your weekly review…
      </div>
    );
  }

  if (err || !data) {
    return (
      <div className="mt-4 rounded-3xl bg-rose-50 p-5 text-sm text-rose-600 ring-1 ring-rose-100">
        {err || "Unable to load weekly review."}
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-3xl bg-gradient-to-br from-slate-900/2 via-white to-sky-50 p-5 ring-1 ring-slate-100 shadow-sm">
     <div className="flex items-baseline justify-between gap-2">
  <div>
    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-500">
      Weekly health review
    </p>
    <h3 className="text-lg sm:text-xl font-semibold text-slate-900">
      Your last 7 days at a glance
    </h3>
  </div>
  <p className="text-[10px] sm:text-xs text-slate-500">
    {data.startISO} → {data.endISO}
  </p>
</div>


      <div className="mt-4 grid grid-cols-2 gap-3 text-xs sm:text-sm">
        <Stat
          label="Avg Calories"
          value={data.avg_kcal}
          target={data.target_kcal}
          unit="kcal"
          kind="kcal"
        />
        <Stat
          label="Avg Activity"
          value={data.avg_minutes}
          target={data.target_minutes}
          unit="min/day"
          kind="activity"
        />
        <div className="col-span-2 mt-1 text-[10px] text-slate-600">
          <b>Balanced days:</b> {data.good_days} / 7{" "}
          <span className="mx-1 text-slate-400">•</span>
          <b>Needs attention:</b> {data.bad_days} / 7
        </div>
      </div>

      <ul className="mt-3 list-disc space-y-0.5 pl-5 text-[10px] sm:text-xs text-slate-700">
        {(data.messages || []).map((m, i) => (
          <li key={i}>{m}</li>
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
    color =
      pct < 70
        ? "bg-amber-400"
        : pct <= 130
        ? "bg-emerald-500"
        : "bg-emerald-600";
  } else {
    color =
      pct <= 110
        ? "bg-sky-600"
        : pct <= 130
        ? "bg-amber-500"
        : "bg-rose-500";
  }

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs sm:text-sm text-slate-600">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="font-medium">
          <b>{Math.round(value || 0)}</b> / {Math.round(target)} {unit} (
          {pct}%)
        </span>
      </div>
      <div className="mt-0.5 h-2.5 w-full rounded-full bg-slate-100">
        <div
          className={`h-2.5 rounded-full ${color}`}
          style={{ width: `${widthPct}%` }}
        />
      </div>
    </div>
  );
}

