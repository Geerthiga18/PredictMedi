// HeartCheck.jsx
import { useState } from "react";
import { api } from "../lib/api";

// ---- UI styles (same vibe as your diabetes page)
const field = "block text-sm font-medium text-slate-700";
const input =
  "mt-1 w-full rounded-xl border border-slate-300/80 bg-slate-50 px-3 py-2 text-slate-900 placeholder-slate-400 shadow-sm transition hover:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500";
const btnPrimary =
  "inline-flex items-center rounded-xl bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-600 px-4 py-2 font-medium text-white shadow-md transition hover:from-blue-700 hover:via-sky-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2";
const card =
  "mx-auto max-w-2xl rounded-2xl bg-white/95 p-6 shadow-xl ring-1 ring-slate-200/70 backdrop-blur-sm";

// ---- Option lists / encodings (UCI)
const YES_NO = [
  { label: "No", value: 0 },
  { label: "Yes", value: 1 },
];

const SEX = [
  [0, "Female"],
  [1, "Male"],
];

const CP = [
  [0, "Typical angina"],
  [1, "Atypical angina"],
  [2, "Non-anginal chest pain"],
  [3, "No chest pain (asymptomatic)"],
];

const RESTECG = [
  [0, "Normal ECG"],
  [1, "ST–T wave abnormality"],
  [2, "Left ventricular hypertrophy"],
];

const SLOPE = [
  [0, "Upsloping"],
  [1, "Flat"],
  [2, "Downsloping"],
];

const THAL = [
  [1, "Normal"],
  [2, "Fixed defect (old scar)"],
  [3, "Reversible defect (ischemia)"],
];

function riskBand(p) {
  if (p >= 0.7)
    return {
      label: "Very high chance",
      tone: "bg-red-50 text-red-800 ring-red-200",
      bar: "bg-red-500",
    };
  if (p >= 0.5)
    return {
      label: "High chance",
      tone: "bg-orange-50 text-orange-800 ring-orange-200",
      bar: "bg-orange-500",
    };
  if (p >= 0.2)
    return {
      label: "Moderate chance",
      tone: "bg-amber-50 text-amber-800 ring-amber-200",
      bar: "bg-amber-500",
    };
  return {
    label: "Low chance",
    tone: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    bar: "bg-emerald-500",
  };
}

function adviceText(p) {
  if (p >= 0.7)
    return "Please consult a healthcare professional soon. Consider ECG, stress testing, and risk-factor management.";
  if (p >= 0.5)
    return "Discuss a full cardiac workup and risk-factor control (blood pressure, cholesterol, smoking).";
  if (p >= 0.2)
    return "Consider lifestyle tuning (diet, activity) and discuss screening with your clinician.";
  return "Keep up healthy habits. Recheck if symptoms or risk factors change.";
}

