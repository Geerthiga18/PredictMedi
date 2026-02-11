import { useState } from "react";
import { api } from "../lib/api";

const YES_NO = [
  { label: "No", value: 0 },
  { label: "Yes", value: 1 },
];

const SEX = [[0, "Female"], [1, "Male"]];
const CP = [[0, "Typical angina"], [1, "Atypical angina"], [2, "Non-anginal chest pain"], [3, "No chest pain (asymptomatic)"]];
const RESTECG = [[0, "Normal ECG"], [1, "ST–T wave abnormality"], [2, "Left ventricular hypertrophy"]];
const SLOPE = [[0, "Upsloping"], [1, "Flat"], [2, "Downsloping"]];
const THAL = [[1, "Normal"], [2, "Fixed defect"], [3, "Reversible defect"]];

function riskBand(p) {
  if (p >= 0.7)
    return { label: "Very high chance", bg: "bg-red-500/10", text: "text-red-400", ring: "ring-red-500/20", bar: "bg-red-500" };
  if (p >= 0.5)
    return { label: "High chance", bg: "bg-orange-500/10", text: "text-orange-400", ring: "ring-orange-500/20", bar: "bg-orange-500" };
  if (p >= 0.2)
    return { label: "Moderate chance", bg: "bg-amber-500/10", text: "text-amber-400", ring: "ring-amber-500/20", bar: "bg-amber-500" };
  return { label: "Low chance", bg: "bg-pm-accent/10", text: "text-pm-accent", ring: "ring-pm-accent/20", bar: "bg-pm-accent" };
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

export default function HeartCheck({ token }) {
  const [f, setF] = useState({
    age: 52, sex: 1, cp: 2, trestbps: 130, chol: 220,
    fbs: 0, restecg: 0, thalach: 160, exang: 0,
    oldpeak: 1.0, slope: 1, ca: 0, thal: 2,
  });

  const [res, setRes] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setF((prev) => ({ ...prev, [k]: v }));

  async function submit(e) {
    e.preventDefault();
    setErr(""); setRes(null); setLoading(true);
    try {
      const out = await api("/ml/heart/predict", { method: "POST", token, body: { features: f, top_k: 5 } });
      setRes(out);
    } catch (e) {
      setErr(e.message || "Prediction failed");
    } finally { setLoading(false); }
  }

  const prob = typeof res?.probability === "number" ? res.probability : null;
  const band = prob != null ? riskBand(prob) : null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="glass-card p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-rose-400">
          Risk Tools
        </p>
        <h2 className="mt-1 text-2xl md:text-3xl font-bold text-white">
          Heart Disease Risk Checker
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Enter basic clinical details to see an estimated risk based on the
          UCI Heart dataset model. This is only a decision support tool.
        </p>
      </div>

      {/* Form */}
      <div className="glass-card p-6">
        <form onSubmit={submit} className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">Age (years)</label>
            <input className="pm-input" type="number" min={18} max={95} value={f.age} onChange={(e) => set("age", Number(e.target.value || 0))} />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">Sex</label>
            <select className="pm-input" value={f.sex} onChange={(e) => set("sex", Number(e.target.value))}>
              {SEX.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">Chest Pain Type</label>
            <select className="pm-input" value={f.cp} onChange={(e) => set("cp", Number(e.target.value))}>
              {CP.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">Resting BP (mmHg)</label>
            <input className="pm-input" type="number" min={70} max={250} value={f.trestbps} onChange={(e) => set("trestbps", Number(e.target.value || 0))} />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">Cholesterol (mg/dL)</label>
            <input className="pm-input" type="number" min={100} max={700} value={f.chol} onChange={(e) => set("chol", Number(e.target.value || 0))} />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">Fasting blood sugar &gt; 120 mg/dL?</label>
            <Toggle name="fbs" options={YES_NO} value={f.fbs} onChange={(v) => set("fbs", v)} />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">Resting ECG</label>
            <select className="pm-input" value={f.restecg} onChange={(e) => set("restecg", Number(e.target.value))}>
              {RESTECG.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">Max Heart Rate (bpm)</label>
            <input className="pm-input" type="number" min={60} max={230} value={f.thalach} onChange={(e) => set("thalach", Number(e.target.value || 0))} />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-slate-400">Exercise-induced chest pain?</label>
            <Toggle name="exang" options={YES_NO} value={f.exang} onChange={(v) => set("exang", v)} />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">ST Depression (oldpeak)</label>
            <input className="pm-input" type="number" step="0.1" min={0} max={10} value={f.oldpeak} onChange={(e) => set("oldpeak", Number(e.target.value || 0))} />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">ST Segment Slope</label>
            <select className="pm-input" value={f.slope} onChange={(e) => set("slope", Number(e.target.value))}>
              {SLOPE.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400"># Vessels by Fluoroscopy (0–3)</label>
            <input className="pm-input" type="number" min={0} max={3} value={f.ca} onChange={(e) => set("ca", Number(e.target.value || 0))} />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">Thallium Test (thal)</label>
            <select className="pm-input" value={f.thal} onChange={(e) => set("thal", Number(e.target.value))}>
              {THAL.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
            </select>
          </div>

          <div className="md:col-span-2 mt-1">
            <button className="pm-btn" disabled={loading}>
              {loading ? (
                <><span className="h-4 w-4 animate-spin rounded-full border-2 border-pm-dark/30 border-t-pm-dark" /> Predicting…</>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  Predict Heart Risk
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {err && (
        <div className="glass-card p-4 bg-red-500/5 text-sm text-red-400 ring-1 ring-red-500/15 animate-slide-up">
          {err}
        </div>
      )}

      {/* Result */}
      {prob != null && band && (
        <div className={`glass-card p-6 ${band.bg} ring-1 ${band.ring} animate-slide-up`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className={`text-lg font-bold ${band.text}`}>{band.label}</p>
              <p className="text-sm text-slate-400 mt-1">
                {(prob * 100).toFixed(1)}% <span className="text-xs opacity-70">(model estimate)</span>
              </p>
            </div>
          </div>

          {/* Probability bar */}
          <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-white/5">
            <div
              className={`h-3 rounded-full ${band.bar} animate-bar-fill`}
              style={{ "--bar-width": `${Math.max(4, Math.min(96, prob * 100))}%`, width: `${Math.max(4, Math.min(96, prob * 100))}%` }}
            />
          </div>

          <p className="mt-4 text-sm text-slate-300">{adviceText(prob)}</p>
          <p className="mt-2 text-[10px] text-slate-500">
            This tool does not diagnose. Always correlate with symptoms, ECG, labs, and clinical judgment.
          </p>
        </div>
      )}

      {/* Contributing factors */}
      {res?.top_factors?.length ? (
        <div className="glass-card p-6 animate-slide-up">
          <h3 className="text-lg font-bold text-white mb-4">
            Top Contributing Factors
          </h3>
          <div className="space-y-3 stagger-children">
            {res.top_factors.map((t, i) => {
              const maxContrib = Math.max(...res.top_factors.map(f => Math.abs(f.contribution)));
              const barWidth = maxContrib > 0 ? (Math.abs(t.contribution) / maxContrib) * 100 : 0;
              return (
                <div key={i} className="animate-slide-in-right">
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <code className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-slate-300 ring-1 ring-white/[0.06]">
                      {t.feature}
                    </code>
                    <span className="text-xs text-slate-400">
                      contribution{" "}
                      <span className="font-semibold text-pm-accent">{Number(t.contribution).toFixed(3)}</span>
                      <span className="ml-1 text-slate-500">(z={Number(t.zvalue).toFixed(3)})</span>
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-pm-accent to-pm-cyan animate-bar-fill"
                      style={{ "--bar-width": `${barWidth}%`, width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        res && (
          <p className="text-xs text-slate-500 text-center">
            No explanation details available for this prediction.
          </p>
        )
      )}
    </div>
  );
}
