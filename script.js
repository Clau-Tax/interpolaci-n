const $=id=>document.getElementById(id);
let pts=[[0,0],[10,14],[25,33],[40,58]];
const f=n=>{const r=Math.round(n*1e6)/1e6;return Object.is(r,-0)?"0":String(r)};

function draw(){
  $("pts").innerHTML=pts.map((p,i)=>
    `<b>${i==0?"Salida":"Parada "+i}</b><input aria-label="Km ${i}" type="number" step="any" placeholder="Km" value="${p[0]}" data-i="${i}" data-k="0">
     <input aria-label="Min ${i}" type="number" step="any" placeholder="Min" value="${p[1]}" data-i="${i}" data-k="1">
     <button data-del="${i}" aria-label="Quitar parada ${i}">✕</button>`).join("");
}
$("pts").addEventListener("input",e=>{const t=e.target;if(t.dataset.i!==undefined){pts[t.dataset.i][t.dataset.k]=t.value;calc()}});
$("pts").addEventListener("click",e=>{const d=e.target.dataset.del;if(d!==undefined&&pts.length>2){pts.splice(+d,1);draw();calc()}});
$("add").onclick=()=>{const l=pts[pts.length-1];pts.push([(+l[0]||0)+10,""]);draw()};
$("ej").onclick=()=>{pts=[[0,0],[10,14],[25,33],[40,58]];draw();calc()};

function calc(){
  $("err").textContent="";
  const P=pts.map(p=>[parseFloat(p[0]),parseFloat(p[1])]);
  if(P.some(p=>isNaN(p[0])||isNaN(p[1]))){$("err").textContent="Completa todos los km y minutos con números.";return}
  if(new Set(P.map(p=>p[0])).size<P.length){$("err").textContent="Hay kilómetros repetidos. Cada parada debe tener un km distinto.";return}
  P.sort((a,b)=>a[0]-b[0]);
  const n=P.length,x=P.map(p=>p[0]);
  const T=[P.map(p=>p[1])];
  for(let j=1;j<n;j++){T[j]=[];for(let i=0;i<n-j;i++)T[j][i]=(T[j-1][i+1]-T[j-1][i])/(x[i+j]-x[i])}
  const c=T.map(col=>col[0]);
  let h="<table><tr><th>i</th><th>km</th><th>min</th>"+Array.from({length:n-1},(_,j)=>`<th>Orden ${j+1}</th>`).join("")+"</tr>";
  for(let i=0;i<n;i++){h+=`<tr><td>${i}</td><td>${f(x[i])}</td><td${i==0?' class="d"':""}>${f(T[0][i])}</td>`;
    for(let j=1;j<n;j++)h+=T[j][i]!==undefined?`<td${i==0?' class="d"':""}>${f(T[j][i])}</td>`:"<td></td>";h+="</tr>"}
  $("tab").innerHTML=h+"</table>";
  let ps=[`b0 = ${f(c[0])}`];
  for(let j=1;j<n;j++)ps.push(`b${j} = (${f(T[j-1][1])} − ${f(T[j-1][0])}) / (${f(x[j])} − ${f(x[0])}) = <b style="color:var(--acc)">${f(c[j])}</b>`);
  $("pasos").innerHTML=ps.join("<br>");
  let s=f(c[0]),fac="";
  for(let k=1;k<n;k++){fac+=`(x ${x[k-1]<0?"+":"−"} ${f(Math.abs(x[k-1]))})`;s+=` ${c[k]<0?"−":"+"} ${f(Math.abs(c[k]))}${fac}`}
  $("fn").textContent="P(x) = "+s;
  let co=[c[n-1]];
  for(let k=n-2;k>=0;k--){const nc=Array(co.length+1).fill(0);co.forEach((a,i)=>{nc[i+1]+=a;nc[i]-=a*x[k]});nc[0]+=c[k];co=nc}
  let t=[];
  for(let k=n-1;k>=0;k--){const a=Math.round(co[k]*1e6)/1e6;if(a===0)continue;
    const m=k==0?f(Math.abs(a)):(Math.abs(a)==1?"":f(Math.abs(a)))+"x"+(k>1?"^"+k:"");
    t.push((t.length?(a<0?" − ":" + "):(a<0?"−":""))+m)}
  $("fe").textContent="P(x) = "+(t.join("")||"0");
  window._c=c;window._x=x;window._P=P;
  const sl=$("sl");sl.min=x[0];sl.max=x[n-1];
  ev();plot();
}
const P_=v=>{const{_c:c,_x:x}=window;let r=c[c.length-1];for(let k=c.length-2;k>=0;k--)r=r*(v-x[k])+c[k];return r};
const clock=min=>{const[hh,mm]=($("hs").value||"00:00").split(":").map(Number);let t=Math.round(hh*60+mm+min);t=((t%1440)+1440)%1440;return String(Math.floor(t/60)).padStart(2,"0")+":"+String(t%60).padStart(2,"0")};
const dur=m=>m>=60?Math.floor(m/60)+" h "+Math.round(m%60)+" min":f(Math.round(m*10)/10)+" min";

