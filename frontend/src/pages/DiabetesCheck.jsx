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

// Shared options
const YES_NO = [
  { label: "No", value: 0 },
  { label: "Yes", value: 1 },
];

const AGE_OPTIONS = [
  [1, "18–24"],
  [2, "25–29"],
  [3, "30–34"],
  [4, "35–39"],
  [5, "40–44"],
  [6, "45–49"],
  [7, "50–54"],
  [8, "55–59"],
  [9, "60–64"],
  [10, "65–69"],
  [11, "70–74"],
  [12, "75–79"],
  [13, "80 or older"],
];

const EDU_OPTIONS = [
  [1, "No school / kindergarten only"],
  [2, "Grades 1–8"],
  [3, "Grades 9–11"],
  [4, "Grade 12 / GED"],
  [5, "Some college (1–3 years)"],
  [6, "College 4+ years"],
];

const INCOME_OPTIONS = [
  [1, "< $10k"],
  [2, "$10k–$15k"],
  [3, "$15k–$20k"],
  [4, "$20k–$25k"],
  [5, "$25k–$35k"],
  [6, "$35k–$50k"],
  [7, "$50k–$75k"],
  [8, "≥ $75k"],
];

const GEN_HEALTH = [
  [1, "Excellent"],
  [2, "Very good"],
  [3, "Good"],
  [4, "Fair"],
  [5, "Poor"],
];

