import { useState, useEffect } from "react";
import { api } from "../lib/api";

export default function Profile({ token, user, onUpdate }) {
  const [age, setAge] = useState(user?.age ?? "");
  const [sex, setSex] = useState(user?.sex ?? "other");
  const [heightCm, setHeightCm] = useState(user?.heightCm ?? "");
  const [weightKg, setWeightKg] = useState(user?.weightKg ?? "");
  const [msg, setMsg] = useState("");

  async function save(e){
    e.preventDefault();
    const body = {
      ...(age ? {age: Number(age)} : {}),
      ...(sex ? {sex} : {}),
      ...(heightCm ? {heightCm: Number(heightCm)} : {}),
      ...(weightKg ? {weightKg: Number(weightKg)} : {}),
    };
    const res = await api("/users/me", { method:"PUT", body, token });
    onUpdate(res.user);
    setMsg("Saved!");
  }

  useEffect(()=>{ setMsg(""); }, [age,sex,heightCm,weightKg]);

  return (
    <form
      onSubmit={save}
      className="mx-auto mt-6 max-w-md rounded-2xl bg-white/95 p-6 shadow-xl ring-1 ring-slate-200/70 backdrop-blur-sm"
    >
      <h2 className="mb-3 text-2xl font-semibold tracking-tight text-slate-900">
        <span className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
          Profile
        </span>
      </h2>

      <input
        className="mb-2 w-full rounded-xl border border-slate-300/80 bg-slate-50 px-3 py-2 text-slate-900 placeholder-slate-400 shadow-sm transition hover:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500"
        placeholder="Age"
        type="number"
        value={age}
        onChange={e=>setAge(e.target.value)}
      />

      <select
        className="mb-2 w-full rounded-xl border border-slate-300/80 bg-slate-50 px-3 py-2 text-slate-900 shadow-sm transition hover:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500"
        value={sex}
        onChange={e=>setSex(e.target.value)}
      >
        <option value="other">Sex: other</option>
        <option value="male">Sex: male</option>
        <option value="female">Sex: female</option>
      </select>

      <input
        className="mb-2 w-full rounded-xl border border-slate-300/80 bg-slate-50 px-3 py-2 text-slate-900 placeholder-slate-400 shadow-sm transition hover:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500"
        placeholder="Height (cm)"
        type="number"
        value={heightCm}
        onChange={e=>setHeightCm(e.target.value)}
      />

      <input
        className="mb-3 w-full rounded-xl border border-slate-300/80 bg-slate-50 px-3 py-2 text-slate-900 placeholder-slate-400 shadow-sm transition hover:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500"
        placeholder="Weight (kg)"
        type="number"
        value={weightKg}
        onChange={e=>setWeightKg(e.target.value)}
      />

      <button
        className="w-full rounded-xl bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-600 px-4 py-2 font-medium text-white shadow-md transition hover:from-blue-700 hover:via-sky-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Save
      </button>

      {msg && (
        <p className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 shadow-sm">
          {msg}
        </p>
      )}
    </form>
  );
}
