import { useState } from "react";
import { api } from "../lib/api";

const field = "block text-sm font-medium text-slate-700";
const input =
  "mt-1 w-full rounded-xl border border-slate-300/80 bg-slate-50 px-3 py-2 text-slate-900 placeholder-slate-400 shadow-sm transition hover:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500";
const btnPrimary =
  "inline-flex items-center rounded-xl bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-600 px-4 py-2 font-medium text-white shadow-md transition hover:from-blue-700 hover:via-sky-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2";
const card =
  "mx-auto max-w-2xl rounded-2xl bg-white/95 p-6 shadow-xl ring-1 ring-slate-200/70 backdrop-blur-sm";

  // Coded option lists for BRFSS fields
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

const EDU_OPTIONS = [
  [1, "No school / kindergarten only"],
  [2, "Grades 1–8"],
  [3, "Grades 9–11"],
  [4, "Grade 12 / GED"],
  [5, "Some college / 1–3 years"],
  [6, "College 4+ years"],
];

const INCOME_OPTIONS = [
  [1, "< $10k"], [2, "$10k–$15k"], [3, "$15k–$20k"], [4, "$20k–$25k"],
  [5, "$25k–$35k"], [6, "$35k–$50k"], [7, "$50k–$75k"], [8, "≥ $75k"],
];

const GEN_HEALTH = [
  [1, "Excellent"], [2, "Very good"], [3, "Good"], [4, "Fair"], [5, "Poor"],
];


