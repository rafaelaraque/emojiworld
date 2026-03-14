/**
 * Cave Level - Full Game Logic
 * Migrated from source-levels/cueva.html
 */

(function() {
  'use strict';

  // ═══════════════════════════════════════════════════════
  // CANVAS SETUP
  // ═══════════════════════════════════════════════════════
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
      r = +r || 4; 
      this.moveTo(x + r, y); 
      this.lineTo(x + w - r, y); 
      this.arcTo(x + w, y, x + w, y + r, r);
      this.lineTo(x + w, y + h - r); 
      this.arcTo(x + w, y + h, x + w - r, y + h, r);
      this.lineTo(x + r, y + h); 
      this.arcTo(x, y + h, x, y + h - r, r);
      this.lineTo(x, y + r); 
      this.arcTo(x, y, x + r, y, r); 
      return this.closePath();
    };
  }

  // ═══════════════════════════════════════════════════════
  // GAME STATE
  // ═══════════════════════════════════════════════════════
  let gameActive = false, frameCount = 0;
  let player, platforms = [];
  let cameraX = 0, cameraY = 0, inShaft = false;
  let keys = { left: false, right: false, jump: false, attack: false };
  let prevKeys = { jump: false, attack: false };
  let hearts = 3, energy = 100, gunAmmo = 0, victoryDone = false, atkCd = 0;
  let lastLandTime = 0;
  
  // Slots
  const slots = [null, null, null, null, null];
  let actionSlot = null;
  let rainOn = false, windOn = false, bubblesOn = false, lightOn = false;
  
  // World
  let enemies = [], obstacles = [], projectiles = [];
  let particles = [], rainDrops = [], bubbles = [], puddles = [], stalactites = [];
  let brickWalls = [];
  let drops = [];
  
  // Boss
  let boss = null;

  let abyssX = 1750, abyssW = 380;
  let roadY, CEIL_Y, HORIZ_END, SHAFT_L, SHAFT_R, SHAFT_MID, SHAFT_TOP_Y;
  const CEIL_H = 195;
  const SHAFT_W = 240;
  const SHAFT_HT = 2700;

  let recentItems = [];

  // ═══════════════════════════════════════════════════════
  // AUDIO FUNCTIONS
  // ═══════════════════════════════════════════════════════
  let _ac = null;
  function AC() { if (!_ac) try { _ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { } return _ac; }
  
  function osc(tp, f1, f2, d, v = 0.28) {
    const ac = AC(); if (!ac) return;
    try {
      const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
      o.type = tp; o.frequency.setValueAtTime(f1, t);
      if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
      g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + d);
      o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + d + .05);
    } catch (e) { }
  }
  
  function nz(d, v = 0.5) {
    const ac = AC(); if (!ac) return;
    try {
      const t = ac.currentTime, n = Math.floor(ac.sampleRate * d), b = ac.createBuffer(1, n, ac.sampleRate), dd = b.getChannelData(0);
      for (let i = 0; i < n; i++) dd[i] = (Math.random() * 2 - 1) * Math.exp(-i / (n * .25));
      const s = ac.createBufferSource(), g = ac.createGain();
      s.buffer = b; g.gain.value = v; s.connect(g); g.connect(ac.destination); s.start(t);
    } catch (e) { }
  }
  
  function SFX_land() { }
  function SFX_jump() { osc('square', 200, 700, .15, .18); }
  function SFX_hurt() { nz(.14, .7); osc('sawtooth', 350, 50, .28, .42); }
  function SFX_pick() { osc('sine', 600, 1200, .12, .2); }
  function SFX_boom() { nz(.2, .6); osc('sawtooth', 200, 30, .25, .4); }
  function SFX_eat() { osc('sine', 500, 850, .14, .2); }
  function SFX_shoot() { osc('sine', 1100, 350, .1, .28); }
  function SFX_bub() { osc('sine', 300, 900, .22, .1); }
  function SFX_splash() { nz(.22, .18); }
  function SFX_wind() { nz(.6, .1); }

  let musicOn = false, mTimers = [];
  const MNOTES = [220, 196, 164.81, 174.61, 196, 220, 246.94, 220];
  
  function startMusic() {
    if (musicOn) return; musicOn = true;
    function loop() {
      if (!musicOn) return;
      const ac = AC(); if (!ac) return; const beat = 60 / 55;
      MNOTES.forEach((f, i) => {
        const id = setTimeout(() => {
          if (!musicOn) return; const ac2 = AC(); if (!ac2) return;
          const t = ac2.currentTime + .01, o = ac2.createOscillator(), g = ac2.createGain();
          o.type = 'sine'; o.frequency.value = f;
          g.gain.setValueAtTime(.07, t); g.gain.exponentialRampToValueAtTime(.001, t + beat * .8);
          o.connect(g); g.connect(ac2.destination); o.start(t); o.stop(t + beat * .85);
        }, i * beat * 1000); mTimers.push(id);
      });
      mTimers.push(setTimeout(loop, MNOTES.length * beat * 1000));
    } loop();
  }
  
  function stopMusic() { musicOn = false; mTimers.forEach(clearTimeout); mTimers = []; }

  // ═══════════════════════════════════════════════════════
  // GENERATE WORLD
  // ═══════════════════════════════════════════════════════
  function makeStalactites() {
    stalactites = [];
    for (let i = 0; i < 80; i++) {
      const s = i < 50 ? 'h' : 'v';
      stalactites.push({
        s,
        x: s === 'h' ? Math.random() * (HORIZ_END - 80) + 40 : SHAFT_L + Math.random() * SHAFT_W,
        y: s === 'h' ? CEIL_Y - Math.random() * 6 : SHAFT_TOP_Y + Math.random() * SHAFT_HT * .9,
        h: 12 + Math.random() * 30, w: 4 + Math.random() * 13, sh: Math.random()
      });
    }
  }

  function generateWorld() {
    platforms = []; enemies = []; obstacles = []; brickWalls = [];
    projectiles = []; particles = []; rainDrops = []; bubbles = []; puddles = [];
    drops = []; boss = null;

    roadY = canvas.height - 55;
    CEIL_Y = roadY - CEIL_H;
    HORIZ_END = 2850;
    SHAFT_L = HORIZ_END - SHAFT_W;
    SHAFT_R = HORIZ_END;
    SHAFT_MID = (SHAFT_L + SHAFT_R) / 2;
    SHAFT_TOP_Y = CEIL_Y - SHAFT_HT;

    abyssX = 1750;
    abyssW = 380;

    // Ground: only on sides of abyss
    platforms.push({ x: 0, y: roadY, w: abyssX, h: 20, type: 'ground' });
    platforms.push({ x: abyssX + abyssW, y: roadY, w: HORIZ_END - abyssX - abyssW + 50, h: 20, type: 'ground' });

    // Horizontal platforms
    [{ x: 180, y: roadY - 95, w: 110 }, { x: 400, y: roadY - 80, w: 100 }, { x: 610, y: roadY - 125, w: 90 },
     { x: 810, y: roadY - 80, w: 105 }, { x: 1030, y: roadY - 110, w: 95 }, { x: 1230, y: roadY - 75, w: 110 },
     { x: 1440, y: roadY - 140, w: 88 }, { x: 1650, y: roadY - 90, w: 100 },
     { x: 2100, y: roadY - 80, w: 110 }, { x: 2300, y: roadY - 125, w: 90 }, { x: 2500, y: roadY - 90, w: 100 }
    ].forEach(p => platforms.push({ ...p, h: 20, type: 'platform' }));

    // Shaft platforms
    const spy = [CEIL_Y - 340, CEIL_Y - 680, CEIL_Y - 1020, CEIL_Y - 1360, CEIL_Y - 1700, CEIL_Y - 2040, CEIL_Y - 2380];
    spy.forEach((py, i) => {
      const px = i % 2 === 0 ? SHAFT_L + 8 : SHAFT_L + SHAFT_W - 108;
      platforms.push({ x: px, y: py, w: 100, h: 20, type: 'platform' });
    });

    // Brick walls
    const bw = (x, hp = 2) => brickWalls.push({ x, y: CEIL_Y, w: 28, h: roadY - CEIL_Y, hp, dead: false, hit: 0 });
    bw(500, 2); bw(920, 2); bw(1340, 3); bw(1960, 2); bw(2250, 3); bw(2450, 2);

    // Fires
    [660, 1100, 1560, 2020, 2440].forEach(x =>
      obstacles.push({ x, y: roadY - 20, w: 36, h: 36, type: 'fire', dead: false, hint: false, ff: 0 }));

    // Puddles
    [700, 1320].forEach(x => puddles.push({ x, y: roadY + 2, w: 80, h: 14, active: true }));

    // Common enemies
    [270, 580, 1000, 1330, 2050, 2380, 2680].forEach((x, i) => enemies.push({
      x, y: i % 2 === 0 ? roadY - 20 : roadY - CEIL_H * .55,
      w: 28, h: 28, type: i % 2 === 0 ? 'spider' : 'bat',
      hp: i % 2 === 0 ? 2 : 1, vx: i % 2 === 0 ? 1.0 : 1.3,
      minX: x - 80, maxX: x + 80, dead: false, deathT: 0,
      emoji: i % 2 === 0 ? '🕷️' : '🦇', phase: Math.random() * Math.PI * 2, baseY: i % 2 === 0 ? roadY - 20 : roadY - CEIL_H * .55
    }));

    // Boss: giant spider at the end
    boss = {
      x: 2700, y: roadY - 70, w: 60, h: 60,
      hp: 10, maxHp: 10,
      vx: 0.8, minX: 2600, maxX: 2800,
      dead: false,
      emoji: '🕷️',
      phase: 0,
      agro: false
    };

    makeStalactites();
  }

  function initPlayer() {
    player = {
      x: 100, y: roadY - 40, vx: 0, vy: 0, w: 40, h: 40,
      onGround: true, jumpCount: 0, maxJumps: 2, rotation: 0,
      alive: true, invincible: false, invincibleTimer: 70, facingRight: true, rideBubble: null
    };
  }

  // ═══════════════════════════════════════════════════════
  // PICKER SYSTEM
  // ═══════════════════════════════════════════════════════
  let picTarget = null, picEmoji = '';

  function addRecent(em) {
    const i = recentItems.indexOf(em);
    if (i !== -1) recentItems.splice(i, 1);
    recentItems.unshift(em);
    if (recentItems.length > 14) recentItems.pop();
  }

  function openPicker(t) {
    picTarget = t; picEmoji = '';
    document.getElementById('picker-label').textContent = t === 'action' ? '→ Botón Acción ⚡' : `→ Slot ${t + 1}`;
    document.getElementById('picker-display').textContent = '↑ elige o escribe';
    document.getElementById('picker-display').classList.remove('has');
    document.getElementById('picker-ok').classList.remove('show');
    const g = document.getElementById('qgrid'); g.innerHTML = '';
    if (recentItems.length === 0) {
      const h = document.createElement('div'); h.className = 'qe-hint';
      h.textContent = 'Aún no has usado ningún ítem.\nUsa los botones rápidos.';
      g.appendChild(h);
    } else {
      recentItems.forEach(em => {
        const el = document.createElement('div'); el.className = 'qe'; el.textContent = em;
        el.onclick = () => selectPicker(em); g.appendChild(el);
      });
    }
    document.getElementById('picker-overlay').classList.add('show');
  }
  
  function selectPicker(em) {
    picEmoji = em;
    const d = document.getElementById('picker-display');
    d.textContent = em; d.classList.add('has');
    document.getElementById('picker-ok').classList.add('show');
  }
  
  function closePicker() { document.getElementById('picker-overlay').classList.remove('show'); picTarget = null; }
  function confirmPicker() { if (!picEmoji) return; const t = picTarget; closePicker(); assignEmoji(picEmoji, t); }

  function initQuickPick() {
    const quickEmojis = ['🔦', '🌧️', '🔫', '🫧', '💣', '🌬️', '🍎'];
    const container = document.getElementById('quick-pick');
    container.innerHTML = '';
    quickEmojis.forEach(em => {
      const btn = document.createElement('div');
      btn.className = 'quick-pick-item';
      btn.textContent = em;
      btn.onclick = () => {
        if (picTarget !== null) {
          selectPicker(em);
          confirmPicker();
        } else {
          toast('Primero selecciona un slot vacío');
        }
      };
      container.appendChild(btn);
    });
  }

  // ═══════════════════════════════════════════════════════
  // EMOJI ASSIGNMENT
  // ═══════════════════════════════════════════════════════
  const BLOCKED = new Set(['🥶', '🔥', '😡', '😎', '🤠', '😁', '🫥']);
  const CAVE_EM = new Set(['🌧️', '🌧', '🌬️', '🌬', '🫧', '🔦']);
  const FOOD_EM = new Set(['🍎', '🍊', '🍋', '🍇', '🍓', '🍉', '🍌', '🥝', '🍑', '🍒',
    '🍕', '🍔', '🌮', '🌯', '🍜', '🍣', '🍩', '🎂', '🧁', '🍫', '🍬', '🍭', '🍦', '🥐',
    '🥞', '🧀', '🥩', '🍗', '🥪', '🌽', '🥕', '🥦', '🥑', '🍄']);
  const ACT_EM = new Set(['💣', '🔫']);

  function assignEmoji(em, target) {
    if (BLOCKED.has(em)) { toast(`🔒 ${em} — Poder bloqueado`); return; }
    addRecent(em);
    const isCave = CAVE_EM.has(em), isFood = FOOD_EM.has(em), isAct = ACT_EM.has(em);
    if (target === 'action') {
      if (isCave) { toast(`${em} va en un slot de cueva`); return; }
      if (isFood || isAct) setActionSlot(em);
      else toast(`${em} — Prueba 💣 🔫 o comida`);
    } else {
      if (isCave) setPowerSlot(target, em);
      else if (isFood || isAct) {
        setPowerSlot(target, em);
        toast(`${em} en grilla — ¡Usa Acción ⚡!`);
      }
      else toast(`${em} — Prueba: 🌧️ 🌬️ 🫧 🔦 💣 🔫 o comidas`);
    }
  }

  function setPowerSlot(idx, em) {
    if (slots[idx]) clearEffect(idx);
    slots[idx] = { emoji: em };
    activateEffect(em);
    renderSlots();
  }

  function clearSlot(idx) {
    clearEffect(idx);
    slots[idx] = null;
    renderSlots();
    toast('Slot vaciado');
  }

  function clearEffect(idx) {
    let em = slots[idx]?.emoji;
    if (!em) return;
    em = em.replace('\uFE0F', '');
    if (em === '🌧') rainOn = false;
    if (em === '🌬') windOn = false;
    if (em === '🫧') bubblesOn = false;
    if (em === '🔦') lightOn = false;
  }

  function activateEffect(em) {
    const baseEm = em.replace('\uFE0F', '');
    if (baseEm === '🌧') { rainOn = true; toast('🌧️ Lluvia — apaga 🔥 y forma charcos 💧'); SFX_splash(); }
    if (baseEm === '🌬') { windOn = true; toast('🌬️ Viento — empuja todo hacia →'); SFX_wind(); }
    if (baseEm === '🫧') { bubblesOn = true; toast('🫧 Burbujas — ¡úsalas para subir el pozo!'); SFX_bub(); }
    if (baseEm === '🔦') { lightOn = true; toast('🔦 ¡Cueva iluminada!'); }
  }

  function setActionSlot(em) {
    actionSlot = { emoji: em, type: em === '💣' ? 'bomb' : em === '🔫' ? 'gun' : FOOD_EM.has(em) ? 'food' : 'none' };
    document.getElementById('attack-btn-wrapper').className = 'ready';
    document.getElementById('atk-em').textContent = em;
    toast(`${em} listo en ⚡`);
  }

  function clearActionSlot() {
    actionSlot = null;
    renderSlots();
  }

  function renderSlots() {
    let hasActionInGrid = false;
    for (let i = 0; i < 5; i++) {
      const el = document.getElementById(`ps${i}`);
      el.innerHTML = '';
      if (slots[i]) {
        el.textContent = slots[i].emoji;
        el.classList.add('glow');
        const x = document.createElement('div'); x.className = 'sclr'; x.textContent = '✕';
        x.onclick = e => { e.stopPropagation(); clearSlot(i); };
        el.appendChild(x);
        if (ACT_EM.has(slots[i].emoji) || FOOD_EM.has(slots[i].emoji)) hasActionInGrid = true;
      } else {
        el.classList.remove('glow');
        const plus = document.createElement('span');
        plus.className = 'plus';
        plus.textContent = '+';
        el.appendChild(plus);
      }
    }
    const atkWrapper = document.getElementById('attack-btn-wrapper');
    if (actionSlot || hasActionInGrid) {
      atkWrapper.className = 'ready';
      if (actionSlot) document.getElementById('atk-em').textContent = actionSlot.emoji;
      else document.getElementById('atk-em').textContent = '⚡';
    } else {
      atkWrapper.className = '';
      document.getElementById('atk-em').textContent = '⚡';
    }
  }

  // ═══════════════════════════════════════════════════════
  // ACTION SYSTEM
  // ═══════════════════════════════════════════════════════
  function doAction() {
    if (atkCd > 0) return;
    let usedAny = false;

    if (rainOn) {
      let hasBomb = false;
      for (let i = 0; i < 5; i++) {
        if (slots[i]?.emoji === '💣') hasBomb = true;
      }
      if (actionSlot?.emoji === '💣') hasBomb = true;
      if (hasBomb) {
        toast('🌧️ La lluvia apaga las bombas, no puedes usarlas');
        return;
      }
    }

    // Check all slots for bombs/food
    for (let i = 0; i < 5; i++) {
      const s = slots[i];
      if (!s) continue;
      const em = s.emoji.replace('\uFE0F', '');
      if (em === '💣' && !s.used) {
        useBomb(player.x + player.w / 2, player.y + player.h / 2);
        s.used = true;
        setTimeout(() => { s.used = false; }, 3000);
        usedAny = true;
      }
      if (FOOD_EM.has(em) && !s.used) {
        useFood(em);
        s.used = true;
        setTimeout(() => { s.used = false; }, 500);
        usedAny = true;
      }
    }

    // Action slot
    if (actionSlot) {
      const em = actionSlot.emoji.replace('\uFE0F', '');
      if (em === '💣') {
        useBomb(player.x + player.w / 2, player.y + player.h / 2);
        usedAny = true;
      }
      if (em === '🔫') {
        useGun();
        usedAny = true;
      }
      if (FOOD_EM.has(em)) {
        useFood(actionSlot.emoji);
        usedAny = true;
      }
    }

    if (usedAny) {
      atkCd = 15;
    }
  }

  function useBomb(x, y) {
    SFX_boom();
    // Destroy nearby brick walls
    brickWalls.forEach(bw => {
      if (!bw.dead && Math.abs(bw.x - x) < 80) {
        bw.hp--;
        bw.hit = 8;
        if (bw.hp <= 0) bw.dead = true;
      }
    });
    // Damage boss
    if (boss && !boss.dead && Math.abs(boss.x - x) < 150) {
      boss.hp--;
      if (boss.hp <= 0) {
        boss.dead = true;
        // Drop ring!
        drops.push({ x: boss.x + boss.w / 2, y: boss.y, emoji: '💍', collected: false });
        SFX_boom();
      }
    }
    // Particle effect
    for (let i = 0; i < 12; i++) {
      particles.push({
        x, y, vx: (Math.random() - 0.5) * 12, vy: (Math.random() - 0.5) * 12 - 4,
        life: 30 + Math.random() * 20, emoji: ['💥', '🔥', '🟠'][Math.floor(Math.random() * 3)]
      });
    }
  }

  function useGun() {
    if (gunAmmo <= 0) {
      toast('🔫 ¡Sin agua! Recarga en 💧charcos');
      return;
    }
    gunAmmo--;
    SFX_shoot();
    const dir = player.facingRight ? 1 : -1;
    projectiles.push({
      x: player.x + player.w / 2, y: player.y + player.h / 3,
      vx: dir * 14, vy: 0,
      w: 14, h: 14, life: 40, emoji: '💧'
    });
  }

  function useFood(em) {
    if (hearts >= 3) {
      toast('❤️ ¡Ya tienes vida completa!');
      return;
    }
    hearts++;
    updateHUD();
    SFX_eat();
    toast('❤️ +1 Vida');
  }

  // ═══════════════════════════════════════════════════════
  // PLAYER UPDATE
  // ═══════════════════════════════════════════════════════
  function updatePlayer() {
    if (!player.alive) return;

    // Horizontal movement
    let moveX = 0;
    if (keys.left) moveX -= 1;
    if (keys.right) moveX += 1;

    const speed = 5.2;
    if (moveX !== 0) {
      player.vx = moveX * speed;
      player.facingRight = moveX > 0;
    } else {
      player.vx *= 0.72;
      if (Math.abs(player.vx) < 0.5) player.vx = 0;
    }

    // Wind effect
    if (windOn) player.vx += 2.2;

    // Gravity
    player.vy += 0.62;

    // Jump
    if (keys.jump && !prevKeys.jump && player.jumpCount < player.maxJumps) {
      player.vy = -13.5;
      player.jumpCount++;
      player.onGround = false;
      SFX_jump();
    }
    prevKeys.jump = keys.jump;

    // Apply velocity
    player.x += player.vx;
    player.y += player.vy;

    // Bubble riding
    if (bubblesOn && !player.onGround && !player.rideBubble) {
      const nearBubble = bubbles.find(b => 
        Math.abs(b.x - (player.x + player.w / 2)) < 40 &&
        Math.abs(b.y - (player.y + player.h / 2)) < 40
      );
      if (nearBubble) {
        player.rideBubble = nearBubble;
      }
    }

    if (player.rideBubble) {
      player.vy = -3;
      player.y += player.vy;
      if (!bubblesOn || player.rideBubble.dead) {
        player.rideBubble = null;
      }
    }

    // Platform collision
    player.onGround = false;
    for (const p of platforms) {
      if (player.x + player.w > p.x && player.x < p.x + p.w &&
          player.y + player.h > p.y && player.y + player.h < p.y + p.h + player.vy + 5 &&
          player.vy >= 0) {
        player.y = p.y - player.h;
        player.vy = 0;
        player.onGround = true;
        player.jumpCount = 0;
        lastLandTime = frameCount;
      }
    }

    // World bounds
    if (player.x < 0) player.x = 0;
    if (player.x + player.w > HORIZ_END) player.x = HORIZ_END - player.w;

    // Ceiling in shaft
    if (player.x > SHAFT_L - 20 && player.x < SHAFT_R + 20 && player.y < SHAFT_TOP_Y + 30) {
      player.y = SHAFT_TOP_Y + 30;
      player.vy = 0;
    }

    // Fall death
    if (player.y > roadY + 100) {
      playerDie();
    }

    // Invincibility
    if (player.invincible) {
      player.invincibleTimer--;
      if (player.invincibleTimer <= 0) player.invincible = false;
    }

    // Collect drops
    for (const d of drops) {
      if (!d.collected && Math.abs(d.x - (player.x + player.w / 2)) < 35 && Math.abs(d.y - (player.y + player.h / 2)) < 35) {
        d.collected = true;
        if (d.emoji === '💍') {
          toast('💍 ¡Encontraste el anillo de Emma!');
          victory();
        } else {
          toast(`¡${d.emoji}!`);
        }
      }
    }

    // Exit
    if (player.x > SHAFT_MID - 30 && player.y < SHAFT_TOP_Y + 50) {
      triggerWin();
    }

    // Camera
    inShaft = player.x > SHAFT_L - 50 && player.x < SHAFT_R + 50;
    if (inShaft) {
      const targetY = player.y - canvas.height / 2;
      cameraY += (targetY - cameraY) * 0.08;
      cameraY = Math.max(SHAFT_TOP_Y - 50, Math.min(cameraY, roadY - canvas.height + 50));
      cameraX = HORIZ_END / 2 - canvas.width / 2;
    } else {
      const targetX = player.x - canvas.width / 2;
      cameraX += (targetX - cameraX) * 0.08;
      cameraX = Math.max(0, Math.min(cameraX, HORIZ_END - canvas.width));
      cameraY = 0;
    }

    // Attack
    if (keys.attack && !prevKeys.attack) {
      doAction();
    }
    prevKeys.attack = keys.attack;

    if (atkCd > 0) atkCd--;
  }

  function playerDie() {
    hearts--;
    updateHUD();
    if (hearts <= 0) {
      player.alive = false;
      SFX_hurt();
      showDead();
    } else {
      SFX_hurt();
      player.invincible = true;
      player.invincibleTimer = 70;
      initPlayer();
    }
  }

  // ═══════════════════════════════════════════════════════
  // ENEMY UPDATE
  // ═══════════════════════════════════════════════════════
  function updateEnemies() {
    for (const e of enemies) {
      if (e.dead) {
        e.deathT++;
        continue;
      }
      
      // Patrol movement
      e.x += e.vx;
      if (e.x < e.minX || e.x > e.maxX) e.vx *= -1;

      // Bat flying
      if (e.type === 'bat') {
        e.phase += 0.05;
        e.y = e.baseY + Math.sin(e.phase) * 30;
      }

      // Collision with player
      if (player.alive && !player.invincible && 
          player.x + player.w > e.x && player.x < e.x + e.w &&
          player.y + player.h > e.y && player.y < e.y + e.h) {
        playerDie();
      }
    }

    // Boss
    if (boss && !boss.dead) {
      boss.x += boss.vx;
      if (boss.x < boss.minX || boss.x > boss.maxX) boss.vx *= -0.8;
      boss.phase += 0.03;

      // Boss attack
      if (frameCount % 120 === 0) {
        // Shoot web
        const dir = player.x < boss.x ? -1 : 1;
        projectiles.push({
          x: boss.x + boss.w / 2, y: boss.y + boss.h / 2,
          vx: dir * 6, vy: 0,
          w: 20, h: 20, life: 50, emoji: '🕸️', isEnemy: true
        });
      }

      // Collision with player
      if (player.alive && !player.invincible && 
          player.x + player.w > boss.x && player.x < boss.x + boss.w &&
          player.y + player.h > boss.y && player.y < boss.y + boss.h) {
        playerDie();
      }

      // Update boss health bar
      document.getElementById('boss-health-bar').style.display = 'block';
      document.getElementById('boss-health-fill').style.width = (boss.hp / boss.maxHp * 100) + '%';
    } else {
      document.getElementById('boss-health-bar').style.display = 'none';
    }
  }

  // ═══════════════════════════════════════════════════════
  // PROJECTILE UPDATE
  // ═══════════════════════════════════════════════════════
  function updateProjectiles() {
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;

      if (p.life <= 0) {
        projectiles.splice(i, 1);
        continue;
      }

      // Hit enemies
      if (!p.isEnemy) {
        for (const e of enemies) {
          if (!e.dead && Math.abs(p.x - (e.x + e.w / 2)) < 25 && Math.abs(p.y - (e.y + e.h / 2)) < 25) {
            e.hp--;
            if (e.hp <= 0) {
              e.dead = true;
              // Drop chance
              if (Math.random() < 0.4) {
                drops.push({ x: e.x + e.w / 2, y: e.y, emoji: FOOD_EM.has ? '🍎' : '💎', collected: false });
              }
            }
            projectiles.splice(i, 1);
            break;
          }
        }
        // Hit boss
        if (boss && !boss.dead && Math.abs(p.x - (boss.x + boss.w / 2)) < 50 && Math.abs(p.y - (boss.y + boss.h / 2)) < 50) {
          boss.hp--;
          if (boss.hp <= 0) {
            boss.dead = true;
            drops.push({ x: boss.x + boss.w / 2, y: boss.y, emoji: '💍', collected: false });
          }
          projectiles.splice(i, 1);
        }
      } else {
        // Enemy projectile hits player
        if (player.alive && !player.invincible && 
            Math.abs(p.x - (player.x + player.w / 2)) < 30 && 
            Math.abs(p.y - (player.y + player.h / 2)) < 30) {
          playerDie();
          projectiles.splice(i, 1);
        }
      }
    }
  }

  // ═══════════════════════════════════════════════════════
  // ENVIRONMENT EFFECTS
  // ═══════════════════════════════════════════════════════
  function updateRain() {
    if (!rainOn) {
      rainDrops = [];
      return;
    }
    if (Math.random() < 0.4) {
      const x = cameraX + Math.random() * canvas.width;
      rainDrops.push({ x, y: -10, vy: 12 + Math.random() * 8 });
    }
    for (let i = rainDrops.length - 1; i >= 0; i--) {
      const r = rainDrops[i];
      r.y += r.vy;
      // Check puddle
      for (const p of puddles) {
        if (p.active && r.x > p.x && r.x < p.x + p.w && r.y > p.y) {
          p.active = false;
          setTimeout(() => { p.active = true; }, 8000);
          rainDrops.splice(i, 1);
          break;
        }
      }
      // Check fire
      for (const o of obstacles) {
        if (o.type === 'fire' && !o.dead && r.x > o.x && r.x < o.x + o.w && r.y > o.y && r.y < o.y + o.h + 20) {
          o.ff++;
          if (o.ff > 40) {
            o.dead = true;
            toast('🔥 Fuego apagado');
          }
          rainDrops.splice(i, 1);
          break;
        }
      }
      if (r.y > canvas.height) rainDrops.splice(i, 1);
    }
  }

  function updateBubbles() {
    if (!bubblesOn) {
      bubbles = [];
      return;
    }
    if (Math.random() < 0.08) {
      bubbles.push({
        x: SHAFT_MID + (Math.random() - 0.5) * 100,
        y: roadY,
        r: 22 + Math.random() * 12,
        vy: -2.5 - Math.random() * 1.5,
        dead: false
      });
    }
    for (const b of bubbles) {
      b.y += b.vy;
      if (b.y < SHAFT_TOP_Y) b.dead = true;
    }
    bubbles = bubbles.filter(b => !b.dead);
  }

  function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.3;
      p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  // ═══════════════════════════════════════════════════════
  // DRAWING FUNCTIONS
  // ═══════════════════════════════════════════════════════
  function DX(x) { return x - cameraX; }
  function DY(y) { return y - cameraY; }

  function drawEmoji(x, y, emoji, size, rot = 0, glow = null) {
    const sx = DX(x), sy = DY(y);
    if (sx < -60 || sx > canvas.width + 60 || sy < -60 || sy > canvas.height + 60) return;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(rot);
    if (glow) { ctx.shadowColor = glow; ctx.shadowBlur = 16; }
    ctx.font = `${size}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, 0, 0);
    ctx.restore();
  }

  function drawBackground() {
    ctx.fillStyle = '#1a0a20';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function drawCaveStructure() {
    ctx.fillStyle = '#2a1a30';
    for (const s of stalactites) {
      const sx = DX(s.x), sy = DY(s.y);
      if (sx < -50 || sx > canvas.width + 50) continue;
      ctx.save();
      if (s.s === 'h') {
        ctx.fillRect(sx - s.w / 2, sy, s.w, s.h);
      } else {
        ctx.fillRect(sx - s.w / 2, sy, s.w, s.h);
      }
      ctx.restore();
    }
  }

  function drawPlatforms() {
    for (const p of platforms) {
      const sx = DX(p.x), sy = DY(p.y);
      if (sx > canvas.width + 100 || sx + p.w < -100) continue;
      ctx.fillStyle = p.type === 'ground' ? '#3d2810' : '#5a3a20';
      ctx.fillRect(sx, sy, p.w, p.h);
      ctx.fillStyle = p.type === 'ground' ? '#4d3820' : '#6a4a30';
      ctx.fillRect(sx, sy, p.w, 4);
    }
  }

  function drawCaveFloor() {
    ctx.fillStyle = '#2d1a08';
    ctx.fillRect(0, DY(roadY), canvas.width, canvas.height - DY(roadY));
  }

  function drawAbyss() {
    if (inShaft) return;
    const ax = DX(abyssX), aw = DX(abyssX + abyssW) - DX(abyssX);
    if (ax > canvas.width + 80 || ax + aw < -80) return;
    const ag = ctx.createLinearGradient(ax, DY(roadY), ax, DY(roadY) + 90);
    ag.addColorStop(0, 'rgba(0,0,0,.9)'); ag.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = ag; ctx.fillRect(ax, DY(roadY), aw, 90);
    ctx.fillStyle = '#3d2810';
    ctx.beginPath(); ctx.moveTo(ax - 2, DY(roadY) - 14); ctx.lineTo(ax + 10, DY(roadY) + 35); ctx.lineTo(ax - 2, DY(roadY) + 35); ctx.fill();
    ctx.beginPath(); ctx.moveTo(ax + aw + 2, DY(roadY) - 14); ctx.lineTo(ax + aw - 10, DY(roadY) + 35); ctx.lineTo(ax + aw + 2, DY(roadY) + 35); ctx.fill();
    const pulse = .5 + .5 * Math.sin(frameCount * .14);
    ctx.save(); ctx.fillStyle = `rgba(255,80,50,${pulse * .9})`;
    ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('⚠️ 🌬️+🫧', ax + aw / 2, DY(roadY) - 22); ctx.restore();
  }

  function drawBrickWalls() {
    for (const bw of brickWalls) {
      if (bw.dead) continue;
      const sx = DX(bw.x), sy = DY(bw.y);
      if (sx > canvas.width + 50 || sx + bw.w < -50) continue;
      ctx.fillStyle = '#8B4513';
      const cols = Math.floor(bw.w / 14);
      for (let row = 0; row < Math.ceil(bw.h / 12); row++) {
        for (let col = 0; col < cols; col++) {
          ctx.fillRect(sx + col * 14 + 1, sy + row * 12 + 1, 12, 10);
        }
      }
    }
  }

  function drawObstacles() {
    for (const o of obstacles) {
      if (o.dead) continue;
      const sx = DX(o.x), sy = DY(o.y);
      if (sx > canvas.width + 50 || sx + o.w < -50) continue;
      if (o.type === 'fire') {
        o.ff = (o.ff || 0) + 1;
        const flicker = Math.sin(o.ff * 0.5) * 3;
        ctx.font = `${o.h + flicker}px serif`;
        ctx.fillText('🔥', sx + o.w / 2, sy + o.h / 2);
      }
    }
  }

  function drawExit() {
    const sx = SHAFT_MID, sy = SHAFT_TOP_Y;
    const dsx = DX(sx), dsy = DY(sy);
    if (dsx < -80 || dsx > canvas.width + 80) return;
    ctx.save();
    ctx.shadowColor = '#fff8c0'; ctx.shadowBlur = 40;
    const og = ctx.createRadialGradient(dsx, dsy, 0, dsx, dsy, 46);
    og.addColorStop(0, '#fffde4'); og.addColorStop(.5, '#ffe87a'); og.addColorStop(1, 'rgba(255,210,60,0)');
    ctx.fillStyle = og; ctx.beginPath(); ctx.ellipse(dsx, dsy, 46, 28, 0, 0, Math.PI * 2); ctx.fill();
    const eg = ctx.createRadialGradient(dsx, dsy - 4, 2, dsx, dsy, 34);
    eg.addColorStop(0, '#fffde8'); eg.addColorStop(.4, '#ffe87a'); eg.addColorStop(.85, '#f59e0b'); eg.addColorStop(1, '#c68642');
    ctx.fillStyle = eg; ctx.beginPath(); ctx.ellipse(dsx, dsy, 34, 21, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,245,.94)'; ctx.beginPath(); ctx.ellipse(dsx, dsy - 2, 17, 11, 0, 0, Math.PI * 2); ctx.fill();
    const pulse = .5 + .5 * Math.sin(frameCount * .08);
    ctx.strokeStyle = `rgba(255,220,80,${pulse * .6})`; ctx.lineWidth = 2 + pulse;
    ctx.beginPath(); ctx.ellipse(dsx, dsy, 38 + pulse * 4, 23 + pulse * 2, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.font = 'bold 11px sans-serif'; ctx.fillStyle = 'rgba(100,65,0,.9)';
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText('☀️ SALIDA', dsx, dsy - 24); ctx.restore();
  }

  function drawRain() {
    ctx.strokeStyle = 'rgba(150,200,255,.4)';
    ctx.lineWidth = 1.5;
    for (const r of rainDrops) {
      const sx = DX(r.x), sy = DY(r.y);
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx - 2, sy + 15); ctx.stroke();
    }
  }

  function drawDarkness() {
    if (lightOn || inShaft) return;
    const gradient = ctx.createRadialGradient(
      DX(player.x + player.w / 2), DY(player.y + player.h / 2), 60,
      DX(player.x + player.w / 2), DY(player.y + player.h / 2), 320
    );
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, 'rgba(0,0,0,.92)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function drawBubbles() {
    for (const b of bubbles) {
      const sx = DX(b.x), sy = DY(b.y);
      if (sx < -50 || sx > canvas.width + 50) continue;
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.strokeStyle = 'rgba(200,240,255,.7)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(sx, sy, b.r, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'rgba(200,240,255,.15)';
      ctx.fill();
      ctx.restore();
    }
  }

  function drawEnemies() {
    for (const e of enemies) {
      if (e.dead) continue;
      const sx = DX(e.x), sy = DY(e.y);
      if (sx < -50 || sx > canvas.width + 50) continue;
      drawEmoji(e.x, e.y, e.emoji, e.w, 0, '#ff5555');
    }
    if (boss && !boss.dead) {
      const sx = DX(boss.x), sy = DY(boss.y);
      if (sx > -100 && sx < canvas.width + 100) {
        drawEmoji(boss.x, boss.y, boss.emoji, boss.w + 10, Math.sin(boss.phase) * 0.1, '#ff0000');
      }
    }
  }

  function drawProjectiles() {
    for (const p of projectiles) {
      const sx = DX(p.x), sy = DY(p.y);
      if (sx < -50 || sx > canvas.width + 50) continue;
      drawEmoji(p.x, p.y, p.emoji, p.w);
    }
  }

  function drawDrops() {
    for (const d of drops) {
      if (d.collected) continue;
      drawEmoji(d.x, d.y, d.emoji, 30, 0, '#ffd700');
    }
  }

  function drawParticles() {
    for (const p of particles) {
      drawEmoji(p.x, p.y, p.emoji, 18);
    }
  }

  function drawPlayer() {
    if (!player.alive) return;
    if (player.invincible && Math.floor(frameCount / 4) % 2 === 0) return;
    const sx = DX(player.x), sy = DY(player.y);
    ctx.save();
    ctx.translate(sx + player.w / 2, sy + player.h / 2);
    if (!player.facingRight) ctx.scale(-1, 1);
    ctx.font = '38px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🧑', 0, 0);
    ctx.restore();
  }

  function drawHUDCanvas() {
    const effs = []; if (rainOn) effs.push('🌧️'); if (windOn) effs.push('🌬️'); if (bubblesOn) effs.push('🫧'); if (lightOn) effs.push('🔦');
    if (effs.length) { ctx.save(); ctx.font = '13px serif'; ctx.fillStyle = 'rgba(255,200,120,.8)'; ctx.textAlign = 'left'; ctx.fillText(effs.join(' '), 6, canvas.height - 6); ctx.restore(); }
    if (gunAmmo > 0) { ctx.save(); ctx.font = '11px sans-serif'; ctx.fillStyle = 'rgba(147,197,253,.85)'; ctx.textAlign = 'right'; ctx.fillText(`🔫×${gunAmmo}`, canvas.width - 6, canvas.height - 6); ctx.restore(); }
    if (!lightOn && !inShaft) { ctx.save(); ctx.fillStyle = 'rgba(255,200,120,.5)'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('🌑 Oscuro — equipa 🔦', canvas.width / 2, canvas.height - 6); ctx.restore(); }
    if (inShaft && !bubblesOn) { ctx.save(); ctx.fillStyle = 'rgba(147,197,253,.75)'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('🫧 Equipa burbujas para subir el pozo', canvas.width / 2, 14); ctx.restore(); }
  }

  // ═══════════════════════════════════════════════════════
  // GAME LOOP
  // ═══════════════════════════════════════════════════════
  function gameLoop() {
    if (!gameActive) return;
    frameCount++;
    updatePlayer(); updateEnemies(); updateProjectiles();
    updateRain(); updateBubbles(); updateParticles();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    drawCaveStructure();
    drawPlatforms();
    drawCaveFloor();
    drawAbyss();
    drawBrickWalls();
    drawObstacles();
    drawExit();
    drawRain();
    drawDarkness();
    drawBubbles();
    drawEnemies();
    drawProjectiles();
    drawDrops();
    drawParticles();
    drawPlayer();
    drawHUDCanvas();
    requestAnimationFrame(gameLoop);
  }

  function updateHUD() {
    document.getElementById('hearts-display').innerHTML =
      [0, 1, 2].map(i => `<span class="heart">${i < hearts ? '❤️' : '🤍'}</span>`).join('');
  }

  let toastT = null;
  function toast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg; el.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 2800);
  }

  function triggerWin() {
    if (victoryDone) return; victoryDone = true; gameActive = false; stopMusic();
    document.getElementById('win-stats').textContent = `¡Has escapado!`;
    document.getElementById('victory-screen').classList.add('show');
  }

  function victory() {
    triggerWin();
  }

  function showDead() {
    gameActive = false; stopMusic(); document.getElementById('game-over').classList.add('show');
  }

  function startGame() {
    document.getElementById('game-over').classList.remove('show');
    document.getElementById('victory-screen').classList.remove('show');
    document.getElementById('start-screen').style.display = 'none';
    for (let i = 0; i < 5; i++) { clearEffect(i); slots[i] = null; }
    actionSlot = null; clearActionSlot();
    rainOn = false; windOn = false; bubblesOn = false; lightOn = false;
    hearts = 3; energy = 100; gunAmmo = 0; frameCount = 0;
    victoryDone = false; cameraX = 0; cameraY = 0; inShaft = false; atkCd = 0; lastLandTime = 0;
    brickWalls = [];
    keys = { left: false, right: false, jump: false, attack: false };
    prevKeys = { jump: false, attack: false };
    generateWorld(); initPlayer(); renderSlots(); updateHUD();
    document.getElementById('zone-hud').textContent = '🕳️ Cueva';
    gameActive = true; startMusic();
    requestAnimationFrame(gameLoop);
    toast('🌑 Cueva oscura — equipa 🔦 | Llega al fondo y sube el pozo ⬆️');
  }

  // ═══════════════════════════════════════════════════════
  // CONTROLS
  // ═══════════════════════════════════════════════════════
  function bind(id, k) {
    const el = document.getElementById(id);
    el.addEventListener('touchstart', e => { e.preventDefault(); keys[k] = true; }, { passive: false });
    el.addEventListener('touchend', e => { e.preventDefault(); keys[k] = false; }, { passive: false });
    el.addEventListener('mousedown', () => keys[k] = true);
    el.addEventListener('mouseup', () => keys[k] = false);
    el.addEventListener('mouseleave', () => keys[k] = false);
  }
  bind('btn-left', 'left'); bind('btn-right', 'right'); bind('jump-btn-wrapper', 'jump');
  const atkEl = document.getElementById('attack-btn-wrapper');
  atkEl.addEventListener('touchstart', e => { e.preventDefault(); keys.attack = true; }, { passive: false });
  atkEl.addEventListener('touchend', e => { e.preventDefault(); keys.attack = false; }, { passive: false });
  atkEl.addEventListener('mousedown', () => keys.attack = true);
  atkEl.addEventListener('mouseup', () => keys.attack = false);
  atkEl.addEventListener('mouseleave', () => keys.attack = false);
  
  document.addEventListener('keydown', e => {
    if (!gameActive) return;
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = true;
    if (['ArrowUp', 'w', ' '].includes(e.key)) { e.preventDefault(); keys.jump = true; }
    if (e.key === 'z' || e.key === 'x') keys.attack = true;
    if (e.key === 'Escape') closePicker();
  });
  document.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
    if (['ArrowUp', 'w', ' '].includes(e.key)) keys.jump = false;
    if (e.key === 'z' || e.key === 'x') keys.attack = false;
  });

  // Picker controls
  document.getElementById('picker-kbd').onclick = () => { document.getElementById('picker-real').value = ''; document.getElementById('picker-real').focus(); };
  document.getElementById('picker-display').onclick = () => { document.getElementById('picker-real').value = ''; document.getElementById('picker-real').focus(); };
  document.getElementById('picker-real').oninput = e => {
    const v = e.target.value.trim(); e.target.value = ''; if (!v) return;
    const em = [...v].find(c => c.codePointAt(0) > 127) || v[0]; if (em) selectPicker(em);
  };
  document.getElementById('picker-ok').onclick = confirmPicker;
  document.getElementById('picker-cancel').onclick = closePicker;
  for (let i = 0; i < 5; i++) {
    document.getElementById(`ps${i}`).onclick = () => { if (gameActive) openPicker(i); };
  }
  document.getElementById('attack-btn-wrapper').addEventListener('click', function () {
    if (!gameActive) return;
    if (this.classList.contains('ready')) doAction();
    else openPicker('action');
  });

  // Game buttons
  document.getElementById('btn-play').onclick = () => { AC(); startGame(); };
  document.getElementById('btn-restart').onclick = startGame;
  document.getElementById('btn-win').onclick = startGame;

  // Initialize
  initQuickPick();

  function resizeCanvas() {
    const c = document.getElementById('game-container');
    canvas.width = c.clientWidth;
    canvas.height = Math.round(c.clientHeight * 0.65);
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // Expose for external use
  window.CaveGame = {
    start: startGame,
    getHearts: () => hearts,
    isActive: () => gameActive
  };

})();
