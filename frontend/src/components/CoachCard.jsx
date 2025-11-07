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
      <div className="flex items-center gap-3 rounded-3xl bg-white/90 p-5 text-sm text-slate-500 ring-1 ring-slate-100 shadow-sm">
        <div className="h-8 w-8 animate-pulse rounded-2xl bg-slate-200" />
        <div className="space-y-1">
          <div className="h-2 w-32 rounded bg-slate-200" />
          <div className="h-2 w-52 rounded bg-slate-100" />
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="rounded-3xl bg-rose-50 p-5 text-sm text-rose-700 ring-1 ring-rose-100">
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
    const widthPct = Math.min(100, Math.max(0, pct)); // clamp bar width

    return {
      label,
      val: `${Math.round(v || 0)} / ${Math.round(t)}`,
      pct,
      widthPct,
    };
  };

  const stats = [
    buildStat("Calories", totals.kcal, macros.kcal || plan.tdee),
    buildStat("Carbs (g)", totals.carb_g, macros.carb_g),
    buildStat("Protein (g)", totals.protein_g, macros.protein_g),
    buildStat("Fat (g)", totals.fat_g, macros.fat_g),
    buildStat("Activity (min)", minutes, 30),
  ].filter(Boolean);

  const scoreColor =
    data.score >= 75
      ? "text-emerald-600"
      : data.score >= 50
      ? "text-amber-500"
      : "text-rose-500";

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/3 via-white to-sky-50 p-5 text-sm ring-1 ring-slate-100 shadow-sm">
      {/* subtle glow accents */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-sky-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-10 bottom-0 h-24 w-24 rounded-full bg-blue-500/5 blur-2xl" />

      <div className="flex items-baseline justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-500">
            Daily coach
          </p>
          <h3 className="mt-0.5 text-lg sm:text-xl font-semibold text-slate-900">
            How today stacks up
          </h3>
        </div>
        <span className="rounded-full bg-slate-900/5 px-2 py-1 text-[9px] sm:text-[10px] font-medium text-slate-500">
          {data.dateISO}
        </span>
      </div>

      {stats.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-3 text-[10px] sm:text-xs">
          {stats.map((s, i) => (
            <Stat key={i} {...s} />
          ))}
        </div>
      )}

      <div className="mt-4 rounded-2xl bg-white/85 p-3 text-[10px] sm:text-xs text-slate-800 ring-1 ring-slate-100/80 backdrop-blur-sm">
        <div className="flex items-baseline gap-2">
          <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Balance score
          </span>
          <span className={`text-sm sm:text-base font-semibold ${scoreColor}`}>
            {data.score}/100
          </span>
        </div>
        <ul className="mt-1 list-disc space-y-0.5 pl-4">
          {(data.messages || []).map((m, i) => (
            <li key={i}>{m}</li>
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
      ? "bg-emerald-500"
      : key.includes("protein")
      ? "bg-indigo-500"
      : key.includes("fat")
      ? "bg-rose-500"
      : key.includes("carb")
      ? "bg-amber-400"
      : "bg-sky-500";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px] sm:text-xs text-slate-600">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="font-semibold text-slate-900">
          {val} {typeof pct === "number" && `(${pct}%)`}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-200/80">
        <div
          className={`h-2 rounded-full ${accent}`}
          style={{ width: `${widthPct || 0}%` }}
        />
      </div>
    </div>
  );
}