function RiskBadge({ label }) {
  const palette = {
    "Very low chance": "bg-emerald-100 text-emerald-800",
    "Low chance": "bg-lime-100 text-lime-800",
    "Moderate chance": "bg-amber-100 text-amber-800",
    "High chance": "bg-orange-100 text-orange-800",
    "Very high chance": "bg-red-100 text-red-800",
  };
  const cls = palette[label] || "bg-slate-100 text-slate-800";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs md:text-sm font-semibold ${cls}`}
    >
      {label}
    </span>
  );
}

export default function DiabetesCheck({ token }) {
  // STEP 1: Questionnaire
  const [q, setQ] = useState({
    HighBP: 0,
    HighChol: 0,
    CholCheck: 1,
    BMI: 28,
    Smoker: 0,
    Stroke: 0,
    HeartDiseaseorAttack: 0,
    PhysActivity: 1,
    Fruits: 1,
    Veggies: 1,
    HvyAlcoholConsump: 0,
    AnyHealthcare: 1,
    NoDocbcCost: 0,
    GenHlth: 3,
    MentHlth: 0,
    PhysHlth: 0,
    DiffWalk: 0,
    Sex: 0,
    Age: 6,
    Education: 5,
    Income: 6,
  });

  // STEP 2: Optional Labs
  const [labs, setLabs] = useState({
    Pregnancies: 2,
    Glucose: 130,
    BloodPressure: 70,
    SkinThickness: 20,
    Insulin: 85,
    BMI: 28.5,
    DiabetesPedigreeFunction: 0.5,
    Age: 33,
  });

  const [screenRes, setScreenRes] = useState(null);
  const [labRes, setLabRes] = useState(null);
  const [err, setErr] = useState("");
  const [loading1, setLoading1] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const [showLabs, setShowLabs] = useState(false);

  const setQv = (k, v) => setQ((prev) => ({ ...prev, [k]: v }));
  const setLv = (k, v) =>
    setLabs((prev) => ({ ...prev, [k]: v === "" ? "" : Number(v) }));

  async function submitScreen(e) {
    e.preventDefault();
    setErr("");
    setScreenRes(null);
    setLabRes(null);
    setLoading1(true);
    try {
      const out = await api("/ml/diabetes/screen", {
        method: "POST",
        token,
        body: { features: q },
      });
      setScreenRes(out);
      const prob = out?.probability ?? 0;
      const label = out?.risk?.label || "";
      if (
        prob >= 0.25 ||
        ["Moderate chance", "High chance", "Very high chance"].includes(label)
      ) {
        setShowLabs(true);
      }
    } catch (e) {
      setErr(e.message || "Screen prediction failed");
    } finally {
      setLoading1(false);
    }
  }

  async function submitLabs(e) {
    e.preventDefault();
    setErr("");
    setLabRes(null);
    setLoading2(true);
    try {
      const out = await api("/ml/diabetes/labs", {
        method: "POST",
        token,
        body: { features: labs },
      });
      setLabRes(out);
    } catch (e) {
      setErr(e.message || "Lab prediction failed");
    } finally {
      setLoading2(false);
    }
  }

  return (
    <div className={card}>
      {/* Header */}
      <div className="flex flex-col gap-1 border-b border-slate-100 pb-3">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-500">
          Risk tools
        </p>
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">
          Diabetes Risk Checker
        </h2>
        <p className="text-sm md:text-base text-slate-600">
          Answer a few lifestyle questions. Optionally add lab values for a
          more refined estimate. This does not replace a doctor.
        </p>
      </div>

      {/* STEP 1 */}
      <div className="mt-5 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 md:p-5">
        <div className="mb-3">
          <h3 className="text-base md:text-lg font-semibold text-slate-900">
            Step 1 · Quick questionnaire (no labs)
          </h3>
          <p className="mt-1 text-xs md:text-sm text-slate-600">
            Use simple yes/no and small numbers from daily life. Takes about 1–2
            minutes.
          </p>
        </div>

        <form
          onSubmit={submitScreen}
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          {/* High blood pressure */}
          <fieldset
            className={field}
            title="Have you ever been told by a doctor that you have high blood pressure?"
          >
            High blood pressure diagnosed?
            <div className="mt-1 flex flex-wrap gap-3 text-sm">
              {YES_NO.map((o) => (
                <label
                  key={"HighBP" + o.value}
                  className="inline-flex items-center gap-1.5"
                >
                  <input
                    type="radio"
                    name="HighBP"
                    checked={q.HighBP === o.value}
                    onChange={() => setQv("HighBP", o.value)}
                  />
                  <span>{o.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* High cholesterol */}
          <fieldset
            className={field}
            title="Ever told you have high cholesterol?"
          >
            High cholesterol diagnosed?
            <div className="mt-1 flex flex-wrap gap-3 text-sm">
              {YES_NO.map((o) => (
                <label
                  key={"HighChol" + o.value}
                  className="inline-flex items-center gap-1.5"
                >
                  <input
                    type="radio"
                    name="HighChol"
                    checked={q.HighChol === o.value}
                    onChange={() => setQv("HighChol", o.value)}
                  />
                  <span>{o.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Cholesterol check */}
          <fieldset
            className={field}
            title="Have you had your cholesterol checked in the last 5 years?"
          >
            Cholesterol check in last 5 years?
            <div className="mt-1 flex flex-wrap gap-3 text-sm">
              {YES_NO.map((o) => (
                <label
                  key={"CholCheck" + o.value}
                  className="inline-flex items-center gap-1.5"
                >
                  <input
                    type="radio"
                    name="CholCheck"
                    checked={q.CholCheck === o.value}
                    onChange={() => setQv("CholCheck", o.value)}
                  />
                  <span>{o.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* BMI */}
          <label
            className={field}
            title="Body Mass Index (kg/m²). You can quickly check this online."
          >
            BMI
            <input
              className={input}
              type="number"
              step="0.1"
              value={q.BMI}
              onChange={(e) =>
                setQv("BMI", Number(e.target.value || 0))
              }
            />
          </label>

          {/* ...remaining questionnaire fields unchanged structurally, just using field/input... */}

          {/* Smoker */}
          <fieldset
            className={field}
            title="Have you smoked at least 100 cigarettes in your life (≈5 packs)?"
          >
            Smoked ≥100 cigarettes lifetime?
            <div className="mt-1 flex flex-wrap gap-3 text-sm">
              {YES_NO.map((o) => (
                <label
                  key={"Smoker" + o.value}
                  className="inline-flex items-center gap-1.5"
                >
                  <input
                    type="radio"
                    name="Smoker"
                    checked={q.Smoker === o.value}
                    onChange={() => setQv("Smoker", o.value)}
                  />
                  <span>{o.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Stroke */}
          <fieldset
            className={field}
            title="Ever told by a doctor that you had a stroke?"
          >
            Ever had a stroke?
            <div className="mt-1 flex flex-wrap gap-3 text-sm">
              {YES_NO.map((o) => (
                <label
                  key={"Stroke" + o.value}
                  className="inline-flex items-center gap-1.5"
                >
                  <input
                    type="radio"
                    name="Stroke"
                    checked={q.Stroke === o.value}
                    onChange={() => setQv("Stroke", o.value)}
                  />
                  <span>{o.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Heart disease/attack */}
          <fieldset
            className={field}
            title="Coronary heart disease or heart attack (ever)?"
          >
            Heart disease or heart attack (ever)?
            <div className="mt-1 flex flex-wrap gap-3 text-sm">
              {YES_NO.map((o) => (
                <label
                  key={"HeartDiseaseorAttack" + o.value}
                  className="inline-flex items-center gap-1.5"
                >
                  <input
                    type="radio"
                    name="HeartDiseaseorAttack"
                    checked={q.HeartDiseaseorAttack === o.value}
                    onChange={() =>
                      setQv("HeartDiseaseorAttack", o.value)
                    }
                  />
                  <span>{o.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* PhysActivity, Fruits, Veggies, Alcohol, AnyHealthcare, NoDocbcCost */}
          {/* (Use same YES/NO pattern + field/input classes) */}

          {/* GenHlth */}
          <label className={field}>
            General health
            <select
              className={input}
              value={q.GenHlth}
              onChange={(e) =>
                setQv("GenHlth", Number(e.target.value))
              }
            >
              {GEN_HEALTH.map(([v, t]) => (
                <option key={v} value={v}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          {/* MentHlth / PhysHlth */}
          <label className={field}>
            Days mental health not good (0–30)
            <input
              className={input}
              type="number"
              min={0}
              max={30}
              value={q.MentHlth}
              onChange={(e) =>
                setQv("MentHlth", Number(e.target.value || 0))
              }
            />
          </label>

          <label className={field}>
            Days physical health not good (0–30)
            <input
              className={input}
              type="number"
              min={0}
              max={30}
              value={q.PhysHlth}
              onChange={(e) =>
                setQv("PhysHlth", Number(e.target.value || 0))
              }
            />
          </label>

          {/* DiffWalk */}
          <fieldset className={field}>
            Serious difficulty walking/climbing stairs?
            <div className="mt-1 flex flex-wrap gap-3 text-sm">
              {YES_NO.map((o) => (
                <label
                  key={"DiffWalk" + o.value}
                  className="inline-flex items-center gap-1.5"
                >
                  <input
                    type="radio"
                    name="DiffWalk"
                    checked={q.DiffWalk === o.value}
                    onChange={() => setQv("DiffWalk", o.value)}
                  />
                  <span>{o.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Sex */}
          <label className={field}>
            Sex
            <select
              className={input}
              value={q.Sex}
              onChange={(e) =>
                setQv("Sex", Number(e.target.value))
              }
            >
              <option value={0}>Female</option>
              <option value={1}>Male</option>
            </select>
          </label>

          {/* Age / Education / Income */}
          <label className={field}>
            Age group
            <select
              className={input}
              value={q.Age}
              onChange={(e) =>
                setQv("Age", Number(e.target.value))
              }
            >
              {AGE_OPTIONS.map(([v, t]) => (
                <option key={v} value={v}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          <label className={field}>
            Education
            <select
              className={input}
              value={q.Education}
              onChange={(e) =>
                setQv("Education", Number(e.target.value))
              }
            >
              {EDU_OPTIONS.map(([v, t]) => (
                <option key={v} value={v}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          <label className={field}>
            Income
            <select
              className={input}
              value={q.Income}
              onChange={(e) =>
                setQv("Income", Number(e.target.value))
              }
            >
              {INCOME_OPTIONS.map(([v, t]) => (
                <option key={v} value={v}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          <div className="md:col-span-2 mt-2">
            <button className={btnPrimary} disabled={loading1}>
              {loading1
                ? "Predicting from questionnaire..."
                : "Predict (Questionnaire only)"}
            </button>
          </div>
        </form>

        {screenRes && (
          <div className="mt-4 rounded-2xl bg-blue-50/80 p-4 md:p-5 ring-1 ring-blue-100">
            <div className="flex flex-wrap items-center gap-2 text-sm md:text-base text-slate-800">
              <span>Estimated probability:</span>
              <b>{Number(screenRes.probability ?? 0).toFixed(3)}</b>
              {screenRes?.risk?.label && (
                <RiskBadge label={screenRes.risk.label} />
              )}
            </div>
            {screenRes?.risk?.advice && (
              <p className="mt-2 text-sm md:text-base text-slate-700">
                {screenRes.risk.advice}
              </p>
            )}
            {!showLabs ? (
              <button
                onClick={() => setShowLabs(true)}
                className="mt-3 rounded-xl border border-blue-200 bg-white px-3.5 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"
              >
                Add lab results for a more detailed check
              </button>
            ) : (
              <p className="mt-3 text-xs md:text-sm text-slate-600">
                Scroll down to enter optional lab values.
              </p>
            )}
          </div>
        )}
      </div>

      {/* STEP 2 */}
      {showLabs && (
        <div className="mt-6 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 md:p-5">
          <div className="mb-3">
            <h3 className="text-base md:text-lg font-semibold text-slate-900">
              Step 2 · Optional lab-based estimate
            </h3>
            <p className="mt-1 text-xs md:text-sm text-slate-600">
              Use if you have values like fasting glucose, insulin, etc.
            </p>
          </div>

          <form
            onSubmit={submitLabs}
            className="grid grid-cols-1 gap-4 md:grid-cols-2"
          >
            {Object.entries(labs).map(([k, v]) => (
              <label key={k} className={field}>
                {k}
                <input
                  className={input}
                  type="number"
                  step="any"
                  value={v}
                  onChange={(e) => setLv(k, e.target.value)}
                />
              </label>
            ))}
            <div className="md:col-span-2 mt-1">
              <button className={btnPrimary} disabled={loading2}>
                {loading2
                  ? "Predicting from labs..."
                  : "Predict (with labs)"}
              </button>
            </div>
          </form>

          {labRes && (
            <div className="mt-4 rounded-2xl bg-indigo-50/90 p-4 md:p-5 ring-1 ring-indigo-100">
              <div className="flex flex-wrap items-center gap-2 text-sm md:text-base text-slate-800">
                <span>Estimated probability:</span>
                <b>{Number(labRes.probability ?? 0).toFixed(3)}</b>
                {labRes?.risk?.label && (
                  <RiskBadge label={labRes.risk.label} />
                )}
              </div>
              {labRes?.risk?.advice && (
                <p className="mt-2 text-sm md:text-base text-slate-700">
                  {labRes.risk.advice}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {err && (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm md:text-base text-red-700 shadow-sm">
          {err}
        </p>
      )}
    </div>
  );
}
