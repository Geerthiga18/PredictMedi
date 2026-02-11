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
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs md:text-sm font-semibold ${cls}`}>
      {label}
    </span>
  );
}

export default function DiabetesCheck({ token }) {
  // STEP 1: Questionnaire - Updated to match Python model parameters
  const [q, setQ] = useState({
    BMI: 28,
    "Age Group": 6,
    "Physical Activity": 1,  // 1 = Regular, 0 = Infrequent
    "Fruit/Veggie Consumption": 1,  // 1 = Yes, 0 = No
    "Family History of Diabetes": 0,  // 1 = Yes, 0 = No
    "High Blood Pressure": 0,  // 1 = Yes, 0 = No
    "High Cholesterol": 1,  // 1 = Yes, 0 = No
    "Stroke/Heart Disease History": 0,  // 1 = Yes, 0 = No
    "General Health": 2,  // 1 = Excellent, 2 = Very good, 3 = Good, 4 = Fair, 5 = Poor
  });

  // STEP 2: Optional Labs (unchanged - lab model is still correct)
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

          {/* Age Group */}
          <label className={field}>
            Age group
            <select
              className={input}
              value={q["Age Group"]}
              onChange={(e) =>
                setQv("Age Group", Number(e.target.value))
              }
            >
              {AGE_OPTIONS.map(([v, t]) => (
                <option key={v} value={v}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          {/* Physical Activity */}
          <fieldset
            className={field}
            title="Do you engage in regular physical activity?"
          >
            Regular physical activity?
            <div className="mt-1 flex flex-wrap gap-3 text-sm">
              {YES_NO.map((o) => (
                <label
                  key={"PhysicalActivity" + o.value}
                  className="inline-flex items-center gap-1.5"
                >
                  <input
                    type="radio"
                    name="PhysicalActivity"
                    checked={q["Physical Activity"] === o.value}
                    onChange={() => setQv("Physical Activity", o.value)}
                  />
                  <span>{o.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Fruit/Veggie Consumption */}
          <fieldset
            className={field}
            title="Do you regularly consume fruits and vegetables?"
          >
            Regular fruit/veggie consumption?
            <div className="mt-1 flex flex-wrap gap-3 text-sm">
              {YES_NO.map((o) => (
                <label
                  key={"FruitVeggie" + o.value}
                  className="inline-flex items-center gap-1.5"
                >
                  <input
                    type="radio"
                    name="FruitVeggie"
                    checked={q["Fruit/Veggie Consumption"] === o.value}
                    onChange={() => setQv("Fruit/Veggie Consumption", o.value)}
                  />
                  <span>{o.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Family History of Diabetes */}
          <fieldset
            className={field}
            title="Do you have a family history of diabetes?"
          >
            Family history of diabetes?
            <div className="mt-1 flex flex-wrap gap-3 text-sm">
              {YES_NO.map((o) => (
                <label
                  key={"FamilyHistory" + o.value}
                  className="inline-flex items-center gap-1.5"
                >
                  <input
                    type="radio"
                    name="FamilyHistory"
                    checked={q["Family History of Diabetes"] === o.value}
                    onChange={() => setQv("Family History of Diabetes", o.value)}
                  />
                  <span>{o.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* High Blood Pressure */}
          <fieldset
            className={field}
            title="Have you been diagnosed with high blood pressure?"
          >
            High blood pressure?
            <div className="mt-1 flex flex-wrap gap-3 text-sm">
              {YES_NO.map((o) => (
                <label
                  key={"HighBP" + o.value}
                  className="inline-flex items-center gap-1.5"
                >
                  <input
                    type="radio"
                    name="HighBP"
                    checked={q["High Blood Pressure"] === o.value}
                    onChange={() => setQv("High Blood Pressure", o.value)}
                  />
                  <span>{o.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* High Cholesterol */}
          <fieldset
            className={field}
            title="Have you been diagnosed with high cholesterol?"
          >
            High cholesterol?
            <div className="mt-1 flex flex-wrap gap-3 text-sm">
              {YES_NO.map((o) => (
                <label
                  key={"HighChol" + o.value}
                  className="inline-flex items-center gap-1.5"
                >
                  <input
                    type="radio"
                    name="HighChol"
                    checked={q["High Cholesterol"] === o.value}
                    onChange={() => setQv("High Cholesterol", o.value)}
                  />
                  <span>{o.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Stroke/Heart Disease History */}
          <fieldset
            className={field}
            title="Have you had a stroke or heart disease?"
          >
            Stroke or heart disease history?
            <div className="mt-1 flex flex-wrap gap-3 text-sm">
              {YES_NO.map((o) => (
                <label
                  key={"StrokeHeart" + o.value}
                  className="inline-flex items-center gap-1.5"
                >
                  <input
                    type="radio"
                    name="StrokeHeart"
                    checked={q["Stroke/Heart Disease History"] === o.value}
                    onChange={() => setQv("Stroke/Heart Disease History", o.value)}
                  />
                  <span>{o.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* General Health */}
          <label className={field}>
            General health
            <select
              className={input}
              value={q["General Health"]}
              onChange={(e) =>
                setQv("General Health", Number(e.target.value))
              }
            >
              {GEN_HEALTH.map(([v, t]) => (
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
              Enter your lab values for a more accurate diabetes risk assessment.
            </p>
          </div>

          <form
            onSubmit={submitLabs}
            className="grid grid-cols-1 gap-4 md:grid-cols-2"
          >
            {/* Pregnancies */}
            <label className={field} title="Number of times pregnant">
              Pregnancies
              <input
                className={input}
                type="number"
                min="0"
                step="1"
                value={labs.Pregnancies}
                onChange={(e) => setLv("Pregnancies", e.target.value)}
              />
            </label>

            {/* Glucose */}
            <label className={field} title="Plasma glucose concentration (mg/dL)">
              Glucose (mg/dL)
              <input
                className={input}
                type="number"
                min="0"
                step="1"
                value={labs.Glucose}
                onChange={(e) => setLv("Glucose", e.target.value)}
              />
            </label>

            {/* Blood Pressure */}
            <label className={field} title="Diastolic blood pressure (mm Hg)">
              Blood Pressure (mm Hg)
              <input
                className={input}
                type="number"
                min="0"
                step="1"
                value={labs.BloodPressure}
                onChange={(e) => setLv("BloodPressure", e.target.value)}
              />
            </label>

            {/* Skin Thickness */}
            <label className={field} title="Triceps skin fold thickness (mm)">
              Skin Thickness (mm)
              <input
                className={input}
                type="number"
                min="0"
                step="1"
                value={labs.SkinThickness}
                onChange={(e) => setLv("SkinThickness", e.target.value)}
              />
            </label>

            {/* Insulin */}
            <label className={field} title="2-Hour serum insulin (mu U/ml)">
              Insulin (mu U/ml)
              <input
                className={input}
                type="number"
                min="0"
                step="1"
                value={labs.Insulin}
                onChange={(e) => setLv("Insulin", e.target.value)}
              />
            </label>

            {/* BMI */}
            <label className={field} title="Body mass index (weight in kg/(height in m)^2)">
              BMI
              <input
                className={input}
                type="number"
                min="0"
                step="0.1"
                value={labs.BMI}
                onChange={(e) => setLv("BMI", e.target.value)}
              />
            </label>

            {/* Diabetes Pedigree Function */}
            <label className={field} title="Diabetes pedigree function (family history score)">
              Diabetes Pedigree Function
              <input
                className={input}
                type="number"
                min="0"
                step="0.01"
                value={labs.DiabetesPedigreeFunction}
                onChange={(e) => setLv("DiabetesPedigreeFunction", e.target.value)}
              />
            </label>

            {/* Age */}
            <label className={field} title="Age in years">
              Age (years)
              <input
                className={input}
                type="number"
                min="0"
                step="1"
                value={labs.Age}
                onChange={(e) => setLv("Age", e.target.value)}
              />
            </label>

            <div className="md:col-span-2 mt-2">
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