import { useState } from "react";
import { api } from "../lib/api";

export default function AiLogInput({ token, onLogged }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  if (!token) return null; // only when logged in

  const todayISO = new Date().toISOString().slice(0, 10);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    setMsg("");
    setErr("");

    try {
      const res = await api("/ai/ingest", {
        method: "POST",
        token,
        body: {
          text,
          dateISO: todayISO,
        },
      });

      setMsg(
        `Saved: ${res.meals_added} meals, ${res.activities_added} activities for ${res.dateISO}.`
      );
      setText("");

      // Let parent refresh CoachCard / TodayProgress if it wants
      if (onLogged) {
        onLogged(res);
      }
    } catch (e) {
      setErr(e.message || "Failed to log using AI.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 rounded-2xl bg-white p-5 shadow ring-1 ring-slate-100">
      <h3 className="text-lg font-semibold text-slate-900">
        Quick Log with AI
      </h3>
      <p className="mt-1 text-xs text-slate-500">
        Type what you ate and what exercise you did today in normal language. 
        We&apos;ll estimate calories and activity and update your dashboard.
      </p>

      <form onSubmit={handleSubmit} className="mt-3 space-y-3">
        <textarea
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          rows={4}
          placeholder={`Example:\nBreakfast: 2 idli with sambar and tea with sugar.\nLunch: rice, chicken curry, salad.\nEvening: Milo packet.\nExercise: 30 min brisk walk, 20 min gym.`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={loading}
        />
        <div className="flex items-center justify-between">
          <button
            type="submit"
            disabled={loading || !text.trim()}
            className="inline-flex items-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {loading ? "Analyzing..." : "Log Today with AI"}
          </button>
          <span className="text-[10px] text-slate-400">
            Uses Gemini to estimate; values are approximate.
          </span>
        </div>
      </form>

      {msg && (
        <div className="mt-2 text-xs text-emerald-600">
          {msg}
        </div>
      )}
      {err && (
        <div className="mt-2 text-xs text-red-600">
          {err}
        </div>
      )}
    </div>
  );
}
