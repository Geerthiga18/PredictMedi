import { useState, useEffect } from "react";
import { api } from "../lib/api";

export default function Profile({ token, user, onUpdate }) {
  const [age, setAge] = useState(user?.age ?? "");
  const [sex, setSex] = useState(user?.sex ?? "");
  const [heightCm, setHeightCm] = useState(user?.heightCm ?? "");
  const [weightKg, setWeightKg] = useState(user?.weightKg ?? "");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  if (!token) return null;

  async function save(e) {
    e.preventDefault();
    setMsg("");
    setErr("");

    const body = {
      ...(age ? { age: Number(age) } : {}),
      ...(sex ? { sex } : {}),
      ...(heightCm ? { heightCm: Number(heightCm) } : {}),
      ...(weightKg ? { weightKg: Number(weightKg) } : {}),
    };

    try {
      const res = await api("/users/me", { method: "PUT", body, token });
      onUpdate?.(res.user);
      setMsg("Profile updated. Your targets have been recalculated.");
    } catch (e) {
      setErr(e.message || "Failed to save.");
    }
  }

  useEffect(() => {
    setMsg("");
    setErr("");
  }, [age, sex, heightCm, weightKg]);

  return (
    <div className="mx-auto max-w-md">
      <div className="glass-card p-6 md:p-8">
        {/* Avatar */}
        <div className="flex flex-col items-center mb-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-pm-accent to-pm-cyan p-[3px]">
            <div className="flex h-full w-full items-center justify-center rounded-full bg-pm-dark text-2xl font-bold text-pm-accent">
              {(user?.name || user?.email || "U")[0].toUpperCase()}
            </div>
          </div>
          <h2 className="mt-3 text-xl font-bold text-white">
            {user?.name || "Your Profile"}
          </h2>
          <p className="text-sm text-slate-400">{user?.email || ""}</p>
        </div>

        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">Age</label>
              <input className="pm-input" placeholder="25" type="number" value={age} onChange={(e) => setAge(e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">Sex</label>
              <select className="pm-input" value={sex} onChange={(e) => setSex(e.target.value)}>
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">Height (cm)</label>
              <input className="pm-input" placeholder="170" type="number" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">Weight (kg)</label>
              <input className="pm-input" placeholder="70" type="number" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} />
            </div>
          </div>

          <button className="pm-btn w-full mt-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Save Profile
          </button>
        </form>

        {msg && (
          <div className="mt-4 rounded-xl bg-pm-accent/10 px-4 py-3 text-sm text-pm-accent ring-1 ring-pm-accent/20 animate-slide-up">
            {msg}
          </div>
        )}
        {err && (
          <div className="mt-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400 ring-1 ring-red-500/20 animate-slide-up">
            {err}
          </div>
        )}
      </div>
    </div>
  );
}
