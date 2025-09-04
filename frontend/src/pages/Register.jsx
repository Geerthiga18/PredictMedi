import { useState } from "react";
import { api } from "../lib/api";

export default function Register({ onAuth }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      const res = await api("/auth/register", { method: "POST", body: { name, email, password } });
      onAuth(res.token, res.user);
    } catch (e) {
      setErr(e.message || "Register failed");
    } finally { setLoading(false); }
  }

  return (
    <div style={{maxWidth: 360, margin: "40px auto"}}>
      <h2>Create account</h2>
      <form onSubmit={submit}>
        <input placeholder="Name" value={name} onChange={e=>setName(e.target.value)} style={{width:"100%",marginBottom:8}}/>
        <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} style={{width:"100%",marginBottom:8}}/>
        <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} style={{width:"100%",marginBottom:8}}/>
        <button disabled={loading}>{loading ? "..." : "Register"}</button>
      </form>
      {err && <p style={{color:"red"}}>{err}</p>}
    </div>
  );
}
