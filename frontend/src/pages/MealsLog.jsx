// frontend/src/pages/MealsLog.jsx
import { useEffect, useState } from "react";
import FoodSearch from "../components/FoodSearch";
import { api } from "../lib/api";

const card = "rounded-2xl bg-white/95 p-5 shadow-xl ring-1 ring-slate-200/70 backdrop-blur-sm";
const input = "w-24 rounded-lg border border-slate-300/80 bg-slate-50 px-2 py-1 text-slate-900 placeholder-slate-400 shadow-sm transition hover:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500";

export default function MealsLog({ token }) {
  const [today, setToday] = useState(() => new Date().toISOString().slice(0,10));
  const [items, setItems] = useState([]); // {desc, grams, kcal, protein_g, carb_g, fat_g, ...}
  const [picked, setPicked] = useState(null); // from FoodSearch
  const [grams, setGrams] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => { load(); }, [today]);

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
      return (picked.serving?.unit?.toLowerCase() === "g" && amt > 0) ? (g / amt) : 1; // assume 1 serving otherwise
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
      setTimeout(()=>setMsg(""), 1500);
    } catch (e) {
      setMsg(e.message || "Save failed");
    }
  }

  function remove(i) { setItems(prev => prev.filter((_,idx)=>idx!==i)); }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className={card}>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            <span className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Meals for
            </span>
          </h2>
          <input
            type="date"
            className="rounded-lg border border-slate-300/80 bg-slate-50 px-2 py-1 text-slate-900 shadow-sm transition hover:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500"
            value={today}
            onChange={e=>setToday(e.target.value)}
          />
          <div className="ml-auto">
            {msg && (
              <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-sm text-emerald-700 shadow-sm">
                {msg}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Picker */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className={card}>
          <h3 className="text-base font-semibold text-slate-900">Search food</h3>
          <p className="mt-1 text-sm text-slate-500">Find items and pick a serving.</p>
          <div className="mt-3">
            <FoodSearch onSelect={(item)=>setPicked(item)} />
          </div>
        </div>

        <div className={card}>
          <h3 className="text-base font-semibold text-slate-900">Add selected</h3>
          {!picked && <p className="mt-2 text-sm text-slate-500">Choose a food on the left.</p>}
          {picked && (
            <>
              <p className="mt-2 text-slate-800">{picked.description}</p>
              <p className="text-sm text-slate-500">
                Default serving: {picked.serving?.amount} {picked.serving?.unit}
              </p>
              <div className="mt-3 flex items-end gap-2">
                <label className="text-sm text-slate-700">
                  Grams
                  <input
                    className={input}
                    type="number"
                    min="0"
                    step="1"
                    value={grams}
                    onChange={e=>setGrams(e.target.value)}
                    placeholder={picked.serving?.unit?.toLowerCase()==="g" ? picked.serving.amount : "100"}
                  />
                </label>
                <button
                  onClick={addPicked}
                  className="rounded-lg bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-600 px-3 py-2 text-white shadow-md transition hover:from-blue-700 hover:via-sky-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Add
                </button>
              </div>
              <MacroPreview macros={picked.macros} />
            </>
          )}
        </div>
      </div>

      {/* Day list */}
      <div className={card}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Logged items</h3>
          <button
            onClick={saveDay}
            className="rounded-lg bg-emerald-600 px-3 py-2 text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            Save Day
          </button>
        </div>

        {!items.length && <p className="mt-3 text-sm text-slate-500">No items yet.</p>}

        {!!items.length && (
          <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 font-semibold text-slate-700">Food</th>
                  <th className="px-4 py-2 font-semibold text-slate-700">g</th>
                  <th className="px-4 py-2 font-semibold text-slate-700">kcal</th>
                  <th className="px-4 py-2 font-semibold text-slate-700">Carb</th>
                  <th className="px-4 py-2 font-semibold text-slate-700">Protein</th>
                  <th className="px-4 py-2 font-semibold text-slate-700">Fat</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {items.map((x,i)=>(
                  <tr key={i} className="hover:bg-slate-50/60">
                    <td className="px-4 py-2 text-slate-800">{x.desc}</td>
                    <td className="px-4 py-2 text-slate-800">{x.grams}</td>
                    <td className="px-4 py-2 text-slate-800">{fmt(x.kcal)}</td>
                    <td className="px-4 py-2 text-slate-800">{fmt(x.carb_g)}g</td>
                    <td className="px-4 py-2 text-slate-800">{fmt(x.protein_g)}g</td>
                    <td className="px-4 py-2 text-slate-800">{fmt(x.fat_g)}g</td>
                    <td className="px-4 py-2">
                      <button
                        onClick={()=>remove(i)}
                        className="rounded-md px-2 py-1 text-sm font-medium text-red-700 hover:bg-red-50 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-400/40"
                      >
                        remove
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
  const box = "rounded-lg bg-slate-50 px-3 py-2 shadow-sm ring-1 ring-slate-100";
  return (
    <div className="mt-3 grid grid-cols-3 gap-2 text-sm text-slate-700">
      <div className={box}>kcal <b>{fmt(macros.kcal)}</b></div>
      <div className={box}>Carb <b>{fmt(macros.carb_g)} g</b></div>
      <div className={box}>Protein <b>{fmt(macros.protein_g)} g</b></div>
      <div className={box}>Fat <b>{fmt(macros.fat_g)} g</b></div>
      <div className={box}>Fiber <b>{fmt(macros.fiber_g)} g</b></div>
      <div className={box}>Sugar <b>{fmt(macros.sugar_g)} g</b></div>
    </div>
  );
}

function fmt(v) { return v==null ? "—" : Math.round(v); }
function roundSafe(v, scale) { return v==null ? null : Math.round(v*scale); }