export default function DiabetesCheck({ token }) {
  // ---- STEP 1: Questionnaire (BRFSS) ----
const [q, setQ] = useState({
  HighBP: 0,                  // High blood pressure diagnosed?
  HighChol: 0,                // High cholesterol diagnosed?
  CholCheck: 1,               // Cholesterol check in past 5 years?
  BMI: 28,                    // Body Mass Index
  Smoker: 0,                  // Smoked ≥100 cigarettes lifetime?
  Stroke: 0,                  // Ever told you had a stroke?
  HeartDiseaseorAttack: 0,    // CHD or heart attack (ever)?
  PhysActivity: 1,            // Any exercise in last 30 days (not job)?
  Fruits: 1,                  // Eat fruit ≥1 time per day?
  Veggies: 1,                 // Eat vegetables ≥1 time per day?
  HvyAlcoholConsump: 0,       // Heavy drinker (men >14/wk, women >7/wk)?
  AnyHealthcare: 1,           // Any health coverage/insurance?
  NoDocbcCost: 0,             // Skipped doctor last 12 mo due to cost?
  GenHlth: 3,                 // 1=Excellent … 5=Poor
  MentHlth: 0,                // Bad mental health days (0–30)
  PhysHlth: 0,                // Bad physical health days (0–30)
  DiffWalk: 0,                // Serious difficulty walking/climbing?
  Sex: 0,                     // 0=female, 1=male
  Age: 6,                     // age bucket (see list)
  Education: 5,               // 1–6 (see list)
  Income: 6,                  // 1–8 (see list)
});

  // ---- STEP 2: Optional Labs (Pima) ----
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

  function setQv(k, v) {
    setQ(prev => ({ ...prev, [k]: v }));
  }
  function setLv(k, v) {
    setLabs(prev => ({ ...prev, [k]: v }));
  }

  async function submitScreen(e) {
    e.preventDefault();
    setErr(""); setScreenRes(null); setLabRes(null);
    setLoading1(true);
    try {
      const out = await api("/ml/diabetes/screen", {
        method: "POST",
        token,
        body: { features: q },
      });
      setScreenRes(out);
      // Gently suggest labs if moderate/high probability
      if (out?.probability >= 0.25) setShowLabs(true);
    } catch (e) {
      setErr(e.message || "Screen prediction failed");
    } finally {
      setLoading1(false);
    }
  }

  async function submitLabs(e) {
    e.preventDefault();
    setErr(""); setLabRes(null);
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
      <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
        <span className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
          Diabetes Risk
        </span>
      </h2>

      {/* STEP 1: Questionnaire form */}
      <div className="mt-4 rounded-xl ring-1 ring-slate-200 p-4">
        <div className="mb-3 text-slate-600 text-sm">
          Quick screen (no lab tests). Use simple yes/no or small numbers from daily life.
        </div>
<form onSubmit={submitScreen} className="grid grid-cols-1 gap-4 sm:grid-cols-2">

  {/* High blood pressure? */}
  <fieldset className={field} title="Have you ever been told by a doctor that you have high blood pressure?">
    High blood pressure diagnosed?
    <div className="mt-1 flex gap-3">
      {YES_NO.map(o => (
        <label key={"HighBP"+o.value} className="inline-flex items-center gap-1">
          <input type="radio" name="HighBP" checked={q.HighBP===o.value}
                 onChange={() => setQ(prev=>({...prev, HighBP:o.value}))}/>
          <span className="text-slate-700">{o.label}</span>
        </label>
      ))}
    </div>
  </fieldset>

  {/* High cholesterol? */}
  <fieldset className={field} title="Ever told you have high cholesterol?">
    High cholesterol diagnosed?
    <div className="mt-1 flex gap-3">
      {YES_NO.map(o => (
        <label key={"HighChol"+o.value} className="inline-flex items-center gap-1">
          <input type="radio" name="HighChol" checked={q.HighChol===o.value}
                 onChange={() => setQ(prev=>({...prev, HighChol:o.value}))}/>
          <span className="text-slate-700">{o.label}</span>
        </label>
      ))}
    </div>
  </fieldset>

  {/* Had cholesterol check in last 5 years? */}
  <fieldset className={field} title="Have you had your cholesterol checked in the last 5 years?">
    Cholesterol check in last 5 years?
    <div className="mt-1 flex gap-3">
      {YES_NO.map(o => (
        <label key={"CholCheck"+o.value} className="inline-flex items-center gap-1">
          <input type="radio" name="CholCheck" checked={q.CholCheck===o.value}
                 onChange={() => setQ(prev=>({...prev, CholCheck:o.value}))}/>
          <span className="text-slate-700">{o.label}</span>
        </label>
      ))}
    </div>
  </fieldset>

  {/* BMI number */}
  <label className={field} title="Body Mass Index (weight kg / height m²). You can estimate from many online BMI calculators.">
    BMI
    <input className={input} type="number" step="0.1" value={q.BMI}
           onChange={(e)=>setQ(prev=>({...prev, BMI:Number(e.target.value||0)}))}/>
  </label>

  {/* Smoker ≥100 cigs lifetime */}
  <fieldset className={field} title="Have you smoked at least 100 cigarettes in your life (≈5 packs)?">
    Smoked ≥100 cigarettes lifetime?
    <div className="mt-1 flex gap-3">
      {YES_NO.map(o => (
        <label key={"Smoker"+o.value} className="inline-flex items-center gap-1">
          <input type="radio" name="Smoker" checked={q.Smoker===o.value}
                 onChange={() => setQ(prev=>({...prev, Smoker:o.value}))}/>
          <span className="text-slate-700">{o.label}</span>
        </label>
      ))}
    </div>
  </fieldset>

  {/* Stroke ever */}
  <fieldset className={field} title="Have you ever been told by a doctor that you had a stroke?">
    Ever had a stroke?
    <div className="mt-1 flex gap-3">
      {YES_NO.map(o => (
        <label key={"Stroke"+o.value} className="inline-flex items-center gap-1">
          <input type="radio" name="Stroke" checked={q.Stroke===o.value}
                 onChange={() => setQ(prev=>({...prev, Stroke:o.value}))}/>
          <span className="text-slate-700">{o.label}</span>
        </label>
      ))}
    </div>
  </fieldset>

  {/* Heart disease or heart attack ever */}
  <fieldset className={field} title="Have you ever been told you have coronary heart disease or had a heart attack?">
    Heart disease or heart attack (ever)?
    <div className="mt-1 flex gap-3">
      {YES_NO.map(o => (
        <label key={"HeartDiseaseorAttack"+o.value} className="inline-flex items-center gap-1">
          <input type="radio" name="HeartDiseaseorAttack" checked={q.HeartDiseaseorAttack===o.value}
                 onChange={() => setQ(prev=>({...prev, HeartDiseaseorAttack:o.value}))}/>
          <span className="text-slate-700">{o.label}</span>
        </label>
      ))}
    </div>
  </fieldset>

  {/* Physical activity in last 30 days */}
  <fieldset className={field} title="Any physical activity or exercise in the past 30 days? (Not counting job.)">
    Exercise in last 30 days (not job)?
    <div className="mt-1 flex gap-3">
      {YES_NO.map(o => (
        <label key={"PhysActivity"+o.value} className="inline-flex items-center gap-1">
          <input type="radio" name="PhysActivity" checked={q.PhysActivity===o.value}
                 onChange={() => setQ(prev=>({...prev, PhysActivity:o.value}))}/>
          <span className="text-slate-700">{o.label}</span>
        </label>
      ))}
    </div>
  </fieldset>

  {/* Fruits daily */}
  <fieldset className={field} title="Do you eat fruit one or more times per day?">
    Eat fruit ≥1 time/day?
    <div className="mt-1 flex gap-3">
      {YES_NO.map(o => (
        <label key={"Fruits"+o.value} className="inline-flex items-center gap-1">
          <input type="radio" name="Fruits" checked={q.Fruits===o.value}
                 onChange={() => setQ(prev=>({...prev, Fruits:o.value}))}/>
          <span className="text-slate-700">{o.label}</span>
        </label>
      ))}
    </div>
  </fieldset>

  {/* Veggies daily */}
  <fieldset className={field} title="Do you eat vegetables one or more times per day?">
    Eat vegetables ≥1 time/day?
    <div className="mt-1 flex gap-3">
      {YES_NO.map(o => (
        <label key={"Veggies"+o.value} className="inline-flex items-center gap-1">
          <input type="radio" name="Veggies" checked={q.Veggies===o.value}
                 onChange={() => setQ(prev=>({...prev, Veggies:o.value}))}/>
          <span className="text-slate-700">{o.label}</span>
        </label>
      ))}
    </div>
  </fieldset>

  {/* Heavy alcohol */}
  <fieldset className={field} title="Men >14 drinks/week, Women >7 drinks/week.">
    Heavy alcohol consumption?
    <div className="mt-1 flex gap-3">
      {YES_NO.map(o => (
        <label key={"HvyAlcoholConsump"+o.value} className="inline-flex items-center gap-1">
          <input type="radio" name="HvyAlcoholConsump" checked={q.HvyAlcoholConsump===o.value}
                 onChange={() => setQ(prev=>({...prev, HvyAlcoholConsump:o.value}))}/>
          <span className="text-slate-700">{o.label}</span>
        </label>
      ))}
    </div>
  </fieldset>

  {/* Insurance */}
  <fieldset className={field} title="Any kind of health coverage (insurance/HMO/etc.)?">
    Any health coverage?
    <div className="mt-1 flex gap-3">
      {YES_NO.map(o => (
        <label key={"AnyHealthcare"+o.value} className="inline-flex items-center gap-1">
          <input type="radio" name="AnyHealthcare" checked={q.AnyHealthcare===o.value}
                 onChange={() => setQ(prev=>({...prev, AnyHealthcare:o.value}))}/>
          <span className="text-slate-700">{o.label}</span>
        </label>
      ))}
    </div>
  </fieldset>

  {/* Skipped doctor due to cost */}
  <fieldset className={field} title="In the last 12 months, was there a time you needed a doctor but could not go due to cost?">
    Skipped doctor last year due to cost?
    <div className="mt-1 flex gap-3">
      {YES_NO.map(o => (
        <label key={"NoDocbcCost"+o.value} className="inline-flex items-center gap-1">
          <input type="radio" name="NoDocbcCost" checked={q.NoDocbcCost===o.value}
                 onChange={() => setQ(prev=>({...prev, NoDocbcCost:o.value}))}/>
          <span className="text-slate-700">{o.label}</span>
        </label>
      ))}
    </div>
  </fieldset>

  {/* General health */}
  <label className={field} title="How would you rate your general health?">
    General health
    <select className={input} value={q.GenHlth}
            onChange={(e)=>setQ(prev=>({...prev, GenHlth:Number(e.target.value)}))}>
      {GEN_HEALTH.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
    </select>
  </label>

  {/* Mental health bad days */}
  <label className={field} title="Number of days in the past 30 days when your mental health was not good.">
    Days mental health not good (0–30)
    <input className={input} type="number" min={0} max={30} value={q.MentHlth}
           onChange={(e)=>setQ(prev=>({...prev, MentHlth:Number(e.target.value||0)}))}/>
  </label>

  {/* Physical health bad days */}
  <label className={field} title="Number of days in the past 30 days when your physical health was not good.">
    Days physical health not good (0–30)
    <input className={input} type="number" min={0} max={30} value={q.PhysHlth}
           onChange={(e)=>setQ(prev=>({...prev, PhysHlth:Number(e.target.value||0)}))}/>
  </label>

  {/* Difficulty walking */}
  <fieldset className={field} title="Do you have serious difficulty walking or climbing stairs?">
    Serious difficulty walking/climbing stairs?
    <div className="mt-1 flex gap-3">
      {YES_NO.map(o => (
        <label key={"DiffWalk"+o.value} className="inline-flex items-center gap-1">
          <input type="radio" name="DiffWalk" checked={q.DiffWalk===o.value}
                 onChange={() => setQ(prev=>({...prev, DiffWalk:o.value}))}/>
          <span className="text-slate-700">{o.label}</span>
        </label>
      ))}
    </div>
  </fieldset>

  {/* Sex */}
  <label className={field} title="Sex assigned at birth (dataset coding: 0=female, 1=male).">
    Sex
    <select className={input} value={q.Sex}
            onChange={(e)=>setQ(prev=>({...prev, Sex:Number(e.target.value)}))}>
      <option value={0}>Female</option>
      <option value={1}>Male</option>
    </select>
  </label>

  {/* Age bucket */}
  <label className={field} title="Age category">
    Age group
    <select className={input} value={q.Age}
            onChange={(e)=>setQ(prev=>({...prev, Age:Number(e.target.value)}))}>
      {AGE_OPTIONS.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
    </select>
  </label>

  {/* Education */}
  <label className={field} title="Highest education completed">
    Education
    <select className={input} value={q.Education}
            onChange={(e)=>setQ(prev=>({...prev, Education:Number(e.target.value)}))}>
      {EDU_OPTIONS.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
    </select>
  </label>

  {/* Income */}
  <label className={field} title="Household income range">
    Income
    <select className={input} value={q.Income}
            onChange={(e)=>setQ(prev=>({...prev, Income:Number(e.target.value)}))}>
      {INCOME_OPTIONS.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
    </select>
  </label>

  <div className="sm:col-span-2">
    <button className={btnPrimary} disabled={loading1}>
      {loading1 ? "Predicting..." : "Predict (Questionnaire)"}
    </button>
  </div>
</form>


        {screenRes && (
          <div className="mt-4 rounded-xl bg-blue-50 p-4 ring-1 ring-inset ring-blue-200">
            <p className="text-slate-800">
              Probability (screen): <b>{screenRes.probability.toFixed(3)}</b>
            </p>
            <p className="text-slate-800">
              Label: <b>{screenRes.label}</b>
            </p>
            <div className="mt-3">
              {!showLabs ? (
                <button
                  onClick={() => setShowLabs(true)}
                  className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-blue-700 hover:bg-blue-50"
                >
                  Do the optional lab-based check
                </button>
              ) : (
                <p className="text-sm text-slate-600">
                  You can run the optional lab-based check below (Glucose/Insulin etc.).
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* STEP 2: Labs (optional) */}
      {showLabs && (
        <div className="mt-6 rounded-xl ring-1 ring-slate-200 p-4">
          <div className="mb-3 text-slate-600 text-sm">
            Optional: use lab numbers (if you have them) for a more specific estimate.
          </div>
          <form onSubmit={submitLabs} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Object.entries(labs).map(([k, v]) => (
              <label key={k} className={field}>
                {k}
                <input
                  className={input}
                  type="number"
                  step="any"
                  value={v}
                  onChange={(e) =>
                    setLv(k, e.target.value === "" ? "" : Number(e.target.value))
                  }
                />
              </label>
            ))}
            <div className="sm:col-span-2">
              <button className={btnPrimary} disabled={loading2}>
                {loading2 ? "Predicting..." : "Predict (Labs)"}
              </button>
            </div>
          </form>

          {labRes && (
            <div className="mt-4 rounded-xl bg-indigo-50 p-4 ring-1 ring-inset ring-indigo-200">
              <p className="text-slate-800">
                Probability (labs): <b>{labRes.probability.toFixed(3)}</b>
              </p>
              <p className="text-slate-800">
                Label: <b>{labRes.label}</b>
              </p>
            </div>
          )}
        </div>
      )}

      {err && (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 shadow-sm">
          {err}
        </p>
      )}
    </div>
  );
}