function ev(src){
  if(!window._x)return;
  const x=window._x,v=parseFloat($("xe").value);
  if(isNaN(v)){$("re").textContent="";road(null);return}
  if(src==="sl")$("xe").value=v;
  $("sl").value=Math.min(Math.max(v,x[0]),x[x.length-1]);
  const m=P_(v),fuera=v<x[0]||v>x[x.length-1];
  const vel=m>window._P[0][1]&&v>x[0]?(v-x[0])/((m-window._P[0][1])/60):null;
  $("re").innerHTML=`<div class="ticket"><div class="l"><small>Pasarás por el km ${f(v)} a las</small><div class="big">${clock(m)}</div></div>
  <div class="r"><small>Tiempo de viaje hasta ahí</small><div style="font-size:1.3rem;font-weight:700">${dur(m)}</div>
  ${vel?`<small>Velocidad media: ${f(Math.round(vel*10)/10)} km/h</small>`:""}</div></div>`+
  (fuera?`<p class="err">Ojo: ese km está fuera de tus mediciones, la estimación es poco confiable.</p>`:"");
  road(v);
}
$("xe").oninput=()=>ev();
$("sl").oninput=e=>{$("xe").value=e.target.value;ev("sl")};
$("hs").oninput=()=>ev();
$("go").onclick=calc;

function road(v){
  const P=window._P;if(!P)return;
  const k0=P[0][0],k1=P[P.length-1][0],W=700,L=50,R=650,X=k=>L+(k-k0)/(k1-k0)*(R-L);
  let s=`<svg viewBox="0 0 ${W} 150" role="img" aria-label="Ruta con las paradas y el carro">`;
  s+=`<rect x="20" y="62" width="660" height="44" rx="22" fill="var(--road)"/><line x1="40" x2="660" y1="84" y2="84" stroke="var(--acc)" stroke-width="3" stroke-dasharray="16 12"/>`;
  P.forEach((p,i)=>{const px=X(p[0]);
    s+=`<line x1="${px}" x2="${px}" y1="40" y2="62" stroke="var(--acc2)" stroke-width="2"/><circle cx="${px}" cy="36" r="8" fill="var(--acc2)"/><circle cx="${px}" cy="36" r="3" fill="var(--bg)"/>`;
    const a=i==0?"start":i==P.length-1?"end":"middle";
    s+=`<text x="${px}" y="16" font-size="12" text-anchor="${a}" fill="var(--ink)">km ${f(p[0])}</text><text x="${px}" y="130" font-size="12" text-anchor="${a}" fill="var(--mute)">${f(p[1])} min</text>`});
  if(v!==null){const cv=Math.min(Math.max(v,k0),k1);
    s+=`<g transform="translate(${X(cv)},84)"><g transform="scale(-1,1)"><text font-size="30" text-anchor="middle" y="10">🚗</text></g></g>`}
  $("road").innerHTML=s+"</svg>";
}

function plot(){
  const P=window._P,x0=P[0][0],x1=P[P.length-1][0],pad=(x1-x0)*.1||1;
  const a=x0-pad,b=x1+pad,N=200,ys=[];
  for(let i=0;i<=N;i++)ys.push(P_(a+(b-a)*i/N));
  let lo=Math.min(...ys,...P.map(p=>p[1])),hi=Math.max(...ys,...P.map(p=>p[1]));
  const yp=(hi-lo)*.1||1;lo-=yp;hi+=yp;
  const W=700,H=340,m=40,X=v=>m+(v-a)/(b-a)*(W-2*m),Y=v=>H-m-(v-lo)/(hi-lo)*(H-2*m);
  let s=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfica del polinomio y las paradas">`;
  s+=`<rect x="${m}" y="${m}" width="${W-2*m}" height="${H-2*m}" fill="none" stroke="var(--line)"/>`;
  s+=`<polyline fill="none" stroke="var(--acc2)" stroke-width="2.5" points="${ys.map((y,i)=>X(a+(b-a)*i/N).toFixed(1)+","+Y(y).toFixed(1)).join(" ")}"/>`;
  P.forEach(p=>s+=`<circle cx="${X(p[0])}" cy="${Y(p[1])}" r="6" fill="var(--acc)"/><text x="${X(p[0])+8}" y="${Y(p[1])-9}" font-size="12" fill="var(--ink)">(${f(p[0])} km, ${f(p[1])} min)</text>`);
  s+=`<text x="${m}" y="${H-14}" font-size="12" fill="var(--mute)">${f(a)} km</text><text x="${W-m}" y="${H-14}" font-size="12" text-anchor="end" fill="var(--mute)">${f(b)} km</text>`;
  s+=`<text x="${m-6}" y="${H-m}" font-size="12" text-anchor="end" fill="var(--mute)">${f(lo)}</text><text x="${m-6}" y="${m+10}" font-size="12" text-anchor="end" fill="var(--mute)">${f(hi)}</text></svg>`;
  $("g").innerHTML=s;
}
draw();calc();