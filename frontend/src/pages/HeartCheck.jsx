import { useState } from "react";
import { api } from "../lib/api";

const field =
  "block text-sm md:text-base font-medium text-slate-800";
const input =
  "mt-1 w-full rounded-xl border border-slate-300/80 bg-slate-50 px-3 py-2.5 text-sm md:text-base text-slate-900 placeholder-slate-400 shadow-sm transition hover:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500";
const btnPrimary =
  "inline-flex items-center rounded-xl bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-600 px-5 py-2.5 text-sm md:text-base font-semibold text-white shadow-md transition hover:from-blue-700 hover:via-sky-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2";
const card =
  "mx-auto max-w-5xl rounded-3xl bg-white/98 px-5 py-6 md:px-7 md:py-7 shadow-[0_18px_60px_rgba(15,23,42,0.12)] ring-1 ring-slate-200/80 backdrop-blur-sm";

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
  [2, "Fixed defect"],
  [3, "Reversible defect"],
];

function riskBand(p) {
  if (p >= 0.7)
    return {
      label: "Very high chance",
      bg: "bg-red-50",
      text: "text-red-800",
      ring: "ring-red-200",
      bar: "bg-red-500",
    };
  if (p >= 0.5)
    return {
      label: "High chance",
      bg: "bg-orange-50",
      text: "text-orange-800",
      ring: "ring-orange-200",
      bar: "bg-orange-500",
    };
  if (p >= 0.2)
    return {
      label: "Moderate chance",
      bg: "bg-amber-50",
      text: "text-amber-800",
      ring: "ring-amber-200",
      bar: "bg-amber-500",
    };
  return {
    label: "Low chance",
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    ring: "ring-emerald-200",
    bar: "bg-emerald-500",
  };
}

function adviceText(p) {
  if (p >= 0.7)
    return "Please consult a healthcare professional as soon as possible. Tests like ECG, stress testing, and close follow-up are important.";
  if (p >= 0.5)
    return "Discuss a full cardiac workup and aggressive control of risk factors (blood pressure, cholesterol, smoking, diabetes).";
  if (p >= 0.2)
    return "Consider lifestyle optimization and talk with your clinician about screening or further evaluation.";
  return "Current pattern suggests lower risk. Keep up healthy habits and review if symptoms or risk factors change.";
}

