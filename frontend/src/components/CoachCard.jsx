import { useEffect, useState } from "react";
import { api } from "../lib/api";

export default function CoachCard({ token, dateISO }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => { load(); }, [dateISO]);

  async function load() {
    try {
      setErr("");
      const r = await api(`/coach/motivate${dateISO ? `?dateISO=${dateISO}` : ""}`, { token });
      setData(r);
    } catch (e) { setErr(e.message || "Failed to load coach"); }
  }

  if (err) return <div className="rounded-2xl bg-white p-5 shadow ring-1 ring-slate-100 text-red-600">{err}</div>;
  if (!data) return <div className="rounded-2xl bg-white p-5 shadow ring-1 ring-slate-100">Loading…</div>;

  const m = data.plan.macros || {};
  const t = data.nutrition_totals || {};
  const pct = (a, b) => !a || !b ? 0 : Math.min(100, Math.round((a/b)*100));

  return (
    <div className="rounded-2xl bg-white p-5 shadow ring-1 ring-slate-100">
      <div className="flex items-baseline justify-between">
        <h3 className="text-xl font-semibold">Daily Coach</h3>
        <span className="text-sm text-slate-500">{data.dateISO}</span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <Stat label="Calories" val={`${Math.round(t.kcal||0)} / ${m.kcal} kcal`} bar={pct(t.kcal, m.kcal)} />
        <Stat label="Activity" val={`${data.minutes} / 30 min`} bar={Math.min(100, Math.round((data.minutes/30)*100))} />
        <Stat label="Carb" val={`${Math.round(t.carb_g||0)} / ${m.carb_g} g`} bar={pct(t.carb_g, m.carb_g)} />
        <Stat label="Protein" val={`${Math.round(t.protein_g||0)} / ${m.protein_g} g`} bar={pct(t.protein_g, m.protein_g)} />
        <Stat label="Fat" val={`${Math.round(t.fat_g||0)} / ${m.fat_g} g`} bar={pct(t.fat_g, m.fat_g)} />
        <Stat label="Sugar" val={`${Math.round(t.sugar_g||0)} g`} bar={Math.min(100, Math.round(((t.sugar_g||0)/50)*100))} />
      </div>

      <div className="mt-4 rounded-lg bg-blue-50 p-3">
        <div className="text-sm text-slate-700">
          <b>Score:</b> {data.score}/100
        </div>
        <ul className="mt-2 list-disc pl-5 text-slate-700">
          {data.messages.map((m,i)=><li key={i}>{m}</li>)}
        </ul>
      </div>
    </div>
  );
}

function Stat({ label, val, bar }) {
  return (
    <div>
      <div className="flex justify-between text-slate-600">
        <span>{label}</span><span className="font-medium text-slate-800">{val}</span>
      </div>
      <div className="mt-1 h-2 w-full rounded bg-slate-200">
        <div className="h-2 rounded bg-blue-600" style={{ width: `${bar||0}%` }} />
      </div>
    </div>
  );
}
