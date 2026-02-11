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
        body: { text, dateISO: todayISO },
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
    <div className="glass-card glass-card-hover p-5 md:p-6 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-pm-cyan/10 blur-3xl" />

      <div className="flex items-center gap-3 relative">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-pm-cyan to-pm-accent text-xs font-extrabold text-pm-dark shadow-lg shadow-pm-cyan/20">
          AI
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">
            Quick Log with AI
          </h3>
          <p className="text-xs text-slate-400">
            Paste your day in natural language. We&apos;ll parse meals &amp;
            workouts and update your dashboard.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3 relative">
        <textarea
          className="pm-input min-h-[100px] resize-none"
          rows={4}
          placeholder={
            "Example:\nBreakfast: 2 idli with sambar, tea with 2 tsp sugar.\nLunch: rice, chicken curry, salad.\nExercise: 30 min brisk walk, 15 min light weights."
          }
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={loading}
        />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="submit"
            disabled={loading || !text.trim()}
            className="pm-btn"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-pm-dark/30 border-t-pm-dark" />
                Analyzing…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Log with AI
              </>
            )}
          </button>
          <span className="text-[10px] text-slate-500">
            Powered by Gemini · Estimates are approximate
          </span>
        </div>
      </form>

      {msg && (
        <div className="mt-3 rounded-xl bg-pm-accent/10 px-4 py-2.5 text-sm text-pm-accent ring-1 ring-pm-accent/20 animate-slide-up">
          {msg}
        </div>
      )}
      {err && (
        <div className="mt-3 rounded-xl bg-red-500/10 px-4 py-2.5 text-sm text-red-400 ring-1 ring-red-500/20 animate-slide-up">
          {err}
        </div>
      )}
    </div>
  );
}
