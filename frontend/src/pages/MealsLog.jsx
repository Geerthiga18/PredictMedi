import { useEffect, useState } from "react";
import { api } from "../lib/api";

function ItemRow({ idx, item, onChange, onRemove }) {
  return (
    <div style={{display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr auto", gap:6}}>
      <input placeholder="name" value={item.name} onChange={e=>onChange(idx, {...item, name:e.target.value})}/>
      <input type="number" placeholder="calories" value={item.calories} onChange={e=>onChange(idx, {...item, calories: Number(e.target.value)})}/>
      <input type="number" placeholder="protein_g" value={item.protein_g ?? ""} onChange={e=>onChange(idx, {...item, protein_g: e.target.value ? Number(e.target.value) : undefined})}/>
      <input type="number" placeholder="carbs_g" value={item.carbs_g ?? ""} onChange={e=>onChange(idx, {...item, carbs_g: e.target.value ? Number(e.target.value) : undefined})}/>
      <input type="number" placeholder="fat_g" value={item.fat_g ?? ""} onChange={e=>onChange(idx, {...item, fat_g: e.target.value ? Number(e.target.value) : undefined})}/>
      <button type="button" onClick={()=>onRemove(idx)}>✕</button>
    </div>
  );
}

export default function MealsLog({ token }) {
  const today = new Date().toISOString().slice(0,10);
  const [date, setDate] = useState(today);
  const [items, setItems] = useState([{ name:"", calories:0 }]);
  const [notes, setNotes] = useState("");
  const [logs, setLogs] = useState([]);
  const [msg, setMsg] = useState("");

  function setItem(idx, v){ setItems(items.map((it,i)=> i===idx?v:it)); }
  function addItem(){ setItems([...items, {name:"", calories:0}]); }
  function removeItem(idx){ setItems(items.filter((_,i)=> i!==idx)); }

  async function load(){
    try {
      const res = await api("/meals/logs", { token });
      setLogs(res.logs);
    } catch (e) { setMsg(e.message); }
  }
  useEffect(()=>{ load(); },[]);

  async function submit(e){
    e.preventDefault();
    setMsg("");
    try{
      // filter out empty rows:
      const clean = items.filter(i=> i.name && Number(i.calories)>0);
      if(clean.length===0){ setMsg("Add at least one item with calories."); return; }
      const res = await api("/meals/log", { method:"POST", token, body: { date, items: clean, notes }});
      setMsg(`Saved! Total ${res.totalCalories} kcal`);
      setItems([{name:"",calories:0}]); setNotes("");
      load();
    }catch(e){ setMsg(e.message); }
  }

  return (
    <div style={{maxWidth: 900, margin: "20px auto", padding: 12}}>
      <h2>Log Meal</h2>
      <form onSubmit={submit} style={{display:"grid", gap:10}}>
        <input type="date" value={date} onChange={e=>setDate(e.target.value)}/>
        {items.map((it, idx)=> (
          <ItemRow key={idx} idx={idx} item={it} onChange={setItem} onRemove={removeItem}/>
        ))}
        <div>
          <button type="button" onClick={addItem}>+ Add item</button>
        </div>
        <textarea placeholder="notes (optional)" value={notes} onChange={e=>setNotes(e.target.value)} />
        <button>Save meal</button>
      </form>
      {msg && <p>{msg}</p>}

      <h3 style={{marginTop:20}}>Recent</h3>
      <table width="100%" border="1" cellPadding="6" style={{borderCollapse:"collapse"}}>
        <thead><tr><th>Date</th><th>Items</th><th>Total kcal</th><th>Notes</th></tr></thead>
        <tbody>
          {logs.map((r,i)=>(
            <tr key={i}>
              <td>{r.date}</td>
              <td>
                {r.items.map((it,j)=>(<div key={j}>{it.name} — {it.calories} kcal</div>))}
              </td>
              <td>{r.totalCalories}</td>
              <td>{r.notes ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
