import { useState } from "react";
import { api } from "../lib/api";

export default function Login({ onAuth }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      const res = await api("/auth/login", { method: "POST", body: { email, password } });
      onAuth(res.token, res.user);
    } catch (e) {
      setErr(e.message || "Login failed");
    } finally { setLoading(false); }
  }

  return (
    <div
      style={{ maxWidth: 360, margin: "40px auto" }}
      className="rounded-2xl bg-white/95 p-6 shadow-xl ring-1 ring-slate-200/70 backdrop-blur-sm"
    >
      <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
        <span className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
          Login
        </span>
      </h2>

      <form onSubmit={submit} className="mt-4 space-y-3">
        <input
          placeholder="Email"
          value={email}
          onChange={e=>setEmail(e.target.value)}
          style={{width:"100%",marginBottom:8}}
          className="w-full rounded-xl border border-slate-300/80 bg-slate-50 px-3 py-2 text-slate-900 placeholder-slate-400 shadow-sm transition hover:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500"
        />
        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={e=>setPassword(e.target.value)}
          style={{width:"100%",marginBottom:8}}
          className="w-full rounded-xl border border-slate-300/80 bg-slate-50 px-3 py-2 text-slate-900 placeholder-slate-400 shadow-sm transition hover:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500"
        />

        <button
          disabled={loading}
          className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-600 px-4 py-2 font-medium text-white shadow-md transition hover:from-blue-700 hover:via-sky-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "..." : "Login"}
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
