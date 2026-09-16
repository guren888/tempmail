const API="/api";
let currentEmail="";
let since="";
let busy=false;

const $=id=>document.getElementById(id);
const status=$("status");

function setStatus(x){status.textContent=x}
function randomName(){return "guren"+Math.random().toString(36).slice(2,9)}
function esc(x){return String(x??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}

async function api(path, options={}){
  const r=await fetch(API+path,{...options,cache:"no-store"});
  const text=await r.text();
  let data={};
  try{data=JSON.parse(text)}catch{}
  if(!r.ok) throw new Error(data.error||`HTTP ${r.status}`);
  return data;
}

function domainsFrom(data){
  const a=data?.domains||data?.system_domains||data?.available_domains||data?.mail_domains;
  if(!Array.isArray(a)) return [];
  return a.map(x=>typeof x==="string"?x:(x?.domain||x?.name||""))
    .filter(x=>/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(x));
}

async function loadDomains(){
  try{
    const data=await api("/config");
    const domains=[...new Set(domainsFrom(data))];
    if(!domains.length) throw new Error("Domain tidak ditemukan");
    $("domain").innerHTML=domains.map(d=>`<option value="${esc(d)}">@${esc(d)}</option>`).join("");
    setStatus(`${domains.length} domain siap`);
  }catch(e){
    $("domain").innerHTML='<option>Gagal memuat domain</option>';
    setStatus(e.message);
  }
}

function createEmail(){
  const d=$("domain").value;
  let u=$("username").value.trim().toLowerCase().replace(/[^a-z0-9._-]/g,"");
  if(!u) u=randomName();
  if(u.length<3){setStatus("Nama minimal 3 karakter");return}
  $("username").value=u;
  currentEmail=`${u}@${d}`;
  $("email").value=currentEmail;
  since="";
  loadInbox();
}

async function loadInbox(){
  if(!currentEmail){setStatus("Buat email dulu");return}
  if(busy)return;
  busy=true;setStatus("Menunggu email...");
  try{
    let path=`/inbox/${encodeURIComponent(currentEmail)}`;
    if(since)path+=`?since=${encodeURIComponent(since)}`;
    const data=await api(path);
    since=data.next_since||since;
    render(data.emails||[]);
    setStatus((data.emails||[]).length?`${data.emails.length} email diterima`:"Inbox kosong");
  }catch(e){
    if(String(e.message).includes("204")) setStatus("Belum ada email");
    else setStatus(e.message);
  }finally{busy=false}
}

function render(emails){
  $("count").textContent=`${emails.length} pesan`;
  if(!emails.length){$("messages").innerHTML='<div class="empty">Belum ada email.</div>';return}
  $("messages").innerHTML="";
  emails.forEach(m=>{
    const el=document.createElement("div");
    el.className="message";
    el.innerHTML=`<div class="from">${esc(m.from_email||"Unknown")}</div>
      <div class="subject">${esc(m.subject||"(Tanpa subjek)")}</div>
      <div class="preview">${esc(m.preview_text||"")}</div>`;
    el.onclick=()=>openEmail(m.id);
    $("messages").appendChild(el);
  });
}

async function openEmail(id){
  $("reader").classList.remove("hidden");
  $("subject").textContent="Memuat...";
  $("from").textContent="";
  $("body").textContent="";
  try{
    const d=await api(`/email/${encodeURIComponent(id)}`);
    $("subject").textContent=d.subject||"(Tanpa subjek)";
    $("from").textContent=d.from_email||d.from||"";
    $("body").textContent=d.text||d.text_body||stripHtml(d.html||d.html_body||"")||"(Isi kosong)";
  }catch(e){$("body").textContent=e.message}
}

function stripHtml(h){const d=new DOMParser().parseFromString(h,"text/html");return d.body?.textContent?.trim()||""}

$("random").onclick=()=>{$("username").value=randomName()}
$("create").onclick=createEmail;
$("refresh").onclick=loadInbox;
$("copy").onclick=async()=>{if(currentEmail){await navigator.clipboard.writeText(currentEmail);setStatus("Email disalin")}}
$("close").onclick=()=>$("reader").classList.add("hidden");
$("reader").onclick=e=>{if(e.target===$("reader"))$("reader").classList.add("hidden")};
$("username").value=randomName();
loadDomains();
