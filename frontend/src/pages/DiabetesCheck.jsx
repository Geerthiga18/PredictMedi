import { useState } from "react";
import { api } from "../lib/api";

const YES_NO = [
  { label: "No", value: 0 },
  { label: "Yes", value: 1 },
];

const AGE_OPTIONS = [
  [1, "18–24"], [2, "25–29"], [3, "30–34"], [4, "35–39"],
  [5, "40–44"], [6, "45–49"], [7, "50–54"], [8, "55–59"],
  [9, "60–64"], [10, "65–69"], [11, "70–74"], [12, "75–79"],
  [13, "80 or older"],
];

const GEN_HEALTH = [
  [1, "Excellent"], [2, "Very good"], [3, "Good"], [4, "Fair"], [5, "Poor"],
];

function RiskBadge({ label }) {
  const palette = {
    "Very low chance": "bg-emerald-500/15 text-emerald-400 ring-emerald-500/20",
    "Low chance": "bg-pm-accent/15 text-pm-accent ring-pm-accent/20",
    "Moderate chance": "bg-amber-500/15 text-amber-400 ring-amber-500/20",
    "High chance": "bg-orange-500/15 text-orange-400 ring-orange-500/20",
    "Very high chance": "bg-red-500/15 text-red-400 ring-red-500/20",
  };
  const cls = palette[label] || "bg-white/5 text-slate-400 ring-white/10";
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${cls}`}>
      {label}
    </span>
  );
}

function Toggle({ name, options, value, onChange }) {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={name + o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
            value === o.value
              ? "bg-pm-accent/15 text-pm-accent ring-1 ring-pm-accent/30"
              : "bg-white/5 text-slate-400 hover:bg-white/8 ring-1 ring-white/[0.06]"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function DiabetesCheck({ token }) {
  const [q, setQ] = useState({
    BMI: 28,
    "Age Group": 6,
    "Physical Activity": 1,
    "Fruit/Veggie Consumption": 1,
    "Family History of Diabetes": 0,
    "High Blood Pressure": 0,
    "High Cholesterol": 1,
    "Stroke/Heart Disease History": 0,
    "General Health": 2,
  });

  const [labs, setLabs] = useState({
    Pregnancies: 2, Glucose: 130, BloodPressure: 70,
    SkinThickness: 20, Insulin: 85, BMI: 28.5,
    DiabetesPedigreeFunction: 0.5, Age: 33,
  });

  const [screenRes, setScreenRes] = useState(null);
  const [labRes, setLabRes] = useState(null);
  const [err, setErr] = useState("");
  const [loading1, setLoading1] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const [showLabs, setShowLabs] = useState(false);

  const setQv = (k, v) => setQ((prev) => ({ ...prev, [k]: v }));
  const setLv = (k, v) => setLabs((prev) => ({ ...prev, [k]: v === "" ? "" : Number(v) }));

  async function submitScreen(e) {
    e.preventDefault();
    setErr(""); setScreenRes(null); setLabRes(null); setLoading1(true);
    try {
      const out = await api("/ml/diabetes/screen", { method: "POST", token, body: { features: q } });
      setScreenRes(out);
      const prob = out?.probability ?? 0;
      const label = out?.risk?.label || "";
      if (prob >= 0.25 || ["Moderate chance", "High chance", "Very high chance"].includes(label)) {
        setShowLabs(true);
      }
    } catch (e) {
      setErr(e.message || "Screen prediction failed");
    } finally { setLoading1(false); }
  }

  async function submitLabs(e) {
    e.preventDefault();
    setErr(""); setLabRes(null); setLoading2(true);
    try {
      const out = await api("/ml/diabetes/labs", { method: "POST", token, body: { features: labs } });
      setLabRes(out);
    } catch (e) {
      setErr(e.message || "Lab prediction failed");
    } finally { setLoading2(false); }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="glass-card p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-pm-cyan">
          Risk Tools
        </p>
        <h2 className="mt-1 text-2xl md:text-3xl font-bold text-white">
          Diabetes Risk Checker
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Answer a few lifestyle questions. Optionally add lab values for a
          more refined estimate. This does not replace a doctor.
        </p>
      </div>

      {/* STEP 1 */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-pm-cyan/15 text-sm font-bold text-pm-cyan ring-1 ring-pm-cyan/20">1</span>
          <div>
            <h3 className="font-bold text-white">Quick Questionnaire</h3>
            <p className="text-xs text-slate-400">Simple yes/no questions. Takes about 1–2 minutes.</p>
          </div>
        </div>

        <form onSubmit={submitScreen} className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">BMI</label>
            <input className="pm-input" type="number" step="0.1" value={q.BMI} onChange={(e) => setQv("BMI", Number(e.target.value || 0))} />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">Age Group</label>
            <select className="pm-input" value={q["Age Group"]} onChange={(e) => setQv("Age Group", Number(e.target.value))}>
              {AGE_OPTIONS.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">Regular physical activity?</label>
            <Toggle name="PhysicalActivity" options={YES_NO} value={q["Physical Activity"]} onChange={(v) => setQv("Physical Activity", v)} />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">Regular fruit/veggie?</label>
            <Toggle name="FruitVeggie" options={YES_NO} value={q["Fruit/Veggie Consumption"]} onChange={(v) => setQv("Fruit/Veggie Consumption", v)} />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">Family history of diabetes?</label>
            <Toggle name="FamilyHistory" options={YES_NO} value={q["Family History of Diabetes"]} onChange={(v) => setQv("Family History of Diabetes", v)} />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">High blood pressure?</label>
            <Toggle name="HighBP" options={YES_NO} value={q["High Blood Pressure"]} onChange={(v) => setQv("High Blood Pressure", v)} />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">High cholesterol?</label>
            <Toggle name="HighChol" options={YES_NO} value={q["High Cholesterol"]} onChange={(v) => setQv("High Cholesterol", v)} />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">Stroke/heart disease history?</label>
            <Toggle name="StrokeHeart" options={YES_NO} value={q["Stroke/Heart Disease History"]} onChange={(v) => setQv("Stroke/Heart Disease History", v)} />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">General Health</label>
            <select className="pm-input" value={q["General Health"]} onChange={(e) => setQv("General Health", Number(e.target.value))}>
              {GEN_HEALTH.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
            </select>
          </div>

          <div className="md:col-span-2 mt-1">
            <button className="pm-btn" disabled={loading1}>
              {loading1 ? (
                <><span className="h-4 w-4 animate-spin rounded-full border-2 border-pm-dark/30 border-t-pm-dark" /> Predicting…</>
              ) : "Predict (Questionnaire only)"}
            </button>
          </div>
        </form>

        {screenRes && (
          <div className="mt-5 rounded-xl bg-pm-cyan/5 p-5 ring-1 ring-pm-cyan/15 animate-slide-up">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-slate-300">Estimated probability:</span>
              <span className="text-lg font-bold text-white">{Number(screenRes.probability ?? 0).toFixed(3)}</span>
              {screenRes?.risk?.label && <RiskBadge label={screenRes.risk.label} />}
            </div>
            {screenRes?.risk?.advice && (
              <p className="mt-3 text-sm text-slate-300">{screenRes.risk.advice}</p>
            )}
            {!showLabs ? (
              <button onClick={() => setShowLabs(true)} className="pm-btn-secondary mt-4">
                Add lab results for a more detailed check
              </button>
            ) : (
              <p className="mt-3 text-xs text-slate-500">Scroll down to enter optional lab values.</p>
            )}
          </div>
        )}
      </div>

      {/* STEP 2 */}
      {showLabs && (
        <div className="glass-card p-6 animate-slide-up">
          <div className="flex items-center gap-3 mb-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-pm-purple/15 text-sm font-bold text-pm-purple ring-1 ring-pm-purple/20">2</span>
            <div>
              <h3 className="font-bold text-white">Lab-Based Estimate</h3>
              <p className="text-xs text-slate-400">Enter your lab values for a more accurate assessment.</p>
            </div>
          </div>

          <form onSubmit={submitLabs} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {[
              ["Pregnancies", "Pregnancies", "0", "1"],
              ["Glucose", "Glucose (mg/dL)", "0", "1"],
              ["BloodPressure", "Blood Pressure (mm Hg)", "0", "1"],
              ["SkinThickness", "Skin Thickness (mm)", "0", "1"],
              ["Insulin", "Insulin (mu U/ml)", "0", "1"],
              ["BMI", "BMI", "0", "0.1"],
              ["DiabetesPedigreeFunction", "Pedigree Function", "0", "0.01"],
              ["Age", "Age (years)", "0", "1"],
            ].map(([key, label, min, step]) => (
              <div key={key}>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">{label}</label>
                <input className="pm-input" type="number" min={min} step={step} value={labs[key]} onChange={(e) => setLv(key, e.target.value)} />
              </div>
            ))}

            <div className="md:col-span-2 mt-1">
              <button className="pm-btn" disabled={loading2}>
                {loading2 ? (
                  <><span className="h-4 w-4 animate-spin rounded-full border-2 border-pm-dark/30 border-t-pm-dark" /> Predicting…</>
                ) : "Predict (with labs)"}
              </button>
            </div>
          </form>

          {labRes && (
            <div className="mt-5 rounded-xl bg-pm-purple/5 p-5 ring-1 ring-pm-purple/15 animate-slide-up">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-slate-300">Estimated probability:</span>
                <span className="text-lg font-bold text-white">{Number(labRes.probability ?? 0).toFixed(3)}</span>
                {labRes?.risk?.label && <RiskBadge label={labRes.risk.label} />}
              </div>
              {labRes?.risk?.advice && (
                <p className="mt-3 text-sm text-slate-300">{labRes.risk.advice}</p>
              )}
            </div>
          )}
        </div>
      )}

      {err && (
        <div className="glass-card p-4 bg-red-500/5 text-sm text-red-400 ring-1 ring-red-500/15 animate-slide-up">
          {err}
        </div>
      )}
    </div>
  );
}