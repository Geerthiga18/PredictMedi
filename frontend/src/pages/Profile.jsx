// Profile.jsx
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
      const res = await api("/users/me", {
        method: "PUT",
        body,
        token,
      });
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
    <form
      onSubmit={save}
      className="mx-auto mt-6 max-w-md rounded-2xl bg-white/95 p-6 shadow-xl ring-1 ring-slate-200/70 backdrop-blur-sm"
    >
      <h2 className="mb-3 text-2xl font-semibold tracking-tight text-slate-900">
        Profile
      </h2>

      <input
        className="mb-2 w-full rounded-xl border border-slate-300/80 bg-slate-50 px-3 py-2"
        placeholder="Age"
        type="number"
        value={age}
        onChange={(e) => setAge(e.target.value)}
      />

      <select
        className="mb-2 w-full rounded-xl border border-slate-300/80 bg-slate-50 px-3 py-2"
        value={sex}
        onChange={(e) => setSex(e.target.value)}
      >
        <option value="">Sex</option>
        <option value="male">Male</option>
        <option value="female">Female</option>
        <option value="other">Other</option>
      </select>

      <input
        className="mb-2 w-full rounded-xl border border-slate-300/80 bg-slate-50 px-3 py-2"
        placeholder="Height (cm)"
        type="number"
        value={heightCm}
        onChange={(e) => setHeightCm(e.target.value)}
      />

      <input
        className="mb-3 w-full rounded-xl border border-slate-300/80 bg-slate-50 px-3 py-2"
        placeholder="Weight (kg)"
        type="number"
        value={weightKg}
        onChange={(e) => setWeightKg(e.target.value)}
      />

      <button
        className="w-full rounded-xl bg-blue-600 px-4 py-2 font-medium text-white"
      >
        Save
      </button>

      {msg && (
        <p className="mt-3 text-sm text-emerald-700">
          {msg}
        </p>
      )}
      {err && (
        <p className="mt-3 text-sm text-red-600">
          {err}
        </p>
      )}
    </form>
  );
}
