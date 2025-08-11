'use strict';

const el = (id)=>document.getElementById(id);
const $home = el('home'), $quiz = el('quiz'), $result = el('result');
const $qText = el('qText'), $choices = el('choices'), $qIndex = el('qIndex'), $bar = el('bar');
const $back = el('backBtn'), $next = el('nextBtn');
const $primaryBadge = el('primaryBadge'), $secondaryBadge = el('secondaryBadge');
const $scoreD = el('scoreD'), $scoreI = el('scoreI'), $scoreS = el('scoreS'), $scoreC = el('scoreC');
const $chart = el('chart'); const $typeLine = el('typeLine');
const $top3 = el('top3'), $top3List = el('top3List');

let DATA = null;
let idx = 0;
let answers = []; // 'D','I','S','C'
let scores = {D:0,I:0,S:0,C:0};

const COLORS = {D:getComputedStyle(document.documentElement).getPropertyValue('--D').trim(),
                I:getComputedStyle(document.documentElement).getPropertyValue('--I').trim(),
                S:getComputedStyle(document.documentElement).getPropertyValue('--S').trim(),
                C:getComputedStyle(document.documentElement).getPropertyValue('--C').trim()};

const TYPE_DESC = {
  D:'行動派：直感とスピードで前に進むタイプ',
  I:'社交派：明るさと会話で場を動かすタイプ',
  S:'思いやり派：安心感と調和を大切にするタイプ',
  C:'こだわり派：丁寧さと品質に価値を置くタイプ'
};

async function loadData(){ const r = await fetch('data.json'); DATA = await r.json(); }
function showHome(){ $home.classList.remove('hidden'); $quiz.classList.add('hidden'); $result.classList.add('hidden'); }
function start(){ idx=0; answers = Array(DATA.questions.length).fill(null); scores={D:0,I:0,S:0,C:0};
  $home.classList.add('hidden'); $result.classList.add('hidden'); $quiz.classList.remove('hidden'); renderQuestion(); }

function shuffled(arr){ const a = arr.map(x=>({...x})); for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]];} return a; }

function renderQuestion(){
  const q = DATA.questions[idx];
  $qIndex.textContent = (idx+1);
  $qText.textContent = q.text;
  $choices.innerHTML = '';
  const list = shuffled(q.choices);
  list.forEach(c=>{
    const div = document.createElement('div');
    div.className='choice';
    div.textContent=c.label; // タイプ表記は出さない
    div.addEventListener('click', ()=>{
      answers[idx]=c.type;
      document.querySelectorAll('.choice').forEach(ch=>ch.style.outline='');
      div.style.outline=`2px solid ${COLORS[c.type]}`;
      $next.disabled=false;
    });
    if (answers[idx]===c.type){ div.style.outline=`2px solid ${COLORS[c.type]}`; $next.disabled=false; }
    $choices.appendChild(div);
  });
  $back.disabled = (idx===0);
  $next.disabled = (answers[idx]===null);
  $bar.style.width = ((idx)/DATA.questions.length*100)+'%';
}

function next(){ if(answers[idx]==null)return; if(idx<DATA.questions.length-1){ idx++; renderQuestion(); } else { compute(); showResult(); } }
function back(){ if(idx===0)return; idx--; renderQuestion(); }
function compute(){ scores={D:0,I:0,S:0,C:0}; answers.forEach(t=>{ if(t) scores[t]++; }); }
function primarySecondary(sc){ const e=Object.entries(sc).sort((a,b)=>b[1]-a[1]); const [p1,v1]=e[0],[p2,v2]=e[1]; return (v2===v1)?[p1[0]+'×'+p2[0], e[2][0]]:[p1[0],p2[0]]; }
function setAccent(primaryType){ const t=(primaryType.includes('×')?primaryType.split('×')[0]:primaryType); const color=COLORS[t]||'#f071a8';
  document.documentElement.style.setProperty('--accent', color); $primaryBadge.className=`badge ${t}`; $primaryBadge.textContent=primaryType; }
function colorBadge($el,t){ $el.className=`badge ${t}`; $el.textContent=t; }

function drawChart(sc, animate=true){
  const ctx = $chart.getContext('2d'); ctx.clearRect(0,0,$chart.width,$chart.height);
  const keys=['D','I','S','C']; const max = DATA.questions.length; const w=120, gap=20, baseY=230, xStart=40; ctx.font='14px system-ui, sans-serif';
  const targetHeights = keys.map(k => (sc[k]/max)*180); let progress = 0;
  const step = ()=>{ progress = Math.min(1, progress + 0.08); ctx.clearRect(0,0,$chart.width,$chart.height);
    keys.forEach((k,i)=>{ const x=xStart+i*(w+gap); const h=targetHeights[i]*progress; ctx.fillStyle='rgba(240,113,168,0.12)'; ctx.fillRect(x, baseY-180, w, 180);
      ctx.fillStyle = COLORS[k]; const y=baseY-h, r=10; ctx.beginPath(); ctx.moveTo(x, y+r); ctx.arcTo(x, y, x+r, y, r); ctx.lineTo(x+w-r, y);
      ctx.arcTo(x+w, y, x+w, y+r, r); ctx.lineTo(x+w, y+h); ctx.lineTo(x, y+h); ctx.closePath(); ctx.fill();
      ctx.fillStyle='rgba(0,0,0,0.55)'; ctx.fillText(k, x + w/2-4, baseY+16); ctx.fillText(sc[k], x + w/2-6, y-6);
    }); if(progress<1 && animate) requestAnimationFrame(step); };
  step();
}

