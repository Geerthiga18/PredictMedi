import { useState } from "react";
import { api } from "../lib/api";
import { Link } from "react-router-dom";

export default function Register({ onAuth }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("other");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      const body = {
        name, email, password,
        age: age ? Number(age) : null,
        sex,
        heightCm: heightCm ? Number(heightCm) : null,
        weightKg: weightKg ? Number(weightKg) : null,
      };
      const res = await api("/auth/register", { method: "POST", body });
      onAuth(res.token, res.user);
    } catch (e) {
      setErr(e.message || "Register failed");
    } finally { setLoading(false); }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md animate-slide-up">
        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-pm-accent to-pm-cyan shadow-lg shadow-pm-accent/20">
            <span className="text-xl font-extrabold text-pm-dark">P</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="mt-1 text-sm text-slate-400">Get started with PredictMedi</p>
        </div>

        {/* Step indicator */}
        <div className="mb-6 flex items-center justify-center gap-3">
          {[1, 2].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => s === 1 && setStep(1)}
              className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                step === s
                  ? "bg-pm-accent/15 text-pm-accent ring-1 ring-pm-accent/30"
                  : step > s
                  ? "bg-pm-accent/5 text-pm-accent/60"
                  : "bg-white/5 text-slate-500"
              }`}
            >
              <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                step === s ? "bg-pm-accent text-pm-dark" : step > s ? "bg-pm-accent/30 text-pm-accent" : "bg-white/10 text-slate-500"
              }`}>
                {step > s ? "✓" : s}
              </span>
              {s === 1 ? "Account" : "Body metrics"}
            </button>
          ))}
        </div>

        {/* Card */}
        <div className="glass-card p-6 md:p-8">
          <form onSubmit={submit} className="space-y-4">
            {step === 1 && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">Name</label>
                  <input placeholder="Your name" value={name} onChange={e => setName(e.target.value)} className="pm-input" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">Email</label>
                  <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} className="pm-input" autoComplete="email" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">Password</label>
                  <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="pm-input" autoComplete="new-password" />
                </div>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="pm-btn w-full mt-2"
                >
                  Continue →
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 animate-fade-in">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">Age</label>
                    <input placeholder="25" type="number" min="1" max="120" value={age} onChange={e => setAge(e.target.value)} className="pm-input" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">Sex</label>
                    <select value={sex} onChange={e => setSex(e.target.value)} className="pm-input">
                      <option value="other">Other</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">Height (cm)</label>
                    <input placeholder="170" type="number" min="80" max="250" value={heightCm} onChange={e => setHeightCm(e.target.value)} className="pm-input" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">Weight (kg)</label>
                    <input placeholder="70" type="number" min="20" max="300" value={weightKg} onChange={e => setWeightKg(e.target.value)} className="pm-input" />
                  </div>
                </div>

                <div className="flex gap-3 mt-2">
                  <button type="button" onClick={() => setStep(1)} className="pm-btn-secondary flex-1">
                    ← Back
                  </button>
                  <button type="submit" disabled={loading} className="pm-btn flex-1">
                    {loading ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-pm-dark/30 border-t-pm-dark" />
                        Creating…
                      </>
                    ) : (
                      "Create account"
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>

          {err && (
            <div className="mt-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400 ring-1 ring-red-500/20 animate-fade-in">
              {err}
            </div>
          )}
        </div>

        {/* Footer link */}
        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-pm-accent hover:text-pm-cyan transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
