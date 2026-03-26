
'use strict';

// ════════════════════════════════════════
//  DATA
// ════════════════════════════════════════
const COLS=8, ROWS=3;

// Planimetría: faces × levels
const P={
  '🍉':{f:3,l:1,color:'#2E7D32',bg:'#E8F5E9',name:'Sandía',star:true},
  '🍍':{f:2,l:2,color:'#6D4C41',bg:'#EFEBE9',name:'Piña'},
  '🥭':{f:2,l:2,color:'#E65100',bg:'#FFF3E0',name:'Mango'},
  '🍎':{f:2,l:1,color:'#B71C1C',bg:'#FFEBEE',name:'Manzana'},
  '🍊':{f:2,l:1,color:'#E65100',bg:'#FFF3E0',name:'Naranja'},
  '🍋':{f:2,l:1,color:'#F57F17',bg:'#FFFDE7',name:'Limón'},
  '🍇':{f:1,l:2,color:'#6A1B9A',bg:'#F3E5F5',name:'Uvas'},
  '🍐':{f:1,l:1,color:'#558B2F',bg:'#F1F8E9',name:'Pera'},
  '🍒':{f:1,l:1,color:'#AD1457',bg:'#FCE4EC',name:'Cerezas'},
  '🍓':{f:1,l:2,color:'#C62828',bg:'#FFEBEE',name:'Fresa'},  // CORREGIDO: ahora 1x2
  '🍑':{f:1,l:1,color:'#BF360C',bg:'#FBE9E7',name:'Durazno'},
};

// 3 layouts: 🍉 at left / center / right of row 0
// grid[row][col] = emoji
const LAYOUTS=[
  // A – 🍉 cols 0-2
  [
    ['🍉','🍉','🍉','🍍','🍍','🥭','🥭','🍒'],
    ['🍎','🍎','🍍','🍍','🥭','🥭','🍇','🍓'],
    ['🍊','🍊','🍋','🍋','🍐','🍑','🍇','🍓'],
  ],
  // B – 🍉 cols 2-4  (swap 🍍 left)
  [
    ['🍍','🍍','🍉','🍉','🍉','🥭','🥭','🍒'],
    ['🍍','🍍','🍎','🍎','🍇','🥭','🥭','🍓'],
    ['🍊','🍊','🍋','🍋','🍇','🍐','🍑','🍓'],
  ],
  // C – 🍉 cols 5-7  (🥭 left, 🍍 center)
  [
    ['🥭','🥭','🍍','🍍','🍒','🍉','🍉','🍉'],
    ['🥭','🥭','🍍','🍍','🍓','🍎','🍎','🍇'],
    ['🍊','🍊','🍋','🍋','🍑','🍐','🍓','🍇'],
  ],
];

const DIALOGS=[
  '¡Hola, aventurero! 👋 Bienvenido al <em>Mercado Feliz</em>, el mejor mercado de Emoji City.',
  'Oye… escuché que andas buscando <em>pistas</em> sobre Emoji City. Yo sé <strong>todo lo que pasa aquí</strong>. 🤫',
  '¡Pero estoy en apuros! Llegó el camión de entrega y mi estantería está <em>completamente vacía</em>. 📦😰',
  'Cada fruta tiene una <em>planimetría</em>: ocupa un número exacto de <strong>caras y niveles</strong> en la estantería.',
  'Si me ayudas a organizarla y colocas el <strong>producto estrella ⭐</strong>... <em>te cuento todo lo que sé</em>. ¡Trato hecho! 🤝',
];

const HINTS=[
  [
    {t:'El diagrama ■ en la lista te muestra cuánto espacio ocupa cada fruta. Por ejemplo <em>🍍 Piña = 2 caras × 2 niveles</em>.'},
    {t:'Arrastra la fruta hacia la estantería. El juego coloca el bloque completo. Si hay algún conflicto, las celdas <em>parpadean en rojo</em>.'},
    {t:'Para mover una fruta ya colocada, <strong>arrástrala de nuevo</strong> desde la estantería hacia otro lugar libre.'},
  ],
  [
    {t:'Consejo: coloca primero los <em>productos grandes</em> (🍍 y 🥭, que son 2×2) para asegurar su espacio.'},
    {t:'La <strong>Sandía 🍉 siempre va en la fila superior</strong> — ocupa 3 caras seguidas. ¡Búscale espacio ahí!'},
  ],
  [
    {t:'¡Último consejo! Una vez colocados 🍍 🥭 y 🍉, los espacios restantes se llenan solos con los productos pequeños.'},
    {t:'¿Ves las celdas que parpadean en dorado? Eso es donde <strong>debe ir la sandía ⭐</strong>.'},
  ],
];

