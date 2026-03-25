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
let answers = [];
let scores = {D:0,I:0,S:0,C:0};

// 追加質問フェーズ用
let isTiebreak = false;
let tiebreakIdx = 0;
let tiebreakTypes = [];   // 同点タイプの配列（例：['D','I','S']）
let tiebreakAnswers = []; // 追加質問の回答

// 追加質問：2タイプ間の決戦用（全6パターン）
const TIEBREAK_QUESTIONS = {
  'DI': [
    { text: '目標を達成したとき、まず思うことは？',
      choices: [{ label: '「次はもっと大きな目標へ！」', type: 'D' }, { label: '「みんなに報告して一緒に喜びたい！」', type: 'I' }] },
    { text: '大切なのはどちら？',
      choices: [{ label: '結果とスピード', type: 'D' }, { label: '盛り上がりと共感', type: 'I' }] },
    { text: 'ピンチの時、あなたは？',
      choices: [{ label: '素早く判断して動く', type: 'D' }, { label: '周りを明るく鼓舞する', type: 'I' }] }
  ],
  'DS': [
    { text: 'プロジェクトで大切にすることは？',
      choices: [{ label: 'スピードと成果', type: 'D' }, { label: 'チームの安定と信頼', type: 'S' }] },
    { text: 'あなたの自然な動き方は？',
      choices: [{ label: '自分が先頭に立って引っ張る', type: 'D' }, { label: '周りを支えながら着実に進める', type: 'S' }] },
    { text: '困った時に頼りにするのは？',
      choices: [{ label: '自分の直感と行動力', type: 'D' }, { label: 'これまでの経験と周囲との絆', type: 'S' }] }
  ],
  'DC': [
    { text: '決断するとき、あなたは？',
      choices: [{ label: '直感で素早く決める', type: 'D' }, { label: 'データを集めてから慎重に決める', type: 'C' }] },
    { text: '新しいことを始めるとき、大事なのは？',
      choices: [{ label: 'とにかく動き出すこと', type: 'D' }, { label: 'しっかり計画してから動くこと', type: 'C' }] },
    { text: 'ミスをしたとき、まず何をしますか？',
      choices: [{ label: '即座に対応策を実行する', type: 'D' }, { label: '原因を分析して再発を防ぐ', type: 'C' }] }
  ],
  'IS': [
    { text: '楽しい時間を過ごすとき、どちらに近い？',
      choices: [{ label: 'みんなでワイワイしていたい', type: 'I' }, { label: '親しい人と静かに過ごしたい', type: 'S' }] },
    { text: '人との関係で大切にしていることは？',
      choices: [{ label: '楽しさと盛り上がり', type: 'I' }, { label: '安心感と信頼', type: 'S' }] },
    { text: '誰かを元気づけるとき、あなたは？',
      choices: [{ label: '明るい話や笑いで気分を上げる', type: 'I' }, { label: 'そばにいてじっくり話を聞く', type: 'S' }] }
  ],
  'IC': [
    { text: '新しいアイデアが浮かんだとき、あなたは？',
      choices: [{ label: 'すぐ周りに話して盛り上げたい', type: 'I' }, { label: 'まず整理して検証してから共有したい', type: 'C' }] },
    { text: '会議で大切にすることは？',
      choices: [{ label: '全員が発言しやすい雰囲気をつくること', type: 'I' }, { label: '正確な情報をもとに議論すること', type: 'C' }] },
    { text: '仕事のやりがいを感じるのは？',
      choices: [{ label: '人と一緒に盛り上がれたとき', type: 'I' }, { label: '丁寧にやり遂げて品質が上がったとき', type: 'C' }] }
  ],
  'SC': [
    { text: 'トラブルが起きたとき、まず何をしますか？',
      choices: [{ label: '周りを安心させて落ち着かせる', type: 'S' }, { label: '原因を分析して対策を考える', type: 'C' }] },
    { text: '仕事で誇りに思うことは？',
      choices: [{ label: 'チームのために陰で支え続けること', type: 'S' }, { label: '正確で質の高い仕事をすること', type: 'C' }] },
    { text: '新しい環境に入るとき、あなたは？',
      choices: [{ label: 'まず周りに馴染んで信頼関係をつくる', type: 'S' }, { label: 'ルールや仕組みをしっかり理解する', type: 'C' }] }
  ]
};

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
function start(){
  idx=0; isTiebreak=false; tiebreakIdx=0; tiebreakTypes=[]; tiebreakAnswers=[];
  answers = Array(DATA.questions.length).fill(null); scores={D:0,I:0,S:0,C:0};
  $home.classList.add('hidden'); $result.classList.add('hidden'); $quiz.classList.remove('hidden');
  renderQuestion();
}