export default function HeartCheck({ token }) {
  const [f, setF] = useState({
    age: 52,
    sex: 1,
    cp: 2,
    trestbps: 130,
    chol: 220,
    fbs: 0,
    restecg: 0,
    thalach: 160,
    exang: 0,
    oldpeak: 1.0,
    slope: 1,
    ca: 0,
    thal: 2,
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

  const prob =
    typeof res?.probability === "number" ? res.probability : null;
  const band = prob != null ? riskBand(prob) : null;

  return (
    <div className={card}>
      {/* Header */}
      <div className="flex flex-col gap-1 border-b border-slate-100 pb-3">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-500">
          Risk tools
        </p>
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">
          Heart Disease Risk Checker
        </h2>
        <p className="text-sm md:text-base text-slate-600">
          Enter basic clinical details to see an estimated risk based on the
          UCI Heart dataset model. This is only a decision support tool.
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={submit}
        className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2"
      >
        <label className={field}>
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

        <label className={field}>
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

        <label className={field}>
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

        <label className={field}>
          Resting blood pressure (mmHg)
          <input
            className={input}
            type="number"
            min={70}
            max={250}
            value={f.trestbps}
            onChange={(e) =>
              set("trestbps", Number(e.target.value || 0))
            }
          />
        </label>

        <label className={field}>
          Cholesterol (mg/dL)
          <input
            className={input}
            type="number"
            min={100}
            max={700}
            value={f.chol}
            onChange={(e) =>
              set("chol", Number(e.target.value || 0))
            }
          />
        </label>

        <fieldset className={field}>
          Fasting blood sugar &gt; 120 mg/dL?
          <div className="mt-1 flex flex-wrap gap-3 text-sm">
            {YES_NO.map((o) => (
              <label
                key={"fbs" + o.value}
                className="inline-flex items-center gap-1.5"
              >
                <input
                  type="radio"
                  name="fbs"
                  checked={f.fbs === o.value}
                  onChange={() => set("fbs", o.value)}
                />
                <span>{o.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className={field}>
          Resting ECG
          <select
            className={input}
            value={f.restecg}
            onChange={(e) =>
              set("restecg", Number(e.target.value))
            }
          >
            {RESTECG.map(([v, t]) => (
              <option key={v} value={v}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <label className={field}>
          Max heart rate (bpm)
          <input
            className={input}
            type="number"
            min={60}
            max={230}
            value={f.thalach}
            onChange={(e) =>
              set("thalach", Number(e.target.value || 0))
            }
          />
        </label>

        <fieldset className={field}>
          Exercise-induced chest pain?
          <div className="mt-1 flex flex-wrap gap-3 text-sm">
            {YES_NO.map((o) => (
              <label
                key={"exang" + o.value}
                className="inline-flex items-center gap-1.5"
              >
                <input
                  type="radio"
                  name="exang"
                  checked={f.exang === o.value}
                  onChange={() => set("exang", o.value)}
                />
                <span>{o.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className={field}>
          ST depression vs rest (oldpeak)
          <input
            className={input}
            type="number"
            step="0.1"
            min={0}
            max={10}
            value={f.oldpeak}
            onChange={(e) =>
              set("oldpeak", Number(e.target.value || 0))
            }
          />
        </label>

        <label className={field}>
          ST segment slope
          <select
            className={input}
            value={f.slope}
            onChange={(e) =>
              set("slope", Number(e.target.value))
            }
          >
            {SLOPE.map(([v, t]) => (
              <option key={v} value={v}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <label className={field}>
          # vessels by fluoroscopy (0–3)
          <input
            className={input}
            type="number"
            min={0}
            max={3}
            value={f.ca}
            onChange={(e) =>
              set("ca", Number(e.target.value || 0))
            }
          />
        </label>

        <label className={field}>
          Thallium test (thal)
          <select
            className={input}
            value={f.thal}
            onChange={(e) =>
              set("thal", Number(e.target.value))
            }
          >
            {THAL.map(([v, t]) => (
              <option key={v} value={v}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <div className="md:col-span-2 mt-2">
          <button className={btnPrimary} disabled={loading}>
            {loading ? "Predicting..." : "Predict heart risk"}
          </button>
        </div>
      </form>

      {err && (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm md:text-base text-red-700 shadow-sm">
          {err}
        </p>
      )}

      {prob != null && band && (
        <div
          className={`mt-5 rounded-2xl p-4 md:p-5 ring-1 ${band.bg} ${band.text} ${band.ring}`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-base md:text-lg font-semibold">
              {band.label}
            </p>
            <p className="text-sm md:text-base font-semibold">
              {(prob * 100).toFixed(1)}%
              <span className="ml-1 text-xs md:text-sm opacity-70">
                (model estimate)
              </span>
            </p>
          </div>
          <div className="mt-3 h-2.5 w-full rounded-full bg-white/60">
            <div
              className={`h-2.5 rounded-full ${band.bar}`}
              style={{
                width: `${Math.max(
                  4,
                  Math.min(96, prob * 100)
                )}%`,
              }}
            />
          </div>
          <p className="mt-3 text-sm md:text-base text-slate-800">
            {adviceText(prob)}
          </p>
          <p className="mt-1 text-[10px] md:text-xs text-slate-600">
            This tool does not diagnose. Always correlate with symptoms,
            ECG, labs, and clinical judgment.
          </p>
        </div>
      )}

      {res?.top_factors?.length ? (
        <div className="mt-4 rounded-2xl bg-indigo-50/90 p-4 md:p-5 ring-1 ring-indigo-100">
          <h3 className="text-base md:text-lg font-semibold text-slate-900">
            Top contributing factors
          </h3>
          <ul className="mt-2 space-y-1.5">
            {res.top_factors.map((t, i) => (
              <li
                key={i}
                className="text-xs md:text-sm text-slate-800"
              >
                <code className="rounded bg-white px-1.5 py-0.5 text-slate-700 ring-1 ring-slate-200">
                  {t.feature}
                </code>
                <span className="ml-2">
                  contribution{" "}
                  <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 font-semibold text-emerald-700 ring-1 ring-emerald-200">
                    {Number(t.contribution).toFixed(3)}
                  </span>{" "}
                  (z={Number(t.zvalue).toFixed(3)})
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        res && (
          <p className="mt-4 text-xs md:text-sm text-slate-600">
            No explanation details available for this prediction.
          </p>
        )
      )}
    </div>
  );
}
