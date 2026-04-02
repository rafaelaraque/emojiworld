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
  let tileMap = null; // Complete tilemap loaded from cave-map.js
  let cameraX = 0, cameraY = 0, inShaft = false;
  let keys = { left: false, right: false, jump: false, attack: false };
  let prevKeys = { jump: false, attack: false };
  let hearts = 3, energy = 100, gunAmmo = 0, victoryDone = false, atkCd = 0;
  let lastLandTime = 0;
  // Slots
  const slots = [null, null, null, null, null];
  let actionSlot = null;
  let rainOn = false, windOn = false, bubblesOn = false, lightOn = false;
  let cinematicActive = false, cinematicTimer = 0, bossIntroDone = false;
  // Mundo
  let enemies = [], obstacles = [], projectiles = [];
  let particles = [], rainDrops = [], bubbles = [], puddles = [];
  let brickWalls = [];
  let drops = []; // { x, y, emoji, collected }

  // Jefe
  let boss = null; // objeto especial

  let playerHasRing = false;  // Track if player collected the ring
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
    // Stalactites are now part of the tilemap
  }

  // ── Tilemap helpers ─────────────────────────
  function getTile(col, row) {
    if (row < 0 || row >= MAP_ROWS || col < 0 || col >= MAP_COLS) return TILE.STONE;
    return tileMap[row][col];
  }
  function isSolid(col, row) {
    const t = getTile(col, row);
    return t === TILE.STONE || t === TILE.BRICK;
  }
  function isOneWay(col, row) {
    return getTile(col, row) === TILE.PLATFORM;
  }
  function isAbyss(col, row) {
    return getTile(col, row) === TILE.ABYSS;
  }
  function isExit(col, row) {
    return getTile(col, row) === TILE.EXIT;
  }
  function breakBrick(col, row) {
    if (getTile(col, row) === TILE.BRICK) {
      tileMap[row][col] = TILE.AIR;
      spawnParts(col * TILE_SIZE + TILE_SIZE / 2, row * TILE_SIZE + TILE_SIZE / 2, '#c68642', 14, '🧱');
    }
  }

  // World dimensions in pixels
  const WORLD_W = MAP_COLS * TILE_SIZE;
  const WORLD_H = MAP_ROWS * TILE_SIZE;

  // ── Get current zone name ───────────────────
  function getZoneName() {
    if (!player) return '🕳️ Cueva';
    const pc = Math.floor(player.x / TILE_SIZE);
    const pr = Math.floor(player.y / TILE_SIZE);
    for (const z of ENTITY_DEFS.zones) {
      const b = z.bounds;
      if (pr >= b.r1 && pr <= b.r2 && pc >= b.c1 && pc <= b.c2) return z.name;
    }
    return '🕳️ Cueva';
  }

  function generateWorld() {
    platforms = []; enemies = []; obstacles = []; brickWalls = [];
    projectiles = []; particles = []; rainDrops = []; bubbles = []; puddles = [];
    drops = []; boss = null;

    // Build complete tilemap
    tileMap = buildMap();

    roadY = ENTITY_DEFS.spawn.row * TILE_SIZE + TILE_SIZE;
    CEIL_Y = 0;
    HORIZ_END = WORLD_W;
    SHAFT_L = 0; SHAFT_R = WORLD_W;
    SHAFT_MID = WORLD_W / 2; SHAFT_TOP_Y = 0;

    abyssX = -9999; abyssW = 0; // Abyss is now tilemap-based

    // Spawn enemies from ENTITY_DEFS
    ENTITY_DEFS.enemies.forEach(def => {
      const ex = def.col * TILE_SIZE + TILE_SIZE / 2;
      const ey = def.row * TILE_SIZE + TILE_SIZE / 2;
      const pr = def.patrolRange * TILE_SIZE;
      enemies.push({
        x: ex, y: ey, w: 28, h: 28, type: def.type,
        hp: def.hp, vx: def.type === 'spider' ? 1.0 : 1.3,
        minX: ex - pr, maxX: ex + pr, dead: false, deathT: 0,
        emoji: def.type === 'spider' ? '🕷️' : '🦇',
        phase: Math.random() * Math.PI * 2,
        baseY: ey
      });
    });

    // Spawn fire obstacles
    ENTITY_DEFS.fires.forEach(def => {
      obstacles.push({
        x: def.col * TILE_SIZE, y: def.row * TILE_SIZE - 4,
        w: 36, h: 36, type: 'fire', dead: false, hint: false, ff: 0
      });
    });

    // Spawn puddles
    ENTITY_DEFS.puddles.forEach(def => {
      puddles.push({
        x: def.col * TILE_SIZE, y: def.row * TILE_SIZE + 2,
        w: def.w * TILE_SIZE, h: 14, active: true
      });
    });

    // Spawn boss
    const bd = ENTITY_DEFS.boss;
    boss = {
      x: bd.col * TILE_SIZE, y: bd.hangFromRow * TILE_SIZE + TILE_SIZE,
      w: 60, h: 60, hp: bd.hp, maxHp: bd.maxHp,
      vx: 1.0, minX: bd.patrolMin * TILE_SIZE, maxX: bd.patrolMax * TILE_SIZE,
      dead: false, emoji: '🕷️', phase: 0, agro: false,
      fury: false, poisonCd: 0,
      baseY: bd.row * TILE_SIZE - 30,
      state: 'hanging',
      webY: bd.hangFromRow * TILE_SIZE
    };

    makeStalactites();
  }

  function initPlayer() {
    const sx = ENTITY_DEFS.spawn.col * TILE_SIZE + TILE_SIZE / 2;
    const sy = ENTITY_DEFS.spawn.row * TILE_SIZE;
    player = {
      x: sx, y: sy, vx: 0, vy: 0, w: 30, h: 30,
      onGround: true, jumpCount: 0, maxJumps: 2, rotation: 0,
      alive: true, invincible: false, invincibleTimer: 0, facingRight: true, rideBubble: null
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
    picTarget = t;
    const container = document.getElementById('quick-pick');
    if (!container) return;
    container.innerHTML = '';
    
    // Solo mostrar objetos disponibles para agregar
    const quickEmojis = ['🔦', '🌧️', '🔫', '🫧', '💣', '🌬️', '🍎'];
    quickEmojis.forEach(em => {
      const btn = document.createElement('div');
      btn.className = 'qe';
      btn.style.cssText = 'cursor:pointer;';
      btn.textContent = em;
      btn.title = 'Agregar a un slot';
      btn.onclick = () => {
        // Buscar slot vacío
        for (let i = 0; i < 5; i++) {
          if (slots[i] === null) {
            assignEmoji(em, i);
            renderSlots();
            closePicker();
            toast(`${em} agregado al slot ${i + 1}`);
            break;
          }
        }
      };
      container.appendChild(btn);
    });
    
    document.getElementById('picker-overlay').classList.add('show');
  }
  
  function closePicker() { 
    const overlay = document.getElementById('picker-overlay');
    if (overlay) overlay.classList.remove('show'); 
    picTarget = null; 
  }

  function initQuickPick() {
    const quickEmojis = ['🔦', '🌧️', '🔫', '🫧', '💣', '🌬️', '🍎'];
    const container = document.getElementById('quick-pick');
    if (!container) return;
    container.innerHTML = '';
    quickEmojis.forEach(em => {
      const btn = document.createElement('div');
      btn.className = 'qe';
      btn.textContent = em;
      btn.onclick = () => {
        // Agregar al primer slot vacío
        for (let i = 0; i < 5; i++) {
          if (slots[i] === null) {
            assignEmoji(em, i);
            updateAttackButton();
            break;
          }
        }
      };
      container.appendChild(btn);
    });
  }

  // Botón cancelar del picker
  const pickerCancel = document.getElementById('picker-cancel');
  if (pickerCancel) pickerCancel.onclick = closePicker;
  
  // Slots - al hacer clic en un slot se abre el picker
  for (let i = 0; i < 5; i++) {
    const slotEl = document.getElementById(`ps${i}`);
    if (slotEl) {
      slotEl.onclick = () => { if (gameActive) openPicker(i); };
    }
  }
  
  document.getElementById('attack-btn-wrapper').addEventListener('click', function () {
    if (!gameActive) return;
    // Solo ejecutar acción si hay un objeto en el slot de acción
    if (this.classList.contains('ready')) doAction();
    // No abrir picker - el botón ahora es solo para usar el item seleccionado
  });
  
  // Función para actualizar estado del botón de acción
  function updateAttackButton() {
    const atkBtn = document.getElementById('attack-btn-wrapper');
    if (!atkBtn) return;
    
    // Verificar si hay algún slot con objetos
    const hasItems = slots.some(s => s !== null);
    const hasAction = actionSlot !== null;
    
    if (hasAction) {
      atkBtn.classList.add('ready');
    } else {
      atkBtn.classList.remove('ready');
    }
  }

  // ── ASIGNAR EMOJI ──────────────────────────
  const BLOCKED = new Set(['🥶', '🔥', '😡', '😎', '🤠', '😁', '🫥']);
  const CAVE_EM = new Set(['🌧️', '🌧', '🌬️', '🌬', '🫧', '🔦']);
  const FOOD_EM = new Set(['🍎', '🍊', '🍋', '🍇', '🍓', '🍉', '🍌', '🥝', '🍑', '🍒',
    '🍕', '🍔', '🌮', '🌯', '🍜', '🍣', '🍩', '🎂', '🧁', '🍫', '🍬', '🍭', '🍦', '🥐',
    '🥞', '🧀', '🥩', '🍗', '🥪', '🌽', '🥕', '🥦', '🥑', '🍄']);
  const ACT_EM = new Set(['💣', '🔫']);

  function assignEmoji(em, target) {
    if (BLOCKED.has(em)) { toast(`🔒 ${em} — Poder bloqueado`); return; }

    // Evitar repetidos en slots (normalizando emojis con VS16)
    const normalize = e => (e || '').replace(/\ufe0f/g, '');
    const normEm = normalize(em);
    const inPower = slots.some(s => s && normalize(s.emoji) === normEm);
    const inAction = actionSlot && normalize(actionSlot.emoji) === normEm;
    
    if (inPower || inAction) {
      toast(`⚠️ ${em} ya está en tu inventario`);
      return;
    }

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

    // Prioridad 1: Comida
    let foodEm = null, foodIndex = -1;
    if (actionSlot && actionSlot.type === 'food') { foodEm = actionSlot.emoji; foodIndex = 'action'; }
    else {
      for (let i = 0; i < 5; i++) {
        if (slots[i] && FOOD_EM.has(slots[i].emoji)) { foodEm = slots[i].emoji; foodIndex = i; break; }
      }
    }
    if (foodEm) {
      eatFood(foodEm);
      if (foodIndex === 'action') clearActionSlot(); else clearSlot(foodIndex);
      atkCd = 20; return; 
    }

    // Uso simultáneo de armas
    let hasGun = (actionSlot && actionSlot.type === 'gun') || slots.some(s => s && s.emoji === '🔫');
    let hasBomb = (actionSlot && actionSlot.type === 'bomb') || slots.some(s => s && s.emoji === '💣');

    let firedGun = false;
    let firedBomb = false;

    if (hasGun) {
      if (gunAmmo > 0) { fireGun(); firedGun = true; } 
      else { fireGun(); /* dispara seco con aviso */ }
    }

    if (hasBomb) {
      if (rainOn) { toast('🌧️ La lluvia apaga las bombas'); } 
      else { launchBomb(); firedBomb = true; }
    }

    if (firedGun && firedBomb) {
      atkCd = 42; // Cooldown más largo por la bomba
    } else if (firedBomb) {
      atkCd = 42;
    } else if (firedGun || hasGun) {
      atkCd = 18;
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

  // Determinar zona del jugador — now uniform since tilemap handles all terrain
  function getZone() {
    return 'cave';
  }

  function updatePlayer() {
    if (!player.alive || !gameActive) return;
    if (player.invincible) { player.invincibleTimer--; if (player.invincibleTimer <= 0) player.invincible = false; }
    if (atkCd > 0) atkCd--;
    if (cinematicActive) {
      cinematicTimer--;
      if (cinematicTimer <= 0) cinematicActive = false;
      // Mientras hay cinemática, el jugador se detiene
      player.vx = 0; player.vy = 0;
    } else {
      player.vx = 0;
      if (keys.left) { player.vx = -PSPEED; player.facingRight = false; }
      if (keys.right) { player.vx = PSPEED; player.facingRight = true; }
      if (windOn) player.vx += 1.8;
      if (!player.onGround) player.vy += gravity;
    }

    if (frameCount % 200 === 0) { energy = Math.max(0, energy - 2); updateHUD(); }

    // ── TILEMAP COLLISION ──────────────────────
    const hw = player.w / 2, hh = player.h / 2;

    // Horizontal movement + tile collision
    player.x += player.vx;
    {
      const left  = Math.floor((player.x - hw) / TILE_SIZE);
      const right = Math.floor((player.x + hw - 1) / TILE_SIZE);
      const top   = Math.floor((player.y - hh + 2) / TILE_SIZE);
      const bot   = Math.floor((player.y + hh - 2) / TILE_SIZE);
      for (let r = top; r <= bot; r++) {
        for (let c = left; c <= right; c++) {
          if (isSolid(c, r)) {
            if (player.vx > 0) { player.x = c * TILE_SIZE - hw; }
            else if (player.vx < 0) { player.x = (c + 1) * TILE_SIZE + hw; }
            player.vx = 0;
          }
        }
      }
    }

    // Vertical movement + tile collision
    player.y += player.vy;
    player.rotation += player.vx * 0.02;

    const _was = player.onGround;
    player.onGround = false;
    let landedThisFrame = false;

    {
      const left  = Math.floor((player.x - hw + 2) / TILE_SIZE);
      const right = Math.floor((player.x + hw - 2) / TILE_SIZE);
      const top   = Math.floor((player.y - hh) / TILE_SIZE);
      const bot   = Math.floor((player.y + hh - 1) / TILE_SIZE);
      for (let r = top; r <= bot; r++) {
        for (let c = left; c <= right; c++) {
          if (isSolid(c, r)) {
            if (player.vy > 0) {
              player.y = r * TILE_SIZE - hh;
              player.vy = 0;
              if (!_was && !landedThisFrame) { SFX_land(); landedThisFrame = true; }
              player.onGround = true; player.jumpCount = 0;
            } else if (player.vy < 0) {
              player.y = (r + 1) * TILE_SIZE + hh;
              player.vy = 0;
              if (player.rideBubble) {
                player.rideBubble.dead = true; player.rideBubble = null;
                spawnParts(player.x, player.y, '#bfdbfe', 8, '🫧');
              }
            }
          }
          // One-way platform collision (only when falling)
          if (isOneWay(c, r) && player.vy > 0) {
            const platTop = r * TILE_SIZE;
            if (player.y + hh > platTop && player.y + hh < platTop + TILE_SIZE * 0.6) {
              player.y = platTop - hh;
              player.vy = 0;
              if (!_was && !landedThisFrame) { SFX_land(); landedThisFrame = true; }
              player.onGround = true; player.jumpCount = 0;
            }
          }
        }
      }
    }

    // Clamp to world bounds
    if (player.x < hw) { player.x = hw; player.vx = 0; }
    if (player.x > WORLD_W - hw) { player.x = WORLD_W - hw; player.vx = 0; }

    // ── ABYSS check (tilemap-based) ──
    {
      const pc = Math.floor(player.x / TILE_SIZE);
      const pr = Math.floor((player.y + hh) / TILE_SIZE);
      if (isAbyss(pc, pr) && !player.rideBubble) {
        if (!player.fallingAbyss) {
          player.fallingAbyss = true;
          player.fallingTimer = 18;
          SFX_hurt(); takeDamage();
          toast('🕳️ ¡Caíste al abismo!');
        }
      }
    }
    if (player.fallingAbyss) {
      player.fallingTimer--;
      player.vy = 8; player.vx = 0;
      if (player.fallingTimer <= 0) {
        player.fallingAbyss = false;
        // Respawn at spawn point
        player.x = ENTITY_DEFS.spawn.col * TILE_SIZE + TILE_SIZE / 2;
        player.y = ENTITY_DEFS.spawn.row * TILE_SIZE;
        player.vy = -3;
      }
      return;
    }

    // ── EXIT check (tilemap-based) ──
    {
      const pc = Math.floor(player.x / TILE_SIZE);
      const pr = Math.floor(player.y / TILE_SIZE);
      if (isExit(pc, pr)) { triggerWin(); return; }
    }

    // ── BRICK WALL collision (from tilemap, hint on touch) ──
    {
      const left  = Math.floor((player.x - hw) / TILE_SIZE);
      const right = Math.floor((player.x + hw) / TILE_SIZE);
      const top   = Math.floor((player.y - hh) / TILE_SIZE);
      const bot   = Math.floor((player.y + hh) / TILE_SIZE);
      for (let r = top; r <= bot; r++) {
        for (let c = left; c <= right; c++) {
          if (getTile(c, r) === TILE.BRICK && !player._brickHint) {
            player._brickHint = true;
            toast('🧱 Pared — usa 💣 para romperla');
          }
        }
      }
    }

    const jumpPressed = keys.jump && !prevKeys.jump;
    if (jumpPressed && player.jumpCount < player.maxJumps) {
      player.vy = player.jumpCount === 0 ? -12 : -10;
      player.jumpCount++; player.onGround = false; SFX_jump();
      player.rideBubble = null;
    }
    const atkPressed = keys.attack && !prevKeys.attack;
    if (atkPressed) doAction();
    prevKeys.jump = keys.jump; prevKeys.attack = keys.attack;

    // Obstáculos (fire)
    for (const o of obstacles) {
      if (o.dead) continue;
      if (player.x + hw > o.x && player.x - hw < o.x + o.w &&
          player.y + hh > o.y && player.y - hh < o.y + o.h) {
        if (player.x < o.x + o.w / 2) player.x = o.x - hw - 1; else player.x = o.x + o.w + hw + 1;
        player.vx = 0;
        if (!player.invincible && o.type === 'fire') takeDamage();
      }
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

    // Jefe (araña) - se congela cuando la linterna está apagada
    if (boss && !boss.dead) {
      const distToPlayer = Math.abs(boss.x - player.x);
      const spiderAwake = lightOn; // La araña solo actúa con luz

      // Gatillar cinemática de introducción solo cuando el jugador se acerca desde la izquierda
      if (!bossIntroDone && player.x < boss.x && distToPlayer < 550 && !inShaft && spiderAwake) {
        bossIntroDone = true;
        cinematicActive = true;
        cinematicTimer = 130;
        toast('⚠️ ¡ALERTA! Presencia enemiga gigante detectada');
      }

      // Solo se mueve y ataca si hay luz
      if (spiderAwake) {
        // Trigger dropping if close
        if (distToPlayer < 350 && boss.state === 'hanging') {
          boss.state = 'dropping';
          SFX_wind();
        }
        if (boss.state === 'dropping') {
          boss.y += 4;
          boss.agro = true;
          if (boss.y >= boss.baseY) {
            boss.y = boss.baseY; boss.state = 'ground'; SFX_land();
          }
        } else if (boss.state === 'ground') {
          boss.agro = distToPlayer < 450;
          if (boss.agro) {
            const speed = boss.fury ? 3.5 : 1.5;
            let newVx = (boss.x < player.x) ? speed : -speed;
            
            for (const bw of brickWalls) {
              if (!bw.dead && boss.x + newVx + boss.w/2 > bw.x && boss.x + newVx - boss.w/2 < bw.x + bw.w &&
                  boss.y + boss.h/2 > bw.y && boss.y - boss.h/2 < bw.y + bw.h) {
                newVx = 0; break;
              }
            }
            boss.x += newVx;
            
            if (boss.fury) {
              boss.phase += 0.12; boss.y = boss.baseY + Math.sin(boss.phase) * 12;
            } else {
              boss.phase += 0.05; boss.y = boss.baseY + Math.sin(boss.phase) * 5;
            }
            
            boss.poisonCd--;
            if (boss.poisonCd <= 0) {
              boss.poisonCd = boss.fury ? 50 : 85;
              const dx = player.x - boss.x, dy = player.y - Math.abs(player.vx)*2 - boss.y;
              const dist = Math.hypot(dx, dy);
              projectiles.push({ type: 'poison', emoji: '🟢', x: boss.x, y: boss.y, vx: (dx/dist)*8, vy: -6, life: 120 });
              SFX_shoot();
            }
          } else {
            let bvx = boss.vx;
            for (const bw of brickWalls) {
              if (!bw.dead && boss.x + bvx + boss.w/2 > bw.x && boss.x + bvx - boss.w/2 < bw.x + bw.w &&
                  boss.y + boss.h/2 > bw.y && boss.y - boss.h/2 < bw.y + bw.h) {
                bvx *= -1; boss.vx *= -1; break;
              }
            }
            boss.x += bvx;
            if (boss.x > boss.maxX || boss.x < boss.minX) boss.vx *= -1;
          }
        }
      }
      
      // Daño al jugador solo si la araña está activa (luz encendida)
      if (spiderAwake && !player.invincible && Math.abs(boss.x - player.x) < 45 && Math.abs(boss.y - player.y) < 45) {
        takeDamage(); player.vx = player.x < boss.x ? -10 : 10; player.vy = -6;
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
      if (b.dead || Math.abs(player.x - b.x) > 28) { 
        player.rideBubble = null; 
      } else { 
        player.y = b.y - 38; 
        player.vy = 0; 
        player.onGround = true; 
        player.jumpCount = 0; 
      }
    }

    // Drops (anillo) - NO termina el juego
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i];
      if (d.collected) continue;
      if (Math.abs(player.x - d.x) < 30 && Math.abs(player.y - d.y) < 30) {
        d.collected = true;
        playerHasRing = true;  // Mark ring as collected
        toast('💍 ¡Encontraste el anillo de Emma!');
        SFX_pick();
        drops.splice(i, 1);
      }
    }

    // Victory is now handled by EXIT tile check above

    // Death from falling out of world
    if (player.y > WORLD_H + 100) { player.alive = false; setTimeout(showDead, 350); return; }

    inShaft = (getZoneName() === "☁️ Camino Superior");
    
    // ── FREE 2D CAMERA ──────────────────────────
    let targetCamX, targetCamY;
    
    if (cinematicActive) {
      targetCamX = boss.x - canvas.width / 2;
      targetCamY = boss.y - canvas.height / 2;
    } else {
      targetCamX = player.x - canvas.width / 2;
      targetCamY = player.y - canvas.height * 0.45;
    }
    
    // Clamp camera to world bounds
    targetCamX = Math.max(0, Math.min(targetCamX, WORLD_W - canvas.width));
    targetCamY = Math.max(0, Math.min(targetCamY, WORLD_H - canvas.height));
    
    cameraX += (targetCamX - cameraX) * 0.1;
    cameraY += (targetCamY - cameraY) * 0.1;

    document.getElementById('zone-hud').textContent = getZoneName();
  }

  function hitBoss(dmg) {
    if (boss.dead) return;
    boss.hp -= dmg;
    if (boss.hp <= 0) {
      boss.dead = true; spawnParts(boss.x, boss.y, '#ffaa00', 30, '🕷️');
      toast('💀 ¡Derrotaste a la araña gigante!');
      drops.push({ x: boss.x, y: boss.y - 20, emoji: '💍', collected: false });
      return;
    }
    if (!boss.fury && boss.hp <= boss.maxHp * 0.33) {
      boss.fury = true; toast('🔥 ¡La araña entra en FURIA!'); SFX_boom();
      spawnParts(boss.x, boss.y, '#ef4444', 40, '🔥');
      spreadFireFrom(boss.x, boss.y); spreadFireFrom(boss.x - 120, boss.y); spreadFireFrom(boss.x + 120, boss.y);
    }
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
      if (e.type === 'bat') { 
        e.phase += 0.025; e.y = e.baseY + Math.sin(e.phase) * 45; e.x += e.vx + wp; 
      } else {
        let newVx = e.vx + wp * 0.6;
        const col = Math.floor((e.x + newVx + (newVx > 0 ? e.w/2 : -e.w/2)) / TILE_SIZE);
        const row = Math.floor(e.y / TILE_SIZE);
        if (isSolid(col, row)) {
          newVx *= -1; e.vx *= -1;
        }
        e.x += newVx;
      }
      if (e.x > e.maxX || e.x < e.minX) e.vx *= -1;
    }

    // Mostrar/ocultar barra de vida del jefe (solo cuando está vivo y agro)
    const bossBar = document.getElementById('boss-health-bar');
    const bossFill = document.getElementById('boss-health-fill');
    if (boss && !boss.dead && boss.agro) {
      const pct = boss.hp / boss.maxHp;
      let hpColor = '#22c55e'; // verde
      if (pct <= 0.66) hpColor = '#eab308'; // amarillo
      if (pct <= 0.33) hpColor = '#ef4444'; // rojo
      if (bossBar && bossFill) {
        bossBar.style.display = 'block';
        bossFill.style.width = (pct * 100) + '%';
        bossFill.style.backgroundColor = hpColor;
      }
    } else if (bossBar) {
      bossBar.style.display = 'none';
    }
  }

  function updateProjectiles() {
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i]; p.vy += 0.22; p.x += p.vx; p.y += p.vy; p.life--;
      if (p.life <= 0) { if (p.type === 'bomb') explode(p.x, p.y); projectiles.splice(i, 1); continue; }
      let hit = false;

      if (p.type === 'poison') {
        if (!player.invincible && Math.abs(p.x - player.x) < 20 && Math.abs(p.y - player.y) < 20) {
          takeDamage(); spawnParts(p.x, p.y, '#4ade80', 8, '🟢'); projectiles.splice(i, 1); continue;
        }
        let hitWall = false;
        for (const bw of brickWalls) {
          if (!bw.dead && p.x > bw.x && p.x < bw.x + bw.w && p.y > bw.y && p.y < bw.y + bw.h) {
            hitWall = true; break;
          }
        }
        if (p.y > roadY || hitWall) {
          spawnParts(p.x, p.y, '#4ade80', 5, '🟢'); projectiles.splice(i, 1); continue;
        }
        continue;
      }

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
        if (p.type === 'bomb') { explode(p.x, p.y); hitBoss(2); } 
        else if (p.type === 'water') { hitBoss(1); }
        projectiles.splice(i, 1); hit = true; continue;
      }

      // Check tile hits (bricks)
      const pc = Math.floor(p.x / TILE_SIZE);
      const pr = Math.floor(p.y / TILE_SIZE);
      if (getTile(pc, pr) === TILE.BRICK) {
        if (p.type === 'bomb') {
          explode(p.x, p.y);
          breakBrick(pc, pr);
          toast('💥 ¡Pared destruida!');
        }
        projectiles.splice(i, 1);
        continue;
      } else if (isSolid(pc, pr)) { // Just solid ground
        if (p.type === 'bomb') explode(p.x, p.y);
        projectiles.splice(i, 1);
        continue;
      }

      // Obstáculos (culling and world culling already check range)
      for (const o of obstacles) {
        if (o.dead) continue;
        if (Math.abs(o.x + 18 - p.x) < 36 && Math.abs(o.y + 18 - p.y) < 36) {
          if (o.type === 'rock' && p.type === 'bomb') { explode(p.x, p.y); o.dead = true; toast('💥 ¡Roca destruida!'); }
          else if (o.type === 'fire' && p.type === 'water') { o.dead = true; SFX_splash(); spawnParts(o.x + 18, o.y, '#60a5fa', 10, '💦'); toast('💦 Fuego apagado'); }
          else if (o.type === 'fire' && p.type === 'bomb') { spreadFireFrom(o.x, o.y); explode(p.x, p.y); toast('🔥 ¡El fuego se expandió!'); }
          else if (p.type === 'bomb') explode(p.x, p.y);
          else if (!o.hint) { o.hint = true; toast(o.type === 'rock' ? '🧱 Usa 💣' : '🔥 Usa 🔫 o 🌧️'); }
          projectiles.splice(i, 1); break;
        }
      }
    }
  }

  function spreadFireFrom(originX, originY) {
    const offsets = [
      { dx: -110, dy: 0 },
      { dx: 110, dy: 0 },
      { dx: -220, dy: 0 },
    ];
    let added = 0;
    for (const off of offsets) {
      const nx = originX + off.dx;
      const ny = originY; 
      if (nx < 40 || nx > WORLD_W - 40) continue;
      const tooClose = obstacles.some(o => !o.dead && o.type === 'fire' && Math.abs(o.x - nx) < 60);
      if (tooClose) continue;
      obstacles.push({ x: nx, y: ny, w: 36, h: 36, type: 'fire', dead: false, hint: false, ff: 0 });
      spawnParts(nx + 18, ny, '#f97316', 6, '🔥');
      added++;
      if (added >= 2) break;
    }
  }

  function explode(x, y) {
    SFX_boom(); spawnParts(x, y, '#f97316', 18, '💥'); spawnParts(x, y, '#fbbf24', 8);
    enemies.forEach(e => { if (!e.dead && Math.hypot(e.x - x, e.y - y) < 85) { e.dead = true; spawnParts(e.x, e.y, '#fbbf24', 8, e.emoji); } });
    // Expansion effects for local fires
    obstacles.forEach(o => { 
      if (!o.dead && o.type === 'fire' && Math.hypot(o.x + 18 - x, o.y - y) < 85) { 
        spreadFireFrom(o.x, o.y); 
      } 
    });
    // Radius demolition on tilemap
    const radius = 2; // tiles
    const cx = Math.floor(x / TILE_SIZE);
    const cy = Math.floor(y / TILE_SIZE);
    for (let r = cy - radius; r <= cy + radius; r++) {
      for (let c = cx - radius; c <= cx + radius; c++) {
        if (getTile(c, r) === TILE.BRICK) {
          breakBrick(c, r);
        }
      }
    }
    if (boss && !boss.dead && Math.hypot(boss.x - x, boss.y - y) < 100) {
      hitBoss(3);
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

      // La lluvia revienta las burbujas
      if (rainOn && rainDrops.length > 0) {
        for (let j = rainDrops.length - 1; j >= 0; j--) {
          const r = rainDrops[j];
          // Simple collision: check if raindrop is inside bubble radius
          if (Math.abs(r.wx - b.x) < b.r && Math.abs(r.wy - b.y) < b.r) {
            b.life = 0; // Pop
            rainDrops.splice(j, 1); // Consume raindrop
            break; 
          }
        }
      }

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
  const DX = wx => {
    const x = Math.round(wx - (cameraX || 0));
    return isNaN(x) ? 0 : x;
  };
  const DY = wy => {
    const y = Math.round(wy - (cameraY || 0));
    return isNaN(y) ? 0 : y;
  };

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
    if (W <= 0 || H <= 0) return;
    ctx.fillStyle = '#060402';
    ctx.fillRect(0, 0, W, H);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0a0705');
    g.addColorStop(1, '#000000');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  function drawCaveStructure() {
    if (!tileMap) return;
    const W = canvas.width, H = canvas.height;
    const startCol = Math.max(0, Math.floor(cameraX / TILE_SIZE));
    const endCol = Math.min(MAP_COLS - 1, Math.floor((cameraX + W) / TILE_SIZE));
    const startRow = Math.max(0, Math.floor(cameraY / TILE_SIZE));
    const endRow = Math.min(MAP_ROWS - 1, Math.floor((cameraY + H) / TILE_SIZE));
    
    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const t = tileMap[r][c];
        if (t === TILE.AIR) continue;
        const sx = Math.round(c * TILE_SIZE - cameraX);
        const sy = Math.round(r * TILE_SIZE - cameraY);
        
        if (t === TILE.STONE) {
          const shade = ((c * 7 + r * 13) % 3);
          ctx.fillStyle = shade === 0 ? '#1a130d' : shade === 1 ? '#15100a' : '#120e08';
          ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
          if (r > 0 && tileMap[r-1][c] !== TILE.STONE && tileMap[r-1][c] !== TILE.BRICK) {
            ctx.fillStyle = '#2d1e10'; ctx.fillRect(sx, sy, TILE_SIZE, 3);
          }
          if (c > 0 && tileMap[r][c-1] !== TILE.STONE && tileMap[r][c-1] !== TILE.BRICK) {
            ctx.fillStyle = '#2d1e10'; ctx.fillRect(sx, sy, 2, TILE_SIZE);
          }
          if (c < MAP_COLS-1 && tileMap[r][c+1] !== TILE.STONE && tileMap[r][c+1] !== TILE.BRICK) {
            ctx.fillStyle = '#2d1e10'; ctx.fillRect(sx + TILE_SIZE - 2, sy, 2, TILE_SIZE);
          }
        } else if (t === TILE.PLATFORM) {
          ctx.fillStyle = '#7a6248';
          ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE * 0.55);
          ctx.fillStyle = '#c68642';
          ctx.fillRect(sx, sy, TILE_SIZE, 3);
          ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(sx + TILE_SIZE/2, sy); ctx.lineTo(sx + TILE_SIZE/2, sy + TILE_SIZE * 0.55); ctx.stroke();
        } else if (t === TILE.BRICK) {
          ctx.fillStyle = '#8b4513';
          ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
          ctx.fillStyle = 'rgba(20,10,3,.6)';
          ctx.fillRect(sx, sy, TILE_SIZE, 2);
          ctx.fillRect(sx, sy + TILE_SIZE/2, TILE_SIZE, 2);
          const off = r % 2 ? TILE_SIZE/2 : TILE_SIZE/4;
          ctx.fillRect(sx + off, sy, 2, TILE_SIZE);
          ctx.fillStyle = 'rgba(255,170,90,.12)';
          ctx.fillRect(sx + 3, sy + 3, TILE_SIZE - 6, 6);
          ctx.strokeStyle = 'rgba(40,20,5,.6)'; ctx.lineWidth = 1;
          ctx.strokeRect(sx, sy, TILE_SIZE, TILE_SIZE);
        } else if (t === TILE.ABYSS) {
          ctx.fillStyle = '#020101';
          ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
          const pulse = .15 + .1 * Math.sin(frameCount * .08 + c * .5);
          ctx.fillStyle = `rgba(255,50,30,${pulse})`;
          ctx.fillRect(sx, sy, TILE_SIZE, 2);
        } else if (t === TILE.STALACTITE) {
          const h = 12 + ((c * 7 + r * 3) % 20);
          ctx.fillStyle = '#2d1e10';
          ctx.beginPath();
          ctx.moveTo(sx + TILE_SIZE/2 - 6, sy);
          ctx.lineTo(sx + TILE_SIZE/2, sy + h);
          ctx.lineTo(sx + TILE_SIZE/2 + 6, sy);
          ctx.fill();
        } else if (t === TILE.EXIT) {
          const pulse = .5 + .5 * Math.sin(frameCount * .08);
          ctx.save();
          ctx.shadowColor = '#fff8c0'; ctx.shadowBlur = 20 + pulse * 10;
          ctx.fillStyle = `rgba(255,248,180,${.3 + pulse * .3})`;
          ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
          ctx.restore();
        }
      }
    }
  }

  function drawPlatforms() {
    // Platforms are now rendered by drawCaveStructure (tilemap)
  }

  function drawCaveFloor() {
    // Puddles only — floor is tilemap
    for (const pu of puddles) {
      if (!pu.active) continue;
      const dx = DX(pu.x), dy = DY(pu.y);
      if (dx > canvas.width + 60 || dx + pu.w < -60) continue;
      ctx.save();
      ctx.fillStyle = 'rgba(56,189,248,0.45)';
      ctx.beginPath(); ctx.ellipse(dx + pu.w / 2, dy + pu.h / 2, pu.w / 2, pu.h / 2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.font = '11px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('💧', dx + pu.w / 2, dy + pu.h / 2); ctx.restore();
    }
  }

  function drawObstacles() {
    for (const o of obstacles) {
      if (o.dead) continue;
      const dx = DX(o.x), dy = DY(o.y);
      if (dx > canvas.width + 60 || dx + o.w < -60 || dy > canvas.height + 60 || dy < -60) continue;
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
    // Brick walls are now rendered by drawCaveStructure (tilemap)
  }

  function drawEnemies() {
    for (const e of enemies) {
      if (e.deathT > 0) continue;
      drawEmoji(e.x, e.y, e.emoji, e.type === 'bat' ? 24 : 26, Math.sin(frameCount * .06 + e.phase) * .06);
    }
    if (boss && !boss.dead) {
      if (boss.state === 'hanging' || boss.state === 'dropping') {
         ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2;
         ctx.beginPath(); ctx.moveTo(DX(boss.x), DY(boss.webY)); ctx.lineTo(DX(boss.x), DY(boss.y) - 15); ctx.stroke();
         ctx.restore();
      }
      
      const spiderAwake = lightOn;
      const bounce = spiderAwake ? (boss.fury ? Math.sin(frameCount * .15) * .2 : Math.sin(frameCount * .05) * .1) : 0;
      const glow = boss.fury ? '#ef4444' : (spiderAwake ? 'rgba(0,0,0,0)' : 'rgba(100,100,150,0.3)');
      drawEmoji(boss.x, boss.y, '🕷️', boss.fury ? 60 : 50, bounce, glow);
      
      // Mostrar indicador de araña dormida
      if (!spiderAwake && boss.hp > 0) {
        const zx = DX(boss.x + 35), zy = DY(boss.y - 30);
        ctx.save();
        ctx.font = '14px sans-serif';
        ctx.fillStyle = 'rgba(150,200,255,0.8)';
        ctx.fillText('💤', zx, zy);
        ctx.restore();
      }
      
      if (boss.agro && boss.hp > 0) {
        const bx = DX(boss.x), by = DY(boss.y) - (boss.fury ? 50 : 40);
        const pct = boss.hp / boss.maxHp;
        let hpColor = '#22c55e';
        if (pct <= 0.66) hpColor = '#eab308';
        if (pct <= 0.33) hpColor = '#ef4444';
        
        ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(bx - 40, by, 80, 8);
        ctx.fillStyle = hpColor; ctx.fillRect(bx - 40, by, 80 * pct, 8);
      }
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
      } else if (p.type === 'poison') {
        const sx = DX(p.x), sy = DY(p.y);
        ctx.save();
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.shadowColor = '#4ade80';
        ctx.shadowBlur = 6;
        
        // Orientar la "gota" según su trayectoria parabólica
        const angle = Math.atan2(p.vy, p.vx);
        const len = 15; // Longitud de la gota
        
        ctx.beginPath();
        ctx.moveTo(sx - Math.cos(angle) * (len/2), sy - Math.sin(angle) * (len/2));
        ctx.lineTo(sx + Math.cos(angle) * (len/2), sy + Math.sin(angle) * (len/2));
        ctx.stroke();
        
        // Pequeño núcleo brillante
        ctx.strokeStyle = '#f0fff4';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(sx - Math.cos(angle) * 3, sy - Math.sin(angle) * 3);
        ctx.lineTo(sx + Math.cos(angle) * 3, sy + Math.sin(angle) * 3);
        ctx.stroke();
        
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
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('🫧', bx, by); ctx.restore();
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
    
    // Parpadeo solo si es invencible (opcional)
    if (player.invincible && (frameCount % 8 < 4)) return;
    
    const px = DX(player.x);
    const py = DY(player.y);
    
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(player.rotation || 0);
    
    // Forzar opacidad sólida
    ctx.globalAlpha = 1.0;
    
    // Círculo de contraste
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2); ctx.fill();
    
    // Emoji
    ctx.font = "32px 'Segoe UI Emoji','Apple Color Emoji','Noto Color Emoji',sans-serif";
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    
    const em = (hearts <= 1 || energy < 15) ? '😰' : (player.rideBubble ? '🥹' : '😊');
    ctx.fillStyle = 'white';
    ctx.fillText(em, 0, 0);
    ctx.restore();
  }

  function drawDarkness() {
    if (lightOn || !player) return;

    // No dibujar oscuridad dentro del pozo
    const cx = DX(player.x), cy = DY(player.y), R = 75;
    // Don't show darkness in Crystal Grotto
    if (getZoneName() === "💎 Gruta de Cristal") return;
    
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(0,0,0,0.94)';
    
    // 4 rectángulos alrededor del jugador
    if (cy - R > 0) ctx.fillRect(0, 0, W, cy - R);
    if (cy + R < H) ctx.fillRect(0, cy + R, W, H - (cy + R));
    const rectH = R * 2;
    const rectY = Math.max(0, cy - R);
    if (cx - R > 0) ctx.fillRect(0, rectY, cx - R, rectH);
    if (cx + R < W) ctx.fillRect(cx + R, rectY, W - (cx + R), rectH);
    
    try {
      const g = ctx.createRadialGradient(cx, cy, R * 0.7, cx, cy, R);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,0.94)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
    } catch(e) {}
    
    ctx.restore();
  }

  function drawExit() { }

  function drawAbyss() { }

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
    
    try {
      updatePlayer(); updateEnemies(); updateProjectiles();
      updateRain(); updateBubbles(); updateParticles();
    } catch(err) {
      if (frameCount % 60 === 0) console.error('Update Error:', err);
    }
    
    ctx.globalAlpha = 1.0;
    ctx.globalCompositeOperation = 'source-over';
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    try {
      if (canvas.width > 0 && canvas.height > 0) {
        drawBackground();
        drawCaveStructure();
        drawCaveFloor();
        drawObstacles();
        drawBubbles();
        drawDrops();
        drawEnemies();
        drawProjectiles();
        drawParticles();
        drawRain();
        drawDarkness();
        drawPlayer();
        drawHUDCanvas();
      }
    } catch(err) {
      if (frameCount % 60 === 0) console.error('Draw Error:', err);
    }
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
    
    // Send message to main game with ring status
    window.parent.postMessage({ type: 'CAVE_EXIT', hasRing: playerHasRing }, '*');
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
    playerHasRing = false;  // Reset ring status
    rainOn = false; windOn = false; bubblesOn = false; lightOn = false;
    hearts = 3; energy = 100; gunAmmo = 0; frameCount = 0;
    victoryDone = false; cameraX = 0; cameraY = 0; inShaft = false; atkCd = 0; lastLandTime = 0;
    cinematicActive = false; cinematicTimer = 0;
    bossIntroDone = false;
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
