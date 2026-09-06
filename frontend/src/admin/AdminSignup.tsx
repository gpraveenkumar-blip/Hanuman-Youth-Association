import { FormEvent, useState } from "react";
import { ArrowRight, ShieldPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export default function AdminSignup(){
  const nav=useNavigate();
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [confirm,setConfirm]=useState("");
  const [error,setError]=useState("");
  const [ok,setOk]=useState("");
  const [busy,setBusy]=useState(false);

  const submit=async(e:FormEvent)=>{
    e.preventDefault(); setError(""); setOk("");
    if(password.length<8){setError("Password must be at least 8 characters.");return}
    if(password!==confirm){setError("Passwords do not match.");return}
    setBusy(true);
    try{
      await api.post("/auth/admins",{email,password});
      setOk("Admin account created successfully. You can now sign in.");
      setTimeout(()=>nav("/admin/login"),700);
    }catch(err){setError(err instanceof Error?err.message:"Could not create account")}
    finally{setBusy(false)}
  };

  return <div className="min-h-screen bg-[#080808] px-6 py-10 text-white">
    <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
      <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[.03] p-8 shadow-2xl backdrop-blur-xl">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-400 text-black"><ShieldPlus/></div>
        <div className="mt-8 text-xs uppercase tracking-[.3em] text-amber-300">HYA Jaklair / Admin</div>
        <h1 className="mt-3 font-display text-4xl font-semibold">Create admin account.</h1>
        <p className="mt-3 text-sm leading-6 text-white/40">This page is protected. Only an existing signed-in administrator can create another administrator.</p>
        <form onSubmit={submit} className="mt-8 space-y-4">
          <Field label="Email" type="email" value={email} onChange={setEmail}/>
          <Field label="Password" type="password" value={password} onChange={setPassword}/>
          <Field label="Confirm password" type="password" value={confirm} onChange={setConfirm}/>
          {error&&<div className="rounded-xl border border-red-400/20 bg-red-400/5 p-3 text-sm text-red-300">{error}</div>}
          {ok&&<div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-3 text-sm text-emerald-300">{ok}</div>}
          <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-black disabled:opacity-50">
            {busy?"Creating…":"Create admin account"}<ArrowRight size={16}/>
          </button>
          <button type="button" onClick={()=>nav("/admin")} className="w-full rounded-xl border border-white/10 px-5 py-3 text-sm text-white/55 hover:bg-white/5">Back to Admin</button>
        </form>
      </div>
    </div>
  </div>
}
function Field({label,type,value,onChange}:{label:string;type:string;value:string;onChange:(v:string)=>void}){
  return <label className="block text-xs uppercase tracking-[.16em] text-white/35">{label}
    <input required type={type} value={value} onChange={e=>onChange(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 p-4 text-white outline-none focus:border-amber-400/50"/>
  </label>
}
