import { useState } from "react";
import { api } from "../lib/api";

const field = "block text-sm text-slate-700";
const input = "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500";

export default function DiabetesCheck({ token }) {
  const [f, setF] = useState({
    Pregnancies: 2, Glucose: 130, BloodPressure: 70, SkinThickness: 20,
    Insulin: 85, BMI: 28.5, DiabetesPedigreeFunction: 0.5, Age: 33
  });
  const [res, setRes] = useState(null);
  const [err, setErr] = useState("");

  function set(k, v){ setF(prev => ({...prev, [k]: v})); }

  async function submit(e){
    e.preventDefault(); setErr(""); setRes(null);
    try {
      const out = await api("/ml/diabetes/predict", { method: "POST", token, body: { features: f }});
      setRes(out);
    } catch (e) { setErr(e.message); }
  }

  return (
    <div className="mx-auto max-w-2xl rounded-2xl bg-white p-6 shadow ring-1 ring-slate-100">
      <h2 className="text-2xl font-semibold">Diabetes Risk (baseline)</h2>
      <form onSubmit={submit} className="mt-4 grid grid-cols-2 gap-4">
        {Object.entries(f).map(([k, v]) => (
          <label key={k} className={field}>
            {k}
            <input className={input} type="number" step="any" value={v}
              onChange={e=> set(k, e.target.value === "" ? "" : Number(e.target.value))}/>
          </label>
        ))}
        <div className="col-span-2">
          <button className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700">
            Predict
          </button>
        </div>
      </form>
      {err && <p className="mt-3 text-red-600">{err}</p>}
      {res && (
        <div className="mt-4 rounded-lg bg-blue-50 p-4">
          <p>Probability: <b>{res.probability.toFixed(3)}</b></p>
          <p>Label: <b>{res.label}</b></p>
        </div>
      )}
    </div>
  );
}
