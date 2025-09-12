import { useState } from "react";
import { api } from "../lib/api";

const label = "block text-sm text-slate-700";
const input = "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500";

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
    <div className="mx-auto max-w-2xl rounded-2xl bg-white p-6 shadow ring-1 ring-slate-100">
      <h2 className="text-2xl font-semibold">Heart Disease Risk (baseline)</h2>
      <form onSubmit={submit} className="mt-4 grid grid-cols-2 gap-4">
        {Object.entries(f).map(([k,v]) => (
          <label key={k} className={label}>
            {k}
            <input className={input} type="number" step="any" value={v}
              onChange={e => set(k, e.target.value === "" ? "" : Number(e.target.value))}/>
          </label>
        ))}
        <div className="col-span-2">
          <button className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">Predict</button>
        </div>
      </form>

      {err && <p className="mt-3 text-red-600">{err}</p>}

      {res && (
        <div className="mt-4 rounded-lg bg-blue-50 p-4">
          <p>Probability: <b>{res.probability.toFixed(3)}</b> (label {res.label})</p>
          <h3 className="mt-3 font-semibold">Top factors</h3>
          <ul className="list-disc pl-5">
            {res.top_factors.map((t, i) => (
              <li key={i}>
                <code>{t.feature}</code>: contribution {t.contribution.toFixed(3)} (z={t.zvalue.toFixed(3)})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
