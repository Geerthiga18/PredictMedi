// frontend/src/components/FoodSearch.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../lib/api";

const inputCls = "w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500";
const pill = "inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600";
const card = "rounded-2xl bg-white p-4 shadow ring-1 ring-slate-100";

export default function FoodSearch({ onSelect }) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState([]);
  const [err, setErr] = useState("");
  const abortRef = useRef(null);

  // simple debounce
  const debouncedQ = useDebounce(q, 300);

  useEffect(() => {
    if (!debouncedQ || debouncedQ.length < 2) { setList([]); return; }
    (async () => {
      setLoading(true); setErr("");
      try {
        abortRef.current?.abort?.();
        const ctrl = new AbortController();
        abortRef.current = ctrl;
        const data = await api(`/nutrition/search?q=${encodeURIComponent(debouncedQ)}`, { signal: ctrl.signal });
        setList(data.items || []);
      } catch (e) {
        if (e.name !== "AbortError") setErr(e.message || "Search failed");
      } finally { setLoading(false); }
    })();
  }, [debouncedQ]);

  async function pick(item) {
    try {
      const detail = await api(`/nutrition/food/${item.fdcId}`);
      // normalized object we pass upward
      onSelect?.({
        fdcId: detail.fdcId,
        description: detail.description,
        serving: detail.serving,                   // {amount, unit}
        macros: detail.macros_per_serving,        // {kcal, protein_g, carb_g, fat_g, fiber_g, sugar_g, sodium_mg}
        raw: detail.raw
      });
    } catch (e) {
      setErr(e.message || "Failed to load details");
    }
  }

  return (
    <div className={card}>
      <label className="block text-sm text-slate-700">Search foods</label>
      <input className={inputCls} value={q} onChange={e=>setQ(e.target.value)} placeholder="e.g. oats, apple, chicken breast" />
      {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
      {loading && <p className="mt-2 text-sm text-slate-500">Searching…</p>}
      {!!list.length && (
        <ul className="mt-3 divide-y divide-slate-100">
          {list.map(f => (
            <li key={f.fdcId} className="py-2 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-800">{f.description}</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {f.brandOwner && <span className={pill}>{f.brandOwner}</span>}
                  {f.dataType && <span className={pill}>{f.dataType}</span>}
                  {(f.servingSize && f.servingSizeUnit) && <span className={pill}>{f.servingSize} {f.servingSizeUnit}</span>}
                </div>
              </div>
              <button
                onClick={() => pick(f)}
                className="shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700"
              >
                Select
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// tiny debounce hook
function useDebounce(val, delay=300) {
  const [v, setV] = useState(val);
  useEffect(() => {
    const t = setTimeout(() => setV(val), delay);
    return () => clearTimeout(t);
  }, [val, delay]);
  return v;
}
