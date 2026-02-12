import { useEffect, useState } from "react";
import FoodSearch from "../components/FoodSearch";
import AiLogInput from "../components/AiLogInput";
import { api } from "../lib/api";

export default function MealsLog({ token }) {
  const [today, setToday] = useState(() => new Date().toISOString().slice(0,10));
  const [items, setItems] = useState([]);
  const [picked, setPicked] = useState(null);
  const [grams, setGrams] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!token) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today, token]);

  async function load() {
    try {
      const r = await api(`/meals/log?date=${today}`, { token });
      setItems(r.items || []);
    } catch (e) { /* ignore for now */ }
  }

  function addPicked() {
    if (!picked) return;
    const g = Number(grams) || (picked.serving?.unit?.toLowerCase()==="g" ? picked.serving.amount : 100);
    const scale = (() => {
      const amt = Number(picked.serving?.amount || 100);
      return (picked.serving?.unit?.toLowerCase() === "g" && amt > 0) ? (g / amt) : 1;
    })();

    const m = picked.macros || {};
    const row = {
      desc: picked.description,
      grams: g,
      kcal: roundSafe(m.kcal, scale),
      protein_g: roundSafe(m.protein_g, scale),
      carb_g: roundSafe(m.carb_g, scale),
      fat_g: roundSafe(m.fat_g, scale),
      fiber_g: roundSafe(m.fiber_g, scale),
      sugar_g: roundSafe(m.sugar_g, scale),
      sodium_mg: roundSafe(m.sodium_mg, scale),
      fdcId: picked.fdcId
    };
    setItems(prev => [...prev, row]);
    setPicked(null); setGrams("");
  }

  async function saveDay() {
    try {
      const payload = {
        date: today,
        items: items.map(x => ({
          name: x.desc,
          grams: x.grams,
          kcal: x.kcal ?? null,
          protein_g: x.protein_g ?? null,
          carb_g: x.carb_g ?? null,
          fat_g: x.fat_g ?? null,
          fiber_g: x.fiber_g ?? null,
          sugar_g: x.sugar_g ?? null,
          sodium_mg: x.sodium_mg ?? null,
          fdcId: x.fdcId ?? null
        }))
      };
      await api("/meals/log", { method:"POST", token, body: payload });
      setMsg("Saved!");
      setTimeout(()=>setMsg(""), 2000);
    } catch (e) {
      setMsg(e.message || "Save failed");
    }
  }

  function remove(i) { setItems(prev => prev.filter((_,idx)=>idx!==i)); }

  function handleAiLogged(res) {
    if (res.parsed?.meals) {
       const newMeals = res.parsed.meals.map(m => ({
          desc: m.name,
          grams: m.grams || 100, // Default to 100g if unknown, or maybe "1 serving" but grams expects number usually? Code displays it.
          kcal: m.kcal,
          carb_g: m.carb_g,
          protein_g: m.protein_g,
          fat_g: m.fat_g,
          sugar_g: m.sugar_g,
          fiber_g: m.fiber_g,
          sodium_mg: m.sodium_mg,
          fdcId: null
       }));
       setItems(prev => [...prev, ...newMeals]);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="glass-card p-5 flex flex-wrap items-center gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-pm-accent">Nutrition</p>
          <h2 className="text-xl font-bold text-white">Meals for</h2>
        </div>
        <input
          type="date"
          className="pm-input w-auto"
          value={today}
          onChange={e=>setToday(e.target.value)}
        />
        <div className="ml-auto">
          {msg && (
            <span className={`rounded-full px-3 py-1.5 text-sm font-medium ring-1 animate-slide-up ${
              msg === "Saved!"
                ? "bg-pm-accent/10 text-pm-accent ring-pm-accent/20"
                : "bg-red-500/10 text-red-400 ring-red-500/20"
            }`}>
              {msg}
            </span>
          )}
        </div>
      </div>

      {/* AI Log Input */}
      <AiLogInput token={token} onLogged={handleAiLogged} />

      {/* Picker */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="glass-card p-5">
          <h3 className="font-semibold text-white">Search Food</h3>
          <p className="mt-1 text-sm text-slate-400">Find items and pick a serving.</p>
          <div className="mt-3">
            <FoodSearch onSelect={(item)=>setPicked(item)} />
          </div>
        </div>

        <div className="glass-card p-5">
          <h3 className="font-semibold text-white">Add Selected</h3>
          {!picked && <p className="mt-3 text-sm text-slate-500">Choose a food on the left.</p>}
          {picked && (
            <div className="mt-3 space-y-3 animate-fade-in">
              <p className="text-sm font-medium text-white">{picked.description}</p>
              <p className="text-xs text-slate-400">
                Default serving: {picked.serving?.amount} {picked.serving?.unit}
              </p>
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">Grams</label>
                  <input
                    className="pm-input"
                    type="number"
                    min="0"
                    step="1"
                    value={grams}
                    onChange={e=>setGrams(e.target.value)}
                    placeholder={picked.serving?.unit?.toLowerCase()==="g" ? String(picked.serving.amount) : "100"}
                  />
                </div>
                <button onClick={addPicked} className="pm-btn">
                  Add
                </button>
              </div>
              <MacroPreview macros={picked.macros} />
            </div>
          )}
        </div>
      </div>

      {/* Day list */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-white">Logged Items</h3>
          <button onClick={saveDay} className="pm-btn">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Save Day
          </button>
        </div>

        {!items.length && <p className="mt-4 text-sm text-slate-500">No items yet.</p>}

        {!!items.length && (
          <div className="mt-4 overflow-x-auto rounded-xl ring-1 ring-white/[0.06]">
            <table className="min-w-full divide-y divide-white/[0.06] text-left text-sm">
              <thead>
                <tr className="bg-white/[0.02]">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Food</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">g</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">kcal</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Carb</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Protein</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Fat</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {items.map((x,i)=>(
                  <tr key={i} className="transition-colors hover:bg-white/[0.03]">
                    <td className="px-4 py-3 text-sm text-white font-medium">{x.desc}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">{x.grams}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">{fmt(x.kcal)}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">{fmt(x.carb_g)}g</td>
                    <td className="px-4 py-3 text-sm text-slate-300">{fmt(x.protein_g)}g</td>
                    <td className="px-4 py-3 text-sm text-slate-300">{fmt(x.fat_g)}g</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={()=>remove(i)}
                        className="rounded-lg px-2.5 py-1 text-xs font-medium text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function MacroPreview({ macros }) {
  if (!macros) return null;
  const items = [
    { label: "kcal", value: fmt(macros.kcal), color: "text-pm-cyan" },
    { label: "Carb", value: `${fmt(macros.carb_g)}g`, color: "text-amber-400" },
    { label: "Protein", value: `${fmt(macros.protein_g)}g`, color: "text-pm-purple" },
    { label: "Fat", value: `${fmt(macros.fat_g)}g`, color: "text-rose-400" },
    { label: "Fiber", value: `${fmt(macros.fiber_g)}g`, color: "text-pm-accent" },
    { label: "Sugar", value: `${fmt(macros.sugar_g)}g`, color: "text-orange-400" },
  ];
  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map(item => (
        <div key={item.label} className="rounded-lg bg-white/[0.03] px-3 py-2 text-center ring-1 ring-white/[0.06]">
          <div className="text-[10px] uppercase tracking-wider text-slate-500">{item.label}</div>
          <div className={`text-sm font-semibold ${item.color}`}>{item.value}</div>
        </div>
      ))}
    </div>
  );
}

function fmt(v) { return v==null ? "—" : Math.round(v); }
function roundSafe(v, scale) { return v==null ? null : Math.round(v*scale); }
