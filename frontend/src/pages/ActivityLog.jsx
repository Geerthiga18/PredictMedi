import { useEffect, useState } from "react";
import { api } from "../lib/api";

export default function ActivityLog({ token }) {
  const today = new Date().toISOString().slice(0,10);
  const [date, setDate] = useState(today);
  const [minutes, setMinutes] = useState(30);
  const [steps, setSteps] = useState("");
  const [type, setType] = useState("walk");
  const [logs, setLogs] = useState([]);
  const [msg, setMsg] = useState("");

  async function load() {
    try {
      const res = await api("/activity/logs", { token });
      setLogs(res.logs);
    } catch (e) { setMsg(e.message); }
  }
  useEffect(()=>{ load(); },[]);

  async function submit(e) {
    e.preventDefault();
    setMsg("");
    try {
      await api("/activity/log/upsert", {
        method: "POST",
        token,
        body: { date, minutes: Number(minutes), steps: steps ? Number(steps) : undefined, type }
      });
      setMsg("Saved!");
      load();
    } catch (e) { setMsg(e.message); }
  }

  return (
    <div
      style={{ maxWidth: 700, margin: "20px auto", padding: 12 }}
      className="rounded-2xl bg-white/95 p-6 shadow-xl ring-1 ring-slate-200/70 backdrop-blur-sm"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
          <span className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            Log Activity
          </span>
        </h2>
      </div>

      <form
        onSubmit={submit}
        style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr" }}
        className="gap-3"
      >
        <input
          type="date"
          value={date}
          onChange={e=>setDate(e.target.value)}
          className="w-full rounded-xl border border-slate-300/80 bg-slate-50 px-3 py-2 text-slate-900 shadow-sm transition hover:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500"
        />
        <input
          type="number"
          placeholder="minutes"
          value={minutes}
          onChange={e=>setMinutes(e.target.value)}
          className="w-full rounded-xl border border-slate-300/80 bg-slate-50 px-3 py-2 text-slate-900 placeholder-slate-400 shadow-sm transition hover:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500"
        />
        <input
          type="number"
          placeholder="steps (optional)"
          value={steps}
          onChange={e=>setSteps(e.target.value)}
          className="w-full rounded-xl border border-slate-300/80 bg-slate-50 px-3 py-2 text-slate-900 placeholder-slate-400 shadow-sm transition hover:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500"
        />
        <input
          placeholder="type (walk/run/gym...)"
          value={type}
          onChange={e=>setType(e.target.value)}
          className="w-full rounded-xl border border-slate-300/80 bg-slate-50 px-3 py-2 text-slate-900 placeholder-slate-400 shadow-sm transition hover:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500"
        />
        <button
          style={{ gridColumn: "1 / -1" }}
          className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-600 px-4 py-2 font-medium text-white shadow-md transition hover:from-blue-700 hover:via-sky-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Save
        </button>
      </form>

      {msg && (
        <p className="mt-3 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800 shadow-sm">
          {msg}
        </p>
      )}

      <h3 className="mt-6 text-lg font-semibold text-slate-900">Recent</h3>

      <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-semibold text-slate-700">Date</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-slate-700">Minutes</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-slate-700">Steps</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-slate-700">Type</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {logs.map((r, i) => (
              <tr key={i} className="hover:bg-slate-50/60">
                <td className="px-4 py-2 text-sm text-slate-800">{r.dateISO || r.date}</td>
                <td className="px-4 py-2 text-sm text-slate-800">{r.minutes}</td>
                <td className="px-4 py-2 text-sm text-slate-800">{r.steps ?? ""}</td>
                <td className="px-4 py-2 text-sm">
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-200">
                    {r.type ?? ""}
                  </span>
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-sm text-slate-500" colSpan={4}>
                  No activity logged yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