function showTop3(primaryType){
  const t=(primaryType.includes('×')?primaryType.split('×')[0]:primaryType);
  const list = DATA.phrases?.[t] || [];
  const top = list.slice(0,3);
  if(top.length){ $top3.classList.remove('hidden'); $top3List.innerHTML = top.map(x=>`<li>${x}</li>`).join(''); }
  else { $top3.classList.add('hidden'); }
}

function renderRx(){
  const p = ($primaryBadge.textContent.includes('×') ? $primaryBadge.textContent.split('×')[0] : $primaryBadge.textContent);
  const s = $secondaryBadge.textContent;
  const targets=[p,s];
  const box = document.getElementById('rxContent'); box.innerHTML='';
  targets.forEach(key=>{
    const rx = DATA.prescriptions[key]; if(!rx) return;
    const div = document.createElement('div'); div.className='card';
    const rep = rx.replace.map(r=>`<li><span class="pill">言い換え</span> ${r.bad} → <strong>${r.good}</strong></li>`).join('');
    const self = rx.selfTalk.map(x=>`<li>${x}</li>`).join('');
    const scripts = rx.scripts.map(s=>`<li><strong>【${s.scene}】</strong> ${s.text}</li>`).join('');
    div.innerHTML = `
      <h3><span class="badge ${key}">${key}</span> タイプの処方箋</h3>
      <p class="muted">${rx.headline}</p>
      <h4>言い換え提案</h4><ul>${rep}</ul>
      <h4>セルフ口ぐせ</h4><ul>${self}</ul>
      <h4>場面別スクリプト</h4><ul>${scripts}</ul>`;
    box.appendChild(div);
  });
}

function renderMissions(){
  const p = ($primaryBadge.textContent.includes('×') ? $primaryBadge.textContent.split('×')[0] : $primaryBadge.textContent);
  const rx = DATA.prescriptions[p]; const box = document.getElementById('missions'); box.innerHTML='';
  const items = (rx?.drills || []).slice(0,3);
  items.forEach((m,i)=>{
    const id='m'+i; const wrap=document.createElement('label'); wrap.className='choice'; wrap.innerHTML=`<input type="checkbox" id="${id}"> ${m}`;
    const saved=JSON.parse(localStorage.getItem('missions')||'{}'); if(saved[id]) wrap.querySelector('input').checked=true;
    wrap.querySelector('input').addEventListener('change', (e)=>{ const store=JSON.parse(localStorage.getItem('missions')||'{}'); store[id]=e.target.checked; localStorage.setItem('missions', JSON.stringify(store)); });
    box.appendChild(wrap);
  });
}

function showResult(){
  $quiz.classList.add('hidden'); $result.classList.remove('hidden');
  const [p,s]=primarySecondary(scores); setAccent(p); colorBadge($secondaryBadge, s);
  $scoreD.textContent=scores.D; $scoreI.textContent=scores.I; $scoreS.textContent=scores.S; $scoreC.textContent=scores.C;
  const typeKey=(p.includes('×')?p.split('×')[0]:p); $typeLine.textContent = TYPE_DESC[typeKey] || '';
  drawChart(scores,true); renderRx(); renderMissions(); showTop3(p); $bar.style.width='100%';
}

// Tabs
document.addEventListener('click', (e)=>{
  const t = e.target.closest('.tab'); if(!t) return;
  document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
  t.classList.add('active'); const tab=t.dataset.tab;
  ['summary','rx','practice'].forEach(id=>{ document.getElementById(id).classList.toggle('hidden', id!==tab); });
});

// Buttons
document.getElementById('startBtn').addEventListener('click', start);
document.getElementById('nextBtn').addEventListener('click', next);
document.getElementById('backBtn').addEventListener('click', back);
document.getElementById('restartBtn').addEventListener('click', showHome);
document.getElementById('saveBtn').addEventListener('click', ()=>{ localStorage.setItem('disc_gukuse_scores', JSON.stringify(scores)); alert('端末に保存しました。'); });
document.getElementById('clearBtn').addEventListener('click', ()=>{ localStorage.removeItem('disc_gukuse_scores'); localStorage.removeItem('missions'); alert('保存をリセットしました。'); });

if('serviceWorker' in navigator){ window.addEventListener('load', ()=>{ navigator.serviceWorker.register('./service-worker.js'); }); }

loadData().then(()=>{ showHome(); });
