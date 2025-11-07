import { useState } from "react";
import { api } from "../lib/api";

export default function AiLogInput({ token, onLogged }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  if (!token) return null;

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
        `Added ${res.meals_added} meal${res.meals_added === 1 ? "" : "s"} and ${
          res.activities_added
        } activit${res.activities_added === 1 ? "y" : "ies"} for ${res.dateISO}.`
      );
      setText("");
      onLogged?.(res);
    } catch (e) {
      setErr(e.message || "Failed to log using AI.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-50 via-white to-slate-50 p-4 sm:p-5 ring-1 ring-sky-100/80 shadow-sm">
      <div className="pointer-events-none absolute -right-6 top-0 h-16 w-16 rounded-full bg-sky-400/15 blur-2xl" />

      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-sky-500 text-xs font-bold text-white shadow-md shadow-sky-400/40">
          AI
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Quick Log with AI
          </h3>
          <p className="text-[10px] text-slate-500">
            Paste your day in normal language. We&apos;ll parse meals &
            workouts, estimate calories, and update your dashboard.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-3 space-y-3">
        <textarea
          className="w-full rounded-2xl border border-slate-200/90 bg-white/95 px-3 py-2 text-xs sm:text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
          rows={4}
          placeholder={
            "Example:\nBreakfast: 2 idli with sambar, tea with 2 tsp sugar.\nLunch: rice, chicken curry, salad.\nSnack: Milo packet.\nExercise: 30 min brisk walk, 15 min light weights."
          }
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={loading}
        />
        <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="submit"
            disabled={loading || !text.trim()}
            className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-500 px-4 py-1.5 text-xs sm:text-sm font-semibold text-white shadow-md transition hover:shadow-lg hover:from-sky-700 hover:via-blue-700 hover:to-indigo-600 disabled:cursor-not-allowed disabled:bg-slate-300`}
          >
            {loading ? (
              <>
                <span className="h-3 w-3 animate-spin rounded-full border-[2px] border-white/40 border-t-transparent" />
                Analyzing...
              </>
            ) : (
              <>
                <span>Log today with AI</span>
              </>
            )}
          </button>
          <span className="text-[9px] text-slate-400">
            Powered by Gemini. Estimates are approximate, not medical advice.
          </span>
        </div>
      </form>

      {msg && (
        <div className="mt-2 rounded-2xl bg-emerald-50 px-3 py-2 text-[10px] text-emerald-700 ring-1 ring-emerald-100">
          {msg}
        </div>
      )}
      {err && (
        <div className="mt-2 rounded-2xl bg-rose-50 px-3 py-2 text-[10px] text-rose-700 ring-1 ring-rose-100">
          {err}
        </div>
      )}
    </div>
  );
}