// ════════════════════════════════════════
//  INTRO / DIALOG
// ════════════════════════════════════════
let dlgIdx=0;
function renderDlg(){
  document.getElementById('dlgTxt').innerHTML=DIALOGS[dlgIdx];
  const btn=document.getElementById('btnDlg');
  btn.textContent=dlgIdx>=DIALOGS.length-1?'¡Acepto el trato! 🤝':'Siguiente ›';
  if(dlgIdx>=DIALOGS.length-1){
    btn.style.background='linear-gradient(135deg,#FF6F00,#E65100)';
    btn.style.boxShadow='0 4px 0 #BF360C,0 6px 18px rgba(255,111,0,.3)';
  }
}
function nextDlg(){
  if(dlgIdx>=DIALOGS.length-1){startGame();return;}
  dlgIdx++;
  renderDlg();
}

// ════════════════════════════════════════
//  STATE
// ════════════════════════════════════════
let LAYOUT;
let grid;       // grid[r][c] = null | {emoji,gid}
let groups;     // gid -> {emoji,cells:[{r,c}]}
let gidSeq;
let hintIdx=0;
let drag=null;  // {emoji,fromGid|null}
let touchId=null;
let highlighted=[];
let mangoTimer;

// ════════════════════════════════════════
//  START GAME
// ════════════════════════════════════════
function startGame(){
  console.log('Mercado: startGame() executing...');
  LAYOUT=LAYOUTS[Math.floor(Math.random()*3)];
  console.log('Mercado: LAYOUT selected:', LAYOUT[0]);
  grid=Array.from({length:ROWS},()=>Array(COLS).fill(null));
  console.log('Mercado: grid created');
  groups={};gidSeq=0;
  console.log('Mercado: hiding sIntro, showing sGame');
  const sIntro = document.getElementById('sIntro');
  const sGame = document.getElementById('sGame');
  console.log('Mercado: sIntro element:', sIntro);
  console.log('Mercado: sGame element:', sGame);
  if(sIntro) sIntro.classList.add('off');
  if(sGame) sGame.classList.remove('off');
  console.log('Mercado: building cells...');
  buildCells();
  console.log('Mercado: building tray...');
  buildTray();
  console.log('Mercado: updating HUD...');
  updateHUD();
  // Check if CSS loaded
const styles = document.querySelectorAll('link[rel="stylesheet"]');
console.log('Mercado: CSS links found:', styles.length);
styles.forEach((s, i) => console.log('Mercado: CSS ' + i + ':', s.href));

// Check dimensions inside iframe only (no cross-origin)
setTimeout(() => {
  // Debug: add colored background to see if iframe has size
  document.body.style.background = 'linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1)';
  document.body.style.minHeight = '100vh';
  
  const sGame = document.getElementById('sGame');
  if (sGame) {
    sGame.style.background = '#ffffff';
    const computed = window.getComputedStyle(sGame);
    console.log('Mercado: sGame display:', computed.display);
    console.log('Mercado: sGame height:', computed.height);
    console.log('Mercado: sGame width:', computed.width);
  }
}, 500);
}

// ════════════════════════════════════════
//  BUILD CELLS
// ════════════════════════════════════════
function buildCells(){
  for(let r=0;r<ROWS;r++){
    const row=document.getElementById('row'+r);
    row.innerHTML='';
    for(let c=0;c<COLS;c++){
      const el=document.createElement('div');
      el.className='cell';
      el.dataset.r=r; el.dataset.c=c;
      // star hint
      if(LAYOUT[r][c]==='🍉') el.classList.add('star-hint');
      el.addEventListener('mousedown',onCellMD);
      el.addEventListener('touchstart',onCellTS,{passive:false});
      row.appendChild(el);
    }
  }
}

