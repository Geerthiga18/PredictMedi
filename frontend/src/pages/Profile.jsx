import { useState, useEffect } from "react";
import { api } from "../lib/api";

export default function Profile({ token, user, onUpdate }) {
  const [age, setAge] = useState(user?.age ?? "");
  const [sex, setSex] = useState(user?.sex ?? "other");
  const [heightCm, setHeightCm] = useState(user?.heightCm ?? "");
  const [weightKg, setWeightKg] = useState(user?.weightKg ?? "");
  const [msg, setMsg] = useState("");

  async function save(e){
    e.preventDefault();
    const body = {
      ...(age ? {age: Number(age)} : {}),
      ...(sex ? {sex} : {}),
      ...(heightCm ? {heightCm: Number(heightCm)} : {}),
      ...(weightKg ? {weightKg: Number(weightKg)} : {}),
    };
    const res = await api("/users/me", { method:"PUT", body, token });
    onUpdate(res.user);
    setMsg("Saved!");
  }

  useEffect(()=>{ setMsg(""); }, [age,sex,heightCm,weightKg]);

  return (
    <form onSubmit={save} className="mx-auto max-w-md p-4">
      <h2 className="text-xl font-semibold mb-3">Profile</h2>
      <input className="border p-2 w-full mb-2" placeholder="Age" type="number" value={age} onChange={e=>setAge(e.target.value)} />
      <select className="border p-2 w-full mb-2" value={sex} onChange={e=>setSex(e.target.value)}>
        <option value="other">Sex: other</option>
        <option value="male">Sex: male</option>
        <option value="female">Sex: female</option>
      </select>
      <input className="border p-2 w-full mb-2" placeholder="Height (cm)" type="number" value={heightCm} onChange={e=>setHeightCm(e.target.value)} />
      <input className="border p-2 w-full mb-2" placeholder="Weight (kg)" type="number" value={weightKg} onChange={e=>setWeightKg(e.target.value)} />
      <button className="bg-blue-600 text-white px-4 py-2 rounded">Save</button>
      {msg && <p className="text-green-700 mt-2">{msg}</p>}
    </form>
  );
}
