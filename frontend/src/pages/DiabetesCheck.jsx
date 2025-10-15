import { useState } from "react";
import { api } from "../lib/api";

const field = "block text-sm font-medium text-slate-700";
const input =
  "mt-1 w-full rounded-xl border border-slate-300/80 bg-slate-50 px-3 py-2 text-slate-900 placeholder-slate-400 shadow-sm transition hover:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500";

export default function DiabetesCheck({ token }) {
  const [f, setF] = useState({
    Pregnancies: 2,
    Glucose: 130,
    BloodPressure: 70,
    SkinThickness: 20,
    Insulin: 85,
    BMI: 28.5,
    DiabetesPedigreeFunction: 0.5,
    Age: 33,
  });
  const [res, setRes] = useState(null);
  const [err, setErr] = useState("");

  function set(k, v) {
    setF((prev) => ({ ...prev, [k]: v }));
  }

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setRes(null);
    try {
      const out = await api("/ml/diabetes/predict", {
        method: "POST",
        token,
        body: { features: f },
      });
      setRes(out);
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <div className="mx-auto max-w-2xl rounded-2xl bg-white/95 p-6 shadow-xl ring-1 ring-slate-200/70 backdrop-blur-sm">
      <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
        <span className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
          Diabetes Risk (baseline)
        </span>
      </h2>

      <form onSubmit={submit} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Object.entries(f).map(([k, v]) => (
          <label key={k} className={field}>
            {k}
            <input
              className={input}
              type="number"
              step="any"
              value={v}
              onChange={(e) => set(k, e.target.value === "" ? "" : Number(e.target.value))}
            />
          </label>
        ))}
        <div className="sm:col-span-2">
          <button
            className="inline-flex items-center rounded-xl bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-600 px-4 py-2 font-medium text-white shadow-md transition hover:from-blue-700 hover:via-sky-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
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
            Probability: <b>{res.probability.toFixed(3)}</b>
          </p>
          <p className="text-slate-800">
            Label: <b>{res.label}</b>
          </p>
        </div>
      )}
    </div>
  );
}