function cellEl(r,c){return document.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);}

// ════════════════════════════════════════
//  BUILD TRAY
// ════════════════════════════════════════
function buildTray(){
  const tray=document.getElementById('tray');
  tray.innerHTML='';
  ['🍉','🍍','🥭','🍎','🍊','🍋','🍇','🍐','🍒','🍓','🍑'].forEach(em=>{
    if(!P[em])return;
    tray.appendChild(makeTI(em));
  });
}

function makeTI(em){
  const p=P[em];
  const d=document.createElement('div');
  d.className='ti'; d.id='ti-'+em; d.dataset.em=em;
  if(p.star){const b=document.createElement('div');b.className='ti-star';b.textContent='⭐ ESTRELLA';d.appendChild(b);}
  const eSpan=document.createElement('span');eSpan.className='ti-em';eSpan.textContent=em;
  const info=document.createElement('div');info.style.flex='1';info.style.minWidth='0';
  const nm=document.createElement('div');nm.className='ti-nm';nm.textContent=p.name;
  const planRow=document.createElement('div');planRow.className='ti-plan';
  const shape=document.createElement('div');shape.className='ti-shape';
  shape.style.gridTemplateColumns=`repeat(${p.f},8px)`;shape.style.gridTemplateRows=`repeat(${p.l},8px)`;
  for(let i=0;i<p.f*p.l;i++){const sc=document.createElement('div');sc.className='ti-sc';sc.style.background=p.color;shape.appendChild(sc);}
  const txt=document.createElement('div');txt.className='ti-txt';txt.textContent=`${p.f} cara${p.f>1?'s':''} × ${p.l} nivel${p.l>1?'es':''}`;
  planRow.appendChild(shape);planRow.appendChild(txt);
  info.appendChild(nm);info.appendChild(planRow);
  d.appendChild(eSpan);d.appendChild(info);
  d.addEventListener('mousedown',e=>beginDragTray(em,e));
  d.addEventListener('touchstart',e=>beginDragTrayT(em,e),{passive:false});
  return d;
}

function tiState(em,state){
  const d=document.getElementById('ti-'+em);
  if(!d)return;
  d.classList.remove('placed','dragging');
  const chk=d.querySelector('.ti-check');if(chk)chk.remove();
  if(state==='placed'){d.classList.add('placed');const c=document.createElement('span');c.className='ti-check';c.textContent='✅';d.appendChild(c);}
  else if(state==='dragging'){d.classList.add('dragging');}
}

// ════════════════════════════════════════
//  DRAG – SHARED
// ════════════════════════════════════════
function beginDrag(em,fromGid,x,y){
  const p=P[em];if(!p)return;
  const ghost=document.getElementById('ghost');
  ghost.innerHTML='';
  ghost.style.display='grid';
  ghost.style.gridTemplateColumns=`repeat(${p.f},var(--cs))`;
  ghost.style.gridTemplateRows=`repeat(${p.l},var(--cs))`;
  ghost.style.gap='var(--gap)';
  for(let i=0;i<p.f*p.l;i++){
    const gc=document.createElement('div');gc.className='gcell';
    gc.style.background=p.bg;gc.style.borderColor=p.color;
    gc.style.width='var(--cs)';gc.style.height='var(--cs)';
    gc.textContent=em;ghost.appendChild(gc);
  }
  drag={em,fromGid};
  posGhost(x,y);
  tiState(em,'dragging');
}

function posGhost(x,y){
  const g=document.getElementById('ghost');
  g.style.left=x+'px';g.style.top=y+'px';
}

function endDrag(x,y){
  clearHL();
  document.getElementById('ghost').style.display='none';
  if(!drag)return;
  const cell=cellAt(x,y);
  if(cell){
    const r=+cell.dataset.r,c=+cell.dataset.c;
    const ok=tryPlace(drag.em,r,c);
    if(!ok){
      flashArea(drag.em,r,c,'fbad');
      tiState(drag.em,'available');
      mangoSay(badMsg(drag.em));
    }
  }else{
    tiState(drag.em,'available');
  }
  drag=null;touchId=null;
}

