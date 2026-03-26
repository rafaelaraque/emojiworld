// ── CAVE LEVEL ─────────────────────────────────────────────────────────────
(function () {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  const ZOOM = 2.0;   // Vista más cercana
  const CEIL_H = 340, SHAFT_W = 240, SHAFT_HT = 2600;
  let roadY, CEIL_Y, HORIZ_END, SHAFT_L, SHAFT_R, SHAFT_MID, SHAFT_TOP_Y;
  let abyssX, abyssW;

  let platforms = [], enemies = [], obstacles = [], brickWalls = [];
  let projectiles = [], particles = [], rainDrops = [], bubbles = [], puddles = [];
  let drops = [], boss = null, stalactites = [];
  let shaftEnemies = [];
  let flameHazards = [];

  let hearts = 3, energy = 100, gunAmmo = 0, frameCount = 0;
  let rainOn = false, windOn = false, bubblesOn = false, lightOn = false;
  let gameActive = false, victoryDone = false, inShaft = false;
  let cameraX = 0, cameraY = 0;
  let atkCd = 0;
  let bossRageTriggered = false;
  let playerHasRing = false;

  let keys = { left: false, right: false, jump: false, attack: false };
  let prevKeys = { jump: false, attack: false };
  let player = null;
  let slots = [null, null, null, null, null], actionSlot = null;
  let recentItems = [];

  function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  function VW() { return canvas.width / ZOOM; }
  function VH() { return canvas.height / ZOOM; }
  window.addEventListener('resize', resize);
  resize();

  // ── AUDIO ──────────────────────────────────────────────────────────────────
  let _ac = null;
  function AC() {
    if (!_ac) { try { _ac = new (window.AudioContext || window.webkitAudioContext)(); } catch(e){ return null; } }
    if (_ac.state === 'suspended') _ac.resume().catch(()=>{});
    return _ac;
  }
  function osc(type,f0,f1,vol,dur){const ac=AC();if(!ac)return;const o=ac.createOscillator(),g=ac.createGain(),t=ac.currentTime+.01;o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.linearRampToValueAtTime(f1,t+dur);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+dur);}
  function nz(vol,dur){const ac=AC();if(!ac)return;const buf=ac.createBuffer(1,ac.sampleRate*dur,ac.sampleRate),d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;const src=ac.createBufferSource(),g=ac.createGain(),t=ac.currentTime+.01;src.buffer=buf;g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);src.connect(g);g.connect(ac.destination);src.start(t);}
  function SFX_hurt(){osc('sawtooth',400,100,.15,.25);}
  function SFX_land(){osc('sine',120,60,.08,.1);}
  function SFX_jump(){osc('sine',260,480,.1,.15);}
  function SFX_pick(){osc('sine',600,1200,.12,.2);}
  function SFX_boom(){nz(.2,.6);osc('sawtooth',200,30,.25,.4);}
  function SFX_eat(){osc('sine',500,850,.14,.2);}
  function SFX_shoot(){osc('sine',1100,350,.1,.28);}
  function SFX_bub(){osc('sine',300,900,.22,.1);}
  function SFX_splash(){nz(.22,.18);}
  function SFX_wind(){nz(.6,.1);}
  function SFX_acid(){osc('sine',800,200,.08,.3);}
  function SFX_rage(){osc('sawtooth',100,400,.3,.8);nz(.3,.8);}

  let musicOn = false, mTimers = [];
  const MNOTES = [220,196,164.81,174.61,196,220,246.94,220];
  function startMusic(){
    if(musicOn)return;musicOn=true;
    function loop(){if(!musicOn)return;const ac=AC();if(!ac)return;const beat=60/55;
      MNOTES.forEach((f,i)=>{const id=setTimeout(()=>{if(!musicOn)return;const ac2=AC();if(!ac2)return;const t=ac2.currentTime+.01,o=ac2.createOscillator(),g=ac2.createGain();o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(.07,t);g.gain.exponentialRampToValueAtTime(.001,t+beat*.8);o.connect(g);g.connect(ac2.destination);o.start(t);o.stop(t+beat*.85);},i*beat*1000);mTimers.push(id);});
      mTimers.push(setTimeout(loop,MNOTES.length*beat*1000));}loop();
  }
  function stopMusic(){musicOn=false;mTimers.forEach(clearTimeout);mTimers=[];}

  // ── WORLD ──────────────────────────────────────────────────────────────────
  function makeStalactites(){
    stalactites=[];
    for(let i=0;i<80;i++){const s=i<50?'h':'v';stalactites.push({s,x:s==='h'?Math.random()*(HORIZ_END-80)+40:SHAFT_L+Math.random()*SHAFT_W,y:s==='h'?CEIL_Y-Math.random()*6:SHAFT_TOP_Y+Math.random()*SHAFT_HT*.9,h:12+Math.random()*30,w:4+Math.random()*13,sh:Math.random()});}
  }

  function generateWebLines(){
    if(!boss)return; boss.webLines=[];
    const R=110,cx=boss.hangX,cy=boss.hangY-10,spokes=8;
    for(let i=0;i<spokes;i++){const a=(i/spokes)*Math.PI*2;boss.webLines.push({x1:cx,y1:cy,x2:cx+Math.cos(a)*R,y2:cy+Math.sin(a)*R});}
    const rings=4;
    for(let r=1;r<=rings;r++){const rad=R*(r/rings);for(let i=0;i<spokes;i++){const a1=(i/spokes)*Math.PI*2,a2=((i+1)/spokes)*Math.PI*2;boss.webLines.push({x1:cx+Math.cos(a1)*rad,y1:cy+Math.sin(a1)*rad,x2:cx+Math.cos(a2)*rad,y2:cy+Math.sin(a2)*rad});}}
  }

  function generateWorld(){
    platforms=[];enemies=[];obstacles=[];brickWalls=[];
    projectiles=[];particles=[];rainDrops=[];bubbles=[];puddles=[];
    drops=[];boss=null;shaftEnemies=[];flameHazards=[];
    bossRageTriggered=false;

    roadY=VH()-55; CEIL_Y=roadY-CEIL_H;
    HORIZ_END=2850; SHAFT_L=HORIZ_END-SHAFT_W; SHAFT_R=HORIZ_END;
    SHAFT_MID=(SHAFT_L+SHAFT_R)/2; SHAFT_TOP_Y=CEIL_Y-SHAFT_HT;
    abyssX=1750; abyssW=380;

    platforms.push({x:0,y:roadY,w:abyssX,h:20,type:'ground'});
    platforms.push({x:abyssX+abyssW,y:roadY,w:HORIZ_END-abyssX-abyssW+50,h:20,type:'ground'});
    [{x:180,y:roadY-95,w:110},{x:400,y:roadY-80,w:100},{x:610,y:roadY-125,w:90},{x:810,y:roadY-80,w:105},{x:1030,y:roadY-110,w:95},{x:1230,y:roadY-75,w:110},{x:1440,y:roadY-140,w:88},{x:1650,y:roadY-90,w:100},{x:2100,y:roadY-80,w:110},{x:2300,y:roadY-125,w:90},{x:2500,y:roadY-90,w:100}].forEach(p=>platforms.push({...p,h:20,type:'platform'}));

    const spy=[CEIL_Y-340,CEIL_Y-680,CEIL_Y-1020,CEIL_Y-1360,CEIL_Y-1700,CEIL_Y-2040,CEIL_Y-2380];
    spy.forEach((py,i)=>{const px=i%2===0?SHAFT_L+8:SHAFT_L+SHAFT_W-108;platforms.push({x:px,y:py,w:100,h:20,type:'platform'});});

    const bw=(x,hp=2)=>brickWalls.push({x,y:CEIL_Y,w:28,h:roadY-CEIL_Y,hp,dead:false,hit:0});
    bw(500,2);bw(920,2);bw(1340,3);bw(1960,2);bw(2250,3);bw(2450,2);
    [660,1100,1560,2020,2440].forEach(x=>obstacles.push({x,y:roadY-20,w:36,h:36,type:'fire',dead:false,hint:false,ff:0}));
    [700,1320].forEach(x=>puddles.push({x,y:roadY+2,w:80,h:14,active:true}));

    [270,580,1000,1330,2050,2380,2680].forEach((x,i)=>enemies.push({x,y:i%2===0?roadY-20:roadY-CEIL_H*.55,w:28,h:28,type:i%2===0?'spider':'bat',hp:i%2===0?2:1,vx:i%2===0?1.0:1.3,minX:x-80,maxX:x+80,dead:false,deathT:0,emoji:i%2===0?'🕷️':'🦇',phase:Math.random()*Math.PI*2,baseY:i%2===0?roadY-20:roadY-CEIL_H*.55}));

    // Enemigos zona ascenso
    spy.forEach((py,i)=>{
      const px=i%2===0?SHAFT_L+8:SHAFT_L+SHAFT_W-108;
      if(i%2===0||i===5){shaftEnemies.push({x:px+50,y:py-20,w:24,h:24,type:'shaft_spider',hp:1,vx:0.6,minX:px+8,maxX:px+92,dead:false,deathT:0,emoji:'🕷️',phase:Math.random()*Math.PI*2});}
    });
    [CEIL_Y-180,CEIL_Y-510,CEIL_Y-850,CEIL_Y-1190,CEIL_Y-1530,CEIL_Y-1870].forEach((by,i)=>{
      shaftEnemies.push({x:SHAFT_L+(i%2===0?60:120),y:by,baseY:by,w:24,h:24,type:'shaft_bat',hp:1,vx:i%2===0?1.1:-1.1,minX:SHAFT_L+10,maxX:SHAFT_R-10,dead:false,deathT:0,emoji:'🦇',phase:Math.random()*Math.PI*2});
    });

    // Boss araña gigante
    boss={x:2700,hangX:2700,hangY:CEIL_Y+40,y:CEIL_Y+110,groundY:roadY-70,w:60,h:60,hp:10,maxHp:10,vx:1.0,minX:2540,maxX:2820,dead:false,emoji:'🕷️',phase:0,state:'hanging',rageModeOn:false,acidTimer:0,acidInterval:160,swingAmp:60,swingSpeed:0.018,ropeLen:80,webLines:[],agro:false};
    generateWebLines();
    makeStalactites();
  }

  function initPlayer(){
    player={x:100,y:roadY-40,vx:0,vy:0,w:40,h:40,onGround:true,jumpCount:0,maxJumps:2,rotation:0,alive:true,invincible:false,invincibleTimer:70,facingRight:true,rideBubble:null};
  }

  // ── PICKER ─────────────────────────────────────────────────────────────────
  let picTarget = null, picEmoji = '';

  function addRecent(em){const i=recentItems.indexOf(em);if(i!==-1)recentItems.splice(i,1);recentItems.unshift(em);if(recentItems.length>14)recentItems.pop();}

  function openPicker(t){
    picTarget=t; picEmoji='';
    document.getElementById('picker-label').textContent=t==='action'?'→ Botón Acción ⚡':`→ Slot ${t+1}`;
    document.getElementById('picker-display').textContent='↑ elige o escribe';
    document.getElementById('picker-display').classList.remove('has');
    document.getElementById('picker-ok').classList.remove('show');
    const g=document.getElementById('qgrid'); g.innerHTML='';
    if(recentItems.length===0){const h=document.createElement('div');h.className='qe-hint';h.textContent='Aún no has usado ningún ítem.\nUsa los botones rápidos.';g.appendChild(h);}
    else{recentItems.forEach(em=>{const el=document.createElement('div');el.className='qe';el.textContent=em;el.onclick=()=>selectPicker(em);g.appendChild(el);});}
    document.getElementById('picker-overlay').classList.add('show');
  }
  function selectPicker(em){picEmoji=em;const d=document.getElementById('picker-display');d.textContent=em;d.classList.add('has');document.getElementById('picker-ok').classList.add('show');}
  function closePicker(){document.getElementById('picker-overlay').classList.remove('show');picTarget=null;}
  function confirmPicker(){if(!picEmoji)return;const t=picTarget;closePicker();assignEmoji(picEmoji,t);}

  function initQuickPick(){
    const quickEmojis=['🔦','🌧️','🔫','🫧','💣','🌬️','🍎'];
    const container=document.getElementById('quick-pick'); container.innerHTML='';
    quickEmojis.forEach(em=>{const btn=document.createElement('div');btn.className='quick-pick-item';btn.textContent=em;btn.onclick=()=>{if(picTarget!==null){selectPicker(em);confirmPicker();}else toast('Primero selecciona un slot vacío');};container.appendChild(btn);});
  }

  document.getElementById('picker-kbd').onclick=()=>{document.getElementById('picker-real').value='';document.getElementById('picker-real').focus();};
  document.getElementById('picker-display').onclick=()=>{document.getElementById('picker-real').value='';document.getElementById('picker-real').focus();};
  document.getElementById('picker-real').oninput=e=>{const v=e.target.value.trim();e.target.value='';if(!v)return;const em=[...v].find(c=>c.codePointAt(0)>127)||v[0];if(em)selectPicker(em);};
  document.getElementById('picker-ok').onclick=confirmPicker;
  document.getElementById('picker-cancel').onclick=closePicker;
  for(let i=0;i<5;i++){document.getElementById(`ps${i}`).onclick=()=>{if(gameActive)openPicker(i);};}
  document.getElementById('attack-btn-wrapper').addEventListener('click',function(){
    if(!gameActive)return;
    if(this.classList.contains('ready'))doAction();
    else openPicker('action');
  });

  // ── SISTEMA DE ÍTEMS ────────────────────────────────────────────────────────
  const BLOCKED=new Set(['🥶','🔥','😡','😎','🤠','😁','🫥']);
  const CAVE_EM=new Set(['🌧️','🌧','🌬️','🌬','🫧','🔦']);
  const FOOD_EM=new Set(['🍎','🍊','🍋','🍇','🍓','🍉','🍌','🥝','🍑','🍒','🍕','🍔','🌮','🌯','🍜','🍣','🍩','🎂','🧁','🍫','🍬','🍭','🍦','🥐','🥞','🧀','🥩','🍗','🥪','🌽','🥕','🥦','🥑','🍄']);
  const ACT_EM=new Set(['💣','🔫']);

  function assignEmoji(em,target){
    if(BLOCKED.has(em)){toast(`🔒 ${em} — Poder bloqueado`);return;}
    addRecent(em);
    const isCave=CAVE_EM.has(em),isFood=FOOD_EM.has(em),isAct=ACT_EM.has(em);
    if(target==='action'){
      if(isCave){toast(`${em} va en un slot de cueva`);return;}
      if(isFood||isAct)setActionSlot(em);
      else toast(`${em} — Prueba 💣 🔫 o comida`);
    }else{
      if(isCave)setPowerSlot(target,em);
      else if(isFood||isAct){setPowerSlot(target,em);toast(`${em} en grilla — ¡Usa Acción ⚡!`);}
      else toast(`${em} — Prueba: 🌧️ 🌬️ 🫧 🔦 💣 🔫 o comidas`);
    }
  }

  function setPowerSlot(idx,em){
    if(slots[idx])clearEffect(idx);
    slots[idx]={emoji:em};
    activateEffect(em);
    renderSlots();
  }

  function clearSlot(idx){clearEffect(idx);slots[idx]=null;renderSlots();toast('Slot vaciado');}

  function clearEffect(idx){
    let em=slots[idx]?.emoji;if(!em)return;
    em=em.replace('\uFE0F','');
    if(em==='🌧')rainOn=false;
    if(em==='🌬')windOn=false;
    if(em==='🫧')bubblesOn=false;
    if(em==='🔦')lightOn=false;
  }

  function activateEffect(em){
    const baseEm=em.replace('\uFE0F','');
    if(baseEm==='🌧'){rainOn=true;toast('🌧️ Lluvia — apaga 🔥 y forma charcos 💧');SFX_splash();}
    if(baseEm==='🌬'){windOn=true;toast('🌬️ Viento — empuja todo hacia →');SFX_wind();}
    if(baseEm==='🫧'){bubblesOn=true;toast('🫧 Burbujas — ¡úsalas para subir el pozo!');SFX_bub();}
    if(baseEm==='🔦'){lightOn=true;toast('🔦 ¡Cueva iluminada!');}
  }

  function setActionSlot(em){
    actionSlot={emoji:em,type:em==='💣'?'bomb':em==='🔫'?'gun':FOOD_EM.has(em)?'food':'none'};
    document.getElementById('attack-btn-wrapper').className='ready';
    document.getElementById('atk-em').textContent=em;
    toast(`${em} listo en ⚡`);
  }

  function clearActionSlot(){actionSlot=null;renderSlots();}

  function renderSlots(){
    let hasActionInGrid=false;
    for(let i=0;i<5;i++){
      const el=document.getElementById(`ps${i}`);
      el.innerHTML='';
      if(slots[i]){
        el.textContent=slots[i].emoji;el.classList.add('glow');
        const x=document.createElement('div');x.className='sclr';x.textContent='✕';
        x.onclick=e=>{e.stopPropagation();clearSlot(i);};
        el.appendChild(x);
        if(ACT_EM.has(slots[i].emoji)||FOOD_EM.has(slots[i].emoji))hasActionInGrid=true;
      }else{el.classList.remove('glow');const plus=document.createElement('span');plus.className='plus';plus.textContent='+';el.appendChild(plus);}
    }
    const atkWrapper=document.getElementById('attack-btn-wrapper');
    if(actionSlot||hasActionInGrid){atkWrapper.className='ready';if(actionSlot)document.getElementById('atk-em').textContent=actionSlot.emoji;else document.getElementById('atk-em').textContent='⚡';}
    else{atkWrapper.className='';document.getElementById('atk-em').textContent='⚡';}
  }

  function doAction(){
    if(atkCd>0)return;let usedAny=false;
    if(rainOn){let hasBomb=false;for(let i=0;i<5;i++){if(slots[i]?.emoji==='💣')hasBomb=true;}if(actionSlot?.emoji==='💣')hasBomb=true;if(hasBomb){toast('🌧️ La lluvia apaga las bombas, no puedes usarlas');return;}}
    for(let i=0;i<5;i++){const em=slots[i]?.emoji;if(!em)continue;if(em==='💣'){launchBomb();atkCd=42;usedAny=true;}else if(em==='🔫'){fireGun();if(atkCd<18)atkCd=18;usedAny=true;}else if(FOOD_EM.has(em)){eatFood(em);clearSlot(i);if(atkCd<20)atkCd=20;usedAny=true;}}
    if(!usedAny&&actionSlot){const{type,emoji}=actionSlot;if(type==='bomb'){launchBomb();atkCd=42;}else if(type==='gun'){fireGun();atkCd=18;}else if(type==='food'){eatFood(emoji);clearActionSlot();atkCd=20;}}
  }

  function launchBomb(){const d=player.facingRight?1:-1;projectiles.push({type:'bomb',emoji:'💣',x:player.x+d*22,y:player.y-8,vx:d*3.5,vy:-5.5,life:100});osc('sine',500,900,.08,.25);}
  function fireGun(){if(gunAmmo<=0){toast('🔫 Sin munición — pasa por un charco 💧');return;}const d=player.facingRight?1:-1;projectiles.push({type:'water',emoji:'💧',x:player.x+d*20,y:player.y-6,vx:d*14,vy:-1,life:55});gunAmmo--;SFX_shoot();if(gunAmmo===0)toast('🔫 Sin munición');}
  function eatFood(em){if(hearts<3)hearts++;energy=Math.min(100,energy+30);updateHUD();SFX_eat();toast(`${em} ¡Comido! +❤️`);spawnParts(player.x,player.y,'#f87171',10,'❤️');}

  // ── FÍSICA ─────────────────────────────────────────────────────────────────
  const gravity=0.5, PSPEED=5;

  function updatePlayer(){
    if(!player.alive||!gameActive)return;
    if(player.invincible){player.invincibleTimer--;if(player.invincibleTimer<=0)player.invincible=false;}
    if(atkCd>0)atkCd--;
    if(frameCount%200===0){energy=Math.max(0,energy-2);updateHUD();}
    player.vx=0;
    if(keys.left){player.vx=-PSPEED;player.facingRight=false;}
    if(keys.right){player.vx=PSPEED;player.facingRight=true;}
    if(windOn)player.vx+=1.8;
    if(!player.onGround)player.vy+=gravity;
    player.x+=player.vx;player.y+=player.vy;
    player.rotation+=player.vx*0.02;
    if(player.x<20){player.x=20;player.vx=0;}
    if(player.y+player.h/2>=CEIL_Y&&player.x+player.w/2>HORIZ_END){player.x=HORIZ_END-player.w/2;player.vx=0;}
    const strictInShaft=player.x>SHAFT_L+8&&player.x<SHAFT_R-8;
    if(!strictInShaft&&player.y-player.h/2<CEIL_Y){player.y=CEIL_Y+player.h/2;if(player.vy<0)player.vy=0;if(player.rideBubble){player.rideBubble.dead=true;player.rideBubble=null;spawnParts(player.x,player.y,'#bfdbfe',8,'🫧');}}
    if(player.y-player.h/2<CEIL_Y){if(player.x-player.w/2<SHAFT_L){player.x=SHAFT_L+player.w/2;player.vx=0;}if(player.x+player.w/2>SHAFT_R){player.x=SHAFT_R-player.w/2;player.vx=0;}}
    const _was=player.onGround;player.onGround=false;let landedThisFrame=false;
    if(player.y+player.h/2>=roadY&&player.vy>=0){if(player.x+player.w/2>abyssX&&player.x-player.w/2<abyssX+abyssW){}else{player.y=roadY-player.h/2;player.vy=0;if(!_was&&!landedThisFrame){SFX_land();landedThisFrame=true;}player.onGround=true;player.jumpCount=0;}}
    for(const p of platforms){if(p.type==='ground')continue;if(player.x+player.w/2>p.x&&player.x-player.w/2<p.x+p.w&&player.y+player.h/2>p.y&&player.y+player.h/2<p.y+p.h&&player.vy>0){player.y=p.y-player.h/2;player.vy=0;if(!_was&&!landedThisFrame){SFX_land();landedThisFrame=true;}player.onGround=true;player.jumpCount=0;}}
    const jumpPressed=keys.jump&&!prevKeys.jump;
    if(jumpPressed&&player.jumpCount<player.maxJumps){player.vy=player.jumpCount===0?-11:-9;player.jumpCount++;player.onGround=false;SFX_jump();}

    // Charcos -> recargan la pistola
    for(const pu of puddles){if(!pu.active)continue;if(player.x+player.w/2>pu.x&&player.x-player.w/2<pu.x+pu.w&&player.y+player.h/2>pu.y&&player.y+player.h/2<pu.y+pu.h+6){if(gunAmmo<10){gunAmmo=Math.min(10,gunAmmo+1);}}}

    for(const o of obstacles){if(o.dead)continue;if(Math.abs(player.x-(o.x+18))<28&&Math.abs(player.y-o.y)<28){if(o.type==='fire')takeDamage();}}
    for(const bw of brickWalls){if(bw.dead)continue;if(player.x+player.w/2>bw.x&&player.x-player.w/2<bw.x+bw.w&&player.y+player.h/2>bw.y&&player.y-player.h/2<bw.y+bw.h){if(player.x<bw.x+bw.w/2){player.x=bw.x-player.w/2;player.vx=0;}else{player.x=bw.x+bw.w+player.w/2;player.vx=0;}}}
    for(const e of enemies){if(e.dead)continue;if(!player.invincible&&Math.abs(e.x-player.x)<26&&Math.abs(e.y-player.y)<26){takeDamage();player.vx=player.x<e.x?-5:5;player.vy=-5;}}
    for(const e of shaftEnemies){if(e.dead)continue;if(!player.invincible&&Math.abs(e.x-player.x)<26&&Math.abs(e.y-player.y)<26){takeDamage();player.vx=player.x<e.x?-5:5;player.vy=-5;}}
    for(const f of flameHazards){if(f.dead)continue;if(!player.invincible&&Math.abs(f.x-player.x)<22&&Math.abs(f.y-player.y)<22){takeDamage();}}
    if(boss&&!boss.dead){const bHB=boss.state==='hanging'?42:38;if(!player.invincible&&Math.abs(boss.x-player.x)<bHB&&Math.abs(boss.y-player.y)<bHB){takeDamage();player.vx=player.x<boss.x?-9:9;player.vy=-7;}}
    if(!player.rideBubble){for(const b of bubbles){if(!b.dead&&Math.abs(b.x-player.x)<32&&Math.abs(b.y-player.y)<32){player.rideBubble=b;SFX_bub();toast('🫧 ¡Montando burbuja!');}}}
    if(player.rideBubble){const b=player.rideBubble;if(b.dead){player.rideBubble=null;}else{player.x=b.x;player.y=b.y-38;player.vy=0;player.onGround=false;}}
    for(let i=drops.length-1;i>=0;i--){const d=drops[i];if(d.collected)continue;if(Math.abs(player.x-d.x)<30&&Math.abs(player.y-d.y)<30){d.collected=true;playerHasRing=true;toast('💍 ¡Encontraste el anillo de Emma!');SFX_pick();drops.splice(i,1);}}
    if(player.y<SHAFT_TOP_Y+55&&player.x>SHAFT_L&&player.x<SHAFT_R){triggerWin();return;}
    if(player.y>roadY+400){player.alive=false;setTimeout(showDead,350);return;}
    inShaft=player.y-player.h/2<CEIL_Y;
    let targetCamX,targetCamY;
    if(inShaft){targetCamX=SHAFT_L-(VW()-SHAFT_W)/2;targetCamY=player.y-VH()*0.5;}
    else{targetCamX=Math.max(0,player.x-VW()*0.4);targetCamY=0;}
    cameraX+=(targetCamX-cameraX)*0.2;cameraY+=(targetCamY-cameraY)*0.2;
    document.getElementById('zone-hud').textContent=inShaft?'↑ Pozo — usa 🫧':(player.x>HORIZ_END-320?'🧱 Pared — busca el pozo':'🕳️ Cueva');
  }

  function takeDamage(){if(player.invincible)return;hearts--;updateHUD();player.invincible=true;player.invincibleTimer=70;SFX_hurt();spawnParts(player.x,player.y,'#ff4444',10,'💢');const h=document.getElementById('hearts-display');h.classList.remove('damage-shake');void h.offsetWidth;h.classList.add('damage-shake');if(hearts<=0){player.alive=false;setTimeout(showDead,350);}}

  function updateEnemies(){
    for(const e of enemies){if(e.dead){e.deathT++;continue;}const wp=windOn?2.2:0;if(e.type==='bat'){e.phase+=0.025;e.y=e.baseY+Math.sin(e.phase)*45;e.x+=e.vx+wp;}else e.x+=e.vx+wp*0.6;if(e.x>e.maxX||e.x<e.minX)e.vx*=-1;}
    for(const e of shaftEnemies){
      if(e.dead){e.deathT=(e.deathT||0)+1;continue;}
      if(e.type==='shaft_bat'){e.phase+=0.03;e.y=e.baseY+Math.sin(e.phase)*30;e.x+=e.vx;if(e.x>e.maxX||e.x<e.minX)e.vx*=-1;}
      else{e.x+=e.vx;if(e.x>e.maxX||e.x<e.minX)e.vx*=-1;}
    }
    for(let i=flameHazards.length-1;i>=0;i--){
      const f=flameHazards[i];if(f.dead){flameHazards.splice(i,1);continue;}
      f.life--;if(f.life<=0){f.dead=true;continue;}
      if(!f.grounded){f.vy+=0.3;f.x+=f.vx;f.y+=f.vy;if(f.y>=roadY-20){f.y=roadY-20;f.vy=0;f.vx*=0.3;f.grounded=true;}}
      else f.vx*=0.95;
    }
    updateBoss();
    if(boss&&!boss.dead){
      document.getElementById('boss-health-bar').style.display='block';
      const pct=boss.hp/boss.maxHp;
      const fill=document.getElementById('boss-health-fill');
      fill.style.width=(pct*100)+'%';
      fill.style.background=pct>0.5?'linear-gradient(90deg,#facc15,#eab308)':'linear-gradient(90deg,#dc2626,#ef4444)';
    }else document.getElementById('boss-health-bar').style.display='none';
  }

  function updateBoss(){
    if(!boss||boss.dead)return;
    boss.phase+=0.02;boss.acidTimer++;
    const hpPct=boss.hp/boss.maxHp;
    if(hpPct<=0.5&&!bossRageTriggered){
      bossRageTriggered=true;boss.rageModeOn=true;boss.state='ground';
      boss.acidInterval=90;boss.swingSpeed=0.035;
      toast('🔥 ¡La araña ENOJA! ¡Modo FURIA!');SFX_rage();
      spawnFlameExplosion(boss.x,boss.hangY+30);
    }
    if(boss.state==='hanging'){
      boss.x=boss.hangX+Math.sin(boss.phase*boss.swingSpeed*50)*boss.swingAmp;
      boss.y=boss.hangY+boss.ropeLen+Math.sin(boss.phase*1.3)*12;
      if(boss.acidTimer>=boss.acidInterval){boss.acidTimer=0;fireAcidDrops();}
      if(!boss.rageModeOn&&Math.abs(boss.x-player.x)<300&&frameCount%480===0){boss.state='ground';setTimeout(()=>{if(boss&&!boss.dead)boss.state='hanging';},4000);}
    }
    if(boss.state==='ground'){
      boss.y+=(boss.groundY-boss.y)*0.08;
      if(Math.abs(boss.x-player.x)<350){boss.agro=true;const sp=boss.rageModeOn?3.2:2.0;if(boss.x<player.x)boss.x+=sp;else boss.x-=sp;}
      else{boss.agro=false;boss.x+=boss.vx*(boss.rageModeOn?1.5:1.0);if(boss.x>boss.maxX||boss.x<boss.minX)boss.vx*=-1;}
      boss.x=Math.max(boss.minX,Math.min(boss.maxX,boss.x));
      if(boss.acidTimer>=boss.acidInterval){boss.acidTimer=0;fireAcidDrops();}
      if(boss.rageModeOn&&frameCount%200===0)spawnParts(boss.x,boss.y,'#ff4400',6,'🔥');
    }
  }

  function fireAcidDrops(){
    if(!boss)return;SFX_acid();
    const count=boss.rageModeOn?4:2;
    for(let i=0;i<count;i++){const spread=(i-(count-1)/2)*0.8;const aimDir=player.x>boss.x?1:-1;projectiles.push({type:'acid',x:boss.x+(Math.random()-.5)*20,y:boss.y-10,vx:aimDir*(3.5+spread*1.2+Math.random()*1.5),vy:-5-Math.random()*2,life:120});}
  }

  function spawnFlameExplosion(cx,cy){
    SFX_boom();spawnParts(cx,cy,'#ff4400',25,'🔥');spawnParts(cx,cy,'#ff8800',15,'💥');
    for(let i=0;i<12;i++){const angle=(i/12)*Math.PI*2,speed=4+Math.random()*5;flameHazards.push({x:cx,y:cy,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed-3,life:180+Math.random()*120,dead:false,grounded:false});}
    const extraDir=player.x>cx?1:-1;
    for(let i=0;i<4;i++){flameHazards.push({x:cx+(Math.random()-.5)*40,y:cy,vx:extraDir*(6+Math.random()*4),vy:-2-Math.random()*3,life:200+Math.random()*100,dead:false,grounded:false});}
  }

  function updateProjectiles(){
    for(let i=projectiles.length-1;i>=0;i--){
      const p=projectiles[i];
      p.vy+=p.type==='acid'?0.28:0.22;p.x+=p.vx;p.y+=p.vy;p.life--;
      if(p.life<=0){if(p.type==='bomb')explode(p.x,p.y);projectiles.splice(i,1);continue;}
      let hit=false;
      if(p.type!=='acid'){
        for(const e of enemies){if(!e.dead&&Math.abs(e.x-p.x)<28&&Math.abs(e.y-p.y)<28){if(p.type==='bomb')explode(p.x,p.y);else{e.dead=true;spawnParts(e.x,e.y,'#fbbf24',8,e.emoji);}projectiles.splice(i,1);hit=true;break;}}if(hit)continue;
        for(const e of shaftEnemies){if(!e.dead&&Math.abs(e.x-p.x)<26&&Math.abs(e.y-p.y)<26){if(p.type==='bomb')explode(p.x,p.y);else{e.dead=true;spawnParts(e.x,e.y,'#fbbf24',6,e.emoji);}projectiles.splice(i,1);hit=true;break;}}if(hit)continue;
        if(boss&&!boss.dead&&Math.abs(boss.x-p.x)<38&&Math.abs(boss.y-p.y)<38){if(p.type==='bomb'){explode(p.x,p.y);boss.hp-=2;}else if(p.type==='water'){boss.hp-=1;}checkBossDeath();projectiles.splice(i,1);continue;}
        let bwHit=false;
        for(const bw of brickWalls){if(bw.dead)continue;if(p.x>bw.x-10&&p.x<bw.x+bw.w+10&&p.y>bw.y-10&&p.y<bw.y+bw.h+10){if(p.type==='bomb'){explode(p.x,p.y);bw.hp--;bw.hit=8;if(bw.hp<=0){bw.dead=true;spawnParts(bw.x+bw.w/2,bw.y+bw.h/2,'#c68642',14,'🧱');toast('💥 ¡Pared destruida!');}}else bw.hit=6;projectiles.splice(i,1);bwHit=true;break;}}if(bwHit)continue;
        for(const o of obstacles){if(o.dead)continue;if(Math.abs(o.x+18-p.x)<36&&Math.abs(o.y+2-p.y)<28){if(o.type==='rock'&&p.type==='bomb'){explode(p.x,p.y);o.dead=true;toast('💥 ¡Roca destruida!');}else if(o.type==='fire'&&p.type==='water'){o.dead=true;SFX_splash();spawnParts(o.x+18,o.y,'#60a5fa',10,'💦');toast('💦 Fuego apagado');}else if(p.type==='bomb')explode(p.x,p.y);else if(!o.hint){o.hint=true;toast(o.type==='rock'?'🧱 Usa 💣':'🔥 Usa 🔫 o 🌧️');}projectiles.splice(i,1);break;}}
      }
      if(p.type==='acid'){
        if(!player.invincible&&Math.abs(p.x-player.x)<20&&Math.abs(p.y-player.y)<20){takeDamage();player.vy=-3;spawnParts(p.x,p.y,'#86efac',6);projectiles.splice(i,1);continue;}
        if(p.y>=roadY-10){spawnParts(p.x,roadY-10,'#4ade80',5);projectiles.splice(i,1);continue;}
        let acidG=false;
        for(const pl of platforms){if(pl.type==='ground')continue;if(p.x>pl.x&&p.x<pl.x+pl.w&&p.y+6>pl.y&&p.y<pl.y+pl.h){spawnParts(p.x,pl.y,'#4ade80',4);projectiles.splice(i,1);acidG=true;break;}}
        if(acidG)continue;
      }
    }
  }

  function checkBossDeath(){if(!boss||boss.hp>0)return;boss.dead=true;spawnParts(boss.x,boss.y,'#ffaa00',25,'🕷️');spawnParts(boss.x,boss.y,'#ff4400',15,'💥');toast('💀 ¡Derrotaste a la araña gigante! 🔥');drops.push({x:boss.x,y:boss.y-20,emoji:'💍',collected:false});}

  function explode(x,y){SFX_boom();spawnParts(x,y,'#f97316',18,'💥');spawnParts(x,y,'#fbbf24',8);enemies.forEach(e=>{if(!e.dead&&Math.hypot(e.x-x,e.y-y)<85){e.dead=true;spawnParts(e.x,e.y,'#fbbf24',8,e.emoji);}});shaftEnemies.forEach(e=>{if(!e.dead&&Math.hypot(e.x-x,e.y-y)<70){e.dead=true;spawnParts(e.x,e.y,'#fbbf24',6,e.emoji);}});obstacles.forEach(o=>{if(!o.dead&&o.type==='fire'&&Math.hypot(o.x+18-x,o.y-y)<85)o.dead=true;});brickWalls.forEach(bw=>{if(!bw.dead&&Math.hypot(bw.x+bw.w/2-x,bw.y+bw.h/2-y)<80){bw.hp=0;bw.dead=true;spawnParts(bw.x+bw.w/2,bw.y+bw.h/2,'#c68642',10,'🧱');}});if(boss&&!boss.dead&&Math.hypot(boss.x-x,boss.y-y)<100){boss.hp-=3;checkBossDeath();}}

  function updateRain(){if(!rainOn){rainDrops=[];return;}if(frameCount%2===0&&rainDrops.length<60){const wx=cameraX+Math.random()*VW();rainDrops.push({wx,wy:cameraY-12,vy:9+Math.random()*4});}for(let i=rainDrops.length-1;i>=0;i--){const r=rainDrops[i];r.wy+=r.vy;if(r.wy>cameraY+VH()+30){rainDrops.splice(i,1);continue;}for(const o of obstacles){if(!o.dead&&o.type==='fire'&&Math.abs(o.x-r.wx)<32&&Math.abs(o.y-r.wy)<14){o.dead=true;spawnParts(o.x+18,o.y,'#60a5fa',8,'💦');}}if(r.wy>=roadY&&frameCount%35===0){if(!puddles.find(pu=>Math.abs(pu.x+40-r.wx)<90)&&puddles.length<14)puddles.push({x:r.wx-40,y:roadY+2,w:80,h:14,active:true});}}}
  function updateBubbles(){if(!bubblesOn&&bubbles.length===0)return;if(bubblesOn&&frameCount%70===0){const bx=inShaft?SHAFT_L+20+Math.random()*(SHAFT_W-40):cameraX+50+Math.random()*(VW()-100);const by=inShaft?player.y+60:roadY+10;bubbles.push({x:bx,y:by,vy:-1.1-Math.random()*0.7,r:22+Math.random()*14,dead:false});}for(let i=bubbles.length-1;i>=0;i--){const b=bubbles[i];b.y+=b.vy;if(b.y<SHAFT_TOP_Y-50||b.dead)bubbles.splice(i,1);}}
  function updateParticles(){for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.x+=p.vx;p.y+=p.vy;p.vy+=0.15;p.life--;if(p.life<=0)particles.splice(i,1);}}
  function spawnParts(x,y,col,n,em){if(particles.length>80)return;for(let i=0;i<n;i++)particles.push({x,y,vx:(Math.random()-.5)*6,vy:-2-Math.random()*5,col,em,size:em?13:3,life:25+Math.random()*20,maxLife:45});}

  // ── DRAW ───────────────────────────────────────────────────────────────────
  const DX=wx=>Math.round(wx-cameraX);
  const DY=wy=>Math.round(wy-cameraY);

  function drawEmoji(wx,wy,em,size=40,angle=0,glow=null){ctx.save();ctx.translate(DX(wx),DY(wy));if(angle)ctx.rotate(angle);ctx.font=`${size}px 'Segoe UI Emoji','Apple Color Emoji','Noto Color Emoji',sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';if(glow){ctx.shadowColor=glow;ctx.shadowBlur=10;}ctx.globalAlpha=1.0;ctx.fillStyle='white';ctx.fillText(em,0,0);ctx.restore();}  // shadowBlur auto-reset by ctx.restore()

  function drawBackground(){
    const W=VW(),H=VH();
    if(lightOn){ctx.fillStyle='#7a4e22';ctx.fillRect(0,0,W,H);const cx0=(cameraX*-.05|0),cy0=(cameraY*.05|0);for(let i=0;i<16;i++){const rx=((i*173+cx0*11+50)%(W+120)+W+120)%(W+120)-60,ry=((i*109+cy0*7+30)%(H+80)+H+80)%(H+80)-40,sz=24+i%22,pts=5+i%3,L=38+i%22,S=35+i%20;ctx.save();ctx.fillStyle=`hsl(${25+i%18},${S}%,${L}%)`;ctx.strokeStyle=`rgba(30,15,5,${.25+i%3*.07})`;ctx.lineWidth=1.2;ctx.beginPath();for(let j=0;j<pts;j++){const anim=frameCount*.005,a=(j/pts)*Math.PI*2,r2=sz*(0.68+Math.sin(a*3+i+anim)*.32);j===0?ctx.moveTo(rx+Math.cos(a)*r2,ry+Math.sin(a)*r2):ctx.lineTo(rx+Math.cos(a)*r2,ry+Math.sin(a)*r2);}ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();}const lx=DX(player.x),ly=DY(player.y);const lg=ctx.createRadialGradient(lx,ly,0,lx,ly,Math.max(W,H)*1.1);lg.addColorStop(0,'rgba(255,235,170,.80)');lg.addColorStop(.25,'rgba(255,200,110,.55)');lg.addColorStop(.55,'rgba(220,155,70,.30)');lg.addColorStop(.85,'rgba(160,100,35,.12)');lg.addColorStop(1,'rgba(80,45,12,.04)');ctx.fillStyle=lg;ctx.fillRect(0,0,W,H);}
    else{ctx.fillStyle='#0e0804';ctx.fillRect(0,0,W,H);const cx1=(cameraX*-.03|0),cy1=(cameraY*.03|0);for(let i=0;i<8;i++){const rx=((i*173+cx1*11+50)%(W+100)+W+100)%(W+100)-50,ry=((i*109+cy1*7+30)%(H+60)+H+60)%(H+60)-30,sz=18+i%18,pts=5+i%3;ctx.save();ctx.globalAlpha=0.08;ctx.fillStyle=`hsl(25,25%,${14+i%8}%)`;ctx.beginPath();for(let j=0;j<pts;j++){const anim=frameCount*.005,a=(j/pts)*Math.PI*2,r2=sz*(0.7+Math.sin(a*3+i+anim)*.3);j===0?ctx.moveTo(rx+Math.cos(a)*r2,ry+Math.sin(a)*r2):ctx.lineTo(rx+Math.cos(a)*r2,ry+Math.sin(a)*r2);}ctx.closePath();ctx.fill();ctx.restore();}}
  }

  function drawCaveStructure(){
    const ceilSX=DX(0),ceilSY=DY(CEIL_Y);
    if(!inShaft){ctx.fillStyle='#2d1b0e';ctx.fillRect(ceilSX,0,HORIZ_END,ceilSY);ctx.strokeStyle='rgba(120,70,30,.35)';ctx.lineWidth=2;ctx.strokeRect(ceilSX,0,HORIZ_END,ceilSY);}
    ctx.fillStyle='#3d2510';
    for(const st of stalactites){if(st.s==='h'){const sx=DX(st.x),sy=DY(st.y);if(sx<-20||sx>VW()+20||sy>VH()+20)continue;const w=st.w,h=st.h,shine=st.sh;ctx.save();const lg=ctx.createLinearGradient(sx-w/2,sy,sx+w/2,sy+h);lg.addColorStop(0,`hsl(25,${30+shine*20}%,${18+shine*10}%)`);lg.addColorStop(1,`hsl(20,${20+shine*10}%,${10+shine*5}%)`);ctx.fillStyle=lg;ctx.beginPath();ctx.moveTo(sx-w/2,sy);ctx.lineTo(sx+w/2,sy);ctx.lineTo(sx,sy+h);ctx.closePath();ctx.fill();if(shine>.7){ctx.fillStyle='rgba(255,230,180,.3)';ctx.beginPath();ctx.moveTo(sx-w/5,sy);ctx.lineTo(sx,sy);ctx.lineTo(sx-w/8,sy+h*.5);ctx.closePath();ctx.fill();}ctx.restore();}}
    const sl=DX(SHAFT_L),sr=DX(SHAFT_R),st2=DY(SHAFT_TOP_Y),sb2=DY(CEIL_Y);
    if(sl<VW()&&sr>0){ctx.fillStyle='#2d1b0e';ctx.fillRect(0,Math.min(st2,0),sl,VH());ctx.fillRect(sr,Math.min(st2,0),VW()-sr,VH());ctx.strokeStyle='rgba(120,70,30,.5)';ctx.lineWidth=3;ctx.strokeRect(sl,Math.min(st2,0),SHAFT_W,sb2-Math.min(st2,0));}
    for(const st of stalactites){if(st.s!=='v')continue;const sx=DX(st.x),sy=DY(st.y);if(sx<-20||sx>VW()+20||sy>VH()+20||sy<-20)continue;ctx.fillStyle='#3d2510';ctx.beginPath();ctx.moveTo(sx-st.w/2,sy);ctx.lineTo(sx+st.w/2,sy);ctx.lineTo(sx,sy+st.h);ctx.closePath();ctx.fill();}
  }

  function drawPlatforms(){for(const p of platforms){if(p.type==='ground')continue;const dx=DX(p.x),dy=DY(p.y);if(dx>VW()+20||dx+p.w<-20)continue;const lg=ctx.createLinearGradient(dx,dy,dx,dy+p.h);lg.addColorStop(0,'#7c4a1e');lg.addColorStop(.5,'#6b3d18');lg.addColorStop(1,'#4a2a10');ctx.fillStyle=lg;ctx.fillRect(dx,dy,p.w,p.h);ctx.fillStyle='rgba(255,160,60,.18)';ctx.fillRect(dx,dy,p.w,3);ctx.strokeStyle='rgba(50,25,5,.7)';ctx.lineWidth=1.2;ctx.strokeRect(dx,dy,p.w,p.h);}}
  function drawCaveFloor(){const fy=DY(roadY),W=VW(),H=VH();ctx.fillStyle='#3b2008';ctx.fillRect(0,fy,W,H-fy);ctx.fillStyle='rgba(255,150,50,.12)';ctx.fillRect(0,fy,W,4);ctx.strokeStyle='rgba(80,40,10,.6)';ctx.lineWidth=2;ctx.strokeRect(0,fy,W,H-fy);for(const pu of puddles){if(!pu.active)continue;const px=DX(pu.x),py2=DY(pu.y);if(px>W+50||px+pu.w<-20)continue;ctx.save();ctx.fillStyle='rgba(100,149,237,.55)';ctx.beginPath();ctx.ellipse(px+pu.w/2,py2+pu.h/2,pu.w/2,pu.h/2,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='rgba(147,197,253,.4)';ctx.lineWidth=1.5;ctx.stroke();ctx.restore();}}
  function drawAbyss(){if(inShaft)return;const ax=DX(abyssX),aw=abyssW,floorY=DY(roadY),visH=VH()-floorY+20;ctx.save();const ag=ctx.createLinearGradient(ax,floorY,ax,floorY+visH*.8);ag.addColorStop(0,'rgba(5,2,1,.95)');ag.addColorStop(.5,'rgba(2,1,0,.99)');ag.addColorStop(1,'rgba(0,0,0,1)');ctx.fillStyle=ag;ctx.fillRect(ax,floorY-2,aw,visH+10);ctx.strokeStyle='rgba(120,60,15,.5)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(ax,floorY-2);ctx.lineTo(ax,floorY+visH);ctx.stroke();ctx.beginPath();ctx.moveTo(ax+aw,floorY-2);ctx.lineTo(ax+aw,floorY+visH);ctx.stroke();ctx.restore();}
  function drawObstacles(){if(inShaft)return;for(const o of obstacles){if(o.dead)continue;const dx=DX(o.x),dy=DY(o.y);if(dx>VW()+60||dx+o.w<-40)continue;if(!lightOn&&!o.hint){ctx.save();ctx.font='10px sans-serif';ctx.fillStyle='rgba(255,200,60,.55)';ctx.textAlign='center';ctx.fillText(o.type==='fire'?'[💣]':'[🔫/🌧️]',dx+o.w/2,dy-14);ctx.restore();}if(o.type==='fire'){o.ff=(o.ff||0)+1;drawEmoji(o.x+6,o.y-8,'🔥',24,0,'#ff6600');drawEmoji(o.x+22,o.y-14,'🔥',20,Math.sin(o.ff*.12)*.15,'#ff8800');drawEmoji(o.x+14,o.y-2,'🔥',28,Math.sin(o.ff*.08)*.1,'#ffaa00');}else drawEmoji(o.x+18,o.y-8,'🧱',30,0,'#a16207');}}
  function drawBrickWalls(){if(inShaft)return;for(const bw of brickWalls){if(bw.dead)continue;const dx=DX(bw.x),dy=DY(bw.y);if(dx>VW()+50||dx+bw.w<-50)continue;ctx.fillStyle='rgba(0,0,0,.35)';ctx.fillRect(dx+3,dy+3,bw.w,bw.h);if(bw.hit>0){bw.hit--;ctx.fillStyle='rgba(255,200,100,.4)';ctx.fillRect(dx,dy,bw.w,bw.h);}const brickH=18;for(let row=0;row*brickH<bw.h;row++){const by2=dy+row*brickH;const lg=ctx.createLinearGradient(dx,by2,dx,by2+brickH);lg.addColorStop(0,'#8b4513');lg.addColorStop(.5,'#7a3c10');lg.addColorStop(1,'#5c2c0a');ctx.fillStyle=lg;ctx.fillRect(dx,by2,bw.w,Math.min(brickH,bw.h-row*brickH));ctx.fillStyle='rgba(20,10,3,.6)';ctx.fillRect(dx,by2,bw.w,2);const off=row%2?bw.w/2:4;ctx.fillRect(dx+off,by2,2,brickH);ctx.fillStyle='rgba(255,170,90,.1)';ctx.fillRect(dx+3,by2+3,bw.w-6,6);}ctx.strokeStyle='rgba(40,20,5,.6)';ctx.lineWidth=1.5;ctx.strokeRect(dx,dy,bw.w,bw.h);if(bw.hp>1){ctx.save();ctx.font='bold 9px sans-serif';ctx.fillStyle='rgba(255,220,120,.85)';ctx.textAlign='center';ctx.fillText('HP:'+bw.hp,dx+bw.w/2,dy-6);ctx.restore();}}}

  function drawEnemies(){
    for(const e of enemies){if(e.deathT>0)continue;drawEmoji(e.x,e.y,e.emoji,e.type==='bat'?24:26,Math.sin(frameCount*.06+e.phase)*.06);}
    for(const e of shaftEnemies){if((e.deathT||0)>0)continue;const sy=DY(e.y);if(sy<-40||sy>VH()+40)continue;drawEmoji(e.x,e.y,e.emoji,22,e.type==='shaft_bat'?Math.sin(frameCount*.08+e.phase)*.12:Math.sin(frameCount*.05+e.phase)*.08);}
    if(boss&&!boss.dead)drawBoss();
  }

  function drawBoss(){
    const bx=DX(boss.x),by=DY(boss.y),hx=DX(boss.hangX),hy=DY(boss.hangY);
    if(boss.state==='hanging'||boss.y<boss.groundY-40){
      ctx.save();ctx.strokeStyle='rgba(200,180,150,0.35)';ctx.lineWidth=1;ctx.shadowColor='rgba(200,180,150,0.2)';ctx.shadowBlur=4;
      for(const line of boss.webLines){ctx.beginPath();ctx.moveTo(DX(line.x1),DY(line.y1));ctx.lineTo(DX(line.x2),DY(line.y2));ctx.stroke();}
      ctx.restore();
      ctx.save();ctx.strokeStyle='rgba(220,200,160,0.7)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(hx,hy);ctx.quadraticCurveTo((hx+bx)/2+Math.sin(frameCount*0.04)*8,(hy+by)/2,bx,by-20);ctx.stroke();ctx.restore();
    }
    const rageGlow=boss.rageModeOn?'#ff2200':'#ff6600';
    const swingAngle=boss.state==='hanging'?Math.sin(boss.phase*boss.swingSpeed*50)*0.15:0;
    drawEmoji(boss.x,boss.y,'🕷️',boss.rageModeOn?58:52,swingAngle,rageGlow);
    if(boss.rageModeOn){ctx.save();const flicker=0.3+Math.sin(frameCount*0.2)*0.15;ctx.strokeStyle=`rgba(255,80,0,${flicker})`;ctx.lineWidth=3;ctx.shadowColor='#ff4400';ctx.shadowBlur=20;ctx.beginPath();ctx.arc(bx,by,38,0,Math.PI*2);ctx.stroke();ctx.restore();}
    const barW=80,barX=bx-barW/2,barY=by-55;
    ctx.fillStyle='#1a0000';ctx.fillRect(barX,barY,barW,8);
    const pct=boss.hp/boss.maxHp;ctx.fillStyle=pct>0.5?'#facc15':'#dc2626';ctx.fillRect(barX,barY,barW*pct,8);
    ctx.strokeStyle='rgba(255,200,80,.5)';ctx.lineWidth=1;ctx.strokeRect(barX,barY,barW,8);
  }

  function drawProjectiles(){for(const p of projectiles){if(p.type==='acid'){const sx=DX(p.x),sy=DY(p.y);ctx.save();ctx.shadowColor='#4ade80';ctx.shadowBlur=10;ctx.fillStyle='#86efac';ctx.beginPath();ctx.arc(sx,sy,5,0,Math.PI*2);ctx.fill();ctx.fillStyle='#bbf7d0';ctx.beginPath();ctx.arc(sx-1.5,sy-1.5,2,0,Math.PI*2);ctx.fill();ctx.restore();}else if(p.type==='water'){const sx=DX(p.x),sy=DY(p.y);ctx.save();ctx.shadowColor='#60a5fa';ctx.shadowBlur=8;ctx.fillStyle='#93c5fd';ctx.beginPath();ctx.arc(sx,sy,5,0,Math.PI*2);ctx.fill();ctx.fillStyle='#dbeafe';ctx.beginPath();ctx.arc(sx-1.5,sy-1.5,2,0,Math.PI*2);ctx.fill();ctx.restore();}else drawEmoji(p.x,p.y,'💣',24);}}
  function drawFlameHazards(){for(const f of flameHazards){if(f.dead)continue;const sx=DX(f.x),sy=DY(f.y);if(sx<-40||sx>VW()+40||sy<-40||sy>VH()+40)continue;const lifePct=Math.min(1,f.life/300);ctx.save();ctx.globalAlpha=Math.min(1,lifePct*2);ctx.font=`${16+Math.sin(frameCount*0.3+f.x)*3}px serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.shadowColor='#ff4400';ctx.shadowBlur=12;ctx.fillText('🔥',sx,sy);ctx.restore();}}
  function drawRain(){if(!rainOn||!rainDrops.length)return;ctx.save();ctx.strokeStyle='rgba(147,197,253,.52)';ctx.lineWidth=1.5;for(const r of rainDrops){const sx=DX(r.wx),sy=DY(r.wy);if(sx<-5||sx>VW()+5||sy<-5||sy>VH()+5)continue;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(sx+1,sy+9);ctx.stroke();}ctx.restore();}
  function drawBubbles(){for(const b of bubbles){if(b.dead)continue;const bx=DX(b.x),by=DY(b.y);if(bx<-50||bx>VW()+50||by<-50||by>VH()+50)continue;const a=.38+.22*Math.sin(frameCount*.05+b.x*.01);ctx.save();ctx.strokeStyle=`rgba(186,230,253,${a})`;ctx.lineWidth=2.5;ctx.shadowColor='rgba(147,197,253,.55)';ctx.shadowBlur=10;ctx.beginPath();ctx.arc(bx,by,b.r,0,Math.PI*2);ctx.stroke();ctx.fillStyle=`rgba(219,234,254,${a*.22})`;ctx.fill();ctx.globalAlpha=.6;ctx.font=`${Math.round(b.r*.85)}px serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('🫧',bx,by);ctx.restore();}}
  function drawParticles(){for(const p of particles){const a=Math.min(1,(p.life/p.maxLife)*2);ctx.globalAlpha=a;if(p.em){ctx.font=`${p.size}px serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(p.em,DX(p.x),DY(p.y));}else{ctx.fillStyle=p.col;ctx.beginPath();ctx.arc(DX(p.x),DY(p.y),p.size,0,Math.PI*2);ctx.fill();}}ctx.globalAlpha=1;}
  function drawPlayer(){if(!player)return;if(player.invincible&&Math.floor(Date.now()/80)%2)return;ctx.save();ctx.translate(DX(player.x),DY(player.y));ctx.rotate(player.rotation);ctx.font="30px 'Segoe UI Emoji','Apple Color Emoji','Noto Color Emoji',sans-serif";ctx.textAlign='center';ctx.textBaseline='middle';ctx.shadowColor='transparent';ctx.shadowBlur=0;ctx.globalAlpha=1;ctx.fillText((hearts===1||energy<15)?'😰':player.rideBubble?'🥹':'😊',0,0);ctx.restore();}
  // Darkness canvas cached - only regenerate when player moves significantly
  let _dkCv=null, _dkLastX=-999, _dkLastY=-999;
  function drawDarkness(){
    if(lightOn)return;
    const cx=DX(player.x), cy=DY(player.y), R=65;
    // Recreate only if player moved >2px
    if(!_dkCv||Math.abs(cx-_dkLastX)>2||Math.abs(cy-_dkLastY)>2||_dkCv.width!==VW()|_dkCv.height!==VH()){
      if(!_dkCv){_dkCv=document.createElement('canvas');}
      _dkCv.width=VW(); _dkCv.height=VH();
      _dkLastX=cx; _dkLastY=cy;
      const _dkCtx=_dkCv.getContext('2d');
      _dkCtx.globalCompositeOperation='source-over';
      _dkCtx.fillStyle='rgba(0,0,0,.92)';_dkCtx.fillRect(0,0,_dkCv.width,_dkCv.height);
      _dkCtx.globalCompositeOperation='destination-out';
      const g=_dkCtx.createRadialGradient(cx,cy,0,cx,cy,R);
      g.addColorStop(0,'rgba(0,0,0,1)');g.addColorStop(.4,'rgba(0,0,0,.9)');g.addColorStop(1,'rgba(0,0,0,0)');
      _dkCtx.fillStyle=g;_dkCtx.fillRect(0,0,_dkCv.width,_dkCv.height);
      _dkCtx.globalCompositeOperation='source-over';
      const g2=_dkCtx.createRadialGradient(cx,cy,0,cx,cy,R*1.1);
      g2.addColorStop(0,'rgba(0,0,0,0)');g2.addColorStop(.4,'rgba(255,150,50,.06)');g2.addColorStop(1,'rgba(0,0,0,0)');
      _dkCtx.fillStyle=g2;_dkCtx.fillRect(0,0,_dkCv.width,_dkCv.height);
    }
    ctx.save();ctx.globalCompositeOperation='source-over';ctx.drawImage(_dkCv,0,0);ctx.restore();
  }
  function drawExit(){const ex=SHAFT_MID,ey=SHAFT_TOP_Y+28;const sx=DX(ex),sy=DY(ey);if(sy<-120||sy>VH()+80)return;const coneW=SHAFT_W*.88,coneH=SHAFT_HT*.72;const lg=ctx.createLinearGradient(sx,sy,sx,sy+coneH);lg.addColorStop(0,'rgba(255,240,180,.75)');lg.addColorStop(.35,'rgba(255,200,80,.4)');lg.addColorStop(.7,'rgba(255,150,40,.15)');lg.addColorStop(1,'rgba(0,0,0,0)');ctx.save();ctx.fillStyle=lg;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(sx-coneW/2,sy+coneH);ctx.lineTo(sx+coneW/2,sy+coneH);ctx.closePath();ctx.fill();ctx.restore();drawEmoji(ex,ey-10,'☀️',36,Math.sin(frameCount*.03)*.08,'#ffdd00');if(playerHasRing)drawEmoji(ex,ey+30,'🔼',22,0,'#00ff88');}
  function drawDrops(){for(const d of drops){if(d.collected)continue;drawEmoji(d.x,d.y-Math.sin(frameCount*.05)*8,d.emoji,28,0,'#ffd700');}}
  function drawHUDCanvas(){const effs=[];if(lightOn)effs.push('🔦');if(rainOn)effs.push('🌧️');if(windOn)effs.push('🌬️');if(bubblesOn)effs.push('🫧');if(effs.length){ctx.save();ctx.font='13px serif';ctx.fillStyle='rgba(255,200,120,.8)';ctx.textAlign='left';ctx.fillText(effs.join(' '),6,canvas.height-6);ctx.restore();}if(gunAmmo>0){ctx.save();ctx.font='11px sans-serif';ctx.fillStyle='rgba(147,197,253,.85)';ctx.textAlign='right';ctx.fillText(`🔫×${gunAmmo}`,canvas.width-6,canvas.height-6);ctx.restore();}if(!lightOn&&!inShaft){ctx.save();ctx.fillStyle='rgba(255,200,120,.5)';ctx.font='10px sans-serif';ctx.textAlign='center';ctx.fillText('🌑 Oscuro — equipa 🔦',canvas.width/2,canvas.height-6);ctx.restore();}if(inShaft&&!bubblesOn){ctx.save();ctx.fillStyle='rgba(147,197,253,.75)';ctx.font='11px sans-serif';ctx.textAlign='center';ctx.fillText('🫧 Equipa burbujas para subir el pozo',canvas.width/2,14);ctx.restore();}}

  // ── GAME LOOP ──────────────────────────────────────────────────────────────
  function gameLoop(){
    if(!gameActive)return;frameCount++;
    updatePlayer();updateEnemies();updateProjectiles();
    updateRain();updateBubbles();updateParticles();
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.save();
    ctx.scale(ZOOM,ZOOM);
    drawBackground();drawCaveStructure();drawPlatforms();drawCaveFloor();drawAbyss();
    drawBrickWalls();drawObstacles();drawExit();drawRain();drawDarkness();drawBubbles();
    drawEnemies();drawFlameHazards();drawProjectiles();drawDrops();drawParticles();
    drawPlayer();
    ctx.restore();
    drawHUDCanvas();
    prevKeys={jump:keys.jump,attack:keys.attack};
    requestAnimationFrame(gameLoop);
  }

  function updateHUD(){document.getElementById('hearts-display').innerHTML=[0,1,2].map(i=>`<span class="heart">${i<hearts?'❤️':'🤍'}</span>`).join('');}
  let toastT=null;
  function toast(msg){const el=document.getElementById('toast');el.textContent=msg;el.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>el.classList.remove('show'),2800);}
  function triggerWin(){if(victoryDone)return;victoryDone=true;gameActive=false;stopMusic();document.getElementById('win-stats').textContent='¡Has escapado!';document.getElementById('victory-screen').classList.add('show');window.parent.postMessage({type:'CAVE_EXIT',hasRing:playerHasRing},'*');}
  function showDead(){gameActive=false;stopMusic();document.getElementById('game-over').classList.add('show');}

  function startGame(){
    document.getElementById('game-over').classList.remove('show');
    document.getElementById('victory-screen').classList.remove('show');
    document.getElementById('start-screen').style.display='none';
    for(let i=0;i<5;i++){clearEffect(i);slots[i]=null;}
    clearActionSlot();playerHasRing=false;
    rainOn=false;windOn=false;bubblesOn=false;lightOn=false;
    hearts=3;energy=100;gunAmmo=0;frameCount=0;
    victoryDone=false;cameraX=0;cameraY=0;inShaft=false;atkCd=0;
    brickWalls=[];keys={left:false,right:false,jump:false,attack:false};prevKeys={jump:false,attack:false};
    generateWorld();initPlayer();renderSlots();updateHUD();
    document.getElementById('zone-hud').textContent='🕳️ Cueva';
    gameActive=true;startMusic();requestAnimationFrame(gameLoop);
    toast('🌑 Cueva oscura — equipa 🔦 | Llega al fondo y sube el pozo ⬆️');
    initQuickPick();
  }

  // ── CONTROLES ─────────────────────────────────────────────────────────────
  function bind(id,k){const el=document.getElementById(id);el.addEventListener('touchstart',e=>{e.preventDefault();keys[k]=true;},{passive:false});el.addEventListener('touchend',e=>{e.preventDefault();keys[k]=false;},{passive:false});el.addEventListener('mousedown',()=>keys[k]=true);el.addEventListener('mouseup',()=>keys[k]=false);el.addEventListener('mouseleave',()=>keys[k]=false);}
  bind('btn-left','left');bind('btn-right','right');bind('jump-btn-wrapper','jump');
  document.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='a')keys.left=true;if(e.key==='ArrowRight'||e.key==='d')keys.right=true;if(e.key==='ArrowUp'||e.key==='w'||e.key===' '){e.preventDefault();keys.jump=true;}if(e.key==='z'||e.key==='x'){keys.attack=true;doAction();}if(e.key>='1'&&e.key<='5'){const at=document.getElementById('attack-btn-wrapper');if(at.classList.contains('ready'))doAction();}});
  document.addEventListener('keyup',e=>{if(e.key==='ArrowLeft'||e.key==='a')keys.left=false;if(e.key==='ArrowRight'||e.key==='d')keys.right=false;if(e.key==='ArrowUp'||e.key==='w'||e.key===' ')keys.jump=false;if(e.key==='z'||e.key==='x')keys.attack=false;});
  document.getElementById('start-screen').addEventListener('click',startGame);
  document.getElementById('start-screen').addEventListener('touchend',e=>{e.preventDefault();startGame();});
  document.querySelectorAll('.retry-btn').forEach(b=>{b.addEventListener('click',startGame);b.addEventListener('touchend',e=>{e.preventDefault();startGame();});});
  renderSlots();updateHUD();initQuickPick();
})();
