(function() {
  'use strict';
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  if (!ctx.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
      r = +r || 4; this.moveTo(x + r, y); this.lineTo(x + w - r, y); this.arcTo(x + w, y, x + w, y + r, r);
      this.lineTo(x + w, y + h - r); this.arcTo(x + w, y + h, x + w - r, y + h, r);
      this.lineTo(x + r, y + h); this.arcTo(x, y + h, x, y + h - r, r);
      this.lineTo(x, y + r); this.arcTo(x, y, x + r, y, r); this.closePath(); return this;
    };
  }

  // ── ESTADO ─────────────────────────────────
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
  // Mundo
  let enemies = [], obstacles = [], projectiles = [];
  let particles = [], rainDrops = [], bubbles = [], puddles = [], stalactites = [];
  let brickWalls = [];
  let drops = []; // { x, y, emoji, collected }

  // Jefe
  let boss = null; // objeto especial

  let abyssX = 1750, abyssW = 380;
  let roadY, CEIL_Y, HORIZ_END, SHAFT_L, SHAFT_R, SHAFT_MID, SHAFT_TOP_Y;
  const CEIL_H = 195;
  const SHAFT_W = 240;
  const SHAFT_HT = 2700;

  let recentItems = [];

  // ── FUNCIONES DE AUDIO ──────────────────────
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

  // ── GENERAR MUNDO ──────────────────────────
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
    SHAFT_L = HORIZ_END - SHAFT_W;   // 2610
    SHAFT_R = HORIZ_END;           // 2850
    SHAFT_MID = (SHAFT_L + SHAFT_R) / 2;
    SHAFT_TOP_Y = CEIL_Y - SHAFT_HT;

    abyssX = 1750;
    abyssW = 380;

    // Suelo: solo a los lados del abismo (el abismo es vacío)
    platforms.push({ x: 0, y: roadY, w: abyssX, h: 20, type: 'ground' });
    platforms.push({ x: abyssX + abyssW, y: roadY, w: HORIZ_END - abyssX - abyssW + 50, h: 20, type: 'ground' });

    // Plataformas horizontales
    [{ x: 180, y: roadY - 95, w: 110 }, { x: 400, y: roadY - 80, w: 100 }, { x: 610, y: roadY - 125, w: 90 },
     { x: 810, y: roadY - 80, w: 105 }, { x: 1030, y: roadY - 110, w: 95 }, { x: 1230, y: roadY - 75, w: 110 },
     { x: 1440, y: roadY - 140, w: 88 }, { x: 1650, y: roadY - 90, w: 100 },
     { x: 2100, y: roadY - 80, w: 110 }, { x: 2300, y: roadY - 125, w: 90 }, { x: 2500, y: roadY - 90, w: 100 }
    ].forEach(p => platforms.push({ ...p, h: 20, type: 'platform' }));

    // Plataformas pozo
    const spy = [CEIL_Y - 340, CEIL_Y - 680, CEIL_Y - 1020, CEIL_Y - 1360, CEIL_Y - 1700, CEIL_Y - 2040, CEIL_Y - 2380];
    spy.forEach((py, i) => {
      const px = i % 2 === 0 ? SHAFT_L + 8 : SHAFT_L + SHAFT_W - 108;
      platforms.push({ x: px, y: py, w: 100, h: 20, type: 'platform' });
    });

    // Paredes de ladrillo
    const bw = (x, hp = 2) => brickWalls.push({ x, y: CEIL_Y, w: 28, h: roadY - CEIL_Y, hp, dead: false, hit: 0 });
    bw(500, 2); bw(920, 2); bw(1340, 3); bw(1960, 2); bw(2250, 3); bw(2450, 2);

    // Fuegos
    [660, 1100, 1560, 2020, 2440].forEach(x =>
      obstacles.push({ x, y: roadY - 20, w: 36, h: 36, type: 'fire', dead: false, hint: false, ff: 0 }));

    // Charcos iniciales
    [700, 1320].forEach(x => puddles.push({ x, y: roadY + 2, w: 80, h: 14, active: true }));

    // Enemigos comunes
    [270, 580, 1000, 1330, 2050, 2380, 2680].forEach((x, i) => enemies.push({
      x, y: i % 2 === 0 ? roadY - 20 : roadY - CEIL_H * .55,
      w: 28, h: 28, type: i % 2 === 0 ? 'spider' : 'bat',
      hp: i % 2 === 0 ? 2 : 1, vx: i % 2 === 0 ? 1.0 : 1.3,
      minX: x - 80, maxX: x + 80, dead: false, deathT: 0,
      emoji: i % 2 === 0 ? '🕷️' : '🦇', phase: Math.random() * Math.PI * 2, baseY: i % 2 === 0 ? roadY - 20 : roadY - CEIL_H * .55
    }));

    // Jefe: araña gigante al final, antes del pozo
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

  // ── PICKER ─────────────────────────────────
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

  // ── ASIGNAR EMOJI ──────────────────────────
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

  // ── ACCIÓN (con lógica de lluvia) ──────────
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

    for (let i = 0; i < 5; i++) {
      const em = slots[i]?.emoji;
      if (!em) continue;
      if (em === '💣') { launchBomb(); atkCd = 42; usedAny = true; }
      else if (em === '🔫') { fireGun(); if (atkCd < 18) atkCd = 18; usedAny = true; }
      else if (FOOD_EM.has(em)) { eatFood(em); clearSlot(i); if (atkCd < 20) atkCd = 20; usedAny = true; }
    }

    if (!usedAny && actionSlot) {
      const { type, emoji } = actionSlot;
      if (type === 'bomb') { launchBomb(); atkCd = 42; }
      else if (type === 'gun') { fireGun(); atkCd = 18; }
      else if (type === 'food') { eatFood(emoji); clearActionSlot(); atkCd = 20; }
    }
  }

  function launchBomb() {
    const d = player.facingRight ? 1 : -1;
    projectiles.push({ type: 'bomb', emoji: '💣', x: player.x + d * 22, y: player.y - 8, vx: d * 3.5, vy: -5.5, life: 100 });
    osc('sine', 500, 900, .08, .25);
  }

  function fireGun() {
    if (gunAmmo <= 0) { toast('🔫 Sin munición — pasa por un charco 💧'); return; }
    const d = player.facingRight ? 1 : -1;
    projectiles.push({ type: 'water', emoji: '💧', x: player.x + d * 20, y: player.y - 6, vx: d * 14, vy: -1, life: 55 });
    gunAmmo--; SFX_shoot(); if (gunAmmo === 0) toast('🔫 Sin munición');
  }

  function eatFood(em) {
    if (hearts < 3) hearts++; energy = Math.min(100, energy + 30);
    updateHUD(); SFX_eat(); toast(`${em} ¡Comido! +❤️`); spawnParts(player.x, player.y, '#f87171', 10, '❤️');
  }

  // ── FÍSICA ─────────────────────────────────
  const gravity = 0.5, PSPEED = 5;

  function updatePlayer() {
    if (!player.alive || !gameActive) return;
    if (player.invincible) { player.invincibleTimer--; if (player.invincibleTimer <= 0) player.invincible = false; }
    if (atkCd > 0) atkCd--;
    if (frameCount % 200 === 0) { energy = Math.max(0, energy - 2); updateHUD(); }

    player.vx = 0;
    if (keys.left) { player.vx = -PSPEED; player.facingRight = false; }
    if (keys.right) { player.vx = PSPEED; player.facingRight = true; }
    if (windOn) player.vx += 1.8;

    if (!player.onGround) player.vy += gravity;
    player.x += player.vx;
    player.y += player.vy;
    player.rotation += player.vx * 0.02;
    if (player.x < 20) { player.x = 20; player.vx = 0; }

    // Pared final
    if (player.y + player.h / 2 >= CEIL_Y && player.x + player.w / 2 > HORIZ_END) {
      player.x = HORIZ_END - player.w / 2;
      player.vx = 0;
    }

    const strictInShaft = player.x > SHAFT_L + 8 && player.x < SHAFT_R - 8;
    if (!strictInShaft && player.y - player.h / 2 < CEIL_Y) {
      player.y = CEIL_Y + player.h / 2;
      if (player.vy < 0) player.vy = 0;
      if (player.rideBubble) {
        player.rideBubble.dead = true;
        player.rideBubble = null;
        spawnParts(player.x, player.y, '#bfdbfe', 8, '🫧');
      }
    }

    if (player.y - player.h / 2 < CEIL_Y) {
      if (player.x - player.w / 2 < SHAFT_L) { player.x = SHAFT_L + player.w / 2; player.vx = 0; }
      if (player.x + player.w / 2 > SHAFT_R) { player.x = SHAFT_R - player.w / 2; player.vx = 0; }
    }

    const _was = player.onGround;
    player.onGround = false;
    let landedThisFrame = false;

    // Suelo (solo en los extremos, el abismo no tiene suelo)
    if (player.y + player.h / 2 >= roadY && player.vy >= 0) {
      // Verificar si está sobre el abismo (zona sin suelo)
      if (player.x + player.w / 2 > abyssX && player.x - player.w / 2 < abyssX + abyssW) {
        // Está en el abismo, no debe tocar suelo
      } else {
        player.y = roadY - player.h / 2; player.vy = 0;
        if (!_was && !landedThisFrame) { SFX_land(); landedThisFrame = true; }
        player.onGround = true; player.jumpCount = 0;
      }
    }

    // Plataformas
    for (const p of platforms) {
      if (p.type === 'ground') continue;
      if (player.x + player.w / 2 > p.x && player.x - player.w / 2 < p.x + p.w &&
          player.y + player.h / 2 > p.y && player.y + player.h / 2 < p.y + p.h && player.vy > 0) {
        player.y = p.y - player.h / 2; player.vy = 0;
        if (!_was && !landedThisFrame) { SFX_land(); landedThisFrame = true; }
        player.onGround = true; player.jumpCount = 0;
      }
    }

    const jumpPressed = keys.jump && !prevKeys.jump;
    if (jumpPressed && player.jumpCount < player.maxJumps) {
      player.vy = player.jumpCount === 0 ? -12 : -10;
      player.jumpCount++; player.onGround = false; SFX_jump();
    }
    const atkPressed = keys.attack && !prevKeys.attack;
    if (atkPressed) doAction();
    prevKeys.jump = keys.jump; prevKeys.attack = keys.attack;

    // Obstáculos
    for (const o of obstacles) {
      if (o.dead) continue;
      if (player.x + player.w / 2 > o.x && player.x - player.w / 2 < o.x + o.w &&
          player.y + player.h / 2 > o.y && player.y - player.h / 2 < o.y + o.h) {
        if (player.x < o.x + o.w / 2) player.x = o.x - player.w / 2 - 1; else player.x = o.x + o.w + player.w / 2 + 1;
        player.vx = 0;
        if (!player.invincible && o.type === 'fire') takeDamage();
      }
    }

    // Paredes ladrillo
    for (const bw of brickWalls) {
      if (bw.dead) continue;
      if (player.x + player.w / 2 > bw.x && player.x - player.w / 2 < bw.x + bw.w &&
          player.y + player.h / 2 > bw.y && player.y - player.h / 2 < bw.y + bw.h) {
        if (player.x < bw.x + bw.w / 2) { player.x = bw.x - player.w / 2 - 1; }
        else { player.x = bw.x + bw.w + player.w / 2 + 1; }
        player.vx = 0;
        if (!bw.hintShown) { bw.hintShown = true; toast('🧱 Pared — usa 💣 para romperla'); }
      }
    }

    // ABISMO: quita un corazón y teletransporta al borde izquierdo
    if (!player.rideBubble && // si va en burbuja no cae
        player.x + player.w / 2 > abyssX && player.x - player.w / 2 < abyssX + abyssW &&
        player.y + player.h / 2 > roadY + 5) { // cayendo en el hueco
      // Quitar vida y retroceder
      if (!player.invincible) {
        takeDamage(); // resta un corazón
        // Retroceder al borde izquierdo del abismo
        player.x = abyssX - player.w / 2 - 5;
        player.y = roadY - player.h / 2 - 10; // un poco arriba
        player.vy = -2; // pequeño rebote
        toast('🕳️ Caíste al abismo');
      }
    }

    if (!inShaft && Math.abs(player.x - abyssX) < 200 && !player._abyssHint) {
      player._abyssHint = true; toast('🕳️ Abismo — necesitas 🌬️+🫧 para cruzar');
    }

    // Charcos
    for (const pu of puddles) {
      if (!pu.active) continue;
      if (player.x + player.w / 2 > pu.x && player.x - player.w / 2 < pu.x + pu.w &&
          player.y + player.h / 2 >= pu.y - 6 && player.y + player.h / 2 <= pu.y + pu.h + 12) {
        if (gunAmmo < 12) { gunAmmo = 12; toast('🔫 Pistola recargada × 12'); spawnParts(player.x, pu.y, '#60a5fa', 6, '💦'); }
      }
    }

    // Enemigos comunes
    if (!player.invincible) {
      for (const e of enemies) {
        if (!e.dead && Math.abs(e.x - player.x) < 26 && Math.abs(e.y - player.y) < 24) {
          takeDamage(); player.vx = player.x < e.x ? -5 : 5; player.vy = -5;
        }
      }
    }

    // Jefe (araña) con movimiento agresivo
    if (boss && !boss.dead) {
      // Detectar si el jugador está cerca para activar agro
      const distToPlayer = Math.abs(boss.x - player.x);
      if (distToPlayer < 200) {
        boss.agro = true;
      } else {
        boss.agro = false;
      }
      if (boss.agro) {
        // Moverse hacia el jugador
        if (boss.x < player.x) boss.x += 2.5;
        else boss.x -= 2.5;
      } else {
        // Patrullaje normal
        boss.x += boss.vx;
        if (boss.x > boss.maxX || boss.x < boss.minX) boss.vx *= -1;
      }
      boss.phase += 0.03;
      // Colisión con el jugador
      if (!player.invincible && Math.abs(boss.x - player.x) < 40 && Math.abs(boss.y - player.y) < 40) {
        takeDamage(); player.vx = player.x < boss.x ? -8 : 8; player.vy = -6;
      }
    }

    // Burbuja
    if (!player.rideBubble) {
      for (const b of bubbles) {
        if (!b.dead && Math.abs(b.x - player.x) < 32 && Math.abs(b.y - player.y) < 32) {
          player.rideBubble = b; SFX_bub(); toast('🫧 ¡Montando burbuja!');
        }
      }
    }
    if (player.rideBubble) {
      const b = player.rideBubble;
      if (b.dead) { player.rideBubble = null; }
      else { player.x = b.x; player.y = b.y - 38; player.vy = 0; player.onGround = false; }
    }

    // Drops (anillo) - NO termina el juego
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i];
      if (d.collected) continue;
      if (Math.abs(player.x - d.x) < 30 && Math.abs(player.y - d.y) < 30) {
        d.collected = true;
        toast('💍 ¡Encontraste el anillo de Emma!');
        SFX_pick();
        drops.splice(i, 1);
      }
    }

    // Victoria
    if (player.y < SHAFT_TOP_Y + 55 && player.x > SHAFT_L && player.x < SHAFT_R) { triggerWin(); return; }

    if (player.y > roadY + 400) { player.alive = false; setTimeout(showDead, 350); return; }

    inShaft = player.y - player.h / 2 < CEIL_Y;
    let targetCamX, targetCamY;
    if (inShaft) {
      targetCamX = SHAFT_L - (canvas.width - SHAFT_W) / 2;
      targetCamY = player.y - canvas.height * 0.5;
    } else {
      targetCamX = Math.max(0, player.x - canvas.width / 3);
      targetCamY = 0;
    }
    cameraX += (targetCamX - cameraX) * 0.2;
    cameraY += (targetCamY - cameraY) * 0.2;

    document.getElementById('zone-hud').textContent = inShaft ? '↑ Pozo — usa 🫧' : (player.x > HORIZ_END - 320 ? '🧱 Pared — busca el pozo' : '🕳️ Cueva');
  }

  function takeDamage() {
    if (player.invincible) return;
    hearts--; updateHUD(); player.invincible = true; player.invincibleTimer = 70;
    SFX_hurt(); spawnParts(player.x, player.y, '#ff4444', 10, '💢');
    const h = document.getElementById('hearts-display');
    h.classList.remove('damage-shake'); void h.offsetWidth; h.classList.add('damage-shake');
    if (hearts <= 0) { player.alive = false; setTimeout(showDead, 350); }
  }

  function updateEnemies() {
    for (const e of enemies) {
      if (e.dead) { e.deathT++; continue; }
      const wp = windOn ? 2.2 : 0;
      if (e.type === 'bat') { e.phase += 0.025; e.y = e.baseY + Math.sin(e.phase) * 45; e.x += e.vx + wp; }
      else e.x += e.vx + wp * 0.6;
      if (e.x > e.maxX || e.x < e.minX) e.vx *= -1;
    }

    // Mostrar/ocultar barra de vida del jefe (solo cuando está vivo)
    if (boss && !boss.dead) {
      document.getElementById('boss-health-bar').style.display = 'block';
      document.getElementById('boss-health-fill').style.width = (boss.hp / boss.maxHp * 100) + '%';
    } else {
      document.getElementById('boss-health-bar').style.display = 'none';
    }
  }

  function updateProjectiles() {
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i]; p.vy += 0.22; p.x += p.vx; p.y += p.vy; p.life--;
      if (p.life <= 0) { if (p.type === 'bomb') explode(p.x, p.y); projectiles.splice(i, 1); continue; }
      let hit = false;

      // Enemigos comunes
      for (const e of enemies) {
        if (!e.dead && Math.abs(e.x - p.x) < 28 && Math.abs(e.y - p.y) < 28) {
          if (p.type === 'bomb') explode(p.x, p.y);
          else { e.dead = true; spawnParts(e.x, e.y, '#fbbf24', 8, e.emoji); }
          projectiles.splice(i, 1); hit = true; break;
        }
      }
      if (hit) continue;

      // Jefe
      if (boss && !boss.dead && Math.abs(boss.x - p.x) < 35 && Math.abs(boss.y - p.y) < 35) {
        if (p.type === 'bomb') {
          explode(p.x, p.y);
          boss.hp -= 2;
        } else if (p.type === 'water') {
          boss.hp -= 1;
        }
        if (boss.hp <= 0) {
          boss.dead = true;
          spawnParts(boss.x, boss.y, '#ffaa00', 20, '🕷️');
          toast('💀 ¡Derrotaste a la araña gigante!');
          drops.push({ x: boss.x, y: boss.y - 20, emoji: '💍', collected: false });
        }
        projectiles.splice(i, 1); hit = true; continue;
      }

      // Paredes ladrillo
      let bwHit = false;
      for (const bw of brickWalls) {
        if (bw.dead) continue;
        if (p.x > bw.x - 10 && p.x < bw.x + bw.w + 10 && p.y > bw.y - 10 && p.y < bw.y + bw.h + 10) {
          if (p.type === 'bomb') {
            explode(p.x, p.y); bw.hp--; bw.hit = 8;
            if (bw.hp <= 0) { bw.dead = true; spawnParts(bw.x + bw.w / 2, bw.y + bw.h / 2, '#c68642', 14, '🧱'); toast('💥 ¡Pared destruida!'); }
          }
          projectiles.splice(i, 1); bwHit = true; break;
        }
      }
      if (bwHit) continue;

      // Obstáculos
      for (const o of obstacles) {
        if (o.dead) continue;
        if (Math.abs(o.x + 18 - p.x) < 36 && Math.abs(o.y + 2 - p.y) < 28) {
          if (o.type === 'rock' && p.type === 'bomb') { explode(p.x, p.y); o.dead = true; toast('💥 ¡Roca destruida!'); }
          else if (o.type === 'fire' && p.type === 'water') { o.dead = true; SFX_splash(); spawnParts(o.x + 18, o.y, '#60a5fa', 10, '💦'); toast('💦 Fuego apagado'); }
          else if (p.type === 'bomb') explode(p.x, p.y);
          else if (!o.hint) { o.hint = true; toast(o.type === 'rock' ? '🧱 Usa 💣' : '🔥 Usa 🔫 o 🌧️'); }
          projectiles.splice(i, 1); break;
        }
      }
    }
  }

  function explode(x, y) {
    SFX_boom(); spawnParts(x, y, '#f97316', 18, '💥'); spawnParts(x, y, '#fbbf24', 8);
    enemies.forEach(e => { if (!e.dead && Math.hypot(e.x - x, e.y - y) < 85) { e.dead = true; spawnParts(e.x, e.y, '#fbbf24', 8, e.emoji); } });
    obstacles.forEach(o => { if (!o.dead && o.type === 'fire' && Math.hypot(o.x + 18 - x, o.y - y) < 85) { o.dead = true; } });
    brickWalls.forEach(bw => {
      if (!bw.dead && Math.hypot(bw.x + bw.w / 2 - x, bw.y + bw.h / 2 - y) < 80) {
        bw.hp = 0; bw.dead = true; spawnParts(bw.x + bw.w / 2, bw.y + bw.h / 2, '#c68642', 10, '🧱');
      }
    });
    if (boss && !boss.dead && Math.hypot(boss.x - x, boss.y - y) < 100) {
      boss.hp -= 3;
      if (boss.hp <= 0) {
        boss.dead = true;
        spawnParts(boss.x, boss.y, '#ffaa00', 20, '🕷️');
        drops.push({ x: boss.x, y: boss.y - 20, emoji: '💍', collected: false });
      }
    }
  }

  function updateRain() {
    if (!rainOn) { rainDrops = []; return; }
    if (frameCount % 2 === 0) {
      const wx = cameraX + Math.random() * canvas.width;
      const wy = cameraY - 12;
      rainDrops.push({ wx, wy, vy: 9 + Math.random() * 4 });
    }
    for (let i = rainDrops.length - 1; i >= 0; i--) {
      const r = rainDrops[i];
      r.wy += r.vy;
      if (r.wy > cameraY + canvas.height + 30) { rainDrops.splice(i, 1); continue; }
      for (const o of obstacles) {
        if (!o.dead && o.type === 'fire' && Math.abs(o.x - r.wx) < 32 && Math.abs(o.y - r.wy) < 14) {
          o.dead = true; spawnParts(o.x + 18, o.y, '#60a5fa', 8, '💦');
        }
      }
      if (r.wy >= roadY && frameCount % 35 === 0) {
        if (!puddles.find(pu => Math.abs(pu.x + 40 - r.wx) < 90) && puddles.length < 14)
          puddles.push({ x: r.wx - 40, y: roadY + 2, w: 80, h: 14, active: true });
      }
    }
  }

  function updateBubbles() {
    if (!bubblesOn && bubbles.length === 0) return;
    if (bubblesOn && frameCount % 70 === 0) {
      const bx = inShaft ? SHAFT_L + 20 + Math.random() * (SHAFT_W - 40) : cameraX + 50 + Math.random() * (canvas.width - 100);
      const by = inShaft ? player.y + 110 + Math.random() * 40 : canvas.height + cameraY + 20;
      bubbles.push({ x: bx, y: by, vy: -2.2 - Math.random() * .8, r: 18 + Math.random() * 8, life: 400, dead: false });
      SFX_bub();
    }
    for (let i = bubbles.length - 1; i >= 0; i--) {
      const b = bubbles[i]; b.y += b.vy; b.life--;
      if (windOn && !inShaft) b.x += 0.8; // viento mueve burbujas a la derecha

      // Colisión con el techo
      const strictInShaft = b.x > SHAFT_L + 8 && b.x < SHAFT_R - 8;
      if (!strictInShaft && b.y - b.r < CEIL_Y) {
        b.life = 0; // revienta
      }

      // Colisión con paredes de ladrillo (evita que la burbuja atraviese)
      for (const bw of brickWalls) {
        if (bw.dead) continue;
        if (b.x > bw.x - 15 && b.x < bw.x + bw.w + 15 && b.y > bw.y - 15 && b.y < bw.y + bw.h + 15) {
          b.life = 0;
          spawnParts(b.x, b.y, '#bfdbfe', 6, '🫧');
          if (player.rideBubble === b) {
            player.rideBubble = null;
            player.vy = -5;
          }
          break;
        }
      }

      if (b.life <= 0 || b.y < SHAFT_TOP_Y - 80) {
        if (player.rideBubble === b) { player.rideBubble = null; player.vy = -5; }
        b.dead = true; bubbles.splice(i, 1); continue;
      }
      if (b.life === 150 || b.life === 0) {
        spawnParts(b.x, b.y, '#bfdbfe', 8, '🫧');
        if (player.rideBubble === b) { player.rideBubble = null; player.vy = -5; }
        b.dead = true; bubbles.splice(i, 1);
      }
    }
  }

  function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]; p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  function spawnParts(x, y, col, n, em = null) {
    for (let i = 0; i < n; i++) particles.push({ x, y, vx: (Math.random() - .5) * 7, vy: (Math.random() - .5) * 7 - 2, col, em, size: em ? 13 : 3, life: 25 + Math.random() * 20, maxLife: 45 });
  }

  // ── DIBUJO (todo con opacidad 1 para elementos vivos) ──
  const DX = wx => Math.round(wx - cameraX);
  const DY = wy => Math.round(wy - cameraY);

  function drawEmoji(wx, wy, em, size = 40, angle = 0, glow = null) {
    ctx.save();
    ctx.translate(DX(wx), DY(wy));
    if (angle) ctx.rotate(angle);
    ctx.font = `${size}px 'Segoe UI Emoji','Apple Color Emoji','Noto Color Emoji',sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = glow || 'transparent';
    ctx.shadowBlur = glow ? 10 : 0;
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = 'white';
    ctx.fillText(em, 0, 0);
    ctx.restore();
  }

  function drawBackground() {
    const W = canvas.width, H = canvas.height;
    if (lightOn) {
      ctx.fillStyle = '#7a4e22'; ctx.fillRect(0, 0, W, H);
      const cx0 = (cameraX * .05 | 0), cy0 = (cameraY * .05 | 0);
      for (let i = 0; i < 32; i++) {
        const rx = ((i * 173 + cx0 * 11 + 50) % (W + 120) + W + 120) % (W + 120) - 60;
        const ry = ((i * 109 + cy0 * 7 + 30) % (H + 80) + H + 80) % (H + 80) - 40;
        const sz = 24 + i % 22, pts = 5 + i % 3;
        const L = 38 + i % 22, S = 35 + i % 20;
        ctx.save();
        ctx.fillStyle = `hsl(${25 + i % 18},${S}%,${L}%)`;
        ctx.strokeStyle = `rgba(30,15,5,${.25 + i % 3 * .07})`; ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (let j = 0; j < pts; j++) {
          const anim = frameCount * .005;
          const a = (j / pts) * Math.PI * 2, r2 = sz * (0.68 + Math.sin(a * 3 + i + anim) * .32);
          j === 0 ? ctx.moveTo(rx + Math.cos(a) * r2, ry + Math.sin(a) * r2) : ctx.lineTo(rx + Math.cos(a) * r2, ry + Math.sin(a) * r2);
        }
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.restore();
      }
      const lx = DX(player.x), ly = DY(player.y);
      const lg = ctx.createRadialGradient(lx, ly, 0, lx, ly, Math.max(W, H) * 1.1);
      lg.addColorStop(0, 'rgba(255,235,170,.80)');
      lg.addColorStop(.25, 'rgba(255,200,110,.55)');
      lg.addColorStop(.55, 'rgba(220,155, 70,.30)');
      lg.addColorStop(.85, 'rgba(160,100, 35,.12)');
      lg.addColorStop(1, 'rgba(80,  45, 12,.04)');
      ctx.fillStyle = lg; ctx.fillRect(0, 0, W, H);
    } else {
      ctx.fillStyle = '#0e0804'; ctx.fillRect(0, 0, W, H);
      const cx1 = (cameraX * .03 | 0), cy1 = (cameraY * .03 | 0);
      for (let i = 0; i < 18; i++) {
        const rx = ((i * 173 + cx1 * 11 + 50) % (W + 100) + W + 100) % (W + 100) - 50;
        const ry = ((i * 109 + cy1 * 7 + 30) % (H + 60) + H + 60) % (H + 60) - 30;
        const sz = 18 + i % 18, pts = 5 + i % 3;
        ctx.save(); ctx.globalAlpha = 0.08;
        ctx.fillStyle = `hsl(25,25%,${14 + i % 8}%)`;
        ctx.beginPath();
        for (let j = 0; j < pts; j++) {
          const anim = frameCount * .005;
          const a = (j / pts) * Math.PI * 2, r2 = sz * (0.7 + Math.sin(a * 3 + i + anim) * .3);
          j === 0 ? ctx.moveTo(rx + Math.cos(a) * r2, ry + Math.sin(a) * r2) : ctx.lineTo(rx + Math.cos(a) * r2, ry + Math.sin(a) * r2);
        }
        ctx.closePath(); ctx.fill(); ctx.restore();
      }
    }
    for (let i = 0; i < 12; i++) {
      const bx = ((i * 199 + (cameraX * .06 | 0)) % (W + 40) + W + 40) % (W + 40) - 20;
      const by = ((i * 113 + (cameraY * .04 | 0)) % (H * 0.85 + 10) + 8);
      const gl = .25 + .15 * Math.sin(frameCount * .035 + i);
      ctx.save(); ctx.shadowColor = '#c68642'; ctx.shadowBlur = 7 + 3 * Math.sin(frameCount * .04 + i);
      ctx.fillStyle = `rgba(198,134,66,${gl})`; ctx.beginPath(); ctx.arc(bx, by, 1.6, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
  }

  function drawCaveStructure() {
    const W = canvas.width, H = canvas.height;
    const cdy = DY(CEIL_Y);
    if (!inShaft) {
      if (cdy > 0 && cdy < H + 20) {
        const slx = DX(SHAFT_L);
        if (slx > 0) {
          const g = ctx.createLinearGradient(0, 0, 0, cdy + 8);
          g.addColorStop(0, '#1a0d04'); g.addColorStop(1, '#2e1a0a');
          ctx.fillStyle = g; ctx.fillRect(0, 0, Math.min(slx, W), cdy + 8);
          const bg = ctx.createLinearGradient(0, cdy - 4, 0, cdy + 9);
          bg.addColorStop(0, '#6b4c2a'); bg.addColorStop(1, '#3d2810');
          ctx.fillStyle = bg; ctx.fillRect(0, cdy - 4, Math.min(slx, W), 14);
        }
      }
      const wx = DX(SHAFT_R);
      if (wx < W && wx > -50) {
        const wg = ctx.createLinearGradient(wx, 0, wx + 60, 0);
        wg.addColorStop(0, '#4a3218'); wg.addColorStop(1, '#1a0d04');
        ctx.fillStyle = wg; ctx.fillRect(Math.max(0, wx), 0, W - Math.max(0, wx), H);
        const sg = ctx.createLinearGradient(Math.max(0, wx), 0, Math.max(0, wx) + 55, 0);
        sg.addColorStop(0, '#7a5838'); sg.addColorStop(1, 'rgba(90,60,28,0)');
        ctx.fillStyle = sg; ctx.fillRect(Math.max(0, wx), cdy, 55, DY(roadY) - cdy + 10);
      }
    }
    if (inShaft) {
      const pl = DX(SHAFT_L), pr = DX(SHAFT_R);
      if (pl > -10) {
        const g = ctx.createLinearGradient(Math.max(0, pl), 0, Math.max(0, pl) + 50, 0);
        g.addColorStop(0, '#3d2810'); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = '#1a0d04'; if (pl > 0) ctx.fillRect(0, 0, pl, H);
        ctx.fillStyle = g; ctx.fillRect(Math.max(0, pl), 0, 50, H);
      }
      if (pr < W + 10) {
        const g = ctx.createLinearGradient(Math.min(W, pr) - 50, 0, Math.min(W, pr), 0);
        g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, '#3d2810');
        ctx.fillStyle = '#1a0d04'; if (pr < W) ctx.fillRect(pr, 0, W - pr, H);
        ctx.fillStyle = g; ctx.fillRect(Math.min(W, pr) - 50, 0, 50, H);
      }
    }
    for (const s of stalactites) {
      if (s.s === 'h' && inShaft) continue;
      if (s.s === 'v' && !inShaft) continue;
      const sx = DX(s.x), sy = DY(s.y);
      if (sx < -40 || sx > W + 40 || sy < -10 || sy > H + 10) continue;
      ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath();
      ctx.moveTo(sx - s.w / 2 + 3, sy); ctx.lineTo(sx + 3, sy + s.h + 4); ctx.lineTo(sx + s.w / 2 + 3, sy); ctx.closePath(); ctx.fill();
      const sg = ctx.createLinearGradient(sx - s.w / 2, sy, sx + s.w / 2, sy + s.h);
      sg.addColorStop(0, `rgba(${93 + s.sh * 64 | 0},${58 + s.sh * 38 | 0},${27 + s.sh * 22 | 0},.92)`);
      sg.addColorStop(1, `rgba(${48 + s.sh * 40 | 0},${30 + s.sh * 24 | 0},${13 + s.sh * 12 | 0},.95)`);
      ctx.fillStyle = sg; ctx.beginPath();
      ctx.moveTo(sx - s.w / 2, sy); ctx.lineTo(sx, sy + s.h); ctx.lineTo(sx + s.w / 2, sy); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,200,140,.07)'; ctx.beginPath();
      ctx.moveTo(sx - s.w / 4, sy); ctx.lineTo(sx, sy + s.h * .4); ctx.lineTo(sx + 1, sy); ctx.closePath(); ctx.fill();
    }
  }

  function drawPlatforms() {
    for (const p of platforms) {
      if (p.type === 'ground') continue;
      const dx = DX(p.x), dy = DY(p.y); const { w, h } = p;
      if (dx > canvas.width + 80 || dx + w < -80 || dy > canvas.height + 30 || dy + h < -50) continue;
      ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.roundRect(dx + 4, dy + 6, w, h + 4, 4); ctx.fill();
      const sg = ctx.createLinearGradient(dx, dy, dx, dy + h);
      sg.addColorStop(0, '#7a6248'); sg.addColorStop(.4, '#5e4a32'); sg.addColorStop(1, '#3d2e1a');
      ctx.fillStyle = sg; ctx.beginPath(); ctx.roundRect(dx, dy, w, h, 3); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 1;
      for (let bx = 0; bx < w; bx += 22) { ctx.beginPath(); ctx.moveTo(dx + bx, dy); ctx.lineTo(dx + bx, dy + h); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(dx, dy + h * .5); ctx.lineTo(dx + w, dy + h * .5); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.1)'; ctx.beginPath(); ctx.roundRect(dx + 2, dy + 2, w - 4, h * .35, 2); ctx.fill();
      const mg = ctx.createLinearGradient(dx, dy - 6, dx, dy + 6);
      mg.addColorStop(0, '#c68642'); mg.addColorStop(.5, '#a06832'); mg.addColorStop(1, '#6b4520');
      ctx.fillStyle = mg; ctx.beginPath(); ctx.roundRect(dx, dy - 4, w, 8, [4, 4, 0, 0]); ctx.fill();
      ctx.strokeStyle = 'rgba(198,134,66,.55)'; ctx.lineWidth = 1.2;
      for (let tx = 4; tx < w - 4; tx += 9) {
        ctx.globalAlpha = 0.55; ctx.beginPath(); ctx.moveTo(dx + tx, dy - 4); ctx.lineTo(dx + tx - 1, dy - 10);
        ctx.moveTo(dx + tx, dy - 4); ctx.lineTo(dx + tx + 2, dy - 8); ctx.stroke();
      } ctx.globalAlpha = 1;
    }
  }

  function drawCaveFloor() {
    const W = canvas.width;
    const rdy = DY(roadY);
    if (rdy > canvas.height + 10 || rdy < -30) return;
    const rW = W * 1.5;
    const tg = ctx.createLinearGradient(0, rdy - 12, 0, rdy + 5);
    tg.addColorStop(0, '#6b4c2a'); tg.addColorStop(.5, '#56391f'); tg.addColorStop(1, '#3d2810');
    ctx.fillStyle = tg; ctx.fillRect(0, rdy - 12, rW, 16);
    ctx.strokeStyle = 'rgba(120,80,40,.38)'; ctx.lineWidth = 1;
    for (let bx = 0; bx < rW; bx += 9) {
      const off = bx - ((cameraX * .001 | 0) % 9);
      ctx.globalAlpha = 0.28; ctx.beginPath(); ctx.moveTo(off, rdy - 12); ctx.lineTo(off + 2, rdy - 19 - (bx % 5)); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    for (let cx = 0; cx < rW; cx += 22) {
      const off = cx - ((cameraX * .5) | 0) % 22;
      ctx.fillStyle = (Math.floor((cx + cameraX * .5) / 22) % 2 === 0) ? '#8b5e3c' : '#c68642';
      ctx.fillRect(off, rdy + 2, 11, 4);
    }
    const fg = ctx.createLinearGradient(0, rdy + 6, 0, rdy + 65);
    fg.addColorStop(0, '#4a3218'); fg.addColorStop(.35, '#3d2810'); fg.addColorStop(1, '#251808');
    ctx.fillStyle = fg; ctx.fillRect(0, rdy + 6, rW, 65);
    ctx.strokeStyle = 'rgba(0,0,0,.2)'; ctx.lineWidth = 1;
    for (let bx = 0; bx < rW; bx += 28) {
      const off = bx - ((cameraX * .5) | 0) % 28;
      ctx.beginPath(); ctx.moveTo(off, rdy + 6); ctx.lineTo(off, rdy + 66); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(0, rdy + 36); ctx.lineTo(rW, rdy + 36); ctx.stroke();
    ctx.fillStyle = 'rgba(198,134,66,.28)';
    const ro = ((cameraX * .06 | 0)) % 100;
    for (let i = -100; i < rW + 100; i += 100) { const lx = (i - ro + rW) % rW; ctx.fillRect(lx, rdy + 34, 50, 2); }

    for (const pu of puddles) {
      if (!pu.active) continue;
      const dx = DX(pu.x); if (dx > W + 60 || dx + pu.w < -60) continue;
      const near = Math.abs(pu.x + 40 - player.x) < 75 && actionSlot?.type === 'gun';
      ctx.save();
      const wg = ctx.createLinearGradient(0, rdy + 2, 0, rdy + pu.h + 2);
      wg.addColorStop(0, 'rgba(56,189,248,.58)'); wg.addColorStop(1, 'rgba(14,165,233,.32)');
      ctx.fillStyle = wg; ctx.beginPath();
      ctx.ellipse(dx + pu.w / 2, rdy + pu.h / 2 + 2, pu.w / 2, pu.h / 2, 0, 0, Math.PI * 2); ctx.fill();
      if (near) { ctx.strokeStyle = 'rgba(147,197,253,.8)'; ctx.lineWidth = 2; ctx.shadowColor = '#60a5fa'; ctx.shadowBlur = 8; ctx.stroke(); }
      ctx.font = '11px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('💧', dx + pu.w / 2, rdy + pu.h / 2 + 2); ctx.restore();
    }
  }

  function drawObstacles() {
    if (inShaft) return;
    for (const o of obstacles) {
      if (o.dead) continue;
      const dx = DX(o.x), dy = DY(o.y); if (dx > canvas.width + 60 || dx + o.w < -60) continue;
      if (Math.abs(o.x - player.x) < 300) {
        ctx.save(); ctx.font = '9px sans-serif'; ctx.fillStyle = 'rgba(255,210,140,.62)'; ctx.textAlign = 'center';
        ctx.fillText(o.type === 'rock' ? '[💣]' : '[🔫/🌧️]', dx + o.w / 2, dy - 14); ctx.restore();
      }
      if (o.type === 'fire') {
        o.ff = (o.ff || 0) + 1;
        drawEmoji(o.x + 6, o.y - 8, '🔥', 24, 0, '#ff6600');
        drawEmoji(o.x + 22, o.y - 14, '🔥', 20, Math.sin(o.ff * .12) * .15, '#ff8800');
        drawEmoji(o.x + 14, o.y - 2, '🔥', 28, Math.sin(o.ff * .08) * .1, '#ffaa00');
      } else drawEmoji(o.x + 18, o.y - 8, '🧱', 30, 0, '#a16207');
    }
  }

  function drawBrickWalls() {
    if (inShaft) return;
    for (const bw of brickWalls) {
      if (bw.dead) continue;
      const dx = DX(bw.x), dy = DY(bw.y);
      if (dx > canvas.width + 50 || dx + bw.w < -50) continue;
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(dx + 3, dy + 3, bw.w, bw.h);
      if (bw.hit > 0) { bw.hit--; ctx.fillStyle = 'rgba(255,200,100,.4)'; ctx.fillRect(dx, dy, bw.w, bw.h); }
      const brickH = 18;
      for (let row = 0; row * brickH < bw.h; row++) {
        const by2 = dy + row * brickH;
        const lg = ctx.createLinearGradient(dx, by2, dx, by2 + brickH);
        lg.addColorStop(0, '#8b4513'); lg.addColorStop(.5, '#7a3c10'); lg.addColorStop(1, '#5c2c0a');
        ctx.fillStyle = lg; ctx.fillRect(dx, by2, bw.w, Math.min(brickH, bw.h - row * brickH));
        ctx.fillStyle = 'rgba(20,10,3,.6)'; ctx.fillRect(dx, by2, bw.w, 2);
        const off = row % 2 ? bw.w / 2 : 4;
        ctx.fillRect(dx + off, by2, 2, brickH);
        ctx.fillStyle = 'rgba(255,170,90,.1)'; ctx.fillRect(dx + 3, by2 + 3, bw.w - 6, 6);
      }
      ctx.strokeStyle = 'rgba(40,20,5,.6)'; ctx.lineWidth = 1.5; ctx.strokeRect(dx, dy, bw.w, bw.h);
      if (bw.hp > 1) { ctx.save(); ctx.font = 'bold 9px sans-serif'; ctx.fillStyle = 'rgba(255,220,120,.85)'; ctx.textAlign = 'center'; ctx.fillText('HP:' + bw.hp, dx + bw.w / 2, dy - 6); ctx.restore(); }
    }
  }

  function drawEnemies() {
    for (const e of enemies) {
      if (e.deathT > 0) continue;
      drawEmoji(e.x, e.y, e.emoji, e.type === 'bat' ? 24 : 26, Math.sin(frameCount * .06 + e.phase) * .06);
    }
    if (boss && !boss.dead) {
      drawEmoji(boss.x, boss.y, '🕷️', 50, Math.sin(frameCount * .05) * .1, '#ff0000');
      // Barra de vida encima del jefe
      const bx = DX(boss.x), by = DY(boss.y) - 40;
      ctx.fillStyle = '#330000';
      ctx.fillRect(bx - 40, by, 80, 8);
      ctx.fillStyle = '#ff4d4d';
      ctx.fillRect(bx - 40, by, 80 * (boss.hp / boss.maxHp), 8);
    }
  }

  function drawProjectiles() {
    for (const p of projectiles) {
      if (p.type === 'water') {
        const sx = DX(p.x), sy = DY(p.y);
        ctx.save();
        ctx.shadowColor = '#60a5fa'; ctx.shadowBlur = 8;
        ctx.fillStyle = '#93c5fd';
        ctx.beginPath(); ctx.arc(sx, sy, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#dbeafe';
        ctx.beginPath(); ctx.arc(sx - 1.5, sy - 1.5, 2, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      } else {
        drawEmoji(p.x, p.y, '💣', 24);
      }
    }
  }

  function drawRain() {
    if (!rainOn || !rainDrops.length) return;
    ctx.save(); ctx.strokeStyle = 'rgba(147,197,253,.52)'; ctx.lineWidth = 1.5;
    for (const r of rainDrops) {
      const sx = DX(r.wx), sy = DY(r.wy);
      if (sx < -5 || sx > canvas.width + 5 || sy < -5 || sy > canvas.height + 5) continue;
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + 1, sy + 9); ctx.stroke();
    }
    ctx.restore();
  }

  function drawBubbles() {
    for (const b of bubbles) {
      if (b.dead) continue;
      const bx = DX(b.x), by = DY(b.y);
      if (bx < -50 || bx > canvas.width + 50 || by < -50 || by > canvas.height + 50) continue;
      const a = .38 + .22 * Math.sin(frameCount * .05 + b.x * .01);
      ctx.save(); ctx.strokeStyle = `rgba(186,230,253,${a})`; ctx.lineWidth = 2.5;
      ctx.shadowColor = 'rgba(147,197,253,.55)'; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(bx, by, b.r, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = `rgba(219,234,254,${a * .22})`; ctx.fill();
      ctx.globalAlpha = .6; ctx.font = `${Math.round(b.r * .85)}px serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🫧', bx, by); ctx.restore();
    }
  }

  function drawParticles() {
    for (const p of particles) {
      const a = Math.min(1, (p.life / p.maxLife) * 2); ctx.globalAlpha = a;
      if (p.em) { ctx.font = `${p.size}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(p.em, DX(p.x), DY(p.y)); }
      else { ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(DX(p.x), DY(p.y), p.size, 0, Math.PI * 2); ctx.fill(); }
    } ctx.globalAlpha = 1;
  }

  function drawPlayer() {
    if (!player) return;
    if (player.invincible && Math.floor(Date.now() / 80) % 2) return;
    ctx.save(); ctx.translate(DX(player.x), DY(player.y)); ctx.rotate(player.rotation);
    ctx.font = "30px 'Segoe UI Emoji','Apple Color Emoji','Noto Color Emoji',sans-serif";
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    const em = (hearts === 1 || energy < 15) ? '😰' : player.rideBubble ? '🥹' : '😊';
    ctx.fillText(em, 0, 0);
    ctx.restore();
  }

  function drawDarkness() {
    if (lightOn) return;
    let _dkCv = document.getElementById('darkness-canvas');
    if (!_dkCv) {
      _dkCv = document.createElement('canvas');
      _dkCv.id = 'darkness-canvas';
    }
    _dkCv.width = canvas.width; _dkCv.height = canvas.height;
    const _dkCtx = _dkCv.getContext('2d');
    _dkCtx.globalCompositeOperation = 'source-over';
    _dkCtx.fillStyle = 'rgba(0,0,0,.92)'; _dkCtx.fillRect(0, 0, _dkCv.width, _dkCv.height);
    _dkCtx.globalCompositeOperation = 'destination-out';
    const cx = DX(player.x), cy = DY(player.y), R = 65;
    const g = _dkCtx.createRadialGradient(cx, cy, 0, cx, cy, R);
    g.addColorStop(0, 'rgba(0,0,0,1)');
    g.addColorStop(.4, 'rgba(0,0,0,.9)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    _dkCtx.fillStyle = g; _dkCtx.fillRect(0, 0, _dkCv.width, _dkCv.height);
    _dkCtx.globalCompositeOperation = 'source-over';
    const g2 = _dkCtx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.1);
    g2.addColorStop(0, 'rgba(0,0,0,0)');
    g2.addColorStop(.4, 'rgba(255,150,50,.06)');
    g2.addColorStop(1, 'rgba(0,0,0,0)');
    _dkCtx.fillStyle = g2; _dkCtx.fillRect(0, 0, _dkCv.width, _dkCv.height);
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(_dkCv, 0, 0);
    ctx.restore();
  }

  function drawExit() {
    const ex = SHAFT_MID, ey = SHAFT_TOP_Y + 28;
    const sx = DX(ex), sy = DY(ey);
    if (sy < -120 || sy > canvas.height + 80) return;
    const coneW = SHAFT_W * .88, coneH = SHAFT_HT * .72;
    const lg = ctx.createLinearGradient(sx, sy, sx, sy + coneH);
    lg.addColorStop(0, 'rgba(255,248,180,.38)');
    lg.addColorStop(.3, 'rgba(255,230,110,.15)');
    lg.addColorStop(1, 'rgba(255,200,80,0)');
    ctx.save(); ctx.beginPath();
    ctx.moveTo(sx - 20, sy); ctx.lineTo(sx + 20, sy);
    ctx.lineTo(sx + coneW / 2, sy + coneH); ctx.lineTo(sx - coneW / 2, sy + coneH);
    ctx.closePath(); ctx.fillStyle = lg; ctx.fill();
    for (let i = 0; i < 10; i++) {
      const t = ((frameCount * .011 + i * .72) % 1);
      const mx = sx + (Math.sin(i * 2.5 + frameCount * .018) * coneW * .4 * t);
      const my = sy + t * coneH * .65;
      ctx.globalAlpha = (.65 - t * .7) * 0.6;
      ctx.fillStyle = 'rgba(255,245,170,.9)'; ctx.beginPath(); ctx.arc(mx, my, 1.4, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1; ctx.restore();
    ctx.save(); ctx.shadowColor = '#fff8c0'; ctx.shadowBlur = 40;
    const og = ctx.createRadialGradient(sx, sy, 0, sx, sy, 46);
    og.addColorStop(0, '#fffde4'); og.addColorStop(.5, '#ffe87a'); og.addColorStop(1, 'rgba(255,210,60,0)');
    ctx.fillStyle = og; ctx.beginPath(); ctx.ellipse(sx, sy, 46, 28, 0, 0, Math.PI * 2); ctx.fill();
    const eg = ctx.createRadialGradient(sx, sy - 4, 2, sx, sy, 34);
    eg.addColorStop(0, '#fffde8'); eg.addColorStop(.4, '#ffe87a'); eg.addColorStop(.85, '#f59e0b'); eg.addColorStop(1, '#c68642');
    ctx.fillStyle = eg; ctx.beginPath(); ctx.ellipse(sx, sy, 34, 21, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,245,.94)'; ctx.beginPath(); ctx.ellipse(sx, sy - 2, 17, 11, 0, 0, Math.PI * 2); ctx.fill();
    const pulse = .5 + .5 * Math.sin(frameCount * .08);
    ctx.strokeStyle = `rgba(255,220,80,${pulse * .6})`; ctx.lineWidth = 2 + pulse;
    ctx.beginPath(); ctx.ellipse(sx, sy, 38 + pulse * 4, 23 + pulse * 2, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.font = 'bold 11px sans-serif'; ctx.fillStyle = 'rgba(100,65,0,.9)';
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText('☀️ SALIDA', sx, sy - 24); ctx.restore();
  }

  function drawAbyss() {
    if (inShaft) return;
    const ax = DX(abyssX), aw = DX(abyssX + abyssW) - DX(abyssX);
    if (ax > canvas.width + 80 || ax + aw < -80) return;
    // Dibujar vacío oscuro (sin plataforma)
    const ag = ctx.createLinearGradient(ax, DY(roadY), ax, DY(roadY) + 90);
    ag.addColorStop(0, 'rgba(0,0,0,.9)'); ag.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = ag; ctx.fillRect(ax, DY(roadY), aw, 90);
    // Bordes irregulares
    ctx.fillStyle = '#3d2810';
    ctx.beginPath(); ctx.moveTo(ax - 2, DY(roadY) - 14); ctx.lineTo(ax + 10, DY(roadY) + 35); ctx.lineTo(ax - 2, DY(roadY) + 35); ctx.fill();
    ctx.beginPath(); ctx.moveTo(ax + aw + 2, DY(roadY) - 14); ctx.lineTo(ax + aw - 10, DY(roadY) + 35); ctx.lineTo(ax + aw + 2, DY(roadY) + 35); ctx.fill();
    const pulse = .5 + .5 * Math.sin(frameCount * .14);
    ctx.save(); ctx.fillStyle = `rgba(255,80,50,${pulse * .9})`;
    ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('⚠️ 🌬️+🫧', ax + aw / 2, DY(roadY) - 22); ctx.restore();
  }

  function drawDrops() {
    for (const d of drops) {
      if (d.collected) continue;
      drawEmoji(d.x, d.y, d.emoji, 30, 0, '#ffd700');
    }
  }

  function drawHUDCanvas() {
    const effs = []; if (rainOn) effs.push('🌧️'); if (windOn) effs.push('🌬️'); if (bubblesOn) effs.push('🫧'); if (lightOn) effs.push('🔦');
    if (effs.length) { ctx.save(); ctx.font = '13px serif'; ctx.fillStyle = 'rgba(255,200,120,.8)'; ctx.textAlign = 'left'; ctx.fillText(effs.join(' '), 6, canvas.height - 6); ctx.restore(); }
    if (gunAmmo > 0) { ctx.save(); ctx.font = '11px sans-serif'; ctx.fillStyle = 'rgba(147,197,253,.85)'; ctx.textAlign = 'right'; ctx.fillText(`🔫×${gunAmmo}`, canvas.width - 6, canvas.height - 6); ctx.restore(); }
    if (!lightOn && !inShaft) { ctx.save(); ctx.fillStyle = 'rgba(255,200,120,.5)'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('🌑 Oscuro — equipa 🔦', canvas.width / 2, canvas.height - 6); ctx.restore(); }
    if (inShaft && !bubblesOn) { ctx.save(); ctx.fillStyle = 'rgba(147,197,253,.75)'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('🫧 Equipa burbujas para subir el pozo', canvas.width / 2, 14); ctx.restore(); }
  }

  // ── GAME LOOP ─────────────────────────────
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

  // ── CONTROLES ─────────────────────────────
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
  document.getElementById('btn-play').onclick = () => { AC(); startGame(); };
  document.getElementById('btn-restart').onclick = startGame;
  document.getElementById('btn-win').onclick = startGame;

  initQuickPick();

  function resizeCanvas() {
    const c = document.getElementById('game-container');
    canvas.width = c.clientWidth;
    canvas.height = Math.round(c.clientHeight * 0.65);
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
})();
