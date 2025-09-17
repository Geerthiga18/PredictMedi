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
    <div className="rounded-2xl bg-white p-5 shadow ring-1 ring-slate-100">
      <h3 className="font-semibold">Search foods</h3>
      <input
        className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="e.g., oats, apple, chicken breast"
        value={q}
        onChange={(e)=>setQ(e.target.value)}
      />
      {loading && <p className="mt-2 text-sm text-slate-500">Searching…</p>}
      {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
      <ul className="mt-3 max-h-64 overflow-auto divide-y">
        {(items||[]).map(it => (
          <li key={it.fdcId} className="py-2">
            <button
              onClick={()=>pick(it.fdcId)}
              className="text-left hover:underline"
              title="Select"
            >
              <div className="font-medium">{it.description}</div>
              <div className="text-xs text-slate-500">{it.dataType}{it.brandOwner ? ` • ${it.brandOwner}` : ""}</div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