function moveDrag(x,y){
  if(!drag)return;
  posGhost(x,y);
  const cell=cellAt(x,y);
  if(cell) hlPlan(drag.em,+cell.dataset.r,+cell.dataset.c);
  else clearHL();
}

// ════════════════════════════════════════
//  MOUSE EVENTS
// ════════════════════════════════════════
function beginDragTray(em,e){
  if(document.getElementById('ti-'+em).classList.contains('placed'))return;
  e.preventDefault();
  beginDrag(em,null,e.clientX,e.clientY);
}

function onCellMD(e){
  const el=e.currentTarget;
  const gid=el.dataset.gid?+el.dataset.gid:null;
  if(!gid||!groups[gid])return;
  e.preventDefault();e.stopPropagation();
  const em=groups[gid].emoji;
  liftGroup(gid);
  beginDrag(em,gid,e.clientX,e.clientY);
}

document.addEventListener('mousemove',e=>{if(drag)moveDrag(e.clientX,e.clientY);});
document.addEventListener('mouseup',e=>{if(drag)endDrag(e.clientX,e.clientY);});

// ════════════════════════════════════════
//  TOUCH EVENTS
// ════════════════════════════════════════
function beginDragTrayT(em,e){
  if(document.getElementById('ti-'+em).classList.contains('placed'))return;
  e.preventDefault();
  const t=e.touches[0];touchId=t.identifier;
  beginDrag(em,null,t.clientX,t.clientY);
}

function onCellTS(e){
  const el=e.currentTarget;
  const gid=el.dataset.gid?+el.dataset.gid:null;
  if(!gid||!groups[gid])return;
  e.preventDefault();e.stopPropagation();
  const em=groups[gid].emoji;
  const t=e.touches[0];touchId=t.identifier;
  liftGroup(gid);
  beginDrag(em,gid,t.clientX,t.clientY);
}

document.addEventListener('touchmove',e=>{
  if(!drag)return;
  e.preventDefault();
  const t=[...e.touches].find(t=>t.identifier===touchId)||e.touches[0];
  moveDrag(t.clientX,t.clientY);
},{passive:false});

document.addEventListener('touchend',e=>{
  if(!drag)return;
  const t=[...e.changedTouches].find(t=>t.identifier===touchId)||e.changedTouches[0];
  endDrag(t.clientX,t.clientY);
},{passive:false});

// ════════════════════════════════════════
//  PLACEMENT LOGIC
// ════════════════════════════════════════
function canPlace(em,r0,c0){
  const p=P[em];if(!p)return false;
  if(c0+p.f>COLS||r0+p.l>ROWS)return false;
  for(let r=r0;r<r0+p.l;r++)
    for(let c=c0;c<c0+p.f;c++)
      if(grid[r][c])return false;
  return true;
}

function tryPlace(em,r0,c0){
  if(!canPlace(em,r0,c0))return false;
  const p=P[em];
  const gid=++gidSeq;
  const cells=[];
  for(let r=r0;r<r0+p.l;r++){
    for(let c=c0;c<c0+p.f;c++){
      grid[r][c]={emoji:em,gid};
      cells.push({r,c});
    }
  }
  groups[gid]={emoji:em,cells};
  renderCells(cells);
  flashCells(cells,'fok');
  tiState(em,'placed');
  updateHUD();
  checkWin();
  return true;
}

function liftGroup(gid){
  const g=groups[gid];if(!g)return;
  g.cells.forEach(({r,c})=>grid[r][c]=null);
  delete groups[gid];
  tiState(g.emoji,'dragging');
  renderCells(g.cells);
  updateHUD();
}

// ════════════════════════════════════════
//  RENDER
// ════════════════════════════════════════
function renderCells(cells){
  cells.forEach(({r,c})=>{
    const el=cellEl(r,c);if(!el)return;
    const s=grid[r][c];
    if(s){
      const p=P[s.emoji];
      el.textContent=s.emoji;
      el.style.background=p.bg;
      el.style.borderColor=p.color;
      el.style.borderStyle='solid';
      el.dataset.gid=s.gid;
      el.classList.add('filled');
      el.classList.remove('star-hint');
    }else{
      el.textContent='';
      el.style.background='';
      el.style.borderColor='';
      el.style.borderStyle='';
      el.dataset.gid='';
      el.classList.remove('filled');
      if(LAYOUT[r][c]==='🍉')el.classList.add('star-hint');
    }
  });
}

