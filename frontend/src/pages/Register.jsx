import { useState } from "react";
import { api } from "../lib/api";

export default function Register({ onAuth }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // NEW
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("other"); // "male"|"female"|"other"
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      const body = {
        name, email, password,
        // convert number fields if user typed them
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
    <div
      style={{ maxWidth: 420, margin: "40px auto" }}
      className="rounded-2xl bg-white/95 p-6 shadow-xl ring-1 ring-slate-200/70 backdrop-blur-sm"
    >
      
      <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
        <span className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
          Create account
        </span>
      </h2>

      <form onSubmit={submit} className="mt-4 space-y-3">
        <input
          placeholder="Name"
          value={name}
          onChange={e=>setName(e.target.value)}
          style={{width:"100%",marginBottom:8}}
          className="w-full rounded-xl border border-slate-300/80 bg-slate-50 px-3 py-2 text-slate-900 placeholder-slate-400 shadow-sm transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/60 hover:border-slate-400"
        />
        <input
          placeholder="Email"
          value={email}
          onChange={e=>setEmail(e.target.value)}
          style={{width:"100%",marginBottom:8}}
          className="w-full rounded-xl border border-slate-300/80 bg-slate-50 px-3 py-2 text-slate-900 placeholder-slate-400 shadow-sm transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/60 hover:border-slate-400"
        />
        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={e=>setPassword(e.target.value)}
          style={{width:"100%",marginBottom:8}}
          className="w-full rounded-xl border border-slate-300/80 bg-slate-50 px-3 py-2 text-slate-900 placeholder-slate-400 shadow-sm transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/60 hover:border-slate-400"
        />

        {/* NEW fields */}
        <input
          placeholder="Age"
          type="number" min="1" max="120"
          value={age}
          onChange={e=>setAge(e.target.value)}
          style={{width:"100%",marginBottom:8}}
          className="w-full rounded-xl border border-slate-300/80 bg-slate-50 px-3 py-2 text-slate-900 placeholder-slate-400 shadow-sm transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/60 hover:border-slate-400"
        />
        <select
          value={sex}
          onChange={e=>setSex(e.target.value)}
          style={{width:"100%",marginBottom:8}}
          className="w-full rounded-xl border border-slate-300/80 bg-slate-50 px-3 py-2 text-slate-900 shadow-sm transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/60 hover:border-slate-400 appearance-none"
        >
          <option value="other">Sex: other</option>
          <option value="male">Sex: male</option>
          <option value="female">Sex: female</option>
        </select>
        <input
          placeholder="Height (cm)"
          type="number" min="80" max="250"
          value={heightCm}
          onChange={e=>setHeightCm(e.target.value)}
          style={{width:"100%",marginBottom:8}}
          className="w-full rounded-xl border border-slate-300/80 bg-slate-50 px-3 py-2 text-slate-900 placeholder-slate-400 shadow-sm transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/60 hover:border-slate-400"
        />
        <input
          placeholder="Weight (kg)"
          type="number" min="20" max="300"
          value={weightKg}
          onChange={e=>setWeightKg(e.target.value)}
          style={{width:"100%",marginBottom:8}}
          className="w-full rounded-xl border border-slate-300/80 bg-slate-50 px-3 py-2 text-slate-900 placeholder-slate-400 shadow-sm transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/60 hover:border-slate-400"
        />

        <button
          disabled={loading}
          className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-600 px-4 py-2 font-medium text-white shadow-md transition hover:from-blue-700 hover:via-sky-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "..." : "Register"}
        </button>
      </form>

      {err && (
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 shadow-sm">
          {err}
        </p>
      )}
    </div>
  );
}
