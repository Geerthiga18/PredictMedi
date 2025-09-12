// frontend/src/pages/MealsLog.jsx
import { useEffect, useState } from "react";
import FoodSearch from "../components/FoodSearch";
import { api } from "../lib/api";

const card = "rounded-2xl bg-white p-5 shadow ring-1 ring-slate-100";
const input = "w-24 rounded-lg border border-slate-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500";

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
      // adapt based on your backend response shape
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
    // reset picker
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
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold">Meals for</h2>
          <input type="date" className="rounded-lg border border-slate-300 px-2 py-1"
                 value={today} onChange={e=>setToday(e.target.value)} />
          <div className="ml-auto">{msg && <span className="text-sm text-green-700">{msg}</span>}</div>
        </div>
      </div>

      {/* Picker */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FoodSearch onSelect={(item)=>setPicked(item)} />
        <div className={card}>
          <h3 className="font-semibold">Add selected</h3>
          {!picked && <p className="mt-2 text-sm text-slate-500">Choose a food on the left.</p>}
          {picked && (
            <>
              <p className="mt-2 text-slate-800">{picked.description}</p>
              <p className="text-sm text-slate-500">Default serving: {picked.serving?.amount} {picked.serving?.unit}</p>
              <div className="mt-3 flex items-end gap-2">
                <label className="text-sm text-slate-700">
                  Grams
                  <input className={input} type="number" min="0" step="1" value={grams}
                         onChange={e=>setGrams(e.target.value)} placeholder={picked.serving?.unit?.toLowerCase()==="g" ? picked.serving.amount : "100"} />
                </label>
                <button onClick={addPicked} className="rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-700">
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
          <h3 className="font-semibold">Logged items</h3>
          <button onClick={saveDay} className="rounded-lg bg-emerald-600 px-3 py-2 text-white hover:bg-emerald-700">
            Save Day
          </button>
        </div>

        {!items.length && <p className="mt-3 text-sm text-slate-500">No items yet.</p>}
        {!!items.length && (
          <table className="mt-3 w-full text-left text-sm">
            <thead className="text-slate-500">
              <tr>
                <th className="py-1">Food</th>
                <th>g</th>
                <th>kcal</th>
                <th>Carb</th>
                <th>Protein</th>
                <th>Fat</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((x,i)=>(
                <tr key={i} className="border-t">
                  <td className="py-1 pr-2">{x.desc}</td>
                  <td>{x.grams}</td>
                  <td>{fmt(x.kcal)}</td>
                  <td>{fmt(x.carb_g)}g</td>
                  <td>{fmt(x.protein_g)}g</td>
                  <td>{fmt(x.fat_g)}g</td>
                  <td>
                    <button onClick={()=>remove(i)} className="text-red-600 hover:underline">remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function MacroPreview({ macros }) {
  if (!macros) return null;
  const box = "rounded-lg bg-slate-50 px-3 py-2";
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
