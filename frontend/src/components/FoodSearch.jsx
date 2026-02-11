import { useEffect, useState } from "react";
import { api } from "../lib/api";

export default function FoodSearch({ onSelect }) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const h = setTimeout(() => {
      if (q.trim().length >= 2) search();
      else setItems([]);
    }, 350);
    return () => clearTimeout(h);
  }, [q]);

  async function search() {
    try {
      setLoading(true); setErr("");
      const r = await api(`/nutrition/search?q=${encodeURIComponent(q)}`);
      setItems(r.items || []);
    } catch (e) { setErr(e.message || "Search failed"); }
    finally { setLoading(false); }
  }

  async function pick(fdcId) {
    try {
      const r = await api(`/nutrition/food/${fdcId}`);
      onSelect?.({
        fdcId,
        description: r.description,
        serving: r.serving,
        macros: r.macros_per_serving
      });
    } catch (e) { setErr(e.message || "Load failed"); }
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          className="pm-input pl-10"
          placeholder="Search foods (e.g., oats, apple, chicken)…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-pm-accent/30 border-t-pm-accent" />
          Searching…
        </div>
      )}

      {err && <p className="text-sm text-red-400">{err}</p>}

      {items.length > 0 && (
        <ul className="max-h-64 overflow-auto rounded-xl bg-white/[0.03] ring-1 ring-white/[0.06] divide-y divide-white/[0.04]">
          {items.map(it => (
            <li key={it.fdcId}>
              <button
                onClick={() => pick(it.fdcId)}
                className="w-full px-4 py-3 text-left transition-colors hover:bg-white/[0.04]"
                title="Select"
              >
                <div className="text-sm font-medium text-white">{it.description}</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {it.dataType}{it.brandOwner ? ` • ${it.brandOwner}` : ""}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