function flashCells(cells,cls){
  cells.forEach(({r,c})=>{
    const el=cellEl(r,c);if(!el)return;
    el.classList.remove(cls);void el.offsetWidth;
    el.classList.add(cls);setTimeout(()=>el.classList.remove(cls),450);
  });
}

function flashArea(em,r0,c0,cls){
  const p=P[em];if(!p)return;
  const cells=[];
  for(let r=r0;r<Math.min(r0+p.l,ROWS);r++)
    for(let c=c0;c<Math.min(c0+p.f,COLS);c++)
      cells.push({r,c});
  flashCells(cells,cls);
}

// ════════════════════════════════════════
//  HIGHLIGHT
// ════════════════════════════════════════
function hlPlan(em,r0,c0){
  clearHL();
  const p=P[em];if(!p)return;
  const valid=canPlace(em,r0,c0);
  for(let r=r0;r<r0+p.l;r++){
    for(let c=c0;c<c0+p.f;c++){
      if(r>=ROWS||c>=COLS)continue;
      const el=cellEl(r,c);if(!el)continue;
      el.classList.add(valid?'hl-ok':'hl-bad');
      highlighted.push(el);
    }
  }
}

function clearHL(){
  highlighted.forEach(el=>el.classList.remove('hl-ok','hl-bad'));
  highlighted=[];
}

// ════════════════════════════════════════
//  CELL AT POINT
// ════════════════════════════════════════
function cellAt(x,y){
  const g=document.getElementById('ghost');
  g.style.display='none';
  let el=document.elementFromPoint(x,y);
  g.style.display='grid';
  if(!el)return null;
  if(el.classList.contains('cell'))return el;
  el=el.closest('.cell');
  return el||null;
}

// ════════════════════════════════════════
//  HUD & PROGRESS
// ════════════════════════════════════════
function updateHUD(){
  let n=0;
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)if(grid[r][c])n++;
  document.getElementById('placedC').textContent=n;
  document.getElementById('totalC').textContent=ROWS*COLS;
  document.getElementById('progBar').style.width=Math.round(n/(ROWS*COLS)*100)+'%';
}

// ════════════════════════════════════════
//  WIN
// ════════════════════════════════════════
function checkWin(){
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)if(!grid[r][c])return;
  setTimeout(showWin,600);
}

function showWin(){
  const CONF=['🍉','⭐','🎉','✨','🏆','🍃','💚','🌟'];
  for(let i=0;i<22;i++){
    setTimeout(()=>{
      const c=document.createElement('div');c.className='cf';
      c.textContent=CONF[Math.floor(Math.random()*CONF.length)];
      c.style.left=Math.random()*100+'vw';
      c.style.animationDuration=(.65+Math.random()*.75)+'s';
      c.style.animationDelay=(Math.random()*.35)+'s';
      document.body.appendChild(c);
      setTimeout(()=>c.remove(),1900);
    },i*55);
  }
  document.getElementById('clueBody').innerHTML=
    'La <strong>🍉 Sandía</strong> es la fruta oficial de Emoji City y de todo Emoji World.<br>¡Díselo a <strong>Emma</strong> para completar tu misión!';
  document.getElementById('winOv').classList.add('show');
}

function closeWin(){
  document.getElementById('winOv').classList.remove('show');
  toast('🗝️ ¡Habla con Emma en el mapa y dile: SANDÍA 🍉!');
  // Notificar al juego principal que se completó el mercado
  if (window.parent) {
    window.parent.postMessage({ type: 'MERCADOVICTORY' }, '*');
  }
}

// ════════════════════════════════════════
//  DON MANGO MESSAGES
// ════════════════════════════════════════
function mangoSay(msg){
  clearTimeout(mangoTimer);
  document.getElementById('mangoMsg').innerHTML=msg;
  mangoTimer=setTimeout(()=>{
    document.getElementById('mangoMsg').innerHTML=
      'Arrastra las frutas a la estantería. <em>Cada una tiene su planimetría</em> — fíjate en el diagrama ■ de la lista.';
  },4000);
}