export default function HeartCheck({ token }) {
  // Default values are reasonable placeholders
  const [f, setF] = useState({
    age: 52,
    sex: 1, // male
    cp: 2, // non-anginal
    trestbps: 130, // resting BP (mmHg)
    chol: 220, // cholesterol (mg/dL)
    fbs: 0, // fasting blood sugar >120 mg/dL
    restecg: 0,
    thalach: 160, // max heart rate achieved
    exang: 0, // exercise-induced chest pain
    oldpeak: 1.0, // ST depression vs rest
    slope: 1, // flat
    ca: 0, // # vessels colored (0-3)
    thal: 2, // fixed defect
  });

  const [res, setRes] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setF((prev) => ({ ...prev, [k]: v }));

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setRes(null);
    setLoading(true);
    try {
      const out = await api("/ml/heart/predict", {
        method: "POST",
        token,
        body: { features: f, top_k: 5 },
      });
      setRes(out);
    } catch (e) {
      setErr(e.message || "Prediction failed");
    } finally {
      setLoading(false);
    }
  }

  const prob = typeof res?.probability === "number" ? res.probability : null;
  const band = prob != null ? riskBand(prob) : null;

  return (
    <div className={card}>
      <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
        <span className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
          Heart Disease Risk
        </span>
      </h2>

      {/* Questionnaire */}
      <form onSubmit={submit} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Age */}
        <label className={field} title="Your age in years.">
          Age (years)
          <input
            className={input}
            type="number"
            min={18}
            max={95}
            value={f.age}
            onChange={(e) => set("age", Number(e.target.value || 0))}
          />
        </label>

        {/* Sex */}
        <label className={field} title="Dataset coding: 0 = Female, 1 = Male.">
          Sex
          <select
            className={input}
            value={f.sex}
            onChange={(e) => set("sex", Number(e.target.value))}
          >
            {SEX.map(([v, t]) => (
              <option key={v} value={v}>
                {t}
              </option>
            ))}
          </select>
        </label>

        {/* Chest pain type */}
        <label
          className={field}
          title="Type of chest discomfort (if any). 'Asymptomatic' means no chest pain."
        >
          Chest pain type
          <select
            className={input}
            value={f.cp}
            onChange={(e) => set("cp", Number(e.target.value))}
          >
            {CP.map(([v, t]) => (
              <option key={v} value={v}>
                {t}
              </option>
            ))}
          </select>
        </label>

        {/* Resting BP */}
        <label
          className={field}
          title="Resting blood pressure (mmHg), typically measured on admission."
        >
          Resting blood pressure (mmHg)
          <input
            className={input}
            type="number"
            min={70}
            max={250}
            value={f.trestbps}
            onChange={(e) => set("trestbps", Number(e.target.value || 0))}
          />
        </label>

        {/* Cholesterol */}
        <label className={field} title="Serum cholesterol in mg/dL.">
          Cholesterol (mg/dL)
          <input
            className={input}
            type="number"
            min={100}
            max={700}
            value={f.chol}
            onChange={(e) => set("chol", Number(e.target.value || 0))}
          />
        </label>

        {/* Fasting blood sugar */}
        <fieldset
          className={field}
          title="Is your fasting blood sugar > 120 mg/dL?"
        >
          Fasting blood sugar &gt; 120 mg/dL?
          <div className="mt-1 flex gap-3">
            {YES_NO.map((o) => (
              <label key={"fbs" + o.value} className="inline-flex items-center gap-1">
                <input
                  type="radio"
                  name="fbs"
                  checked={f.fbs === o.value}
                  onChange={() => set("fbs", o.value)}
                />
                <span className="text-slate-700">{o.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Resting ECG */}
        <label
          className={field}
          title="Resting ECG result: Normal, ST–T abnormality, or LVH."
        >
          Resting ECG
          <select
            className={input}
            value={f.restecg}
            onChange={(e) => set("restecg", Number(e.target.value))}
          >
            {RESTECG.map(([v, t]) => (
              <option key={v} value={v}>
                {t}
              </option>
            ))}
          </select>
        </label>

        {/* Max heart rate */}
        <label
          className={field}
          title="Maximum heart rate achieved during exercise test (beats/min)."
        >
          Max heart rate (bpm)
          <input
            className={input}
            type="number"
            min={60}
            max={230}
            value={f.thalach}
            onChange={(e) => set("thalach", Number(e.target.value || 0))}
          />
        </label>

        {/* Exercise-induced angina */}
        <fieldset
          className={field}
          title="Chest pain brought on by exercise?"
        >
          Exercise-induced chest pain?
          <div className="mt-1 flex gap-3">
            {YES_NO.map((o) => (
              <label key={"exang" + o.value} className="inline-flex items-center gap-1">
                <input
                  type="radio"
                  name="exang"
                  checked={f.exang === o.value}
                  onChange={() => set("exang", o.value)}
                />
                <span className="text-slate-700">{o.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* ST depression (oldpeak) */}
        <label
          className={field}
          title="ST-segment depression induced by exercise relative to rest (ECG)."
        >
          ST depression vs rest (oldpeak)
          <input
            className={input}
            type="number"
            step="0.1"
            min={0}
            max={10}
            value={f.oldpeak}
            onChange={(e) => set("oldpeak", Number(e.target.value || 0))}
          />
        </label>

        {/* ST segment slope */}
        <label
          className={field}
          title="Shape of the ST segment at peak exercise."
        >
          ST segment slope
          <select
            className={input}
            value={f.slope}
            onChange={(e) => set("slope", Number(e.target.value))}
          >
            {SLOPE.map(([v, t]) => (
              <option key={v} value={v}>
                {t}
              </option>
            ))}
          </select>
        </label>

        {/* Colored vessels (ca) */}
        <label
          className={field}
          title="Number of major vessels (0–3) seen by fluoroscopy."
        >
          # vessels seen by fluoroscopy (0–3)
          <input
            className={input}
            type="number"
            min={0}
            max={3}
            value={f.ca}
            onChange={(e) => set("ca", Number(e.target.value || 0))}
          />
        </label>

        {/* Thal result */}
        <label
          className={field}
          title="Thallium test result."
        >
          Thallium test (thal)
          <select
            className={input}
            value={f.thal}
            onChange={(e) => set("thal", Number(e.target.value))}
          >
            {THAL.map(([v, t]) => (
              <option key={v} value={v}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <div className="sm:col-span-2">
          <button className={btnPrimary} disabled={loading}>
            {loading ? "Predicting..." : "Predict"}
          </button>
        </div>
      </form>

      {/* Errors */}
      {err && (
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 shadow-sm">
          {err}
        </p>
      )}

      {/* Result */}
      {prob != null && (
        <div className={`mt-4 rounded-xl p-4 ring-1 ${band.tone.replace("bg-", "ring-")} ${band.tone}`}>
          <div className="flex items-center justify-between">
            <p className="text-slate-900/90 font-medium">{band.label}</p>
            <p className="text-slate-700">
              {(prob * 100).toFixed(1)}%
              <span className="text-slate-500 text-xs ml-1">(model estimate)</span>
            </p>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-slate-200">
            <div
              className={`h-2 rounded-full ${band.bar}`}
              style={{ width: `${Math.max(2, Math.min(98, prob * 100))}%` }}
            />
          </div>
          <p className="mt-3 text-sm text-slate-800">{adviceText(prob)}</p>
          <p className="mt-1 text-xs text-slate-500">This is not a diagnosis. Please use with clinical judgment.</p>
        </div>
      )}

      {/* SHAP-style top factors */}
      {res?.top_factors?.length ? (
        <div className="mt-4 rounded-xl bg-indigo-50 p-4 ring-1 ring-inset ring-indigo-200">
          <h3 className="text-base font-semibold text-slate-900">Top factors (model explanation)</h3>
          <ul className="mt-2 space-y-1">
            {res.top_factors.map((t, i) => (
              <li key={i} className="text-sm text-slate-800">
                <code className="rounded bg-white px-1.5 py-0.5 text-slate-700 ring-1 ring-slate-200">
                  {t.feature}
                </code>
                <span className="ml-2">
                  contribution{" "}
                  <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 font-medium text-emerald-700 ring-1 ring-emerald-200">
                    {Number(t.contribution).toFixed(3)}
                  </span>{" "}
                  (z={Number(t.zvalue).toFixed(3)})
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        res && <p className="mt-4 text-sm text-slate-600">No explanation available.</p>
      )}
    </div>
  );
}
