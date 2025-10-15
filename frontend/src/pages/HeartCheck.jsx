import { useState } from "react";
import { api } from "../lib/api";

const label = "block text-sm font-medium text-slate-700";
const input =
  "mt-1 w-full rounded-xl border border-slate-300/80 bg-slate-50 px-3 py-2 text-slate-900 placeholder-slate-400 shadow-sm transition hover:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500";

export default function HeartCheck({ token }) {
  const [f, setF] = useState({
    age: 52, sex: 1, cp: 0, trestbps: 130, chol: 250, fbs: 0, restecg: 1,
    thalach: 160, exang: 0, oldpeak: 1.0, slope: 2, ca: 0, thal: 2
  });
  const [res, setRes] = useState(null);
  const [err, setErr] = useState("");

  const set = (k,v) => setF(prev => ({...prev, [k]: v}));

  async function submit(e){
    e.preventDefault(); setErr(""); setRes(null);
    try {
      const out = await api("/ml/heart/predict", { method:"POST", token, body:{ features: f, top_k: 5 }});
      setRes(out);
    } catch (e) { setErr(e.message); }
  }

  return (
    <div className="mx-auto max-w-2xl rounded-2xl bg-white/95 p-6 shadow-xl ring-1 ring-slate-200/70 backdrop-blur-sm">
      <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
        <span className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
          Heart Disease Risk (baseline)
        </span>
      </h2>

      <form onSubmit={submit} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Object.entries(f).map(([k,v]) => (
          <label key={k} className={label}>
            {k}
            <input
              className={input}
              type="number"
              step="any"
              value={v}
              onChange={e => set(k, e.target.value === "" ? "" : Number(e.target.value))}
            />
          </label>
        ))}
        <div className="sm:col-span-2">
          <button className="inline-flex items-center rounded-xl bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-600 px-4 py-2 font-medium text-white shadow-md transition hover:from-blue-700 hover:via-sky-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            Predict
          </button>
        </div>
      </form>

      {err && (
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 shadow-sm">
          {err}
        </p>
      )}

      {res && (
        <div className="mt-4 rounded-xl bg-blue-50 p-4 ring-1 ring-inset ring-blue-200">
          <p className="text-slate-800">
            Probability:{" "}
            <b>{((res.probability ?? res.prob) ?? 0).toFixed(3)}</b>{" "}
            <span className="text-slate-600">(label {res.label})</span>
          </p>

          <h3 className="mt-3 text-base font-semibold text-slate-900">Top factors</h3>
          {Array.isArray(res.top_factors) && res.top_factors.length ? (
            <ul className="mt-1 space-y-1">
              {res.top_factors.map((t, i) => (
                <li key={i} className="text-sm text-slate-800">
                  <code className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-700 ring-1 ring-slate-200">
                    {t.feature}
                  </code>
                  <span className="ml-2">
                    contribution{" "}
                    <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 font-medium text-emerald-700 ring-1 ring-emerald-200">
                      {t.contribution.toFixed(3)}
                    </span>
                    {" "} (z={t.zvalue.toFixed(3)})
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-600">No explanation available.</p>
          )}
        </div>
      )}
    </div>
  );
}
