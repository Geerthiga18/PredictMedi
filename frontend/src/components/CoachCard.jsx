import { useEffect, useState } from "react";
import { api } from "../lib/api";

export default function CoachCard({ token, activity="light", goal="maintain", sugarG=0, activityMinutes=30 }) {
  const [plan, setPlan] = useState(null);
  const [tips, setTips] = useState([]);
  const [mot, setMot] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    const today = new Date().toISOString().slice(0,10);
    (async () => {
      try {
        const p = await api(`/coach/plan?activity=${activity}&goal=${goal}`, { token });
        setPlan(p);
      } catch (e) { setErr(e.message); }
      try {
        const t = await api(`/coach/tips?activity_minutes=${activityMinutes}&sugar_g_today=${sugarG}`, { token });
        setTips(t.tips || []);
      } catch {}
      try {
        const m = await api(`/coach/motivate?dateISO=${today}&goal=${goal}`, { token });
        setMot(m);
      } catch {}
    })();
  }, [token, activity, goal, sugarG, activityMinutes]);

  return (
    <div className="rounded-2xl bg-white p-5 shadow ring-1 ring-slate-100">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Your Daily Plan</h3>
        {mot && (
          <span className={`rounded-full px-3 py-1 text-sm ${
            mot.score >= 85 ? "bg-emerald-100 text-emerald-700" :
            mot.score >= 70 ? "bg-blue-100 text-blue-700" :
                              "bg-amber-100 text-amber-700"
          }`}>
            Score: {mot.score}
          </span>
        )}
      </div>

      {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
      {!plan && !err && <p className="mt-2 text-sm text-slate-500">Loading…</p>}

      {plan && (
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <Stat label="BMR" value={`${plan.bmr} kcal`} />
          <Stat label="TDEE" value={`${plan.tdee} kcal`} />
          <Stat label="Carbs" value={`${plan.macros.carb_g} g`} />
          <Stat label="Protein" value={`${plan.macros.protein_g} g`} />
          <Stat label="Fat" value={`${plan.macros.fat_g} g`} />
        </div>
      )}

      {!!tips.length && (
        <>
          <h4 className="mt-4 font-medium">Tips</h4>
          <ul className="mt-1 list-disc pl-5 text-sm text-slate-700">
            {tips.map((t,i)=>(<li key={i}>{t}</li>))}
          </ul>
        </>
      )}

      {mot?.messages?.length ? (
        <>
          <h4 className="mt-4 font-medium">Today’s messages</h4>
          <ul className="mt-1 list-disc pl-5 text-sm text-slate-800">
            {mot.messages.map((m,i)=>(<li key={i}>{m}</li>))}
          </ul>
        </>
      ) : null}

      <p className="mt-4 text-xs text-slate-500">
        Not medical advice. For diagnosis or treatment, consult a healthcare professional.
      </p>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2">
      <p className="text-slate-500">{label}</p>
      <p className="font-semibold text-slate-800">{value}</p>
    </div>
  );
}
