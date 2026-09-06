import { useEffect, useMemo, useRef, useState } from "react";
import { Activity, BarChart3, CalendarDays, ChevronDown, FileImage, Film, Home, LogOut, Menu, MessageSquare, Plus, Save, Search, Settings, Trash2, Upload, Users, X, ShieldPlus, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import type { Activity as ActivityType, Event, Media, Member, Announcement, SiteSettings } from "../types";

const navItems=[["Dashboard",Home],["Media",FileImage],["Events",CalendarDays],["Activities",Activity],["Members",Users],["Announcements",MessageSquare],["Homepage",Settings],["Analytics",BarChart3],["Admin Accounts",ShieldPlus]] as const;

export default function AdminDashboard(){
  const nav=useNavigate(); const [user,setUser]=useState<any>(null); const [active,setActive]=useState("Dashboard"); const [mobile,setMobile]=useState(false);
  useEffect(()=>{api.get("/auth/me").then(setUser).catch(()=>nav("/admin/login"))},[nav]);
  if(!user) return <div className="grid min-h-screen place-items-center bg-[#080808] text-white">Loading…</div>;
  return <div className="min-h-screen bg-[#080808] text-white">
    <aside className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-white/8 bg-[#0b0b0b] p-5 transition-transform ${mobile?"translate-x-0":"-translate-x-full lg:translate-x-0"}`}>
      <div className="flex items-center justify-between"><div><div className="font-display text-lg font-bold">HYA JAKLAIR</div><div className="text-[10px] uppercase tracking-[.35em] text-white/30">Admin CMS</div></div><button className="lg:hidden" onClick={()=>setMobile(false)}><X/></button></div>
      <div className="mt-8 space-y-1">
  {navItems.map(([label, Icon]) => (
    <button
      key={label}
      onClick={() => {
        setActive(label);
        setMobile(false);
      }}
      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm ${
        active === label
          ? "bg-amber-400 text-black"
          : "text-white/50 hover:bg-white/5 hover:text-white"
      }`}
    >
      <Icon size={17} />
      {label}
    </button>
  ))}

  {/* Messages */}
  <a
    href="/admin/messages"
    onClick={() => setMobile(false)}
    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-white/50 hover:bg-white/5 hover:text-white"
  >
    <MessageSquare size={17} />
    <span>Messages</span>
  </a>
</div>
      <button onClick={async()=>{await api.post("/auth/logout");nav("/admin/login")}} className="absolute bottom-5 left-5 right-5 flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-white/45 hover:bg-white/5 hover:text-white"><LogOut size={17}/>Logout</button>
    </aside>
    <div className="lg:pl-72"><header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/8 bg-[#080808]/90 px-5 py-4 backdrop-blur-xl lg:px-8"><button className="lg:hidden" onClick={()=>setMobile(true)}><Menu/></button><div><div className="text-xs uppercase tracking-[.2em] text-white/30">CMS / {active}</div><div className="font-display text-xl font-semibold">{active}</div></div><div className="hidden text-sm text-white/40 sm:block">{user.email}</div></header>
      <main className="p-5 lg:p-8">{active==="Dashboard"&&<Overview/>}{active==="Media"&&<MediaManager/>}{active==="Events"&&<CrudEvents/>}{active==="Activities"&&<CrudActivities/>}{active==="Members"&&<CrudMembers/>}{active==="Announcements"&&<CrudAnnouncements/>}{active==="Homepage"&&<HomepageSettings/>}{active==="Analytics"&&<Analytics/>}{active==="Admin Accounts"&&<AdminAccounts/>}</main></div>
  </div>
}

function Overview(){const [data,setData]=useState<any>({});useEffect(()=>{Promise.all([api.get<Media[]>("/media"),api.get<Event[]>("/events"),api.get<ActivityType[]>("/activities"),api.get<Member[]>("/members"),api.get<Announcement[]>("/announcements")]).then(([m,e,a,me,n])=>setData({media:m,events:e,activities:a,members:me,announcements:n})).catch(()=>{})},[]); const cards=[["Photos",data.media?.filter((x:any)=>x.type==="photo").length||0,FileImage],["Videos",data.media?.filter((x:any)=>x.type==="video").length||0,Film],["Events",data.events?.length||0,CalendarDays],["Activities",data.activities?.length||0,Activity],["Team",data.members?.length||0,Users],["Announcements",data.announcements?.length||0,MessageSquare]];return <div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{cards.map(([label,count,Icon]:any)=><div key={label} className="rounded-2xl border border-white/8 bg-white/[.03] p-5"><Icon size={18} className="text-amber-300"/><div className="mt-8 font-display text-4xl font-semibold">{count}</div><div className="mt-1 text-sm text-white/35">{label}</div></div>)}</div><div className="mt-8 rounded-2xl border border-white/8 bg-white/[.02] p-6"><div className="text-xs uppercase tracking-[.2em] text-white/30">Publishing principle</div><div className="mt-3 font-display text-3xl">UPLOAD IT. EDIT IT. PUBLISH IT.</div><p className="mt-2 max-w-2xl text-sm leading-6 text-white/40">Everything on the public website should be manageable here without source-code edits.</p></div></div>}

function MediaManager(){
  const [items,setItems]=useState<Media[]>([]);
  const [drag,setDrag]=useState(false);
  const input=useRef<HTMLInputElement>(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [category,setCategory]=useState("Community");
  const [selected,setSelected]=useState<string[]>([]);

  const load=()=>api.get<Media[]>("/media").then(setItems).catch(e=>setError(e.message));
  useEffect(()=>{load()},[]);

  const upload=async(files:FileList|null)=>{
    if(!files?.length)return;
    setBusy(true); setError("");
    try{
      for(const file of Array.from(files)){
        const f=new FormData();
        f.append("file",file);
        f.append("title",file.name.replace(/\.[^.]+$/,""));
        f.append("category",category);
        f.append("caption","");
        await api.upload("/media",f);
      }
      await load();
    }catch(e:any){
      setError(e?.message || "Upload failed. Please try again.");
    }finally{
      setBusy(false);
      if(input.current) input.current.value="";
    }
  };

  const remove=async(id:string)=>{
    if(!confirm("Delete this media?"))return;
    try{await api.del(`/media/${id}`);setSelected(s=>s.filter(x=>x!==id));await load();}
    catch(e:any){setError(e?.message || "Delete failed.");}
  };

  const photos=items.filter(x=>x.type==="photo").length;
  const videos=items.filter(x=>x.type==="video").length;

  return <div className="space-y-7">
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-2xl border border-white/8 bg-white/[.03] p-5">
        <FileImage size={18} className="text-amber-300"/>
        <div className="mt-5 font-display text-3xl font-semibold">{photos}</div>
        <div className="text-sm text-white/35">Photos</div>
      </div>
      <div className="rounded-2xl border border-white/8 bg-white/[.03] p-5">
        <Film size={18} className="text-amber-300"/>
        <div className="mt-5 font-display text-3xl font-semibold">{videos}</div>
        <div className="text-sm text-white/35">Videos</div>
      </div>
      <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[.05] p-5">
        <Upload size={18} className="text-amber-300"/>
        <div className="mt-5 font-display text-lg font-semibold">Publish media</div>
        <div className="text-sm text-white/40">Upload directly to the public gallery.</div>
      </div>
    </div>
    

    <div
      onDragOver={e=>{e.preventDefault();setDrag(true)}}
      onDragLeave={()=>setDrag(false)}
      onDrop={e=>{e.preventDefault();setDrag(false);upload(e.dataTransfer.files)}}
      className={`rounded-[2rem] border-2 border-dashed p-8 text-center transition md:p-12 ${drag?"border-amber-300 bg-amber-300/10":"border-white/10 bg-white/[.02]"}`}
    >
      <input ref={input} hidden type="file" multiple accept="image/*,video/*" onChange={e=>upload(e.target.files)}/>
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-300/10">
        <Upload size={28} className="text-amber-300"/>
      </div>
      <div className="mt-5 font-display text-3xl font-semibold">Upload Photos & Videos</div>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-white/40">
        Drag and drop your photos or videos here, or choose files from your device.
        You can upload multiple files at once.
      </p>

      <div className="mx-auto mt-6 flex max-w-md flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
        <select value={category} onChange={e=>setCategory(e.target.value)} className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none">
          <option>Community</option>
          <option>Youth</option>
          <option>Cultural</option>
          <option>Sports</option>
          <option>Social Service</option>
          <option>Events</option>
        </select>
        <button
          type="button"
          disabled={busy}
          onClick={()=>input.current?.click()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Upload size={17}/>
          {busy?"Uploading…":"Choose Photos / Videos"}
        </button>
      </div>

      <div className="mt-5 text-[11px] uppercase tracking-[.18em] text-white/25">
        Supported: JPG · PNG · WEBP · GIF · MP4 · WEBM · MOV · and other browser-supported image/video formats
      </div>

      {busy && <div className="mx-auto mt-6 h-1 max-w-md overflow-hidden rounded-full bg-white/10"><div className="h-full w-1/2 animate-pulse rounded-full bg-amber-300"/></div>}
      {error && <div className="mx-auto mt-5 max-w-xl rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</div>}
    </div>

    <div>
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <div className="text-xs uppercase tracking-[.2em] text-white/30">Media library</div>
          <h3 className="mt-1 font-display text-2xl font-semibold">{items.length} published items</h3>
        </div>
        <button onClick={load} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/55 hover:bg-white/5 hover:text-white">Refresh library</button>
      </div>

      {items.length===0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center text-white/35">Your media library is empty. Upload your first photos or videos above.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map(m=>
            <div key={m.id} className="overflow-hidden rounded-2xl border border-white/8 bg-white/[.02]">
              {m.type==="video"
                ? <video src={m.url} controls preload="metadata" className="aspect-video w-full bg-black object-cover"/>
                : <img src={m.url} className="aspect-video w-full object-cover" alt={m.title}/>}
              <div className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <div className="truncate font-semibold">{m.title}</div>
                  <div className="text-xs text-white/35">{m.category} · {m.type==="video"?"Video":"Photo"} · {m.published?"Published":"Draft"}</div>
                </div>
                <button onClick={()=>remove(m.id)} aria-label={`Delete ${m.title}`} className="shrink-0 text-white/30 hover:text-red-300"><Trash2 size={17}/></button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  </div>
}

function CrudEvents(){const [items,setItems]=useState<Event[]>([]);const load=()=>api.get<Event[]>("/events").then(setItems);useEffect(()=>{load()},[]);const [form,setForm]=useState({title:"",date:"",time:"",location:"",description:"",status:"upcoming"});const save=async()=>{if(!form.title||!form.date)return;await api.post("/events",form);setForm({title:"",date:"",time:"",location:"",description:"",status:"upcoming"});load()};const del=async(id:string)=>{await api.del(`/events/${id}`);load()};return <Crud title="Events" items={items} fields={form} setFields={setForm as any} save={save} del={del}/>}

function CrudActivities(){const [items,setItems]=useState<ActivityType[]>([]);const load=()=>api.get<ActivityType[]>("/activities").then(setItems);useEffect(()=>{load()},[]);const [form,setForm]=useState({title:"",category:"Youth",description:""});const save=async()=>{if(!form.title)return;await api.post("/activities",form);setForm({title:"",category:"Youth",description:""});load()};const del=async(id:string)=>{await api.del(`/activities/${id}`);load()};return <Crud title="Activities" items={items} fields={form} setFields={setForm as any} save={save} del={del}/>}

function CrudMembers(){const [items,setItems]=useState<Member[]>([]);const load=()=>api.get<Member[]>("/members").then(setItems);useEffect(()=>{load()},[]);const [form,setForm]=useState({name:"",position:"",bio:""});const save=async()=>{if(!form.name)return;await api.post("/members",form);setForm({name:"",position:"",bio:""});load()};const del=async(id:string)=>{await api.del(`/members/${id}`);load()};return <Crud title="Members" items={items} fields={form} setFields={setForm as any} save={save} del={del}/>}

function CrudAnnouncements(){const [items,setItems]=useState<Announcement[]>([]);const load=()=>api.get<Announcement[]>("/announcements").then(setItems);useEffect(()=>{load()},[]);const [form,setForm]=useState({title:"",description:"",priority:"normal",date:new Date().toISOString().slice(0,10)});const save=async()=>{if(!form.title)return;await api.post("/announcements",form);load()};const del=async(id:string)=>{await api.del(`/announcements/${id}`);load()};return <Crud title="Announcements" items={items} fields={form} setFields={setForm as any} save={save} del={del}/>}

function Crud({title,items,fields,setFields,save,del}:{title:string;items:any[];fields:Record<string,string>;setFields:(x:any)=>void;save:()=>void;del:(id:string)=>void}){return <div><div className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]"><div className="rounded-2xl border border-white/8 bg-white/[.02] p-5"><div className="mb-5 flex items-center justify-between"><div className="font-display text-xl">Create {title.slice(0,-1)}</div><Plus size={18} className="text-amber-300"/></div>{Object.entries(fields).map(([k,v])=><label key={k} className="mb-4 block text-xs uppercase tracking-[.16em] text-white/30">{k}<input value={v} onChange={e=>setFields({...fields,[k]:e.target.value})} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-white outline-none focus:border-amber-400/40"/></label>)}<button onClick={save} className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black"><Save size={16}/>Publish</button></div><div className="space-y-3">{items.map((x:any)=><div key={x.id} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[.02] p-5"><div><div className="font-semibold">{x.title||x.name}</div><div className="mt-1 text-xs text-white/35">{x.category||x.position||x.priority||x.status||x.date}</div></div><button onClick={()=>del(x.id)} className="text-white/30 hover:text-red-300"><Trash2 size={17}/></button></div>)}</div></div></div>}

function HomepageSettings(){const [s,setS]=useState<SiteSettings|null>(null);useEffect(()=>{api.get<SiteSettings>("/site").then(setS)},[]);if(!s)return <div>Loading…</div>;const save=async()=>{await api.put("/site",s);alert("Homepage settings saved.")};return <div className="max-w-3xl rounded-2xl border border-white/8 bg-white/[.02] p-6"><div className="font-display text-2xl">Homepage & branding</div><p className="mt-2 text-sm text-white/35">Edit the content that powers the public experience.</p><div className="mt-7 grid gap-4 sm:grid-cols-2">{(["organizationName","shortName","tagline","location","phone","email","instagram","youtube","facebook","whatsapp","heroVideo"] as const).map(k=><label key={k} className="block text-xs uppercase tracking-[.16em] text-white/30">{k}<input value={s[k] as any} onChange={e=>setS({...s,[k]:e.target.value})} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-white outline-none focus:border-amber-400/40"/></label>)}</div><label className="mt-4 block text-xs uppercase tracking-[.16em] text-white/30">Description<textarea value={s.description} onChange={e=>setS({...s,description:e.target.value})} rows={5} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-white outline-none"/></label><button onClick={save} className="mt-5 flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black"><Save size={16}/>Save settings</button></div>}

function Analytics(){return <div className="rounded-2xl border border-white/8 bg-white/[.02] p-8"><BarChart3 className="text-amber-300"/><h2 className="mt-5 font-display text-3xl">Analytics-ready dashboard</h2><p className="mt-2 max-w-xl text-sm leading-7 text-white/40">The architecture is ready for privacy-conscious page-view/event analytics. Connect your preferred analytics provider or first-party event table without changing the public UI.</p></div>}


function AdminAccounts(){
  const [items,setItems]=useState<any[]>([]);
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [error,setError]=useState("");
  const [ok,setOk]=useState("");
  const load=()=>api.get<any[]>("/auth/admins").then(setItems).catch(e=>setError(e.message));
  useEffect(()=>{load()},[]);
  const create=async()=>{
    setError("");setOk("");
    if(!email||password.length<8){setError("Enter a valid email and a password of at least 8 characters.");return}
    try{await api.post("/auth/admins",{email,password});setEmail("");setPassword("");setOk("Admin account created.");load()}
    catch(e:any){setError(e.message||"Could not create account")}
  };
  const remove=async(id:string)=>{
    if(!confirm("Delete this admin account?"))return;
    try{await api.del(`/auth/admins/${id}`);load()}catch(e:any){setError(e.message||"Could not delete account")}
  };
  return <div className="space-y-7">
    <div className="rounded-[2rem] border border-amber-400/20 bg-amber-400/[.05] p-7">
      <div className="flex items-start gap-4">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber-400 text-black"><UserPlus size={20}/></div>
        <div><div className="text-xs uppercase tracking-[.2em] text-amber-300">Secure signup</div><h2 className="mt-1 font-display text-3xl font-semibold">Create another admin account</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">Add trusted administrators at any time. Passwords are hashed on the server and never stored as plain text.</p></div>
      </div>
      <div className="mt-7 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
        <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="admin@example.com" className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-amber-400/40"/>
        <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="Password (8+ characters)" className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-amber-400/40"/>
        <button onClick={create} className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black hover:scale-[1.01]">Create account</button>
      </div>
      {error&&<div className="mt-4 rounded-xl border border-red-400/20 bg-red-400/5 p-3 text-sm text-red-300">{error}</div>}
      {ok&&<div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-3 text-sm text-emerald-300">{ok}</div>}
    </div>
    <div className="rounded-2xl border border-white/8 bg-white/[.02] p-6">
      <div className="mb-5 flex items-center justify-between"><div><div className="text-xs uppercase tracking-[.2em] text-white/30">Accounts</div><h3 className="mt-1 font-display text-2xl font-semibold">{items.length} administrator{items.length===1?"":"s"}</h3></div><button onClick={load} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/55 hover:bg-white/5">Refresh</button></div>
      <div className="space-y-2">{items.map(a=><div key={a.id} className="flex flex-col gap-3 rounded-xl border border-white/8 bg-white/[.02] p-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="font-medium">{a.email}</div><div className="text-xs text-white/35">{a.role} · created {new Date(a.createdAt).toLocaleString()}</div></div><button onClick={()=>remove(a.id)} className="inline-flex w-fit items-center gap-2 rounded-lg border border-red-400/15 px-3 py-2 text-xs text-red-300 hover:bg-red-400/5"><Trash2 size={14}/>Delete</button></div>)}</div>
    </div>
  </div>
}
