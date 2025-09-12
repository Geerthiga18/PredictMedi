import { useState } from "react";
import { api } from "../lib/api";

export default function Register({ onAuth }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // NEW
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("other"); // "male"|"female"|"other"
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      const body = {
        name, email, password,
        // convert number fields if user typed them
        age: age ? Number(age) : null,
        sex,
        heightCm: heightCm ? Number(heightCm) : null,
        weightKg: weightKg ? Number(weightKg) : null,
      };
      const res = await api("/auth/register", { method: "POST", body });
      onAuth(res.token, res.user);
    } catch (e) {
      setErr(e.message || "Register failed");
    } finally { setLoading(false); }
  }

  return (
    <div style={{maxWidth: 420, margin: "40px auto"}}>
      <h2>Create account</h2>
      <form onSubmit={submit}>
        <input placeholder="Name" value={name} onChange={e=>setName(e.target.value)} style={{width:"100%",marginBottom:8}}/>
        <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} style={{width:"100%",marginBottom:8}}/>
        <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} style={{width:"100%",marginBottom:8}}/>

        {/* NEW fields */}
        <input placeholder="Age" type="number" min="1" max="120" value={age} onChange={e=>setAge(e.target.value)} style={{width:"100%",marginBottom:8}}/>
        <select value={sex} onChange={e=>setSex(e.target.value)} style={{width:"100%",marginBottom:8}}>
          <option value="other">Sex: other</option>
          <option value="male">Sex: male</option>
          <option value="female">Sex: female</option>
        </select>
        <input placeholder="Height (cm)" type="number" min="80" max="250" value={heightCm} onChange={e=>setHeightCm(e.target.value)} style={{width:"100%",marginBottom:8}}/>
        <input placeholder="Weight (kg)" type="number" min="20" max="300" value={weightKg} onChange={e=>setWeightKg(e.target.value)} style={{width:"100%",marginBottom:8}}/>

        <button disabled={loading}>{loading ? "..." : "Register"}</button>
      </form>
      {err && <p style={{color:"red"}}>{err}</p>}
    </div>
  );
}
