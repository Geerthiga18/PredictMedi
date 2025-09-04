import { useEffect, useState } from "react";
import { api } from "../lib/api";

export default function ActivityLog({ token }) {
  const today = new Date().toISOString().slice(0,10);
  const [date, setDate] = useState(today);
  const [minutes, setMinutes] = useState(30);
  const [steps, setSteps] = useState("");
  const [type, setType] = useState("walk");
  const [logs, setLogs] = useState([]);
  const [msg, setMsg] = useState("");

  async function load() {
    try {
      const res = await api("/activity/logs", { token });
      setLogs(res.logs);
    } catch (e) { setMsg(e.message); }
  }
  useEffect(()=>{ load(); },[]);

  async function submit(e) {
    e.preventDefault();
    setMsg("");
    try {
      await api("/activity/log", { method: "POST", token, body: {
        date, minutes: Number(minutes), steps: steps ? Number(steps) : undefined, type
      }});
      setMsg("Saved!");
      load();
    } catch (e) { setMsg(e.message); }
  }

  return (
    <div style={{maxWidth: 700, margin: "20px auto", padding: 12}}>
      <h2>Log Activity</h2>
      <form onSubmit={submit} style={{display:"grid", gap:8, gridTemplateColumns:"1fr 1fr"}}>
        <input type="date" value={date} onChange={e=>setDate(e.target.value)}/>
        <input type="number" placeholder="minutes" value={minutes} onChange={e=>setMinutes(e.target.value)}/>
        <input type="number" placeholder="steps (optional)" value={steps} onChange={e=>setSteps(e.target.value)}/>
        <input placeholder="type (walk/run/gym...)" value={type} onChange={e=>setType(e.target.value)}/>
        <button style={{gridColumn:"1 / -1"}}>Save</button>
      </form>
      {msg && <p>{msg}</p>}

      <h3 style={{marginTop:20}}>Recent</h3>
      <table width="100%" border="1" cellPadding="6" style={{borderCollapse:"collapse"}}>
        <thead><tr><th>Date</th><th>Minutes</th><th>Steps</th><th>Type</th></tr></thead>
        <tbody>
          {logs.map((r, i)=>(
            <tr key={i}>
              <td>{r.date}</td>
              <td>{r.minutes}</td>
              <td>{r.steps ?? ""}</td>
              <td>{r.type ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