function badMsg(em){
  const p=P[em];
  const opts=[
    `¡No hay espacio para ${em}! Necesita ${p.f} cara${p.f>1?'s':''} × ${p.l} nivel${p.l>1?'es':''} libres. 📦`,
    `${em} no cabe ahí — está ocupado. <em>Mueve algo</em> para hacer espacio.`,
    `¡Ese hueco es muy pequeño para ${em}! Necesita ${p.f*p.l} celdas juntas. 🤔`,
  ];
  return opts[Math.floor(Math.random()*opts.length)];
}

// ════════════════════════════════════════
//  HINT PANEL
// ════════════════════════════════════════
function showHint(){
  const msgs=HINTS[Math.min(hintIdx,HINTS.length-1)];
  document.getElementById('hintMsgs').innerHTML=msgs.map(m=>`<div class="hint-msg">${m.t}</div>`).join('');
  document.getElementById('hintOv').classList.add('show');
  hintIdx++;
}

function closeHint(e){
  if(!e||e.target===document.getElementById('hintOv'))
    document.getElementById('hintOv').classList.remove('show');
}

// ════════════════════════════════════════
//  EMOJI KEYBOARD INPUT
// ════════════════════════════════════════
const eField=document.getElementById('eField');

eField.addEventListener('input',function(){
  const em=firstEmoji(this.value.trim());
  if(em){
    const item=document.getElementById('ti-'+em);
    if(item&&!item.classList.contains('placed')){
      document.querySelectorAll('.ti').forEach(i=>i.style.outline='');
      item.style.outline='3px solid var(--gold)';
      item.scrollIntoView({behavior:'smooth',block:'nearest'});
    }
  }
});

function addFromField(){
  const val=eField.value.trim();
  eField.value='';
  document.querySelectorAll('.ti').forEach(i=>i.style.outline='');
  if(!val){toast('Escribe un emoji del teclado 📱');return;}
  const em=firstEmoji(val);
  if(!em){toast('No reconocí un emoji. Prueba: 🍉 🍎 🍊 🍋 🍍');return;}
  if(P[em]){
    const item=document.getElementById('ti-'+em);
    if(item&&item.classList.contains('placed')){mangoSay(`¡Ya colocaste ${em}! Está en la estantería. ✅`);}
    else if(item){
      mangoSay(`¡Perfecto! Ahora <em>arrastra ${em}</em> a la estantería. 🎯`);
      item.style.outline='3px solid var(--gold)';
      setTimeout(()=>item.style.outline='',2500);
      item.scrollIntoView({behavior:'smooth',block:'nearest'});
    }
  }else{
    mangoSay(`${em} no está en el pedido de hoy 😅 Prueba: <strong>🍉 🍍 🥭 🍎 🍊 🍋 🍇 🍐 🍒 🍓 🍑</strong>`);
  }
}

eField.addEventListener('keydown',e=>{if(e.key==='Enter')addFromField();});

function firstEmoji(s){
  const m=s.match(/\p{Emoji_Presentation}\uFE0F?(?:\u200D\p{Emoji_Presentation}\uFE0F?)*|\p{Emoji}\uFE0F/gu);
  return m?m[0]:null;
}

// ════════════════════════════════════════
//  TOAST
// ════════════════════════════════════════
let toastT;
function toast(msg){
  clearTimeout(toastT);
  const el=document.getElementById('toast');
  el.textContent=msg;el.classList.add('show');
  toastT=setTimeout(()=>el.classList.remove('show'),2800);
}

// Auto-start when loaded in iframe
const isIframe = window.parent && window.parent !== window;

if (isIframe) {
  document.addEventListener('DOMContentLoaded', function() {
    try {
      requestAnimationFrame(function() {
        requestAnimationFrame(function() {
          if (typeof startGame === 'function') {
            startGame();
          }
          if (window.parent) window.parent.postMessage({ type: 'MERCADO_READY' }, '*');
        });
      });
    } catch(e) { console.error('Mercado iframe init error:', e); }
  });
} else {
  document.addEventListener('DOMContentLoaded', function() {
    renderDlg();
  });
}