function shuffled(arr){ const a = arr.map(x=>({...x})); for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]];} return a; }

function renderQuestion(){
  if(isTiebreak){ renderTiebreakQuestion(); return; }
  const q = DATA.questions[idx];
  $qIndex.textContent = (idx+1);
  $qText.textContent = q.text;
  $choices.innerHTML = '';
  const list = shuffled(q.choices);
  list.forEach(c=>{
    const div = document.createElement('div');
    div.className='choice';
    div.textContent=c.label;
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

function renderTiebreakQuestion(){
  // 同点タイプが2つに絞られていたら対決質問、3つ以上なら最初の2つで対決
  const types = tiebreakTypes;
  const key = [types[0], types[1]].sort().join('');
  const qs = TIEBREAK_QUESTIONS[key] || [];
  const q = qs[tiebreakIdx % qs.length];

  const total = DATA.questions.length;
  $qIndex.textContent = total + tiebreakIdx + 1;
  $bar.style.width = '95%';

  // 追加質問であることをわかりやすく表示
  $qText.innerHTML = `<span style="font-size:0.75em;color:#f071a8;display:block;margin-bottom:6px;">🌸 同点のため追加質問（${types.join('・')}タイプが同点です）</span>${q.text}`;
  $choices.innerHTML = '';
  $back.disabled = true;
  $next.disabled = true;

  q.choices.forEach(c=>{
    const div = document.createElement('div');
    div.className='choice';
    div.textContent=c.label;
    div.addEventListener('click', ()=>{
      document.querySelectorAll('.choice').forEach(ch=>ch.style.outline='');
      div.style.outline=`2px solid ${COLORS[c.type]}`;
      // 選択したタイプにポイントを加算して即判定
      scores[c.type]++;
      tiebreakAnswers.push(c.type);
      setTimeout(()=>{ checkTiebreak(); }, 350);
    });
    $choices.appendChild(div);
  });
}

function checkTiebreak(){
  // 現在の同点タイプを再計算
  const max = Math.max(...tiebreakTypes.map(t=>scores[t]));
  const tied = tiebreakTypes.filter(t=>scores[t]===max);

  if(tied.length===1){
    // 決着がついた
    showResult();
  } else if(tiebreakIdx < 2){
    // まだ追加質問が残っている
    tiebreakIdx++;
    tiebreakTypes = tied; // 絞り込まれたタイプで続ける
    renderTiebreakQuestion();
  } else {
    // 3問やっても決まらない場合はスコアが高い方を選ぶ（最終手段）
    const finalType = tied[0]; // アルファベット順で先のタイプ
    scores[finalType]++;       // 1点加算して決定
    showResult();
  }
}

function getTiedTypes(){
  const max = Math.max(scores.D, scores.I, scores.S, scores.C);
  return Object.keys(scores).filter(t=>scores[t]===max);
}

function next(){
  if(isTiebreak) return; // 追加質問中は next ボタン不使用
  if(answers[idx]==null)return;
  if(idx<DATA.questions.length-1){ idx++; renderQuestion(); }
  else {
    compute();
    const tied = getTiedTypes();
    if(tied.length >= 2){
      // 同点 → 追加質問フェーズへ
      isTiebreak = true;
      tiebreakIdx = 0;
      tiebreakTypes = tied.slice(0,2); // 上位2タイプで対決開始
      $back.disabled = true;
      $next.disabled = true;
      renderTiebreakQuestion();
    } else {
      showResult();
    }
  }
}

function back(){ if(idx===0||isTiebreak)return; idx--; renderQuestion(); }
function compute(){ scores={D:0,I:0,S:0,C:0}; answers.forEach(t=>{ if(t) scores[t]++; }); }

function primarySecondary(sc){
  const e=Object.entries(sc).sort((a,b)=>b[1]-a[1]);
  const [p1,v1]=e[0],[p2,v2]=e[1];
  // 追加質問で同点は解消済みなので、基本的に単独1位になっているはず
  return [p1[0], p2[0]];
}

function setAccent(primaryType){
  const t=(primaryType.includes('×')?primaryType.split('×')[0]:primaryType);
  const color=COLORS[t]||'#f071a8';
  document.documentElement.style.setProperty('--accent', color);
  $primaryBadge.className=`badge ${t}`;
  $primaryBadge.textContent=primaryType;
}

function colorBadge($el,t){ $el.className=`badge ${t}`; $el.textContent=t; }

function drawChart(sc, animate=true){
  const ctx = $chart.getContext('2d'); ctx.clearRect(0,0,$chart.width,$chart.height);
  const keys=['D','I','S','C']; const max = DATA.questions.length + tiebreakAnswers.length;
  const w=120, gap=20, baseY=230, xStart=40; ctx.font='14px system-ui, sans-serif';
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
