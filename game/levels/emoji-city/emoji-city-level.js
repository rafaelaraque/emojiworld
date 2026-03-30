// ── roundRect polyfill for older browsers ───────────────────────
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x,y,w,h,r) {
    const radii = Array.isArray(r) ? r : [r,r,r,r];
    const [tl=0,tr=0,br=0,bl=0] = radii;
    this.moveTo(x+tl, y);
    this.lineTo(x+w-tr, y);  this.arcTo(x+w,y,   x+w,y+tr, tr);
    this.lineTo(x+w, y+h-br); this.arcTo(x+w,y+h, x+w-br,y+h, br);
    this.lineTo(x+bl, y+h);  this.arcTo(x,y+h, x,y+h-bl, bl);
    this.lineTo(x, y+tl);    this.arcTo(x,y, x+tl,y, tl);
    this.closePath();
    return this;
  };
}

// Constantes para el nivel
const LEVEL_LENGTH = 36400; // Longitud total del nivel
const SECTION_DAY = 0;
const SECTION_EVENING =12200;
const SECTION_NIGHT = 24400;

// Global variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameOverScreen = document.getElementById('game-over');
const restartBtn = document.getElementById('restart-btn');
const scoreDisplay = document.getElementById('score-display');
const coinsDisplay = document.getElementById('coins-display');
const startScreen = document.getElementById('start-screen');
const playBtn = document.getElementById('play-btn');
const heartsDisplay = document.getElementById('hearts-display');
const coinsHud = document.getElementById('coins-hud');
const timerDisplay = document.getElementById('timer-display');
const powerSlots = document.querySelectorAll('.power-slot');
const bonusStage = document.getElementById('bonus-stage');
const bonusGrid = document.getElementById('bonus-grid');
const bonusTimer = document.getElementById('bonus-timer');
const bonusMessage = document.getElementById('bonus-message');
const store = document.getElementById('store');
const backBtn = document.getElementById('back-btn');
const buyBtns = document.querySelectorAll('.buy-btn');
const leftBtn = document.getElementById('left');
const rightBtn = document.getElementById('right');
const jumpBtnWrapper = document.getElementById('jump-btn-wrapper');
const attackBtnWrapper = document.getElementById('attack-btn-wrapper');
const victoryScreen = document.getElementById('victory-screen');
const playAgainBtn = document.getElementById('play-again-btn');
const scoreVictory = document.getElementById('score-victory');
const coinsVictory = document.getElementById('coins-victory');

// Game variables
let player, platforms = [], stairsPlatforms = [];
let cameraX = 0, gameActive = false, distance = 0;
let coinsCollected = 0;
let keys = { left: false, right: false, jump: false, attack: false };
let currentPower = null, powerActive = false, powerDuration = 0;
let coolFreezeActive = false;   // 😎 cool: todos los enemigos estáticos 5s
let coolFreezeTimer = 0;        // frames restantes (300 = 5s @ 60fps)
let hearts = 3, damageEmojiTimeout = null;
let cars = [], holes = [], obstacles = [], coins = [];
let roadOffset = 0, lastPlatformX = 300, enemies = [];
let roadY, sunEnemy = null, ufo = null, timeOfDay = 'day';
let star = null, storeEmoji = null;

// ── Helicopter (anti-eagle countermeasure) ─────────────────────────
let helicopter = null;
let lastHeliSpawn = 0;
let heliSpawnCooldown = 0;

// ── Level 1 Night Boss (🛸) ────────────────────────────────────────
let nightBoss = null;
let nightBossActive = false;
let nightBossArena = false;
let bossDefeated = false;  // prevents arena re-trigger after boss death
let nightBossArenaX = 0;
let frozenEnemies = [];
let lastNightBossShot = 0;
// Phase 2: boss ascends, vertical scroll
let bossPhase2 = false;          // true once boss HP ≤ 50%
let cameraY = 0;                 // vertical camera offset (phase 2)
let bossRainDrops = [];          // falling 💧 the player can freeze
let bossHitCooldown = 0;         // frames until boss can be hit again
const BOSS_HIT_COOLDOWN = 55;    // ~0.9s cooldown between hits
let bossArenaPlatforms = [];     // floating platforms inside the arena

// ── Checkpoint system ─────────────────────────────────────────────
// null = no checkpoint yet, 'evening' | 'night' | 'boss' = last reached
let lastCheckpoint = null;
let checkpointCoins = 0;    // coins at checkpoint time
let level2CheckpointSaved = false; // true once player enters level 2
let bonusGameActive = false;
let bonusCards = [];
let flippedCards = [];
let matchedPairs = 0;
let bonusTimeLeft = 30;
let bonusGameTimer = null;
let particles = [];
let heartDrops = [];
let keysPressed = {};
let prevKeys = { jump: false, attack: false };
let paused = false;
let purchasedAvatar = null;
let avatarAttackActive = false;
let avatarAttackTimer = 0;
let avatarPowerTimer = 0;          // countdown frames (20s × 60fps = 1200)
const AVATAR_POWER_DURATION = 1200; // 20 seconds
let reinforcedHearts = 0;          // 0–3 extra shield hearts
let weapons = [];
let ufoShots = [];
let lastUfoShot = 0;
let prevCoins = 0;
let keyCheckInterval = null;
let gameLoopID = null;
let sunDefeated = false;
let lastSunSpawn = 0;
let selectingPower = false;
let currentSelectingPower = null;
let gameTimer = 300;
let gameTimerInterval = null;
let flag = null;
let levelCompleted = false;

// ── Level 2 variables ──────────────────────────────────────────────
let currentLevel = 1;
let trees = [], animals = [], boss = null;
let asteroids = [];
let asteroidSpawnTimer = 0;
let asteroidSpawnInterval = 55;
let bossActive = false;
let lastBossSpawn = 0;
let trailY = 0;
let trailOffset = 0;
const LEVEL1_LENGTH = 36400;
const LEVEL2_LENGTH = 36400;
const animalEmojis = ['🐂','🦔','🪨'];          // terrestres estáticos, hacen daño
const forestEnemyEmojis = ['👻','👾','🤖'];      // con movimiento, hacen daño
const flyingEnemyEmojis = ['🦇'];               // voladores, baja frecuencia
const trollEnemyEmojis  = ['🧌'];               // baja frecuencia, estáticos
const obstacleEmojis    = ['🪨'];               // obstáculo genérico nivel 1
const nextLevelBtn = document.getElementById('next-level-btn');
const starsContainer = document.getElementById('stars');

// ── Level 2 Boss 2 (🗿) new mechanic state ──────────────────────────
let boss2DialogShown    = false;
let boss2DialogActive   = false;
let elvenPowersActive   = false;
let boss2Frozen         = false;
let boss2FrozenTimer    = 0;
let boss2Aura           = null;
let boss2AuraTimer      = 0;
let boss2IceBarrier     = null;
let boss2BarrierPhase   = false; // true while barrier is up and boss regens
let boss2RegenTimer     = 0;     // frames boss has been regenerating
let boss2Phase          = 1;
let endingDialogActive  = false;
let endingDialogStep    = 0;
let boss2ArenaX         = 0;   // left wall of boss arena (no-return boundary)

// === VISUAL + AUDIO EFFECT VARIABLES ===
let screenShake = 0;
let damageFlash = 0;
let powerFlash = 0;
let powerFlashColor = '#ff0000';
let powerAuraParticles = [];
let lastAuraSpawn = 0;

const POWER_COLORS = {
  angry: { main:'#ff3300', glow:'#ff6600', particle:'💥' },
  ice:   { main:'#00cfff', glow:'#aaeeff', particle:'❄️' },
  fire:  { main:'#ff8800', glow:'#ffcc00', particle:'🔥' },
  cool:  { main:'#ffe000', glow:'#ffffff', particle:'⭐' },
  ghost: { main:'#9966ff', glow:'#ccaaff', particle:'💫' }
};

// Constants
const gravity = 0.5;
const enemyEmojis = ["🤖", "👾", "🌪", "🤖", "👾", "🌪"];
const obstacleEmojisList = ["🌵"];
const carEmojis = ["🚕", "🚗", "🚙", "🚌", "🛻", "🚐", "🚚", "🛺"]
let powerCooldowns = {
  angry: 0, ice: 0, fire: 0, cool: 0, ghost: 0
};

// Emojis for the bonus level
const bonusEmojis = ["🌵", "🛸", "🥶", "🤖", "👾", "🌪️", "🚌", "🚙", "🚗", "🚕"];

// ═══════════════════════════════════════════════════════════════════
//  AUDIO ENGINE — Banda sonora procedural + efectos de sonido
// ═══════════════════════════════════════════════════════════════════
let _ac = null;
let _masterGain = null;
let _musicGain  = null;
let _sfxGain    = null;
let _reverbNode = null;
let _musicSeqTimer = null;
let _musicStep  = 0;
let _musicTheme = null;
let _musicBeat  = 0;          // seconds per 16th note
let _nextNoteTime = 0;
let _scheduleAhead = 0.12;    // seconds to schedule ahead
let _schedTimer = null;

// ── Frecuencias de notas ─────────────────────────────────────────
const N = {
  B2:123.47, C3:130.81, D3:146.83, E3:164.81, F3:174.61,
  G3:196.00, A3:220.00, B3:246.94,
  C4:261.63, D4:293.66, E4:329.63, F4:349.23,
  G4:392.00, A4:440.00, B4:493.88,
  C5:523.25, D5:587.33, E5:659.25, F5:698.46,
  G5:783.99, A5:880.00, _:0  // _ = silencio
};

// ── Temas musicales ──────────────────────────────────────────────
// Cada tema: 16 pasos de 16os, BPM, capas melody + bass + arp
const THEMES = {
  day: {
    bpm: 132,
    melody: ['C5','_','E5','_','G5','E5','C5','_','D5','_','F5','_','E5','C5','G4','_'],
    bass:   ['C3','_','C3','_','G3','_','G3','_','A3','_','A3','_','F3','_','F3','_'],
    arp:    ['E4','G4','C5','G4','E4','G4','B4','G4','D4','F4','A4','F4','C4','E4','G4','E4'],
    mType:  'triangle', bType: 'sawtooth', aType: 'sine',
    mVol: 0.18, bVol: 0.12, aVol: 0.08
  },
  evening: {
    bpm: 88,
    melody: ['A4','_','C5','_','E5','_','D5','C5','B4','_','A4','_','G4','_','F4','_'],
    bass:   ['A3','_','A3','_','E3','_','E3','_','F3','_','C3','_','G3','_','D3','_'],
    arp:    ['C4','E4','A4','E4','G3','C4','E4','C4','F3','A3','C4','A3','E3','G3','B3','G3'],
    mType:  'sine',     bType: 'triangle', aType: 'sine',
    mVol: 0.14, bVol: 0.10, aVol: 0.07
  },
  night: {
    bpm: 104,
    melody: ['E5','_','B4','_','G4','_','E4','_','D4','_','B3','_','G3','_','E3','_'],
    bass:   ['E3','B2','E3','_','G3','B2','G3','_','D3','B2','D3','_','E3','_','B2','_'],
    arp:    ['B3','E4','G4','B4','E4','G4','B4','E5','D4','G4','B4','D5','E4','G4','B4','E5'],
    mType:  'sawtooth', bType: 'square',   aType: 'triangle',
    mVol: 0.15, bVol: 0.13, aVol: 0.06
  },
  forest: {
    // Bosque oscuro — misterioso, épico, más lento y profundo
    bpm: 80,
    melody: ['D5','_','A4','_','F4','_','D4','_','E4','_','C5','_','B4','_','G4','_'],
    bass:   ['D3','_','D3','A2','F3','_','F3','_','E3','_','E3','_','G3','_','G3','_'],
    arp:    ['F4','A4','D5','A4','F4','A4','C5','A4','E4','G4','C5','G4','D4','F4','B4','F4'],
    mType:  'triangle', bType: 'sawtooth', aType: 'sine',
    mVol: 0.18, bVol: 0.14, aVol: 0.06
  }
};

function getAC() {
  if (!_ac) {
    try {
      _ac = new (window.AudioContext || window.webkitAudioContext)();
      // Master chain: masterGain → destination
      _masterGain = _ac.createGain(); _masterGain.gain.value = 0.9;
      _masterGain.connect(_ac.destination);
      // Music bus
      _musicGain = _ac.createGain(); _musicGain.gain.value = 0.55;
      _musicGain.connect(_masterGain);
      // SFX bus
      _sfxGain = _ac.createGain(); _sfxGain.gain.value = 1.0;
      _sfxGain.connect(_masterGain);
      // Simple reverb (convolver with impulse)
      _reverbNode = buildReverb(_ac);
      _reverbNode.connect(_musicGain);
    } catch(e) { _ac = null; }
  }
  return _ac;
}

function buildReverb(ac) {
  const len = ac.sampleRate * 1.2;
  const imp = ac.createBuffer(2, len, ac.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = imp.getChannelData(ch);
    for (let i = 0; i < len; i++)
      d[i] = (Math.random()*2-1) * Math.pow(1 - i/len, 3.5);
  }
  const conv = ac.createConvolver();
  conv.buffer = imp;
  const g = ac.createGain(); g.gain.value = 0.22;
  g.connect(conv);
  return g; // input into g, wet out from conv already connected
}

// Schedule a single note on the music bus (with optional reverb send)
function schedNote(freq, type, start, dur, vol, reverb=false) {
  if (!freq || !_ac) return;
  const o = _ac.createOscillator();
  const g = _ac.createGain();
  o.type = type;
  o.frequency.value = freq;
  // Slight detune for warmth
  o.detune.value = (Math.random()-0.5) * 8;
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(vol, start + 0.012);
  g.gain.exponentialRampToValueAtTime(0.001, start + dur * 0.85);
  o.connect(g);
  g.connect(_musicGain);
  if (reverb) g.connect(_reverbNode);
  o.start(start); o.stop(start + dur + 0.04);
}

// SFX helper: play on sfx bus
function sfxOsc(type, f1, f2, start, dur, vol) {
  if (!_ac) return;
  const o = _ac.createOscillator(), g = _ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f1, start);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, start + dur);
  g.gain.setValueAtTime(vol, start);
  g.gain.exponentialRampToValueAtTime(0.001, start + dur);
  o.connect(g); g.connect(_sfxGain);
  o.start(start); o.stop(start + dur + 0.03);
}

function sfxNoise(start, dur, vol, decay=0.3) {
  if (!_ac) return;
  const len = Math.floor(_ac.sampleRate * dur);
  const buf = _ac.createBuffer(1, len, _ac.sampleRate);
  const d   = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random()*2-1) * Math.exp(-i/(len*decay));
  const src = _ac.createBufferSource(), g = _ac.createGain();
  src.buffer = buf;
  g.gain.setValueAtTime(vol, start);
  src.connect(g); g.connect(_sfxGain);
  src.start(start);
}

// ── Music scheduler ──────────────────────────────────────────────
function startMusicScheduler(theme) {
  const ac = getAC(); if (!ac) return;
  if (_musicTheme === theme && _schedTimer) return; // already playing
  stopMusic();
  _musicTheme = theme;
  _musicStep  = 0;
  _nextNoteTime = ac.currentTime + 0.1;
  const th = THEMES[theme];
  _musicBeat = 60 / (th.bpm * 4); // 16th note duration in seconds
  _schedTimer = setInterval(() => scheduleMusicChunk(), 50);
}

function scheduleMusicChunk() {
  const ac = getAC(); if (!ac) return;
  const th = THEMES[_musicTheme];
  if (!th) return;
  while (_nextNoteTime < ac.currentTime + _scheduleAhead) {
    const step = _musicStep % 16;
    const dur  = _musicBeat * 1.9;

    const mNote = N[th.melody[step]];
    const bNote = N[th.bass[step]];
    const aNote = N[th.arp[step]];

    if (mNote) schedNote(mNote, th.mType, _nextNoteTime, dur, th.mVol, true);
    if (bNote) schedNote(bNote, th.bType, _nextNoteTime, _musicBeat*3.8, th.bVol);
    if (aNote) schedNote(aNote, th.aType, _nextNoteTime, _musicBeat*0.9, th.aVol);

    // Kick: steps 0 and 8
    if (step === 0 || step === 8) {
      sfxNoise(_nextNoteTime, 0.08, 0.18, 0.15);
      sfxOsc('sine', 160, 35, _nextNoteTime, 0.12, 0.22);
    }
    // Snare: steps 4 and 12
    if (step === 4 || step === 12) {
      sfxNoise(_nextNoteTime, 0.06, 0.14, 0.25);
      sfxOsc('square', 220, 110, _nextNoteTime, 0.07, 0.08);
    }
    // Hi-hat: every 2 steps
    if (step % 2 === 1) {
      sfxNoise(_nextNoteTime, 0.025, 0.04, 0.6);
    }

    _nextNoteTime += _musicBeat;
    _musicStep++;
  }
}

function stopMusic() {
  if (_schedTimer) { clearInterval(_schedTimer); _schedTimer = null; }
  _musicTheme = null;
}

function updateMusicTheme() {
  if (!gameActive || bonusGameActive || paused) return;
  let desired;
  if (currentLevel === 2) {
    desired = 'forest';
  } else {
    desired = player.x < SECTION_EVENING ? 'day' :
              player.x < SECTION_NIGHT   ? 'evening' : 'night';
  }
  if (desired !== _musicTheme) {
    if (_ac && _musicGain) {
      _musicGain.gain.setTargetAtTime(0, _ac.currentTime, 0.4);
      setTimeout(() => {
        if (_musicGain) _musicGain.gain.setTargetAtTime(0.55, _ac.currentTime, 0.6);
        startMusicScheduler(desired);
      }, 600);
    } else {
      startMusicScheduler(desired);
    }
    _musicTheme = desired;
  }
}

// ── Sound effects ────────────────────────────────────────────────
function playHeartSound() {
  try {
    const ac = getAC(); if (!ac) return;
    const t = ac.currentTime;
    // Sonido cálido y dulce — dos notas ascendentes con vibrato suave
    sfxOsc('sine', 523, 784, t,        0.18, 0.25);  // C5 → G5
    sfxOsc('sine', 784, 1047, t+0.18,  0.15, 0.22); // G5 → C6
    sfxOsc('triangle', 440, 660, t+0.06, 0.10, 0.20);
  } catch(e) {}
}

function playCoinSound() {
  try {
    const ac = getAC(); if (!ac) return;
    const t = ac.currentTime;

    // Sonido de moneda tomado de index.html:
    // sube de 1200 Hz a 1600 Hz en dos pasos rápidos
    const osc = ac.createOscillator();
    const gainNode = ac.createGain();
    osc.connect(gainNode);
    gainNode.connect(_sfxGain);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.setValueAtTime(1600, t + 0.1);
    gainNode.gain.setValueAtTime(0.2, t);
    gainNode.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
    osc.start(t);
    osc.stop(t + 0.3);
  } catch(e) {}
}

function playJumpSound() {
  try {
    const ac = getAC(); if (!ac) return;
    const t = ac.currentTime;
    // Mario clásico — onda cuadrada 8-bit subiendo
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = 'square';
    o.frequency.setValueAtTime(200, t);
    o.frequency.exponentialRampToValueAtTime(800, t + 0.18);
    g.gain.setValueAtTime(0.22, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    o.connect(g); g.connect(_sfxGain);
    o.start(t); o.stop(t + 0.24);
  } catch(e) {}
}

let _lastLandTime = 0; // debounce: evita disparar varias veces por frame
function playLandSound() {
  try {
    const ac = getAC(); if (!ac) return;
    const now = ac.currentTime;
    if (now - _lastLandTime < 0.12) return; // debounce 120ms
    _lastLandTime = now;

    // Ruido blanco filtrado paso-bajo → sonido de "golpe sordo" sin componente eléctrico
    const len = Math.floor(ac.sampleRate * 0.10);
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const d   = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      // decay rápido: suena como impacto corto, no como zumbido
      d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.18));
    }

    const src  = ac.createBufferSource();
    src.buffer = buf;

    // Filtro paso-bajo: corta todo lo agudo (sin sierra, sin eléctrico)
    const lpf = ac.createBiquadFilter();
    lpf.type            = 'lowpass';
    lpf.frequency.value = 280;   // solo frecuencias graves pasan
    lpf.Q.value         = 0.8;

    const g = ac.createGain();
    g.gain.setValueAtTime(0.55, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    src.connect(lpf);
    lpf.connect(g);
    g.connect(_sfxGain);
    src.start(now);
  } catch(e) {}
}

function playDamageSound() {
  try {
    const ac = getAC(); if (!ac) return;
    const t = ac.currentTime;
    sfxNoise(t, 0.14, 0.70, 0.20);
    sfxOsc('sawtooth', 380, 55,  t,        0.30, 0.55);
    sfxOsc('square',   900, 140, t + 0.02, 0.18, 0.30);
    sfxOsc('sine',    1400, 200, t + 0.01, 0.15, 0.25);
  } catch(e) {}
}

function playEnemyDefeatSound() {
  try {
    const ac = getAC(); if (!ac) return;
    const t = ac.currentTime;
    sfxNoise(t, 0.08, 0.35, 0.35);
    sfxOsc('square',  440, 880, t,        0.10, 0.30);
    sfxOsc('triangle',660,1320, t + 0.04, 0.08, 0.20);
  } catch(e) {}
}

function playExplosionSound() {
  try {
    const ac = getAC(); if (!ac) return;
    const t = ac.currentTime;
    sfxNoise(t, 0.20, 0.60, 0.18);
    sfxOsc('sawtooth', 200, 30, t, 0.25, 0.45);
    sfxOsc('square',   400, 50, t + 0.02, 0.15, 0.30);
  } catch(e) {}
}

function playPowerSound(power) {
  try {
    const ac = getAC(); if (!ac) return;
    const t = ac.currentTime;
    const map = {
      angry: () => {
        sfxOsc('sawtooth', 80,  600, t,        0.25, 0.40);
        sfxOsc('square',  120,  800, t + 0.05, 0.18, 0.30);
        sfxNoise(t, 0.12, 0.30, 0.25);
      },
      ice: () => {
        sfxOsc('sine',   1200, 400, t,        0.20, 0.25);
        sfxOsc('sine',   1800, 600, t + 0.05, 0.12, 0.20);
        sfxNoise(t, 0.10, 0.12, 0.50);
      },
      fire: () => {
        sfxOsc('sawtooth',160,  900, t,        0.22, 0.30);
        sfxOsc('triangle',240, 1200, t + 0.04, 0.15, 0.25);
        sfxNoise(t, 0.15, 0.25, 0.18);
      },
      cool: () => {
        sfxOsc('sine',  500, 1100, t,        0.18, 0.30);
        sfxOsc('sine',  750, 1500, t + 0.06, 0.12, 0.25);
        sfxOsc('triangle',300,1800,t + 0.12, 0.08, 0.20);
      },
      ghost: () => {
        sfxOsc('sine',   600,  80, t,        0.15, 0.40);
        sfxOsc('triangle',800,100, t + 0.05, 0.10, 0.35);
        sfxNoise(t, 0.20, 0.08, 0.40);
      }
    };
    if (map[power]) map[power]();
  } catch(e) {}
}

function playGameOverSound() {
  try {
    const ac = getAC(); if (!ac) return;
    const t = ac.currentTime;
    stopMusic();
    // Descending drama
    [[N.E4,0],[N.D4,0.18],[N.C4,0.36],[N.B3,0.54],[N.A3,0.72],[N.G3,0.95]].forEach(([f,dt]) => {
      sfxOsc('sawtooth', f, f*0.5, t+dt, 0.28, 0.30);
    });
    sfxNoise(t, 0.25, 0.35, 0.20);
    sfxNoise(t+0.90, 0.40, 0.40, 0.15);
  } catch(e) {}
}

function playVictorySound() {
  try {
    const ac = getAC(); if (!ac) return;
    const t = ac.currentTime;
    stopMusic();
    // Ascending fanfare
    const fanfare = [
      [N.C4,0,0.15],[N.E4,0.12,0.15],[N.G4,0.24,0.15],[N.C5,0.36,0.25],
      [N.E5,0.50,0.20],[N.G5,0.62,0.30],[N.C5,0.55,0.50],[N.G4,0.55,0.50]
    ];
    fanfare.forEach(([f,dt,d]) => {
      sfxOsc('triangle', f, f, t+dt, d, 0.28);
      sfxOsc('sine',     f, f, t+dt, d, 0.18);
    });
    // Glitter
    for (let i=0; i<5; i++) {
      sfxNoise(t + i*0.12, 0.06, 0.12, 0.50);
    }
  } catch(e) {}
}

function playBonusSound() {
  try {
    const ac = getAC(); if (!ac) return;
    const t = ac.currentTime;
    sfxOsc('sine', N.C5, N.G5, t,        0.12, 0.22);
    sfxOsc('sine', N.E5, N.C6||N.C5*2, t+0.08, 0.12, 0.18);
    sfxOsc('triangle', N.G5, N.C6||N.C5*2, t+0.16, 0.10, 0.14);
  } catch(e) {}
}

// Create radial burst of particles when activating a power
function createPowerTransformEffect(power) {
  const pc = POWER_COLORS[power]; if (!pc) return;
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    const spd = 2.5 + Math.random() * 3.5;
    const life = 24 + Math.floor(Math.random() * 20);
    particles.push({
      x: player.x, y: player.y,
      vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd - 1.5,
      emoji: pc.particle, size: 14 + Math.random() * 14,
      life: life, maxLife: life
    });
  }
}

// Continuously spawn small aura particles around player while power active
function spawnAuraParticles() {
  if (!powerActive || !currentPower) return;
  const now = Date.now();
  if (now - lastAuraSpawn < 90) return;
  lastAuraSpawn = now;
  const pc = POWER_COLORS[currentPower]; if (!pc) return;
  const angle = Math.random() * Math.PI * 2;
  const r = 18 + Math.random() * 12;
  const life = 18 + Math.floor(Math.random() * 14);
  powerAuraParticles.push({
    x: player.x + Math.cos(angle)*r, y: player.y + Math.sin(angle)*r,
    vx: Math.cos(angle)*0.6, vy: -1 - Math.random(),
    emoji: pc.particle, size: 9 + Math.random()*8,
    life: life, maxLife: life
  });
  if (powerAuraParticles.length > 35) powerAuraParticles.splice(0, 5);
}

// Draw the glow ring around the player when power is active
function drawPowerAura() {
  if (!powerActive || !currentPower || !player) return;
  const pc = POWER_COLORS[currentPower]; if (!pc) return;
  const dx = Math.round(player.x - cameraX);
  const dy = Math.round(player.y);
  const pulse = 0.55 + 0.45 * Math.sin(Date.now() / 120);
  ctx.save();
  const grad = ctx.createRadialGradient(dx, dy, 6, dx, dy, 34);
  grad.addColorStop(0, pc.main + '99');
  grad.addColorStop(0.7, pc.glow + '44');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.globalAlpha = pulse;
  ctx.beginPath(); ctx.arc(dx, dy, 34, 0, Math.PI*2); ctx.fill();
  ctx.globalAlpha = 0.75 * pulse;
  ctx.strokeStyle = pc.main;
  ctx.lineWidth = 2.5;
  ctx.shadowColor = pc.glow; ctx.shadowBlur = 16;
  ctx.beginPath(); ctx.arc(dx, dy, 26, 0, Math.PI*2); ctx.stroke();
  ctx.restore();
}

// Draw the floating aura particles
function drawAuraParticles() {
  if (powerAuraParticles.length === 0) return;
  for (let i = powerAuraParticles.length - 1; i >= 0; i--) {
    const p = powerAuraParticles[i];
    p.x += p.vx; p.y += p.vy; p.life--;
    if (p.life <= 0) { powerAuraParticles.splice(i, 1); continue; }
    ctx.globalAlpha = p.life / p.maxLife * 0.8;
    ctx.font = `${p.size | 0}px serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowBlur = 0;
    ctx.fillText(p.emoji, Math.round(p.x - cameraX), Math.round(p.y));
  }
  ctx.globalAlpha = 1;
}

// Initialize the game — dispatch to correct level
function initGame() {
  if (gameLoopID) { cancelAnimationFrame(gameLoopID); gameLoopID = null; }
  resizeCanvas();
  if (currentLevel === 1) {
    initLevel1();
  } else {
    initLevel2();
  }
}

// ── Level 1 init ─────────────────────────────────────────────────
function initLevel1() {
  starsContainer.style.display = 'none';
  starsContainer.innerHTML = '';

  // Player initialization
  player = {
    x: 100, y: roadY - 40, vx: 0, vy: 0, w: 40, h: 40,
    onGround: true, jumpCount: 0, maxJumps: 2, rotation: 0,
    emoji: "😊", baseEmoji: "😊", alive: true, health: 3,
    ghostMode: false, invincible: false, invincibleTimer: 0,
    fireBounce: false, angryAura: false, facingRight: true,
  };

  attackBtnWrapper.classList.add('inactive'); attackBtnWrapper.classList.remove('active-avatar');
  document.querySelector('#attack-btn-wrapper .base-emoji').textContent = '🟣';
  document.querySelector('#attack-btn-wrapper .overlay-emoji').textContent = '';

  platforms = [{ x: 0, y: canvas.height - 60, w: 300, h: 20, type: 'flat' }];
  stairsPlatforms = []; cars = []; holes = []; obstacles = [];
  coins = []; enemies = []; particles = []; heartDrops = [];
  sunEnemy = null; ufo = null; weapons = []; ufoShots = [];
  star = null; storeEmoji = null;
  cameraX = 0; distance = 0;
  coinsCollected = prevCoins; hearts = 3;
  currentPower = null; powerActive = false; roadOffset = 0;
  coolFreezeActive = false; coolFreezeTimer = 0;
  lastPlatformX = 300; timeOfDay = 'day';
  avatarAttackActive = false; avatarAttackTimer = 0;
  if (!ngPlusMode) { purchasedAvatar = null; avatarPowerTimer = 0; reinforcedHearts = 0; }
  else { avatarPowerTimer = 1200; reinforcedHearts = ngPlusMode ? 3 : 0; }
  sunDefeated = false; lastSunSpawn = 0;
  selectingPower = false; currentSelectingPower = null;
  gameTimer = 300; levelCompleted = false;
  screenShake = 0; damageFlash = 0; powerFlash = 0;
  powerAuraParticles = []; lastAuraSpawn = 0;

  flag = { x: LEVEL1_LENGTH, y: roadY - 40 };
  keysPressed = {}; keys = { left: false, right: false, jump: false, attack: false };
  prevKeys = { jump: false, attack: false };
  updateHearts();
  timerDisplay.textContent = `⏱: ${gameTimer}s`;
  coinsHud.textContent = `💰: ${coinsCollected}`;
  for (let power in powerCooldowns) powerCooldowns[power] = 0;
  powerSlots.forEach(slot => {
    slot.classList.remove('active', 'cooldown', 'disabled', 'selecting');
    slot.querySelector('.cooldown-overlay').style.height = '0';
    slot.querySelector('.cooldown-clock').style.display = 'none';
  });
  // Reset helicopter & night boss
  helicopter = null; lastHeliSpawn = 0; heliSpawnCooldown = 0;
  nightBoss = null; nightBossActive = false; nightBossArena = false; bossDefeated = false;
  nightBossArenaX = 0; frozenEnemies = []; lastNightBossShot = 0;
  bossPhase2 = false; cameraY = 0; bossRainDrops = [];
  bossHitCooldown = 0; bossArenaPlatforms = [];
  // Reset avatar power timer
  avatarPowerTimer = 0; reinforcedHearts = 0;
  // Reset checkpoints (fresh start)
  lastCheckpoint = null; checkpointCoins = 0;
}

// ── Level 2 init — Bosque Oscuro ─────────────────────────────────
function initLevel2() {
  // Show HTML stars overlay
  createStars();

  player = {
    x: 100, y: trailY - 40, vx: 0, vy: 0, w: 40, h: 40,
    onGround: true, jumpCount: 0, maxJumps: 2, rotation: 0,
    emoji: "😊", baseEmoji: "😊", alive: true, health: 3,
    ghostMode: false, invincible: false, invincibleTimer: 0,
    fireBounce: false, angryAura: false, facingRight: true,
  };

  attackBtnWrapper.classList.add('inactive'); attackBtnWrapper.classList.remove('active-avatar');
  document.querySelector('#attack-btn-wrapper .base-emoji').textContent = '🟣';
  document.querySelector('#attack-btn-wrapper .overlay-emoji').textContent = '';

  platforms = [{ x: 0, y: trailY - 20, w: 300, h: 20, type: 'flat' }];
  trees = []; animals = []; boss = null; holes = [];
  obstacles = []; coins = []; enemies = []; particles = []; heartDrops = [];
  weapons = []; asteroids = []; asteroidSpawnTimer = 0;
  star = null; storeEmoji = null;
  cameraX = 0; distance = 0; hearts = 3;
  currentPower = null; powerActive = false; trailOffset = 0;
  coolFreezeActive = false; coolFreezeTimer = 0;
  lastPlatformX = 300; timeOfDay = 'night';
  avatarAttackActive = false; avatarAttackTimer = 0;
  if (!ngPlusMode) { purchasedAvatar = null; avatarPowerTimer = 0; reinforcedHearts = 0; }
  else { avatarPowerTimer = 1200; reinforcedHearts = ngPlusMode ? 3 : 0; }
  bossActive = false; lastBossSpawn = 0;
  boss2DialogShown = false; boss2DialogActive = false;
  elvenPowersActive = false;
  boss2Frozen = false; boss2FrozenTimer = 0;
  boss2Aura = null; boss2AuraTimer = 0;
  boss2IceBarrier = null; boss2BarrierPhase = false; boss2RegenTimer = 0;
  boss2Phase = 1; boss2ArenaX = 0;
  endingDialogActive = false; endingDialogStep = 0;
  selectingPower = false; currentSelectingPower = null;
  gameTimer = 360; levelCompleted = false;
  screenShake = 0; damageFlash = 0; powerFlash = 0;
  powerAuraParticles = []; lastAuraSpawn = 0;

  flag = { x: LEVEL2_LENGTH, y: trailY - 40 };
  keysPressed = {}; keys = { left: false, right: false, jump: false, attack: false };
  prevKeys = { jump: false, attack: false };
  updateHearts();
  timerDisplay.textContent = `⏱: ${gameTimer}s`;
  coinsHud.textContent = `💰: ${coinsCollected}`;
  for (let power in powerCooldowns) powerCooldowns[power] = 0;
  powerSlots.forEach(slot => {
    slot.classList.remove('active', 'cooldown', 'disabled', 'selecting');
    slot.querySelector('.cooldown-overlay').style.height = '0';
    slot.querySelector('.cooldown-clock').style.display = 'none';
  });
}

function createStars() {
  starsContainer.innerHTML = '';
  starsContainer.style.display = 'block';
  for (let i = 0; i < 80; i++) {
    const s = document.createElement('div');
    const sz = 1 + Math.random() * 2.5;
    s.style.cssText = `
      position:absolute;
      width:${sz}px; height:${sz}px;
      border-radius:50%;
      background:white;
      left:${Math.random()*100}%;
      top:${Math.random()*95}%;
      opacity:${0.3 + Math.random()*0.7};
      animation: twkl${i%4} ${2+Math.random()*4}s ${Math.random()*3}s infinite;
    `;
    starsContainer.appendChild(s);
  }
  // inject keyframes once
  if (!document.getElementById('star-kf')) {
    const sty = document.createElement('style');
    sty.id = 'star-kf';
    sty.textContent = `
      @keyframes twkl0{0%,100%{opacity:0.2}50%{opacity:1}}
      @keyframes twkl1{0%,100%{opacity:0.5}50%{opacity:0.1}}
      @keyframes twkl2{0%,100%{opacity:0.8}50%{opacity:0.3}}
      @keyframes twkl3{0%,100%{opacity:0.1}50%{opacity:0.9}}
    `;
    document.head.appendChild(sty);
  }
}

// Update hearts in the HUD
function updateHearts() {
  heartsDisplay.innerHTML = '';

  if (reinforcedHearts > 0) {
    // Show avatar timer bar above hearts
    const timerFrac = avatarPowerTimer / AVATAR_POWER_DURATION;
    const timerBar = document.createElement('div');
    timerBar.id = 'avatar-timer-bar';
    timerBar.style.cssText = `
      width:100%; height:5px; border-radius:3px; margin-bottom:3px;
      background:linear-gradient(90deg,#ffe44d ${timerFrac*100}%,rgba(255,255,255,0.15) ${timerFrac*100}%);
      box-shadow:0 0 8px rgba(255,220,0,0.7);
      transition:width 0.1s;
    `;
    heartsDisplay.appendChild(timerBar);
  }

  // Row of hearts: reinforced first, then normal health, then empty
  for (let i = 0; i < 3; i++) {
    const heart = document.createElement('span');
    heart.className = 'heart';
    if (i < reinforcedHearts) {
      heart.textContent = '💛'; // Corazón reforzado (dorado)
      heart.style.cssText = 'filter:drop-shadow(0 0 4px gold) drop-shadow(0 0 8px #ffd700); animation:heartPulse 0.8s infinite;';
    } else if ((i - reinforcedHearts) < player.health) {
      heart.textContent = '❤️';
    } else {
      heart.textContent = '🤍';
    }
    heartsDisplay.appendChild(heart);
  }
}

// Draw emojis on the canvas
function drawEmoji(x, y, emoji, size = 40, angle = 0, glowColor = null) {
  ctx.save();

  const drawX = Math.round(x - cameraX);
  // In boss phase 2, apply vertical camera offset
  const drawY = Math.round(y);

  ctx.translate(drawX, drawY);

  if (emoji === '🦅') {
    ctx.scale(-1, 1);
  }

  ctx.rotate(angle);

  ctx.font = `${size}px 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  if (glowColor) {
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 20;  // static — was Math.sin(Date.now()) which is very expensive per-sprite
  } else {
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 3;
  }

  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(emoji, 0, 0);

  ctx.restore();
}

// Draw the road
function drawRoad() {
  const W = canvas.width;
  const rW = W * 1.5;

  // ── Grass verge ─────────────────────────────
  const grassGrad = ctx.createLinearGradient(0, roadY - 18, 0, roadY + 6);
  grassGrad.addColorStop(0, '#4aad52');
  grassGrad.addColorStop(0.5,'#3d9645');
  grassGrad.addColorStop(1, '#2d7534');
  ctx.fillStyle = grassGrad;
  ctx.fillRect(0, roadY - 18, rW, 24);

  // Grass blade texture (thin lines)
  ctx.strokeStyle = '#56c25e';
  ctx.lineWidth = 1;
  for (let bx = 0; bx < rW; bx += 7) {
    const bxOff = bx - (cameraX * 0.001 | 0) % 7;
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.moveTo(bxOff, roadY - 18);
    ctx.lineTo(bxOff + 2, roadY - 26 - (bx % 5));
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // ── Curb (kerb) strip ───────────────────────
  ctx.fillStyle = '#c8c8c8';
  ctx.fillRect(0, roadY + 2, rW, 5);
  // Curb detail - alternating red/white blocks
  for (let cx2 = 0; cx2 < rW; cx2 += 20) {
    const off = cx2 - ((cameraX * 0.5) | 0) % 20;
    ctx.fillStyle = (Math.floor((cx2 + cameraX*0.5) / 20) % 2 === 0) ? '#d44' : '#eee';
    ctx.fillRect(off, roadY + 2, 10, 5);
  }

  // ── Asphalt surface ─────────────────────────
  const aspGrad = ctx.createLinearGradient(0, roadY + 7, 0, roadY + 65);
  aspGrad.addColorStop(0,   '#4a4a4a');
  aspGrad.addColorStop(0.3, '#3e3e3e');
  aspGrad.addColorStop(1,   '#2c2c2c');
  ctx.fillStyle = aspGrad;
  ctx.fillRect(0, roadY + 7, rW, 58);

  // Asphalt subtle noise patches (static for perf, light/dark)
  ctx.globalAlpha = 0.06;
  for (let px = 0; px < rW; px += 40) {
    const pOff = px - ((cameraX * 0.5) | 0) % 40;
    const shade = (px / 40) % 3;
    ctx.fillStyle = shade === 0 ? '#888' : shade === 1 ? '#222' : '#666';
    ctx.fillRect(pOff, roadY + 7, 40, 58);
  }
  ctx.globalAlpha = 1;

  // ── Road edge lines (white) ──────────────────
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillRect(0, roadY + 7, rW, 3);
  ctx.fillRect(0, roadY + 60, rW, 3);

  // ── Center dashed line (yellow) ─────────────
  roadOffset = (roadOffset + player.vx * 0.12) % 100;
  ctx.fillStyle = '#ffd740';
  ctx.shadowColor = 'rgba(255,215,0,0.4)';
  ctx.shadowBlur = 4;
  for (let i = -100; i < rW + 100; i += 100) {
    ctx.fillRect(i + roadOffset, roadY + 34, 60, 4);
  }
  ctx.shadowBlur = 0;

  // ── Lane dividers (dashed white) ────────────
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  for (let i = -100; i < rW + 100; i += 100) {
    ctx.fillRect(i + roadOffset + 20, roadY + 20, 40, 2);
    ctx.fillRect(i + roadOffset + 20, roadY + 47, 40, 2);
  }

  // ── Holes ───────────────────────────────────
  for (let hole of holes) {
    const hx = Math.round(hole.x - cameraX);
    if (hx > -60 && hx < W + 60) {
      // Dark pit
      const hGrad = ctx.createRadialGradient(hx, roadY+30, 2, hx, roadY+30, 22);
      hGrad.addColorStop(0, '#000000');
      hGrad.addColorStop(0.6,'#111111');
      hGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = hGrad;
      ctx.beginPath(); ctx.ellipse(hx, roadY+30, 22, 12, 0, 0, Math.PI*2); ctx.fill();
      drawEmoji(hole.x, roadY + 28, '🕳️', 32);
    }
  }

  // ── Star, storeEmoji, flag ───────────────────
  if (star) {
    star.rotation += 0.1;
    drawEmoji(star.x, star.y, '🌟', 42, star.rotation);
  }
  if (storeEmoji) {
    drawEmoji(storeEmoji.x, storeEmoji.y, '🏪', 52, 0);
  }
  // No flag in Level 1 — boss arena signals the end
}

// Draw platforms
function drawPlatforms() {
  for (let p of platforms) {
    const dx = Math.round(p.x - cameraX);
    const dy = Math.round(p.y);
    const w = p.w, h = p.h;

    // Drop shadow
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.roundRect(dx + 4, dy + 6, w, h + 4, 4);
    ctx.fill();

    // Stone body gradient
    const stoneGrad = ctx.createLinearGradient(dx, dy, dx, dy + h);
    stoneGrad.addColorStop(0,   '#7a6a58');
    stoneGrad.addColorStop(0.4, '#5e5040');
    stoneGrad.addColorStop(1,   '#3d3228');
    ctx.fillStyle = stoneGrad;
    ctx.beginPath(); ctx.roundRect(dx, dy, w, h, 3); ctx.fill();

    // Stone block lines (mortar joints)
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 1;
    for (let bx = 0; bx < w; bx += 22) {
      ctx.beginPath(); ctx.moveTo(dx + bx, dy); ctx.lineTo(dx + bx, dy + h); ctx.stroke();
    }
    // Horizontal joint
    ctx.beginPath(); ctx.moveTo(dx, dy + h*0.5); ctx.lineTo(dx + w, dy + h*0.5); ctx.stroke();

    // Stone highlight
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    ctx.beginPath(); ctx.roundRect(dx + 2, dy + 2, w - 4, h * 0.35, 2); ctx.fill();

    // Moss/grass top strip
    const mossGrad = ctx.createLinearGradient(dx, dy - 6, dx, dy + 7);
    mossGrad.addColorStop(0,   '#5dd870');
    mossGrad.addColorStop(0.5, '#46b858');
    mossGrad.addColorStop(1,   '#2e8b3a');
    ctx.fillStyle = mossGrad;
    ctx.beginPath(); ctx.roundRect(dx, dy - 4, w, 8, [4, 4, 0, 0]); ctx.fill();

    // Tiny grass tufts
    ctx.strokeStyle = '#6ee87a';
    ctx.lineWidth = 1.2;
    for (let tx = 4; tx < w - 4; tx += 8) {
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.moveTo(dx + tx, dy - 4);
      ctx.lineTo(dx + tx - 2, dy - 9);
      ctx.moveTo(dx + tx, dy - 4);
      ctx.lineTo(dx + tx + 2, dy - 10);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  // Stair platforms
  for (let s of stairsPlatforms) {
    const dx = Math.round(s.x - cameraX);
    const dy = Math.round(s.y);
    for (let i = 0; i < s.steps; i++) {
      const sx = dx + i * 40, sy = dy - i * 20;
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.fillRect(sx + 3, sy + 3, 40, 20);
      // Stone
      const sg = ctx.createLinearGradient(sx, sy, sx, sy + 20);
      sg.addColorStop(0, '#7a6a58'); sg.addColorStop(1, '#3d3228');
      ctx.fillStyle = sg; ctx.fillRect(sx, sy, 40, 20);
      // Moss
      const mg = ctx.createLinearGradient(sx, sy - 3, sx, sy + 4);
      mg.addColorStop(0,'#5dd870'); mg.addColorStop(1,'#2e8b3a');
      ctx.fillStyle = mg; ctx.fillRect(sx, sy - 2, 40, 5);
      // Highlight
      ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(sx+1,sy+1,38,5);
    }
  }
}

// Draw enemies and vehicles
function drawEnemies() {
  for (let i = cars.length - 1; i >= 0; i--) {
    const car = cars[i];
    if (!coolFreezeActive) car.x += car.vx;
    if (car.x + 50 < cameraX) { cars.splice(i, 1); continue; }
    drawEmoji(car.x, car.y, car.emoji, 40);
    if (Math.abs(car.x - player.x) < 30 && Math.abs(car.y - player.y) < 30 &&
        !player.invincible && !player.ghostMode) handlePlayerDamage(car);
  }
  
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const obstacle = obstacles[i];
    if (obstacle.burning) { drawEmoji(obstacle.x, obstacle.y, '🔥', 40); continue; }
    drawEmoji(obstacle.x, obstacle.y, obstacle.emoji, 40);
    if (Math.abs(obstacle.x - player.x) < 30 && Math.abs(obstacle.y - player.y) < 30 &&
        !player.invincible && !player.ghostMode) handlePlayerDamage(obstacle);
  }
  
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    if (e.burning) { drawEmoji(e.x, e.y, '🔥', 40); continue; }
    if (e.frozen) {
      // Frameless 🧊 emoji with ice glow
      const fx = Math.round(e.x - cameraX);
      ctx.save();
      ctx.shadowColor = 'rgba(100,230,255,0.75)'; ctx.shadowBlur = 18;
      ctx.font = '40px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('🧊', fx, e.y);
      ctx.restore();
      // Boss arena: climbable ice platform
      const HS = 22;
      if (nightBossArena &&
          player.x + player.w/2 > e.x - HS && player.x - player.w/2 < e.x + HS &&
          player.y + player.h/2 > e.y - HS && player.y + player.h/2 < e.y - HS + 8 && player.vy > 0) {
        player.y = e.y - HS - player.h/2;
        player.vy = 0; player.onGround = true; player.jumpCount = 0;
      }
      continue;
    }
    if (!coolFreezeActive) {
      e.x += e.vx;
      if (e.x < e.minX || e.x > e.maxX) e.vx *= -1;
      // Alien falls to ground
      if ((e.type === 'alien') && e.y + 20 < roadY) { e.vy += 0.1; e.y += e.vy; }
      if (e.y + 20 >= roadY) { e.y = roadY - 20; e.vy = 0; }
    }
    drawEmoji(e.x, e.y, e.emoji, 40);
    if (Math.abs(e.x - player.x) < 30 && Math.abs(e.y - player.y) < 30 &&
        !player.invincible && !player.ghostMode) handlePlayerDamage(e);
  }
  
  // ── Sun (day / evening only) ──────────────────────────────────────
  if (sunEnemy && timeOfDay === 'evening' && player.x > SECTION_EVENING) {
    if (!sunEnemy.stunned) {
      if (!powerActive || currentPower !== 'cool') {
        if (!coolFreezeActive) {
          const dx = player.x - sunEnemy.x, dy = player.y - sunEnemy.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist > 50) { sunEnemy.x += dx/30; sunEnemy.y += dy/30; }
        }
      }
    } else {
      sunEnemy.stunTimer--;
      if (sunEnemy.stunTimer <= 0) { sunEnemy.stunned = false; sunEnemy.emoji = sunEnemy.originalEmoji; }
    }
    drawEmoji(sunEnemy.x, sunEnemy.y, sunEnemy.emoji, 50);
    if (Math.abs(sunEnemy.x - player.x) < 40 && Math.abs(sunEnemy.y - player.y) < 40 &&
        !player.invincible && !player.ghostMode) handlePlayerDamage(sunEnemy);
  } else if (sunEnemy === null && (timeOfDay === 'day' || timeOfDay === 'evening') &&
             player.x > SECTION_DAY && player.x < SECTION_NIGHT && !sunDefeated && player.x > lastSunSpawn + 500) {
    sunEnemy = {
      x: lastPlatformX + 200, y: 100,
      emoji: '🌝', originalEmoji: '🌝', type: 'sun', health: 2, stunned: false, stunTimer: 0
    };
    lastSunSpawn = player.x;
  }

  // ── Helicopter (anti-eagle bug patrol) ───────────────────────────
  if (currentLevel === 1) drawHelicopter();

  // ── Night Boss Arena ─────────────────────────────────────────────
  if (currentLevel === 1 && timeOfDay === 'night') drawNightBossArena();

  // ── Frozen-enemy ice cube platforms ──────────────────────────────
  drawFrozenEnemies();
}

// ── 🚁 Helicopter — flies past occasionally at random altitude ─────
function drawHelicopter() {
  const now = Date.now();
  // Spawn when not in boss arena
  if (!helicopter && !nightBossArena && now - lastHeliSpawn > heliSpawnCooldown) {
    const altY = 40 + Math.random() * (canvas.height * 0.45);
    helicopter = {
      x: cameraX + canvas.width + 80,
      y: altY,
      vx: -(3.5 + Math.random() * 2.5),
      emoji: '🚁',
      type: 'helicopter',
      size: 46,
      passedPlayer: false
    };
    lastHeliSpawn = now;
    heliSpawnCooldown = 18000 + Math.random() * 22000; // 18-40s between passes
  }

  if (!helicopter) return;
  if (!coolFreezeActive) helicopter.x += helicopter.vx;

  // Detect eagle bug: player too high for too long
  if (purchasedAvatar === 'eagle' && player.y < canvas.height * 0.3) {
    helicopter.vx = Math.min(-7, helicopter.vx - 0.5); // speed up to intercept
  }

  const drawX = Math.round(helicopter.x - cameraX);
  // Glow
  ctx.save();
  ctx.shadowColor = 'rgba(255,50,50,0.7)';
  ctx.shadowBlur = 16;
  drawEmoji(helicopter.x, helicopter.y, helicopter.emoji, helicopter.size);
  ctx.restore();

  // Hit player (can't be killed, just blocks/damages)
  if (Math.abs(helicopter.x - player.x) < 36 && Math.abs(helicopter.y - player.y) < 30 &&
      !player.invincible && !player.ghostMode) {
    handlePlayerDamage(helicopter);
  }

  // Remove when off-screen to the left
  if (helicopter.x < cameraX - 120) {
    helicopter = null;
  }
}

// ── Night Boss Arena walls + boss 🛸 ──────────────────────────────
// Jump physics: gravity=0.5, jump1 vy=-12 → h=144px, jump2 vy=-10 → h=100px
// Total double-jump reach above ground = ~244px
// Phase 1 platforms: 3 floating shelves at +110, +220 above road; boss at +340
// Phase 2: boss ascends 2×H, vertical canvas scroll, rain drops 💧 become ice platforms

function drawNightBossArena() {
  const arenaW = canvas.width + 80;
  const H = canvas.height;

  // ── Trigger arena entry ──────────────────────────────────────────
  if (!nightBossArena && !bossDefeated && player.x >= LEVEL1_LENGTH - arenaW - 200) {
    nightBossArena = true;
    nightBossArenaX = LEVEL1_LENGTH - arenaW;

    // No terrain platforms — player climbs via frozen rain drops in phase 2
    bossArenaPlatforms = [];

    const midX = nightBossArenaX + arenaW / 2;
    nightBoss = {
      x: midX,
      y: roadY - 340,
      worldY: roadY - 340,      // absolute world y (used in phase 2)
      health: 16, maxHealth: 16,
      vx: 2.2, vy: 0,
      emoji: '🛸',
      type: 'nightboss',
      shootTimer: 0,
      shootInterval: 90,
      bkickDir: 0,
      phase2Triggered: false,
      phase2AscendTimer: 0      // counts frames while ascending
    };
    nightBossActive = true;
    bossPhase2 = false;
    cameraY = 0;

    const hint = document.getElementById('boss-hint');
    if (hint) { hint.style.display = 'block'; setTimeout(() => hint.style.display = 'none', 8000); }
    try {
      const ac = getAC(); if (ac) {
        const t = ac.currentTime;
        sfxOsc('sawtooth', 60, 40, t, 0.5, 0.4);
        sfxOsc('sawtooth', 80, 45, t+0.2, 0.5, 0.4);
        sfxOsc('square', 120, 60, t+0.4, 0.4, 0.35);
      }
    } catch(e2) {}
  }

  if (!nightBossArena) return;

  // ── Phase 2 transition: boss ascends when HP ≤ 50% ───────────────
  if (nightBoss && !bossPhase2 &&
      nightBoss.health <= nightBoss.maxHealth / 2 &&
      !nightBoss.phase2Triggered) {
    nightBoss.phase2Triggered = true;
    bossPhase2 = true;
    enemies = enemies.filter(e => e.type !== 'alien');
    nightBoss.vx = 0;
    nightBoss.phase2AscendTimer = 0;
    screenShake = 12;
    try {
      const ac = getAC(); if (ac) {
        const t = ac.currentTime;
        sfxOsc('sawtooth', 40, 20, t, 0.7, 0.6);
        sfxOsc('sawtooth', 55, 30, t+0.3, 0.6, 0.5);
        sfxOsc('square',  80, 50, t+0.6, 0.5, 0.4);
      }
    } catch(e2) {}
  }

  // ── Phase 2: boss ascends, rain drops fall, camera follows player ─
  if (bossPhase2 && nightBoss) {
    if (!coolFreezeActive) {
      const targetWorldY = roadY - H * 2.5;
      if (nightBoss.phase2AscendTimer < 180) {
        nightBoss.phase2AscendTimer++;
        nightBoss.worldY += (targetWorldY - nightBoss.worldY) * 0.04;
      } else {
        nightBoss.worldY = targetWorldY + Math.sin(Date.now() / 500) * 25;
      }
      nightBoss.y = nightBoss.worldY;
    }

    // Camera follows player upward only (always, even frozen)
    const playerScreenCenter = H * 0.55;
    if (player.y < playerScreenCenter) {
      const targetCamY = player.y - playerScreenCenter;
      cameraY += (targetCamY - cameraY) * 0.10;
    } else {
      if (cameraY < 0) {
        const targetCamY = Math.min(0, player.y - playerScreenCenter);
        cameraY += (targetCamY - cameraY) * 0.10;
      }
    }
    cameraY = Math.min(cameraY, 0);

    // Spawn rain drops — paused while frozen
    if (!coolFreezeActive && Math.random() < 0.035) {
      const isDiamond = Math.random() < 0.22; // ~22% chance
      bossRainDrops.push({
        x: nightBossArenaX + 40 + Math.random() * (arenaW - 80),
        y: cameraY - 40,
        vy: isDiamond ? 3.5 + Math.random() * 1.5 : 2.5 + Math.random() * 2,
        frozen: false,
        type: isDiamond ? 'diamond' : 'water'
      });
    }
  } else if (!bossPhase2) {
    // Phase 1: normal horizontal hover
    cameraY = 0;
    if (nightBoss && !coolFreezeActive) {
      if (nightBoss.bkickDir !== 0) {
        nightBoss.x += nightBoss.bkickDir * 7;
        nightBoss.bkickDir *= 0.82;
        if (Math.abs(nightBoss.bkickDir) < 0.1) nightBoss.bkickDir = 0;
      } else {
        nightBoss.x += nightBoss.vx;
      }
      if (nightBoss.x < nightBossArenaX + 80 || nightBoss.x > nightBossArenaX + arenaW - 80) {
        nightBoss.vx *= -1;
        nightBoss.bkickDir = 0;
      }
      nightBoss.y = (roadY - 340) + Math.sin(Date.now() / 600) * 20;
      nightBoss.worldY = nightBoss.y;
    }
  }

  // ── Walls (drawn in screen space) ────────────────────────────────
  const wallLX = Math.round(nightBossArenaX - cameraX);
  const wallRX = Math.round(nightBossArenaX + arenaW - cameraX);
  ctx.save();
  // Left wall
  const lwGrad = ctx.createLinearGradient(wallLX - 40, 0, wallLX, 0);
  lwGrad.addColorStop(0, 'rgba(80,0,180,0.95)');
  lwGrad.addColorStop(1, 'rgba(180,0,255,0.7)');
  ctx.fillStyle = lwGrad;
  ctx.fillRect(wallLX - 40, 0, 40, H);
  for (let wy = 20; wy < H; wy += 50) {
    ctx.fillStyle = `rgba(200,100,255,${0.4 + 0.4*Math.sin(Date.now()/300 + wy)})`;
    ctx.fillRect(wallLX - 36, wy, 32, 6);
  }
  ctx.fillStyle = 'rgba(200,100,255,0.9)';
  ctx.fillRect(wallLX - 6, 0, 6, H);
  // Right wall
  const rwGrad = ctx.createLinearGradient(wallRX, 0, wallRX + 40, 0);
  rwGrad.addColorStop(0, 'rgba(180,0,255,0.7)');
  rwGrad.addColorStop(1, 'rgba(80,0,180,0.95)');
  ctx.fillStyle = rwGrad;
  ctx.fillRect(wallRX, 0, 40, H);
  for (let wy = 20; wy < H; wy += 50) {
    ctx.fillStyle = `rgba(200,100,255,${0.4 + 0.4*Math.sin(Date.now()/300 + wy + 1.5)})`;
    ctx.fillRect(wallRX + 4, wy, 32, 6);
  }
  ctx.fillStyle = 'rgba(200,100,255,0.9)';
  ctx.fillRect(wallRX, 0, 6, H);
  ctx.restore();

  // ── Clamp player inside arena walls ──────────────────────────────
  if (player.x < nightBossArenaX + 22) { player.x = nightBossArenaX + 22; player.vx = 0; }
  if (player.x > nightBossArenaX + arenaW - 22) { player.x = nightBossArenaX + arenaW - 22; player.vx = 0; }

  // ── Phase 2 rain drops — world coords, ctx.translate handles screen ─
  if (bossPhase2) {
    const now = Date.now();
    for (let i = bossRainDrops.length - 1; i >= 0; i--) {
      const d = bossRainDrops[i];

      if (d.frozen) {
        // Permanent frozen ice platform — draw with frame
        const sx = Math.round(d.x - cameraX);
        const sy = Math.round(d.y);  // world y, translate handles offset
        const SZ = 44;
        ctx.save();
        ctx.fillStyle = 'rgba(120,210,255,0.60)';
        ctx.strokeStyle = 'rgba(0,180,255,0.95)';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#00cfff'; ctx.shadowBlur = 14;
        ctx.fillRect(sx - SZ/2, sy - SZ/2, SZ, SZ);
        ctx.strokeRect(sx - SZ/2, sy - SZ/2, SZ, SZ);
        ctx.restore();
        ctx.save();
        ctx.beginPath(); ctx.rect(sx - SZ/2+3, sy - SZ/2+3, SZ-6, SZ-6); ctx.clip();
        ctx.font = '32px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('🧊', sx, sy + 2);
        ctx.restore();

        // Platform collision — world coords
        if (player.x + player.w/2 > d.x - SZ/2 &&
            player.x - player.w/2 < d.x + SZ/2 &&
            player.y + player.h/2 > d.y - SZ/2 &&
            player.y + player.h/2 < d.y - SZ/2 + 8 &&
            player.vy > 0) {
          player.y = d.y - SZ/2 - player.h/2;
          player.vy = 0;
          player.onGround = true;
          player.jumpCount = 0;
        }
      } else {
        // Moving drop — world coords
        d.y += d.vy;

        // Despawn if falls far below road
        if (d.y > roadY + 80) {
          bossRainDrops.splice(i, 1);
          continue;
        }

        // Only draw if within visible vertical range
        const screenY = d.y - cameraY;
        if (screenY > -30 && screenY < H + 30) {
          const sx = Math.round(d.x - cameraX);
          ctx.save();
          if (d.type === 'diamond') {
            ctx.shadowColor = 'rgba(180,80,255,0.8)'; ctx.shadowBlur = 12;
          } else {
            ctx.shadowColor = 'rgba(80,160,255,0.6)'; ctx.shadowBlur = 8;
          }
          ctx.font = '26px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(d.type === 'diamond' ? '💎' : '💧', sx, Math.round(d.y));
          ctx.restore();
        }

        const hitR = d.type === 'diamond' ? 24 : 22;
        if (Math.abs(d.x - player.x) < hitR && Math.abs(d.y - player.y) < hitR) {
          if (d.type === 'diamond') {
            // 💎 damages player
            if (!player.invincible && !player.ghostMode) {
              bossRainDrops.splice(i, 1);
              handlePlayerDamage({ type: 'diamond', x: d.x, y: d.y });
              continue;
            }
          }
          // 💧 pass through — no damage
        }

        // Ice power freezes nearby 💧 (not 💎)
        if (d.type === 'water' && !d.frozen &&
            powerActive && currentPower === 'ice' &&
            Math.abs(d.x - player.x) < 110 && Math.abs(d.y - player.y) < 110) {
          d.frozen = true;
          d.vy = 0;
          playCoinSound();
        }
      }
    }

    // Atmospheric rain streaks (screen space — draw after ctx.restore in gameLoop)
  }

  // ── Victory when boss dead — check BEFORE early return ────────────
  if (!nightBoss && nightBossActive) {
    nightBossActive = false;
    bossDefeated = true;      // prevents arena re-triggering
    cameraY = 0;
    bossPhase2 = false;
    nightBossArena = false;
    bossRainDrops = [];
    enemies = enemies.filter(e => e.type !== 'alien');
    // Stop game loop immediately so arena can't re-spawn
    gameActive = false;
    if (gameLoopID) { cancelAnimationFrame(gameLoopID); gameLoopID = null; }
    setTimeout(() => { showBossComic(); }, 900);
    return;
  }

  if (!nightBoss) return;

  // ── Boss shoots aliens ────────────────────────────────────────────
  if (bossHitCooldown > 0) bossHitCooldown--;

  if (!coolFreezeActive) {
    nightBoss.shootTimer++;
    const shootRate = bossPhase2 ? 60 : 90;
  if (nightBoss.shootTimer >= shootRate) {
    nightBoss.shootTimer = 0;
    const dropEmoji = Math.random() > 0.5 ? '👾' : '👽';
    enemies.push({
      x: nightBoss.x + (Math.random()-0.5)*80,
      y: nightBoss.worldY + 50,
      vx: (Math.random()-0.5)*2,
      vy: 2.5,
      emoji: dropEmoji,
      type: 'alien',
      minX: nightBossArenaX + 30,
      maxX: nightBossArenaX + arenaW - 30,
      dropHeart: Math.random() < 0.25, // 25% chance to drop ❤️ on death
      onGround: false,
      frozen: false
    });
    try { const ac=getAC(); if(ac) sfxOsc('square',600,200,ac.currentTime,0.12,0.15); } catch(e){}
  }
  } // end !coolFreezeActive shooting block

  // ── Draw boss — world coords (ctx.translate in gameLoop shifts to screen) ─
  const bossScreenY = Math.round(nightBoss.worldY - cameraY); // for culling check
  const bossSize = bossPhase2 ? 95 : 70;
  if (bossScreenY > -100 && bossScreenY < H + 100) {
    ctx.save();
    ctx.shadowColor = bossPhase2 ? 'rgba(255,80,0,0.9)' : 'rgba(0,255,200,0.9)';
    ctx.shadowBlur = (bossPhase2 ? 40 : 28) + 14*Math.sin(Date.now()/200);
    const bx = Math.round(nightBoss.x - cameraX);
    ctx.font = `${bossSize}px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    // Draw at world y — ctx.translate shifts it to correct screen position
    ctx.fillText('🛸', bx, Math.round(nightBoss.worldY));
    ctx.restore();

    if (bossPhase2) {
      ctx.save();
      const vig = ctx.createRadialGradient(canvas.width/2, H/2 + cameraY, H*0.1,
                                            canvas.width/2, H/2 + cameraY, H*0.8);
      vig.addColorStop(0, 'transparent');
      vig.addColorStop(1, `rgba(200,0,0,${0.12 + 0.08*Math.sin(Date.now()/300)})`);
      ctx.fillStyle = vig;
      ctx.fillRect(0, cameraY, canvas.width, H); // cover visible area in world coords
      ctx.restore();
    }
  }

  // ── Boss health bar — always in screen space ──────────────────────
  const barW = canvas.width * 0.6, barH = 12;
  const bx0 = canvas.width/2 - barW/2;
  ctx.save();
  // Undo vertical camera translate so bar stays pinned at top of screen
  ctx.translate(0, cameraY);
  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.fillRect(bx0 - 1, 14, barW + 2, barH + 2);
  const hpRatio = nightBoss.health / nightBoss.maxHealth;
  const hpGrad = ctx.createLinearGradient(bx0, 0, bx0+barW, 0);
  if (hpRatio > 0.5) {
    hpGrad.addColorStop(0, '#00ffe0'); hpGrad.addColorStop(1, '#00c8ff');
  } else {
    hpGrad.addColorStop(0, '#ff4400'); hpGrad.addColorStop(0.5, '#ff8800'); hpGrad.addColorStop(1, '#ffcc00');
  }
  ctx.fillStyle = hpGrad;
  ctx.fillRect(bx0, 15, barW * hpRatio, barH);
  ctx.strokeStyle = hpRatio > 0.5 ? 'rgba(0,255,200,0.7)' : 'rgba(255,80,0,0.7)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(bx0-1, 14, barW+2, barH+2);
  ctx.fillStyle = 'white'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center';
  const phase2Label = bossPhase2 ? ' ⚡FASE 2' : '';
  ctx.fillText(`🛸 JEFE FINAL  ${nightBoss.health}/${nightBoss.maxHealth}${phase2Label}`, canvas.width/2, 12);
  ctx.restore();

  // ── Boss damage collision — world coords ──────────────────────────
  const hitDist = bossPhase2 ? 55 : 44;
  if (bossHitCooldown === 0 && !player.invincible &&
      Math.abs(nightBoss.x - player.x) < hitDist &&
      Math.abs(nightBoss.worldY - player.y) < hitDist) {

    // Powers that can hurt boss: angry, ice, fire, cowboy, eagle
    const canHit = (powerActive && (currentPower === 'angry' || currentPower === 'ice' || currentPower === 'fire')) ||
                   (purchasedAvatar === 'cowboy') ||
                   (purchasedAvatar === 'eagle');
    if (canHit) {
      nightBoss.bkickDir = player.x < nightBoss.x ? 1 : -1;
      hitNightBoss(1);
      bossHitCooldown = BOSS_HIT_COOLDOWN;
      // Push player away to prevent sticking
      player.vx = player.x < nightBoss.x ? -8 : 8;
      player.vy = -6;
      player.onGround = false;
    } else {
      handlePlayerDamage(nightBoss);
    }
  }

}

function hitNightBoss(dmg) {
  if (!nightBoss) return;
  nightBoss.health -= dmg;
  screenShake = 7; damageFlash = 8;
  playDamageSound();
  createExplosionEffect(nightBoss.x, nightBoss.worldY + 20, '💥');
  if (nightBoss.health <= 0) {
    createExplosionEffect(nightBoss.x, nightBoss.worldY,    '🛸');
    createExplosionEffect(nightBoss.x+40, nightBoss.worldY+30, '💥');
    createExplosionEffect(nightBoss.x-40, nightBoss.worldY+30, '💥');
    createExplosionEffect(nightBoss.x, nightBoss.worldY+60,   '✨');
    playExplosionSound();
    nightBoss = null;
    cameraY = 0;
  }
}

// ── Frozen enemies — frameless 🧊 emoji platforms ─────────────────
function drawFrozenEnemies() {
  const now = Date.now();
  const fireMelts = powerActive && currentPower === 'fire';
  const allowStep = !fireMelts; // fire cannot step on ice it melts

  for (let i = frozenEnemies.length - 1; i >= 0; i--) {
    const fe = frozenEnemies[i];

    // Fire near block → fast melt
    if (fireMelts && Math.abs(player.x - fe.x) < 90 && Math.abs(player.y - fe.y) < 90) {
      fe.expiresAt = Math.min(fe.expiresAt, now + 700);
    }

    if (now > fe.expiresAt) {
      // Evaporation effect on destroy
      if (!fe.vaporized) {
        fe.vaporized = true;
        createVaporEffect(fe.x, fe.y);
      }
      frozenEnemies.splice(i, 1);
      continue;
    }

    const drawX = Math.round(fe.x - cameraX);
    const drawY = Math.round(fe.y);
    const lifeRatio = Math.max(0, (fe.expiresAt - now) / 8000);
    const melting = fireMelts && Math.abs(player.x - fe.x) < 90 && Math.abs(player.y - fe.y) < 90;

    // Draw frameless 🧊 emoji — larger, with subtle ice shimmer glow
    ctx.save();
    ctx.globalAlpha = Math.max(0.2, lifeRatio * (melting ? 0.6 : 1));
    if (!melting) {
      ctx.shadowColor = 'rgba(100,230,255,0.75)';
      ctx.shadowBlur = 18;
    }
    ctx.font = '40px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(melting ? '💧' : '🧊', drawX, drawY);
    ctx.restore();

    // Animated drip when melting
    if (melting) {
      ctx.save();
      ctx.globalAlpha = 0.6 + 0.35 * Math.sin(now / 110);
      ctx.font = '14px serif';
      ctx.textAlign = 'center';
      ctx.fillText('💧', drawX + ((now / 60) % 14 - 7), drawY + 26 + ((now / 80) % 14));
      ctx.restore();
    }

    // Platform collision (22px half-size = approx emoji footprint)
    const HS = 22;
    if (allowStep &&
        player.x + player.w/2 > fe.x - HS &&
        player.x - player.w/2 < fe.x + HS &&
        player.y + player.h/2 > fe.y - HS &&
        player.y + player.h/2 < fe.y - HS + 8 &&
        player.vy > 0) {
      player.y = fe.y - HS - player.h/2;
      player.vy = 0;
      player.onGround = true;
      player.jumpCount = 0;
    }

    // Enemy contact → accelerate melt
    for (const e of enemies) {
      if (!e.frozen && Math.abs(e.x - fe.x) < 28 && Math.abs(e.y - fe.y) < 28) {
        if (!fe.vaporized) {
          fe.vaporized = true;
          createVaporEffect(fe.x, fe.y);
        }
        fe.expiresAt = Math.min(fe.expiresAt, now + 300);
      }
    }
  }
}

// Actualizar comportamiento de los enemigos del ovni (ahora solo aliens de tierra en noche)
function updateNightAliens() {
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    if (e.type !== 'alien' || e.frozen) continue;
    if (!e.onGround) {
      e.vy += 0.12;
      e.y += e.vy;
      if (e.y + 20 >= roadY) { e.y = roadY - 20; e.vy = 0; e.onGround = true; }
      // Also land on arena platforms (phase 1) 
      for (const p of bossArenaPlatforms) {
        if (e.x + 20 > p.x && e.x - 20 < p.x+p.w && e.y+20 > p.y - cameraY && e.y+20 < p.y - cameraY + p.h && e.vy > 0) {
          e.y = p.y - cameraY - 20; e.vy = 0; e.onGround = true;
        }
      }
      // In phase 2, remove aliens that fall off screen
      if (bossPhase2 && e.y - cameraY > canvas.height + 100) {
        enemies.splice(i, 1); continue;
      }
    } else {
      // Chase player
      const dx = player.x - e.x;
      if (Math.abs(dx) > 50) e.x += (dx > 0 ? 1.8 : -1.8);
      // In phase 2, enemy can fall off platforms
      if (bossPhase2) { e.onGround = false; }
    }

    // Ice power freezes alien → becomes platform (frozenEnemies list)
    if (powerActive && currentPower === 'ice' &&
        Math.abs(e.x - player.x) < 80 && Math.abs(e.y - cameraY - player.y) < 80) {
      frozenEnemies.push({ x: e.x, y: e.onGround ? e.y - 4 : e.y, expiresAt: Date.now() + 8000 });
      enemies.splice(i, 1);
      playCoinSound();
      continue;
    }
  }
}

// Handle player damage from collisions
function handlePlayerDamage(source) {
  // Helicopter and night boss cannot be destroyed by eagle
  if (source.type === 'helicopter' || source.type === 'nightboss') {
    // Just do standard damage
  } else if (purchasedAvatar === 'eagle' && 
      (source.type === 'enemy' || source.type === 'car' || source.type === 'alien' || 
       source.type === 'sun' || source.type === 'ufo' || source.type === 'animal' || source.type === 'flying') && 
      source.emoji !== '🌵') {
    createExplosionEffect(source.x, source.y, source.emoji);
    playEnemyDefeatSound();
    if (source.type === 'enemy' || source.type === 'alien' || source.type === 'flying') {
      const index = enemies.indexOf(source);
      if (index !== -1) enemies.splice(index, 1);
    } else if (source.type === 'animal') {
      const index = animals.indexOf(source);
      if (index !== -1) animals.splice(index, 1);
    } else if (source.type === 'car') {
      const index = cars.indexOf(source);
      if (index !== -1) cars.splice(index, 1);
    } else if (source.type === 'sun') {
      sunEnemy = null;
      sunDefeated = true;
    } else if (source.type === 'ufo') {
      ufo = null;
    }
    return;
  }
  
  if (powerActive && currentPower === 'fire') {
    if (source.type === 'enemy' || source.type === 'flying' || source.type === 'alien' ||
        source.type === 'cactus' || source.type === 'car' || source.type === 'animal') {
      source.burning = true;
      source.emoji = '🔥';
      
      setTimeout(() => {
        if (source.type === 'enemy' || source.type === 'flying' || source.type === 'alien') {
          const index = enemies.indexOf(source);
          if (index !== -1) {
            enemies.splice(index, 1);
            if (source.dropHeart) createHeartDrop(source.x, source.y);
          }
        } else if (source.type === 'animal') {
          const index = animals.indexOf(source);
          if (index !== -1) {
            animals.splice(index, 1);
            if (source.dropHeart) createHeartDrop(source.x, source.y);
          }
        } else if (source.type === 'cactus') {
          const index = obstacles.indexOf(source);
          if (index !== -1) {
            obstacles.splice(index, 1);
            if (source.dropHeart) createHeartDrop(source.x, source.y);
          }
        } else if (source.type === 'car') {
          const index = cars.indexOf(source);
          if (index !== -1) {
            cars.splice(index, 1);
            if (source.dropHeart) createHeartDrop(source.x, source.y);
          }
        }
      }, 500);
      return;
    }
  }
  
  if (powerActive && currentPower === 'ice') {
    const freezable = ['enemy','alien','flying','animal','cactus','car'];
    if (freezable.includes(source.type)) {
      source.frozen = true;
      source.originalEmoji = source.emoji;
      source.emoji = '🧊';
      source.vx = 0;
      source.vy = 0;

      // In the boss arena, alien blocks become ice platforms (handled in drawEnemies)
      setTimeout(() => {
        if (source.type === 'enemy' || source.type === 'alien' || source.type === 'flying') {
          const index = enemies.indexOf(source);
          if (index !== -1) { enemies.splice(index, 1); if (source.dropHeart) createHeartDrop(source.x, source.y); }
        } else if (source.type === 'animal') {
          const index = animals.indexOf(source);
          if (index !== -1) { animals.splice(index, 1); if (source.dropHeart) createHeartDrop(source.x, source.y); }
        } else if (source.type === 'cactus') {
          const index = obstacles.indexOf(source);
          if (index !== -1) { obstacles.splice(index, 1); if (source.dropHeart) createHeartDrop(source.x, source.y); }
        } else if (source.type === 'car') {
          const index = cars.indexOf(source);
          if (index !== -1) { cars.splice(index, 1); if (source.dropHeart) createHeartDrop(source.x, source.y); }
        }
      }, 1800);
      return;
    }
  }
  
  if (powerActive && currentPower === 'angry') {
    if (source.type === 'enemy' || source.type === 'alien' || source.type === 'cactus' || source.type === 'car') {
      createExplosionEffect(source.x, source.y, source.emoji);
      playEnemyDefeatSound();
      if (source.type === 'enemy' || source.type === 'alien') {
        const index = enemies.indexOf(source);
        if (index !== -1) { enemies.splice(index, 1); if (source.dropHeart) createHeartDrop(source.x, source.y); }
      } else if (source.type === 'cactus') {
        const index = obstacles.indexOf(source);
        if (index !== -1) { obstacles.splice(index, 1); if (source.dropHeart) createHeartDrop(source.x, source.y); }
      } else if (source.type === 'car') {
        const index = cars.indexOf(source);
        if (index !== -1) { cars.splice(index, 1); if (source.dropHeart) createHeartDrop(source.x, source.y); }
      }
      return;
    }
  }
  
  if (powerActive && currentPower === 'cool') {
    if (source.type === 'sun') {
      return;
    }
  }
  
  if (player.angryAura) {
    if (source.type === 'enemy' || source.type === 'alien' || source.type === 'cactus' || source.type === 'car') {
      createExplosionEffect(source.x, source.y, source.emoji);
      playEnemyDefeatSound();
      if (source.type === 'enemy' || source.type === 'alien') {
        const index = enemies.indexOf(source);
        if (index !== -1) { enemies.splice(index, 1); if (source.dropHeart) createHeartDrop(source.x, source.y); }
      } else if (source.type === 'cactus') {
        const index = obstacles.indexOf(source);
        if (index !== -1) { obstacles.splice(index, 1); if (source.dropHeart) createHeartDrop(source.x, source.y); }
      } else if (source.type === 'car') {
        const index = cars.indexOf(source);
        if (index !== -1) { cars.splice(index, 1); if (source.dropHeart) createHeartDrop(source.x, source.y); }
      }
      return;
    }
  }
  
  // ── Reinforced hearts absorb damage first ────────────────────────
  if (reinforcedHearts > 0) {
    reinforcedHearts--;
    updateHearts();
    // Only deactivate avatar if elven powers are NOT active
    if (reinforcedHearts <= 0 && !elvenPowersActive && !ngPlusMode) {
      deactivateAvatar();
    } else if (reinforcedHearts <= 0 && elvenPowersActive) {
      // Refill to 1 so the player stays alive; elven grants toughness
      reinforcedHearts = 1;
      updateHearts();
    }
  } else {
    player.health--;
    updateHearts();
  }
  
  // === DAMAGE EFFECTS ===
  playDamageSound();
  screenShake = 10;
  damageFlash = 12;
  heartsDisplay.classList.remove('damage-shake');
  void heartsDisplay.offsetWidth;
  heartsDisplay.classList.add('damage-shake');
  
  player.invincible = true;
  player.invincibleTimer = 60;
  
  player.emoji = '😵‍💫';
  
  clearTimeout(damageEmojiTimeout);
  damageEmojiTimeout = setTimeout(() => {
    if (player.alive) {
      if (powerActive) {
        player.emoji = getPowerEmoji(currentPower);
      } else {
        player.emoji = player.baseEmoji;
      }
    }
  }, 1000);
  
  if (player.health <= 0) {
    player.alive = false;
    gameOver();
  }
}

// Ice vapor evaporation — upward-drifting steam particles
function createVaporEffect(x, y) {
  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI/2 + (Math.random()-0.5) * Math.PI * 0.9;
    const spd = 0.8 + Math.random() * 2.2;
    const life = 28 + Math.floor(Math.random() * 22);
    particles.push({
      x: x + (Math.random()-0.5)*28,
      y: y + (Math.random()-0.5)*14,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd - 1.2,
      emoji: '💨', size: 14 + Math.random() * 16,
      life, maxLife: life,
      vapor: true
    });
  }
  // A few ice shards
  for (let i = 0; i < 5; i++) {
    const angle = Math.random() * Math.PI * 2;
    const spd = 1.5 + Math.random() * 3;
    const life = 16 + Math.floor(Math.random() * 14);
    particles.push({
      x, y,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd - 2,
      emoji: '❄️', size: 10 + Math.random() * 10,
      life, maxLife: life
    });
  }
}

// Create explosion particle effect
function createExplosionEffect(x, y, emoji) {
  if (particles.length > 50) return; // don't spawn if already many particles
  const count = Math.min(5, 60 - particles.length);
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const spd = 2 + Math.random() * 4;
    const life = 18 + Math.floor(Math.random() * 16);
    particles.push({
      x, y,
      vx: Math.cos(angle) * spd * (0.5 + Math.random()),
      vy: Math.sin(angle) * spd * (0.5 + Math.random()) - 1.5,
      emoji, size: 12 + Math.random() * 14,
      life, maxLife: life
    });
  }
  if (particles.length < 55) {
    for (let i = 0; i < 2; i++) {
      const life2 = 12 + Math.floor(Math.random() * 10);
      particles.push({
        x: x + (Math.random()-0.5)*16, y: y + (Math.random()-0.5)*16,
        vx: (Math.random()-0.5)*3, vy: -1.5 - Math.random()*2.5,
        emoji: '✨', size: 9 + Math.random()*9,
        life: life2, maxLife: life2
      });
    }
  }
}

// Create a heart that the player can pick up
function createHeartDrop(x, y) {
  heartDrops.push({ x: x, y: y, w: 30, h: 30, vy: -1 });
}

// ══════════════════════════════════════════════════════════════════
//  LEVEL 2 — BOSQUE OSCURO: drawing functions
// ══════════════════════════════════════════════════════════════════

function drawTrail() {
  const W = canvas.width * 1.5;

  // ── Undergrowth strip ───────────────────────────────────────────
  const grassGrad = ctx.createLinearGradient(0, trailY - 22, 0, trailY + 8);
  grassGrad.addColorStop(0, '#1a4a1a');
  grassGrad.addColorStop(0.5,'#143a14');
  grassGrad.addColorStop(1, '#0d2a0d');
  ctx.fillStyle = grassGrad;
  ctx.fillRect(0, trailY - 22, W, 28);

  // Grass blades
  ctx.strokeStyle = '#1e5a1e';
  ctx.lineWidth = 1.2;
  for (let bx = 0; bx < W; bx += 9) {
    const bxOff = bx - (cameraX * 0.002 | 0) % 9;
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.moveTo(bxOff, trailY - 22);
    ctx.lineTo(bxOff + 2, trailY - 32 - (bx % 7));
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // ── Trail dirt path ─────────────────────────────────────────────
  const dirtGrad = ctx.createLinearGradient(0, trailY, 0, trailY + 65);
  dirtGrad.addColorStop(0,   '#5d4037');
  dirtGrad.addColorStop(0.3, '#4e342e');
  dirtGrad.addColorStop(1,   '#3e2723');
  ctx.fillStyle = dirtGrad;
  ctx.fillRect(0, trailY, W, 65);

  // Dirt texture patches
  ctx.globalAlpha = 0.08;
  for (let px = 0; px < W; px += 50) {
    const pOff = px - ((cameraX * 0.4) | 0) % 50;
    ctx.fillStyle = (px / 50) % 2 === 0 ? '#8d6e63' : '#3e2723';
    ctx.fillRect(pOff, trailY, 50, 65);
  }
  ctx.globalAlpha = 1;

  // Footprint marks (animated)
  trailOffset = (trailOffset + (player.vx || 0) * 0.12) % 80;
  ctx.fillStyle = 'rgba(62,39,35,0.6)';
  for (let i = -80; i < W; i += 80) {
    const tx = i + trailOffset;
    ctx.beginPath();
    ctx.ellipse(tx, trailY + 28, 6, 3, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(tx + 12, trailY + 38, 6, 3, -0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Holes
  for (let hole of holes) {
    const drawX = Math.round(hole.x - cameraX);
    if (drawX > -50 && drawX < W + 50) {
      ctx.fillStyle = '#1a0d00';
      ctx.beginPath();
      ctx.ellipse(drawX, trailY + 30, 20, 12, 0, 0, Math.PI*2);
      ctx.fill();
      drawEmoji(hole.x, trailY + 30, '🕳️', 30);
    }
  }

  // Star pickup
  if (star) { star.rotation += 0.1; drawEmoji(star.x, star.y, '🌟', 40, star.rotation); }
  if (storeEmoji) drawEmoji(storeEmoji.x, storeEmoji.y, '⛺', 50, 0);
  if (flag) drawEmoji(flag.x, flag.y, '🏁', 60);
}

function drawPlatformsLevel2() {
  for (let p of platforms) {
    const drawX = Math.round(p.x - cameraX);
    const drawY = Math.round(p.y);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(drawX + 4, drawY + 6, p.w, p.h);

    // Dirt body
    const platGrad = ctx.createLinearGradient(0, drawY, 0, drawY + p.h);
    platGrad.addColorStop(0, '#6d4c41');
    platGrad.addColorStop(1, '#4e342e');
    ctx.fillStyle = platGrad;
    ctx.fillRect(drawX, drawY, p.w, p.h);

    // Mossy top
    const mossGrad = ctx.createLinearGradient(0, drawY, 0, drawY + 8);
    mossGrad.addColorStop(0, '#2e7d32');
    mossGrad.addColorStop(1, '#1b5e20');
    ctx.fillStyle = mossGrad;
    ctx.fillRect(drawX, drawY, p.w, 8);

    // Bark line texture
    ctx.fillStyle = 'rgba(78,52,46,0.45)';
    for (let xi = 0; xi < p.w; xi += 18) {
      ctx.fillRect(drawX + xi, drawY + 8, 9, p.h - 8);
    }

    // Root connector (if platform is elevated)
    if (drawY + p.h < trailY - 2) {
      ctx.fillStyle = 'rgba(62,39,35,0.5)';
      ctx.fillRect(drawX + p.w/2 - 4, drawY + p.h, 8, trailY - (drawY + p.h));
    }
  }
}

function drawTrees() {
  for (let tree of trees) {
    const drawX = Math.round(tree.x - cameraX);
    if (drawX < -100 || drawX > canvas.width + 100) continue;

    if (tree.isFern) {
      // 🪾 fern — smaller, ground-level decoration
      ctx.save();
      ctx.shadowColor = '#2e7d32'; ctx.shadowBlur = 10;
      ctx.font = '38px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('🪾', drawX, trailY - 22);
      ctx.restore();
      continue;
    }

    // Trunk
    ctx.fillStyle = '#4e342e';
    ctx.fillRect(drawX - 6, trailY - 55, 12, 55);
    // Glow behind canopy
    ctx.save();
    ctx.shadowColor = '#1b5e20'; ctx.shadowBlur = 18;
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = '#1b5e20';
    ctx.beginPath(); ctx.arc(drawX, trailY - 80, 36, 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
    // Tree emoji
    drawEmoji(tree.x, trailY - 55, '🌳', 60);
    // 🦉 perched on the tree (decorative, no collision)
    if (tree.hasOwl) {
      drawEmoji(tree.x + 22, trailY - 88, '🦉', 24);
    }
  }
}

function drawAnimals() {
  for (let i = animals.length - 1; i >= 0; i--) {
    const animal = animals[i];
    const drawX = Math.round(animal.x - cameraX);
    if (drawX < -80 || drawX > canvas.width + 80) continue;

    // Frozen by ice power
    if (animal.frozen) {
      ctx.save();
      ctx.shadowColor = 'rgba(100,230,255,0.75)'; ctx.shadowBlur = 18;
      ctx.font = '40px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('🧊', drawX, animal.y); ctx.restore();
      continue;
    }

    const size  = animal.type === 'troll' ? 55 : 38;
    const range = animal.type === 'troll' ? 42 : 28;

    // Movement — patrolling terrestrials (skip if static or troll)
    if (!animal.static && animal.type !== 'troll') {
      if (!animal.initialized) {
        animal.minX = animal.x - 60;
        animal.maxX = animal.x + 60;
        animal.vx = (Math.random() < 0.5 ? -0.8 : 0.8);
        animal.initialized = true;
      }
      if (!coolFreezeActive) {
        animal.x += animal.vx;
        if (animal.x < animal.minX || animal.x > animal.maxX) animal.vx *= -1;
      }
    }

    // Subtle eye glow for hostile terrestrials (not troll — they have their own look)
    if (animal.type !== 'troll') {
      ctx.save();
      ctx.shadowColor = 'rgba(255,80,0,0.7)'; ctx.shadowBlur = 10;
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = '#ff3300';
      ctx.beginPath(); ctx.arc(drawX - 5, animal.y - 16, 3, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(drawX + 5, animal.y - 16, 3, 0, Math.PI*2); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    // Troll special glow: green-brown
    if (animal.type === 'troll') {
      ctx.save();
      ctx.shadowColor = 'rgba(80,160,0,0.6)'; ctx.shadowBlur = 22;
      drawEmoji(animal.x, animal.y, animal.emoji, size);
      ctx.restore();
    } else {
      drawEmoji(animal.x, animal.y, animal.emoji, size);
    }

    // Power-based damage to animals
    if (powerActive && currentPower !== 'ghost' && currentPower !== 'cool') {
      const pRange = size + 20;
      if (Math.abs(animal.x - player.x) < pRange && Math.abs(animal.y - player.y) < pRange) {
        if (currentPower === 'ice') {
          animal.frozen = true;
          animals.splice(i, 1);
          frozenEnemies.push({ x: animal.x, y: animal.y, expiresAt: Date.now() + 8000, vaporized: false });
          if (animal.dropHeart) createHeartDrop(animal.x, animal.y);
          createExplosionEffect(animal.x, animal.y, '🧊');
        } else {
          animals.splice(i, 1);
          if (animal.dropHeart) createHeartDrop(animal.x, animal.y);
          createExplosionEffect(animal.x, animal.y, animal.emoji);
        }
        continue;
      }
    }

    // Player contact damage
    if (!player.invincible && !player.ghostMode &&
        Math.abs(animal.x - player.x) < range && Math.abs(animal.y - player.y) < range) {
      handlePlayerDamage(animal);
    }
  }
}

function drawEnemiesLevel2() {
  // ── Moving enemies ────────────────────────────────────────────────
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    if (e.burning) { drawEmoji(e.x, e.y, '🔥', 40); continue; }
    if (e.frozen) {
      const fx = Math.round(e.x - cameraX);
      ctx.save();
      ctx.shadowColor = 'rgba(100,230,255,0.75)'; ctx.shadowBlur = 18;
      ctx.font = '40px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('🧊', fx, e.y); ctx.restore();
      continue;
    }

    if (!coolFreezeActive) {
      e.x += e.vx;
      if (e.x < e.minX || e.x > e.maxX) e.vx *= -1;

      if (e.type === 'flying') {
        // Bat: sinusoidal vertical wobble
        e._t = (e._t || 0) + 0.04;
        e.y = e._baseY !== undefined ? e._baseY + Math.sin(e._t) * 18 : e.y;
        if (e._baseY === undefined) { e._baseY = e.y; e._t = Math.random() * Math.PI * 2; }
      } else if (e.type === 'ghost') {
        // Ghosts/robots: gentle vertical float
        e._t = (e._t || 0) + 0.06;
        const baseY = e._baseY !== undefined ? e._baseY : e.y;
        if (e._baseY === undefined) { e._baseY = e.y; e._t = Math.random() * Math.PI * 2; }
        e.y = e._baseY + Math.sin(e._t) * 10;
      }
    }

    // Glow
    let glowCol = 'rgba(180,0,255,0.6)';
    if (e.emoji === '🤖') glowCol = 'rgba(0,200,255,0.7)';
    if (e.emoji === '👾') glowCol = 'rgba(140,0,220,0.8)';
    if (e.emoji === '👻') glowCol = 'rgba(220,220,255,0.7)';
    if (e.type  === 'flying') glowCol = 'rgba(80,0,80,0.8)';
    drawEmoji(e.x, e.y, e.emoji, e.type === 'flying' ? 32 : 40, 0, glowCol);

    // Power contact damage
    if (powerActive && currentPower !== 'ghost' && currentPower !== 'cool') {
      const pRange = 55;
      if (Math.abs(e.x - player.x) < pRange && Math.abs(e.y - player.y) < pRange) {
        if (currentPower === 'ice') {
          e.frozen = true;
          enemies.splice(i, 1);
          frozenEnemies.push({ x: e.x, y: e.y, expiresAt: Date.now() + 8000, vaporized: false });
          if (e.dropHeart) createHeartDrop(e.x, e.y);
          createExplosionEffect(e.x, e.y, '🧊');
          continue;
        } else {
          enemies.splice(i, 1);
          if (e.dropHeart) createHeartDrop(e.x, e.y);
          createExplosionEffect(e.x, e.y, e.emoji);
          continue;
        }
      }
    }

    // Player contact damage
    const hitRange = e.type === 'flying' ? 24 : 30;
    if (!player.invincible && !player.ghostMode &&
        Math.abs(e.x - player.x) < hitRange && Math.abs(e.y - player.y) < hitRange) {
      handlePlayerDamage(e);
    }
  }

  // ── Obstacles in level 2 ────────────────────────────────────────
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const obs = obstacles[i];
    if (obs.burning) { drawEmoji(obs.x, obs.y, '🔥', 40); continue; }
    drawEmoji(obs.x, obs.y, obs.emoji, 36);
    if (!player.invincible && !player.ghostMode &&
        Math.abs(obs.x - player.x) < 26 && Math.abs(obs.y - player.y) < 26) {
      handlePlayerDamage(obs);
    }
  }

  // ── BOSS 2 spawn ──────────────────────────────────────────────────
  if (!boss && !bossActive && player.x > LEVEL2_LENGTH * 0.55) {
    boss2ArenaX = player.x - 40;
    boss = {
      x: player.x + 500, y: trailY - 40,
      w: 80, h: 80,
      health: 20, maxHealth: 20,
      jumpTimer: 0, jumping: false, jumpPower: -14,
      vx: 0, vy: 0, emoji: '🗿',
      hitCooldown: 0
    };
    bossActive = true;
    boss2Phase = 1; boss2Frozen = false; boss2FrozenTimer = 0;
    boss2Aura = null; boss2AuraTimer = 0;
    boss2IceBarrier = null; boss2BarrierPhase = false; boss2RegenTimer = 0;
    enemies = []; obstacles = [];
    asteroids = []; asteroidSpawnTimer = 99999; // stop meteorites
    if (!boss2DialogShown) { boss2DialogShown = true; showBoss2Dialog(); }
    try {
      const ac = getAC(); if (ac) {
        const t = ac.currentTime;
        [0, 0.15, 0.30].forEach((d, i) => sfxOsc('sawtooth', 80 - i*15, 20, t+d, 0.4, 0.35));
      }
    } catch(e2) {}
  }

  if (!boss) return;
  if (boss2DialogActive) return;

  if (boss2ArenaX > 0) {
    const leftWallX  = boss2ArenaX;
    const rightWallX = boss2ArenaX + canvas.width * 1.8; // wide enough
    const H = canvas.height;

    // Enforce left boundary
    if (player.x - player.w/2 < leftWallX) {
      player.x = leftWallX + player.w/2 + 1;
      if (player.vx < 0) player.vx = 0;
    }
    // Enforce right boundary (only while boss alive)
    if (boss && player.x + player.w/2 > rightWallX) {
      player.x = rightWallX - player.w/2 - 1;
      if (player.vx > 0) player.vx = 0;
    }

    // Draw left wall
    const lwx = Math.round(leftWallX - cameraX);
    ctx.save();
    const lwGrad = ctx.createLinearGradient(lwx - 28, 0, lwx, 0);
    lwGrad.addColorStop(0, 'rgba(60,0,160,0)');
    lwGrad.addColorStop(1, 'rgba(110,0,220,0.92)');
    ctx.fillStyle = lwGrad;
    ctx.fillRect(lwx - 28, 0, 28, H);
    ctx.strokeStyle = 'rgba(160,60,255,0.9)';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#9b30ff'; ctx.shadowBlur = 16;
    ctx.beginPath(); ctx.moveTo(lwx, 0); ctx.lineTo(lwx, H); ctx.stroke();
    // Rune marks
    ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(200,120,255,0.35)';
    ctx.font = '18px serif';
    for (let yi = 30; yi < H - 20; yi += 60) ctx.fillText('🔮', lwx - 14, yi);
    ctx.restore();

    // Draw right wall (only while boss alive — disappears on death)
    if (boss) {
      const rwx = Math.round(rightWallX - cameraX);
      ctx.save();
      const rwGrad = ctx.createLinearGradient(rwx, 0, rwx + 28, 0);
      rwGrad.addColorStop(0, 'rgba(110,0,220,0.92)');
      rwGrad.addColorStop(1, 'rgba(60,0,160,0)');
      ctx.fillStyle = rwGrad;
      ctx.fillRect(rwx, 0, 28, H);
      ctx.strokeStyle = 'rgba(160,60,255,0.9)';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#9b30ff'; ctx.shadowBlur = 16;
      ctx.beginPath(); ctx.moveTo(rwx, 0); ctx.lineTo(rwx, H); ctx.stroke();
      ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(200,120,255,0.35)';
      ctx.font = '18px serif';
      for (let yi = 30; yi < H - 20; yi += 60) ctx.fillText('🔮', rwx + 4, yi);
      ctx.restore();
    }
  }

  // ── Phase 1 → 2 transition at exactly 50% ───────────────────────
  if (boss2Phase === 1 && boss.health <= boss.maxHealth * 0.5 && !boss2BarrierPhase) {
    boss2Phase = 2;
    boss2BarrierPhase = true;
    boss2RegenTimer = 0;
    // Barrier spawns centered between player and boss
    boss2IceBarrier = {
      x: player.x + (boss.x - player.x) * 0.5,
      y: trailY,
      w: 55, h: canvas.height * 0.85, // full column
      hp: 4
    };
    boss2Aura = Math.random() < 0.5 ? 'fire' : 'ice';
    boss2AuraTimer = 300;
    screenShake = 18;
    createExplosionEffect(boss.x, boss.y, '⚡');
    createExplosionEffect(boss2IceBarrier.x, boss2IceBarrier.y - boss2IceBarrier.h/2, '🧊');
    try {
      const ac = getAC(); if (ac) {
        sfxOsc('sawtooth', 55, 35, ac.currentTime, 0.6, 0.5);
        sfxOsc('square', 110, 60, ac.currentTime+0.3, 0.4, 0.4);
      }
    } catch(e) {}
  }

  // ── Boss regenerates while barrier is up ─────────────────────────
  if (boss2BarrierPhase && boss2IceBarrier) {
    boss2RegenTimer++;
    // Regen 1 hp every 3 seconds (180 frames), up to 50% max
    if (boss2RegenTimer % 180 === 0 && boss.health < boss.maxHealth * 0.5) {
      boss.health++;
      createExplosionEffect(boss.x, boss.y - 30, '💚');
    }
  }
  // Barrier destroyed → stop regen
  if (boss2BarrierPhase && !boss2IceBarrier) {
    boss2BarrierPhase = false;
    boss2RegenTimer = 0;
  }

  // ── Phase 2: aura rotates every ~5s ─────────────────────────────
  if (boss2Phase === 2) {
    boss2AuraTimer--;
    if (boss2AuraTimer <= 0) {
      boss2Aura = boss2Aura === 'fire' ? 'ice' : 'fire';
      boss2AuraTimer = 240 + Math.floor(Math.random() * 120);
    }
  }

  // ── Boss frozen countdown ────────────────────────────────────────
  if (boss2Frozen) {
    boss2FrozenTimer--;
    if (boss2FrozenTimer <= 0) boss2Frozen = false;
  }

  // ── Boss movement — paused while barrier phase is active ─────────
  const bossMovePaused = boss2BarrierPhase || boss2Frozen || coolFreezeActive;
  if (!bossMovePaused) {
    if (!boss.jumping) {
      boss.jumpTimer++;
      if (boss.jumpTimer > 90) {
        boss.jumping = true;
        boss.vy = boss.jumpPower;
        boss.vx = (player.x - boss.x) / 50;
        playJumpSound();
      }
    } else {
      boss.vy += gravity;
      boss.y += boss.vy;
      boss.x += boss.vx;
      if (boss.y + boss.h / 2 >= trailY) {
        boss.y = trailY - boss.h / 2;
        boss.vy = 0; boss.jumping = false; boss.jumpTimer = 0;
        screenShake = 6;
        playLandSound();
      }
    }
  }

  // ── Draw ice column barrier ──────────────────────────────────────
  if (boss2IceBarrier) {
    const bib = boss2IceBarrier;
    const bx  = Math.round(bib.x - cameraX);
    const topY = bib.y - bib.h;

    ctx.save();
    // Background frost fill
    const iceGrad = ctx.createLinearGradient(bx - bib.w/2, 0, bx + bib.w/2, 0);
    iceGrad.addColorStop(0,   'rgba(150,220,255,0.25)');
    iceGrad.addColorStop(0.5, 'rgba(200,245,255,0.55)');
    iceGrad.addColorStop(1,   'rgba(150,220,255,0.25)');
    ctx.fillStyle = iceGrad;
    ctx.fillRect(bx - bib.w/2, topY, bib.w, bib.h);

    // Glowing border
    ctx.strokeStyle = 'rgba(0,210,255,0.95)';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#00cfff';
    ctx.shadowBlur = 22 + 8 * Math.sin(Date.now() / 200);
    ctx.strokeRect(bx - bib.w/2, topY, bib.w, bib.h);

    // Ice emoji stack down the column
    ctx.font = '26px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowBlur = 14;
    for (let yi = topY + 24; yi < bib.y - 10; yi += 44) {
      ctx.fillText('🧊', bx, yi);
    }

    // HP and hint label
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(`${bib.hp} golpes 🤜🔥`, bx, topY - 14);

    // Boss regen pulse indicator
    if (boss2BarrierPhase) {
      ctx.fillStyle = `rgba(80,255,120,${0.4 + 0.3*Math.sin(Date.now()/300)})`;
      ctx.font = '14px serif';
      ctx.fillText('💚 regenerando...', bx, topY - 30);
    }
    ctx.restore();

    // ── Collision: block player passage ─────────────────────────────
    const ibx = bib.x, ibw = bib.w / 2;
    // Top surface (player can land on top, but column reaches sky so they can't)
    if (player.x + player.w/2 > ibx - ibw - 4 && player.x - player.w/2 < ibx - ibw + 8 &&
        player.y + player.h/2 > topY) {
      player.x = ibx - ibw - player.w/2 - 1;
      if (player.vx > 0) player.vx = 0;
    }
    if (player.x - player.w/2 < ibx + ibw + 4 && player.x + player.w/2 > ibx + ibw - 8 &&
        player.y + player.h/2 > topY) {
      player.x = ibx + ibw + player.w/2 + 1;
      if (player.vx < 0) player.vx = 0;
    }
  }

  // ── Boss draw ────────────────────────────────────────────────────
  const bx = Math.round(boss.x - cameraX);
  ctx.save();
  if (boss2Frozen) {
    ctx.shadowColor = 'rgba(0,200,255,0.95)'; ctx.shadowBlur = 32;
    ctx.globalAlpha = 0.88;
  } else if (boss2Phase === 2) {
    const auraColor = boss2Aura === 'fire' ? 'rgba(255,100,0,0.95)' : 'rgba(0,160,255,0.95)';
    ctx.shadowColor = auraColor;
    ctx.shadowBlur = 30 + 14 * Math.sin(Date.now() / 170);
  } else if (boss2BarrierPhase) {
    // Regen glow: green pulse
    ctx.shadowColor = `rgba(50,255,100,${0.5 + 0.4*Math.sin(Date.now()/220)})`;
    ctx.shadowBlur = 24;
  } else {
    ctx.shadowColor = 'rgba(180,80,255,0.85)'; ctx.shadowBlur = 18;
  }
  ctx.font = '80px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(boss2Frozen ? '🧊' : boss.emoji, bx, boss.y);
  ctx.restore();

  // ── Boss health bar ───────────────────────────────────────────────
  const barW = canvas.width * 0.6, barH = 14;
  const bx0 = canvas.width / 2 - barW / 2;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.78)';
  ctx.fillRect(bx0 - 1, 26, barW + 2, barH + 2);
  const bHpRatio = Math.max(0, boss.health / boss.maxHealth);
  const hpGrad = ctx.createLinearGradient(bx0, 0, bx0 + barW, 0);
  if (boss2BarrierPhase) {
    hpGrad.addColorStop(0, '#00cc44'); hpGrad.addColorStop(1, '#88ff55');
  } else if (boss2Phase === 1) {
    hpGrad.addColorStop(0, '#c850ff'); hpGrad.addColorStop(1, '#7b2ff7');
  } else if (boss2Aura === 'fire') {
    hpGrad.addColorStop(0, '#ff4400'); hpGrad.addColorStop(1, '#ffcc00');
  } else {
    hpGrad.addColorStop(0, '#00cfff'); hpGrad.addColorStop(1, '#0066ff');
  }
  ctx.fillStyle = hpGrad;
  ctx.fillRect(bx0, 27, barW * bHpRatio, barH);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = boss2BarrierPhase ? 'rgba(80,255,100,0.7)' : boss2Phase === 2
    ? (boss2Aura === 'fire' ? 'rgba(255,80,0,0.7)' : 'rgba(0,200,255,0.7)')
    : 'rgba(200,80,255,0.7)';
  ctx.strokeRect(bx0 - 1, 26, barW + 2, barH + 2);
  ctx.fillStyle = 'white'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center';
  let phaseLabel;
  if (boss2BarrierPhase)       phaseLabel = ' 🧊 ¡Rompe la columna! 🤜🔥';
  else if (boss2Phase === 1)   phaseLabel = ' ❄️ Congela → golpea 🔥 ó 😡';
  else if (boss2Aura==='fire') phaseLabel = ' 🔴 USA 🥶 HIELO';
  else                         phaseLabel = ' 🔵 USA 🔥 FUEGO';
  ctx.fillText(`🗿 JEFE FINAL  ${boss.health}/${boss.maxHealth}${phaseLabel}`, canvas.width / 2, 24);
  ctx.restore();

  // ── Boss contact damage ───────────────────────────────────────────
  if (boss.hitCooldown > 0) boss.hitCooldown--;
  else if (!player.invincible && !player.ghostMode &&
           Math.abs(boss.x - player.x) < 60 && Math.abs(boss.y - player.y) < 70) {
    handlePlayerDamage(boss);
  }

  // ── Boss death ────────────────────────────────────────────────────
  if (boss.health <= 0) {
    for (let k = 0; k < 5; k++) {
      const angle = (k / 5) * Math.PI * 2;
      createExplosionEffect(boss.x + Math.cos(angle)*50, boss.y + Math.sin(angle)*40, k%2===0?'💥':'✨');
    }
    playExplosionSound();
    boss = null; bossActive = false;
    gameActive = false;
    if (gameLoopID) { cancelAnimationFrame(gameLoopID); gameLoopID = null; }
    setTimeout(() => showEndingDialog(), 900);
  }
}

// ── Boss 2 arrival dialogue ──────────────────────────────────────────
function showBoss2Dialog() {
  boss2DialogActive = true;
  gameActive = false;
  if (gameLoopID) { cancelAnimationFrame(gameLoopID); gameLoopID = null; }
  if (gameTimerInterval) { clearInterval(gameTimerInterval); gameTimerInterval = null; }

  const overlay = document.getElementById('boss2-dialog');
  const content = document.getElementById('b2d-content');
  const hint    = document.getElementById('b2d-hint');
  overlay.style.display = 'flex';

  const lines = [
    { speaker:'🛸', name:'NAVE ENEMIGA', color:'#c040ff',
      text:'¡JA JA JA! ¡He robado los poderes de todos los emojis! 😤 ¡Ahora el jefe del bosque te aplastará con ellos!' },
    { speaker:'😊', name:'TÚ', color:'#0090ff',
      text:'¡No puede ser... sin poderes no tengo chance...!' },
    { speaker:'🧝🏻', name:'🧝🏻 ELF MÁGICO', color:'#00cc66',
      text:'¡ALTO! ¡La magia élfica no puede ser robada tan fácil! Yo fui liberado... ¡y devuelvo todos los poderes! ✨🔥🥶😡😎🫥😁🤜🏻' },
    { speaker:'😊', name:'TÚ', color:'#0090ff',
      text:'¡Los siento... todos activos! ¡Sin límite! ¡Voy a por ti, 🗿!' },
  ];

  let step = 0;
  function showLine() {
    content.innerHTML = '';
    const d = lines[step];
    const card = document.createElement('div');
    card.style.cssText = 'display:flex;align-items:flex-end;gap:10px;animation:bcomicBubbleIn 0.3s ease;';
    card.innerHTML = `
      <div style="font-size:clamp(40px,9vw,62px);filter:drop-shadow(0 0 12px ${d.color});">${d.speaker}</div>
      <div style="flex:1;background:rgba(255,255,255,0.95);border-radius:16px;padding:12px 14px;box-shadow:0 4px 20px rgba(0,0,0,0.5);">
        <div style="font-size:10px;font-weight:900;letter-spacing:1px;text-transform:uppercase;color:${d.color};margin-bottom:5px;">${d.name}</div>
        <div style="font-size:clamp(12px,3vw,15px);color:#111;font-weight:600;line-height:1.45;">${d.text}</div>
      </div>`;
    content.appendChild(card);
  }

  showLine();

  function advance() {
    step++;
    if (step < lines.length) {
      showLine();
    } else {
      overlay.style.display = 'none';
      boss2DialogActive = false;
      // Grant elven powers
      activateElvenPowers();
      gameActive = true;
      if (gameTimerInterval) clearInterval(gameTimerInterval);
      gameTimerInterval = setInterval(() => {
        gameTimer--;
        timerDisplay.textContent = `⏱: ${gameTimer}s`;
        if (gameTimer <= 0) gameOver();
      }, 1000);
      gameLoop();
      overlay.removeEventListener('click', advance);
      overlay.removeEventListener('touchstart', advance);
    }
  }

  overlay.addEventListener('click', advance);
  overlay.addEventListener('touchstart', advance, { passive: true });
}

// ── Weapon hit on Boss 2 (from drawWeapons) ─────────────────────────
function tryHitBoss2(weapon) {
  // ── Check ice barrier by position (intercepts before reaching boss) ─
  if (boss2IceBarrier) {
    const bib = boss2IceBarrier;
    const ibw = bib.w / 2;
    // Weapon overlaps barrier column?
    if (weapon.x > bib.x - ibw - 10 && weapon.x < bib.x + ibw + 10 &&
        weapon.y > bib.y - bib.h - 10 && weapon.y < bib.y + 10) {
      if (weapon.aura === 'fire') {
        bib.hp--;
        screenShake = 5;
        createExplosionEffect(bib.x, weapon.y, '💧');
        if (bib.hp <= 0) {
          createExplosionEffect(bib.x, bib.y - bib.h / 2, '💥');
          createExplosionEffect(bib.x - 20, bib.y - bib.h * 0.7, '🌊');
          boss2IceBarrier = null;
          try {
            const ac = getAC(); if(ac) sfxOsc('sine',880,400,ac.currentTime,0.3,0.2);
          } catch(e){}
        } else {
          // Crack sound
          try {
            const ac = getAC(); if(ac) sfxOsc('square',200,100,ac.currentTime,0.2,0.1);
          } catch(e){}
        }
      } else {
        // Non-fire bounces off
        createExplosionEffect(weapon.x, weapon.y, '❄️');
      }
      return true; // weapon always consumed by barrier
    }
  }

  if (!boss || boss.hitCooldown > 0) return false;
  if (Math.abs(weapon.x - boss.x) > 70 || Math.abs(weapon.y - boss.y) > 80) return false;

  // Phase 1: freeze (ice fist/power) → then hit (fire/angry fist/power)
  if (boss2Phase === 1) {
    const isIce    = weapon.aura === 'ice'  || currentPower === 'ice';
    const isFire   = weapon.aura === 'fire' || currentPower === 'fire';
    const isAngry  = weapon.aura === 'angry'|| currentPower === 'angry';

    if (isIce && !boss2Frozen) {
      boss2Frozen = true;
      boss2FrozenTimer = 200;
      createExplosionEffect(boss.x, boss.y, '❄️');
      playCoinSound();
      boss.hitCooldown = 20;
      return true;
    }
    if (boss2Frozen && (isFire || isAngry)) {
      boss.health--;
      boss2Frozen = false;
      boss.hitCooldown = 35;
      screenShake = 10;
      createExplosionEffect(boss.x, boss.y, '💥');
      playDamageSound();
      return true;
    }
    // Wrong element
    createExplosionEffect(weapon.x, weapon.y, boss2Frozen ? '🚫' : '🛡️');
    boss.hitCooldown = 15;
    return true;
  }

  // Phase 2: match opposite element of aura
  if (boss2Phase === 2) {
    const isFireWeapon  = weapon.aura === 'fire'  || currentPower === 'fire';
    const isIceWeapon   = weapon.aura === 'ice'   || currentPower === 'ice';
    const isAngryWeapon = weapon.aura === 'angry' || currentPower === 'angry';
    const canHit = (boss2Aura === 'fire' && (isIceWeapon || isAngryWeapon)) ||
                   (boss2Aura === 'ice'  && (isFireWeapon || isAngryWeapon));
    if (canHit) {
      boss.health--;
      boss.hitCooldown = 25;
      screenShake = 8;
      createExplosionEffect(boss.x, boss.y, boss2Aura === 'fire' ? '💧' : '🔥');
      playDamageSound();
      return true;
    }
    createExplosionEffect(weapon.x, weapon.y, '🛡️');
    boss.hitCooldown = 15;
    return true;
  }
  return false;
}

// ── Final ending story ────────────────────────────────────────────────
function showEndingDialog() {
  const comic   = document.getElementById('boss-comic');
  const leftCh  = document.getElementById('bcomic-left-char');
  const rightCh = document.getElementById('bcomic-right-char');
  const name    = document.getElementById('bcomic-speaker-name');
  const text    = document.getElementById('bcomic-text');
  const dotsBox = document.getElementById('bcomic-dots');

  const dialogue = [
    { speaker:'player', left:'🎊', right:'😊', line:'¡Lo logré! ¡El Bosque Oscuro está a salvo! 🌳✨' },
    { speaker:'friends', left:'🔥', right:'🥶', line:'¡Gracias, héroe! ¡Nunca lo olvidaremos! Los emojis somos libres gracias a ti 😭💪' },
    { speaker:'friends', left:'😡', right:'🧝🏻', line:'¡Tu valentía y los poderes del elf mágico salvaron a todos! ¡Eres una leyenda! 🏆' },
    { speaker:'player', left:'😎', right:'😊', line:'Fue un honor. Mientras haya emojis en peligro... ¡yo estaré ahí! 💙' },
    { speaker:'ship', left:'🛸', right:'😤', line:'No tan rápido, terrícola... 😈 Esta guerra NO ha terminado.' },
    { speaker:'ship', left:'🛸', right:'💀', line:'Pronto regresaré con un ejército más poderoso... ¡y robaré cada uno de tus poderes para siempre! ⚡👾' },
    { speaker:'player', left:'😤', right:'😊', line:'¡Cuando vuelvas... te estaremos esperando! 🔥🥶😡😎' },
  ];

  dotsBox.innerHTML = '';
  dialogue.forEach((_, i) => {
    const d = document.createElement('div');
    d.className = 'bcomic-dot' + (i === 0 ? ' active' : '');
    dotsBox.appendChild(d);
  });
  const dots = dotsBox.querySelectorAll('.bcomic-dot');

  let step = 0;
  function showStep(i) {
    if (i >= dialogue.length) { endEnding(); return; }
    const d = dialogue[i];
    dots.forEach((dot, idx) => dot.classList.toggle('active', idx === i));
    const isShip = d.speaker === 'ship';
    const isFriends = d.speaker === 'friends';

    leftCh.textContent  = d.left;
    rightCh.textContent = d.right;
    leftCh.className  = isShip ? 'speaking' : (isFriends ? 'speaking' : 'silent');
    rightCh.className = (d.speaker === 'player') ? 'speaking' : 'silent';

    name.textContent = isShip ? '🛸 NAVE ENEMIGA' : (isFriends ? '✨ EMOJIS AMIGOS' : '😊 TÚ');
    name.style.color = isShip ? '#c040ff' : (isFriends ? '#00cc66' : '#0090ff');

    text.style.opacity = '0';
    setTimeout(() => {
      text.textContent = d.line;
      text.style.transition = 'opacity 0.3s';
      text.style.opacity = '1';
    }, 80);

    const box = document.getElementById('bcomic-bubble-box');
    box.style.animation = 'none'; void box.offsetWidth; box.style.animation = '';
    if (autoTimer) clearTimeout(autoTimer);
    autoTimer = setTimeout(() => { step++; showStep(step); }, 3000);
  }

  let autoTimer = null;
  function endEnding() {
    if (autoTimer) clearTimeout(autoTimer);
    comic.style.transition = 'opacity 0.8s';
    comic.style.opacity = '0';
    setTimeout(() => {
      comic.classList.remove('show');
      comic.style.opacity = '';
      comic.style.transition = '';
      victory();
    }, 820);
  }

  function onTap() { step++; showStep(step); }
  comic.addEventListener('click', onTap);
  comic.addEventListener('touchstart', onTap, { passive: true });

  comic.classList.add('show');
  setTimeout(() => showStep(0), 300);
}

// ── Asteroid class (enhanced) ─────────────────────────────────────
class Asteroid {
  constructor() {
    this.size = 22 + Math.random() * 28;
    this.x = player.x + (Math.random() * canvas.width * 2.2) - canvas.width * 0.6;
    this.y = -this.size;
    this.speed = 1.5 + Math.random() * 3;
    this.hue = 20 + Math.random() * 40;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotSpeed = (Math.random() - 0.5) * 0.06;
    this.vertices = this._buildVerts();
    this.drawX = 0; this.drawY = 0;
    this.glowing = false;
    this.trail = [];
  }
  _buildVerts() {
    const v = []; const n = 7 + Math.floor(Math.random()*3);
    for (let i = 0; i < n; i++) {
      const a = (i/n) * Math.PI * 2;
      const r = this.size/2 * (0.65 + Math.random()*0.35);
      v.push({ x: Math.cos(a)*r, y: Math.sin(a)*r });
    }
    return v;
  }
  update() {
    this.trail.push({ x: this.drawX, y: this.drawY });
    if (this.trail.length > 6) this.trail.shift();
    this.y += this.speed;
    this.rotation += this.rotSpeed;
    this.drawX = Math.round(this.x - cameraX);
    this.drawY = Math.round(this.y);
  }
  draw() {
    // Trail glow
    for (let i = 0; i < this.trail.length; i++) {
      const alpha = (i / this.trail.length) * 0.25;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = `hsl(${this.hue},90%,60%)`;
      ctx.beginPath();
      ctx.arc(this.trail[i].x, this.trail[i].y, this.size * 0.3 * (i/this.trail.length), 0, Math.PI*2);
      ctx.fill();
      ctx.restore();
    }
    ctx.save();
    ctx.translate(this.drawX, this.drawY);
    ctx.rotate(this.rotation);
    // Glow
    ctx.shadowColor = `hsl(${this.hue},100%,70%)`;
    ctx.shadowBlur = 14;
    ctx.fillStyle = `hsl(${this.hue},75%,45%)`;
    ctx.beginPath();
    this.vertices.forEach((v, i) => i === 0 ? ctx.moveTo(v.x, v.y) : ctx.lineTo(v.x, v.y));
    ctx.closePath(); ctx.fill();
    // Crater
    ctx.shadowBlur = 0;
    ctx.fillStyle = `hsl(${this.hue},50%,30%)`;
    ctx.beginPath(); ctx.arc(-this.size/5, -this.size/5, this.size/5.5, 0, Math.PI*2); ctx.fill();
    // Bright highlight
    ctx.fillStyle = `hsla(${this.hue+20},80%,80%,0.4)`;
    ctx.beginPath(); ctx.arc(this.size/4, -this.size/4, this.size/8, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }
}

function updateAsteroids() {
  asteroidSpawnTimer++;
  if (asteroidSpawnTimer >= asteroidSpawnInterval) {
    asteroids.push(new Asteroid());
    asteroidSpawnTimer = 0;
    // reduce interval slightly over time (max difficulty)
    asteroidSpawnInterval = Math.max(25, asteroidSpawnInterval - 0.1);
  }
  for (let i = asteroids.length - 1; i >= 0; i--) {
    const a = asteroids[i];
    a.update();
    let hit = false;

    // Platform collision
    for (let p of platforms) {
      if (a.x >= p.x && a.x <= p.x+p.w &&
          a.y+a.size/2 >= p.y && a.y-a.size/2 <= p.y+p.h) { hit = true; break; }
    }
    if (!hit && a.y + a.size/2 >= trailY) hit = true;

    // Player collision
    if (!hit && Math.abs(a.x-player.x) < 28 && Math.abs(a.y-player.y) < 28) {
      hit = true;
      screenShake = 8; damageFlash = 10;
      player.health--;
      updateHearts();
      playDamageSound();
      createExplosionEffect(a.x, a.y, '💥');
      if (player.health <= 0) { player.alive = false; gameOver(); }
    }
    // Enemy collision
    for (let j = enemies.length-1; j >= 0; j--) {
      const e = enemies[j];
      if (Math.abs(a.x-e.x) < 28 && Math.abs(a.y-e.y) < 28) {
        enemies.splice(j, 1); hit = true;
        playExplosionSound();
        createExplosionEffect(e.x, e.y, e.emoji);
      }
    }
    // Boss collision
    if (boss && Math.abs(a.x-boss.x) < 50 && Math.abs(a.y-boss.y) < 50) {
      boss.health--;
      hit = true;
      screenShake = 5;
      createExplosionEffect(boss.x, boss.y, '💥');
      playExplosionSound();
      if (boss.health <= 0) {
        createExplosionEffect(boss.x, boss.y, '🗿');
        boss = null; bossActive = false;
      }
    }
    if (hit || a.y > canvas.height + 80) asteroids.splice(i, 1);
  }
}

// ══════════════════════════════════════════════════════════════════
//  END LEVEL 2 drawing functions
// ══════════════════════════════════════════════════════════════════

// Draw particles on the canvas
function drawParticles() {
  // Cap to avoid unbounded growth
  if (particles.length > 60) particles.splice(0, particles.length - 60);
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.life--;
    if (p.life <= 0) { particles.splice(i, 1); continue; }
    const px = Math.round(p.x - cameraX);
    if (px < -60 || px > canvas.width + 60) continue; // off-screen skip
    const maxLife = p.maxLife || 40;
    ctx.globalAlpha = Math.min(1, (p.life / maxLife) * 2);
    ctx.font = `${p.size | 0}px serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(p.emoji, px, Math.round(p.y));
  }
  ctx.globalAlpha = 1;
}

// Draw recovery hearts
function drawHeartDrops() {
  for (let i = heartDrops.length - 1; i >= 0; i--) {
    const heart = heartDrops[i];
    heart.vy += 0.05;
    heart.y += heart.vy;
    
    if (Math.abs(heart.x - player.x) < 30 && 
        Math.abs(heart.y - player.y) < 30) {
      if (player.health < 3) {
        player.health++;
        updateHearts();
        playHeartSound();
      }
      heartDrops.splice(i, 1);
      continue;
    }
    
    if (heart.y > canvas.height + 50) {
      heartDrops.splice(i, 1);
      continue;
    }
    
    drawEmoji(heart.x, heart.y, '❤️', 30);
  }
}

// Draw coins and manage their collection
function drawCoins() {
  for (let i = coins.length - 1; i >= 0; i--) {
    const coin = coins[i];
    coin.rotation += 0.1;
    drawEmoji(coin.x, coin.y, '🪙', 30, coin.rotation);
    
    if (Math.abs(coin.x - player.x) < 30 && 
        Math.abs(coin.y - player.y) < 30) {
      coinsCollected++;
      coins.splice(i, 1);
      coinsHud.textContent = `💰: ${coinsCollected}`;
      playCoinSound();
      
      if (coinsCollected % 20 === 0 && coinsCollected > 0 && star === null) {
        star = {
          x: player.x + 200,
          y: canvas.height / 2,
          rotation: 0
        };
      }
      
      const storeCoins = [10, 15, 20, 30, 40, 50, 60, 70, 90];
      if (storeCoins.includes(coinsCollected) && storeEmoji === null) {
        storeEmoji = {
          x: player.x + 300 + Math.random() * 200,
          y: roadY - 30,
          rotation: 0
        };
      }
    }
  }
  
  if (star) {
    if (Math.abs(star.x - player.x) < 40 && 
        Math.abs(star.y - player.y) < 40) {
      startBonusGame();
      star = null;
    }
  }
  
  if (storeEmoji) {
    if (Math.abs(storeEmoji.x - player.x) < 40 && 
        Math.abs(storeEmoji.y - player.y) < 40) {
      openStore();
      storeEmoji = null;
    }
    
    if (storeEmoji && storeEmoji.x < cameraX - 100) {
      storeEmoji = null;
    }
  }
  
  // Flag victory only for Level 2 (Level 1 ends via boss defeat)
  if (flag && currentLevel === 2) {
    if (Math.abs(flag.x - player.x) < 50 && 
        Math.abs(flag.y - player.y) < 50) {
      victory();
    }
  }
}

// Draw avatar weapons
function drawWeapons() {
  for (let i = weapons.length - 1; i >= 0; i--) {
    const weapon = weapons[i];
    
    if (weapon.type === 'boomerang') {
      weapon.rotation += 0.3;
      
      let closestEnemy = null;
      let minDist = Infinity;
      
      for (let enemy of enemies) {
        const dist = Math.abs(weapon.x - enemy.x);
        if (dist < minDist) {
          minDist = dist;
          closestEnemy = enemy;
        }
      }
      
      if (closestEnemy) {
        const dx = closestEnemy.x - weapon.x;
        const dy = closestEnemy.y - weapon.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 5) {
          weapon.vx = dx / dist * 5;
          weapon.vy = dy / dist * 5;
        }
      }
      
      weapon.x += weapon.vx;
      weapon.y += weapon.vy;
    } else {
      weapon.x += weapon.vx;
      weapon.y += weapon.vy;
    }
    
    if (weapon.x < cameraX - 100 || weapon.x > cameraX + canvas.width + 100) {
      weapons.splice(i, 1);
      continue;
    }
    
    let rotation = 0;
    if (weapon.type === 'boomerang') {
      rotation = weapon.rotation;
    }

    // ── Fist: draw with elemental aura glow ─────────────────────────
    if (weapon.type === 'fist') {
      const wx = Math.round(weapon.x - cameraX);
      const wy = Math.round(weapon.y);
      const age = weapon.spawnTime ? (Date.now() - weapon.spawnTime) : 0;
      const pulse = Math.sin(age / 60) * 0.4 + 0.9;

      ctx.save();
      if (weapon.aura === 'fire') {
        const rg = ctx.createRadialGradient(wx, wy, 4, wx, wy, 28);
        rg.addColorStop(0, `rgba(255,220,50,${0.7*pulse})`);
        rg.addColorStop(0.5, `rgba(255,80,0,${0.5*pulse})`);
        rg.addColorStop(1, 'rgba(200,20,0,0)');
        ctx.fillStyle = rg;
        ctx.beginPath(); ctx.arc(wx, wy, 28, 0, Math.PI*2); ctx.fill();
        ctx.shadowColor = '#ff4400'; ctx.shadowBlur = 20*pulse;
      } else if (weapon.aura === 'ice') {
        const rg = ctx.createRadialGradient(wx, wy, 4, wx, wy, 28);
        rg.addColorStop(0, `rgba(200,240,255,${0.85*pulse})`);
        rg.addColorStop(0.4, `rgba(0,200,255,${0.6*pulse})`);
        rg.addColorStop(1, 'rgba(0,100,200,0)');
        ctx.fillStyle = rg;
        ctx.beginPath(); ctx.arc(wx, wy, 28, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = `rgba(180,240,255,${0.7*pulse})`;
        ctx.lineWidth = 1.5;
        for (let s = 0; s < 6; s++) {
          const angle = (s / 6) * Math.PI * 2 + age/300;
          ctx.beginPath();
          ctx.moveTo(wx + Math.cos(angle)*8, wy + Math.sin(angle)*8);
          ctx.lineTo(wx + Math.cos(angle)*26, wy + Math.sin(angle)*26);
          ctx.stroke();
        }
        ctx.shadowColor = '#00cfff'; ctx.shadowBlur = 18*pulse;
      } else if (weapon.aura === 'angry') {
        // Angry: red shockwave + jagged lines
        const rg = ctx.createRadialGradient(wx, wy, 4, wx, wy, 30);
        rg.addColorStop(0, `rgba(255,50,50,${0.85*pulse})`);
        rg.addColorStop(0.5, `rgba(200,0,0,${0.5*pulse})`);
        rg.addColorStop(1, 'rgba(120,0,0,0)');
        ctx.fillStyle = rg;
        ctx.beginPath(); ctx.arc(wx, wy, 30, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = `rgba(255,100,0,${0.8*pulse})`;
        ctx.lineWidth = 2;
        for (let s = 0; s < 4; s++) {
          const angle = (s / 4) * Math.PI * 2 + age/200;
          ctx.beginPath();
          ctx.moveTo(wx + Math.cos(angle)*10, wy + Math.sin(angle)*10);
          ctx.lineTo(wx + Math.cos(angle+0.3)*22, wy + Math.sin(angle+0.3)*22);
          ctx.lineTo(wx + Math.cos(angle)*28, wy + Math.sin(angle)*28);
          ctx.stroke();
        }
        ctx.shadowColor = '#ff2200'; ctx.shadowBlur = 22*pulse;
      }
      ctx.font = '28px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('🤜🏻', wx, wy);
      ctx.restore();
    } else {
      drawEmoji(weapon.x, weapon.y, weapon.emoji, 30, rotation);
    }
    
    for (let j = enemies.length - 1; j >= 0; j--) {
      const enemy = enemies[j];
      if (Math.abs(weapon.x - enemy.x) < 30 && 
          Math.abs(weapon.y - enemy.y) < 30) {
        createExplosionEffect(enemy.x, enemy.y, enemy.emoji);
        playEnemyDefeatSound();
        enemies.splice(j, 1);
        if (enemy.dropHeart) createHeartDrop(enemy.x, enemy.y);
        
        if (weapon.type !== 'boomerang') {
          weapons.splice(i, 1);
        }
        break;
      }
    }

    // ── Level 2: weapons also hit animals (🐂🦔🧌🪨 terrestrials) ──
    if (currentLevel === 2 && !bossActive) {
      let hitAnimal = false;
      for (let j = animals.length - 1; j >= 0; j--) {
        const an = animals[j];
        if (an.frozen) continue;
        const range = an.type === 'troll' ? 42 : 30;
        if (Math.abs(weapon.x - an.x) < range && Math.abs(weapon.y - an.y) < range) {
          createExplosionEffect(an.x, an.y, an.emoji);
          playEnemyDefeatSound();
          animals.splice(j, 1);
          if (an.dropHeart) createHeartDrop(an.x, an.y);
          if (weapon.type !== 'boomerang') { weapons.splice(i, 1); }
          hitAnimal = true;
          break;
        }
      }
      if (hitAnimal) continue;
    }
    
    for (let j = cars.length - 1; j >= 0; j--) {
      const car = cars[j];
      if (Math.abs(weapon.x - car.x) < 30 && 
          Math.abs(weapon.y - car.y) < 30) {
        createExplosionEffect(car.x, car.y, car.emoji);
        cars.splice(j, 1);
        if (car.dropHeart) createHeartDrop(car.x, car.y);
        
        if (weapon.type !== 'boomerang') {
          weapons.splice(i, 1);
        }
        break;
      }
    }

    if (sunEnemy && !sunEnemy.stunned) {
      if (Math.abs(weapon.x - sunEnemy.x) < 40 && 
          Math.abs(weapon.y - sunEnemy.y) < 40) {
        sunEnemy.health--;
        sunEnemy.stunned = true;
        sunEnemy.stunTimer = 30;
        sunEnemy.originalEmoji = sunEnemy.emoji;
        sunEnemy.emoji = '🌚';
        
        if (weapon.type !== 'boomerang') {
          weapons.splice(i, 1);
        }

        if (sunEnemy.health <= 0) {
          createExplosionEffect(sunEnemy.x, sunEnemy.y, sunEnemy.originalEmoji);
          sunEnemy = null;
          sunDefeated = true;
        }
        break;
      }
    }

    // Night boss (🛸) — cowboy/eagle weapons + ice power can hit
    if (nightBoss && bossHitCooldown === 0 &&
        Math.abs(weapon.x - nightBoss.x) < 55 &&
        Math.abs(weapon.y - (nightBoss.worldY - cameraY)) < 55) {
      if (purchasedAvatar === 'cowboy' || purchasedAvatar === 'eagle') {
        nightBoss.bkickDir = weapon.x < nightBoss.x ? 1 : -1;
        hitNightBoss(1);
        bossHitCooldown = BOSS_HIT_COOLDOWN;
        if (weapon.type !== 'boomerang') weapons.splice(i, 1);
      }
    }

    // Boss 2 (🗿) — fist with correct element hits boss
    if (currentLevel === 2 && boss) {
      const consumed = tryHitBoss2(weapon);
      if (consumed && weapon.type !== 'boomerang') {
        weapons.splice(i, 1);
        continue;
      }
    }
  }
}

// Update player position and state
function updatePlayer() {
  if (!player.alive || !gameActive || bonusGameActive || paused) return;
  
  if (player.invincible) {
    player.invincibleTimer--;
    if (player.invincibleTimer <= 0) {
      player.invincible = false;
      if (powerActive) {
        player.emoji = getPowerEmoji(currentPower);
      } else {
        player.emoji = player.baseEmoji;
      }
    }
  }
  
  if (avatarAttackActive) {
    avatarAttackTimer--;
    if (avatarAttackTimer <= 0) {
      avatarAttackActive = false;
    }
  }

  // ── Avatar power countdown — skip entirely when elven active ──────
  if (purchasedAvatar && avatarPowerTimer > 0 && !elvenPowersActive && !ngPlusMode) {
    avatarPowerTimer--;
    if (avatarPowerTimer % 3 === 0) updateHearts();
    if (avatarPowerTimer <= 0) {
      deactivateAvatar();
    }
  }
  
  if (powerActive) {
    if (!elvenPowersActive) {
      powerDuration--;
      if (powerDuration <= 0) { deactivatePower(); }
    }
  }

  // Cool freeze countdown (enemies stop for 5s even after power expires)
  if (coolFreezeActive) {
    coolFreezeTimer--;
    if (coolFreezeTimer <= 0) {
      coolFreezeActive = false;
      coolFreezeTimer = 0;
    }
  }
  
  for (let power in powerCooldowns) {
    if (powerCooldowns[power] > 0) {
      powerCooldowns[power]--;
      updateCooldownDisplay(power, powerCooldowns[power]);
    }
  }
  
  powerSlots.forEach(slot => {
    const power = slot.dataset.power;
    if (powerCooldowns[power] > 0) {
      slot.classList.add('cooldown');
    } else {
      slot.classList.remove('cooldown');
    }
  });

  player.vx = 0;
  if (keys.left) {
    player.vx = -5;
    player.facingRight = false;
  } else if (keys.right) {
    player.vx = 5;
    player.facingRight = true;
  }
  
  if (!player.onGround) player.vy += gravity;

  player.x += player.vx;
  player.y += player.vy;
  
  if (purchasedAvatar !== 'kangaroo' && purchasedAvatar !== 'eagle') {
    player.rotation += player.vx * 0.02;
  }
  
  if (purchasedAvatar === 'eagle') {
    player.vy *= 0.9;
  }
  
  if (!bossPhase2 && player.y < 0) {
    player.y = 0;
    player.vy = 0;
  }
  
  const _wasOnGround = player.onGround;
  player.onGround = false;
  
  // Ground collision detection (roadY for level 1, trailY for level 2)
  // In boss phase 2 there is no floor — player must stand on frozen rain platforms
  const groundLevel = currentLevel === 2 ? trailY : roadY;
  if (!bossPhase2 && player.y + player.h/2 >= groundLevel && player.vy >= 0) {
    player.y = groundLevel - player.h/2;
    player.vy = 0;
    if (!_wasOnGround) playLandSound();
    player.onGround = true;
    player.jumpCount = 0;
    
    if (powerActive && currentPower === 'fire') {
      player.vy = -8;
      player.onGround = false;
      player.fireBounce = true;
    }
  }
  // In phase 2, player can still land on road (they start there)
  if (bossPhase2 && player.y + player.h/2 >= groundLevel && player.vy >= 0) {
    player.y = groundLevel - player.h/2;
    player.vy = 0;
    if (!_wasOnGround) playLandSound();
    player.onGround = true;
    player.jumpCount = 0;
  }
  // Die if fall too far below road
  if (player.y > groundLevel + 500) {
    player.health = 0;
    updateHearts();
    player.alive = false;
    gameOver();
  }
  
  // Platform collision detection
  for (let p of platforms) {
    if (player.x + player.w/2 > p.x &&
        player.x - player.w/2 < p.x + p.w &&
        player.y + player.h/2 > p.y &&
        player.y + player.h/2 < p.y + p.h &&
        player.vy > 0) {
      player.y = p.y - player.h/2;
      player.vy = 0;
      if (!_wasOnGround) playLandSound();
      player.onGround = true;
      player.jumpCount = 0;
    }
  }
  
  // Stairs collision detection
  for (let s of stairsPlatforms) {
    for (let i = 0; i < s.steps; i++) {
      const stepX = s.x + i * 40;
      const stepY = s.y - i * 20;
      
      if (player.x + player.w/2 > stepX &&
          player.x - player.w/2 < stepX + 40 &&
          player.y + player.h/2 > stepY &&
          player.y + player.h/2 < stepY + 20 &&
          player.vy > 0) {
        player.y = stepY - player.h/2;
        player.vy = 0;
        if (!_wasOnGround) playLandSound();
        player.onGround = true;
        player.jumpCount = 0;
      }
    }
  }

  const jumpPressed = keys.jump && !prevKeys.jump;
  
  if (jumpPressed) {
    if (purchasedAvatar === 'eagle') {
      player.vy = -8;
      player.onGround = false;
      playJumpSound();
    } else if (player.jumpCount < player.maxJumps) {
      player.vy = player.jumpCount === 0 ? -12 : -10;
      player.jumpCount++;
      player.onGround = false;
      playJumpSound();
      
      if (powerActive && currentPower === 'fire' && player.jumpCount === 2) {
        player.vy = -14;
      }
      
      if (purchasedAvatar === 'kangaroo') {
        player.vy = -14;
      }
    }
  }
  
  const attackPressed = keys.attack && !prevKeys.attack;
  if (attackPressed && (purchasedAvatar || elvenPowersActive || ngPlusMode) && !avatarAttackActive) {
    if (elvenPowersActive && !purchasedAvatar) {
      // Ensure fist is re-granted if lost
      purchasedAvatar = 'fist';
      attackBtnWrapper.classList.remove('inactive');
      attackBtnWrapper.classList.add('active-avatar');
    }
    useAvatarAttack();
  }
  
  prevKeys.jump = keys.jump;
  prevKeys.attack = keys.attack;

  if (player.y > canvas.height + 500 && !bossPhase2) {
    player.health = 0;
    updateHearts();
    player.alive = false;
    gameOver();
  }

  cameraX = player.x - canvas.width / 3;
  
  // Actualizar ciclo día/tarde/noche
  if (player.x < SECTION_EVENING) {
    timeOfDay = 'day';
    ufo = null;
  } else if (player.x < SECTION_NIGHT) {
    timeOfDay = 'evening';
    ufo = null;
  } else {
    timeOfDay = 'night';
    if (sunEnemy) sunEnemy = null;
    ufo = null; // UFO removed from night section — boss arena handles end
  }

  // Night section: update falling/chasing aliens and ice mechanic
  if (currentLevel === 1 && timeOfDay === 'night') updateNightAliens();

  // ── Checkpoint detection (Level 1 only) ─────────────────────────
  if (currentLevel === 1) {
    // CP1: day → evening
    if (lastCheckpoint === null && player.x >= SECTION_EVENING) {
      lastCheckpoint = 'evening';
      checkpointCoins = coinsCollected;
      showCheckpointBanner('🌅 Punto de control — Tarde');
    }
    // CP2: evening → night
    if (lastCheckpoint === 'evening' && player.x >= SECTION_NIGHT) {
      lastCheckpoint = 'night';
      checkpointCoins = coinsCollected;
      showCheckpointBanner('🌙 Punto de control — Noche');
    }
    // CP3: boss arena entered (nightBoss may not exist yet on first frame)
    if (lastCheckpoint === 'night' && nightBossArena) {
      lastCheckpoint = 'boss';
      checkpointCoins = coinsCollected;
      showCheckpointBanner('🛸 Punto de control — Jefe Final');
    }
  }
}

// Activate special avatar attack
function useAvatarAttack() {
  if (!purchasedAvatar && !ngPlusMode) return;
  
  avatarAttackActive = true;
  avatarAttackTimer = 30;
  
  switch(purchasedAvatar) {
    case 'cowboy':
      weapons.push({
        x: player.x + 50,
        y: player.y,
        vx: 5,
        vy: 0,
        emoji: '🪃',
        type: 'boomerang',
        life: 200,
        rotation: 0
      });
      break;
      
    case 'fist': {
      const fistAura = (currentPower === 'fire')  ? 'fire'
                     : (currentPower === 'ice')   ? 'ice'
                     : (currentPower === 'angry') ? 'angry'
                     : null;
      weapons.push({
        x: player.facingRight !== false ? player.x + 50 : player.x - 50,
        y: player.y,
        vx: player.facingRight !== false ? 10 : -10,
        vy: 0,
        emoji: '🤜🏻',
        type: 'fist',
        aura: fistAura,
        life: 30,
        spawnTime: Date.now()
      });
      break;
    }
  }
}

function activateElvenPowers() {
  elvenPowersActive = true;
  // Grant fist avatar (for attack button) without removing power slots
  purchasedAvatar = 'fist';
  player.baseEmoji = '😁';
  player.emoji = '😁';
  document.querySelector('#attack-btn-wrapper .base-emoji').textContent = '🟣';
  document.querySelector('#attack-btn-wrapper .overlay-emoji').textContent = '🤜🏻';
  attackBtnWrapper.classList.remove('inactive');
  attackBtnWrapper.classList.add('active-avatar');
  // Re-enable all power slots
  powerSlots.forEach(slot => {
    slot.classList.remove('disabled','cooldown','active','selecting');
    slot.querySelector('.cooldown-overlay').style.height = '0';
    slot.querySelector('.cooldown-clock').style.display = 'none';
  });
  for (let p in powerCooldowns) powerCooldowns[p] = 0;
  // Grant reinforced hearts (5 hearts from 🧝🏻 blessing)
  player.health = 5;
  reinforcedHearts = 5;
  avatarPowerTimer = 999999; // infinite while elven active
  updateHearts();
  // Visual fanfare
  screenShake = 12;
  createExplosionEffect(player.x, player.y, '🧝🏻');
  createExplosionEffect(player.x - 60, player.y, '✨');
  createExplosionEffect(player.x + 60, player.y, '✨');
  createExplosionEffect(player.x, player.y - 50, '💚');
  createExplosionEffect(player.x + 30, player.y - 30, '💚');
  try {
    const ac = getAC(); if (ac) {
      const t = ac.currentTime;
      [523, 659, 784, 1047].forEach((f, i) => sfxOsc('sine', f, f*0.5, t+i*0.12, 0.3, 0.2));
    }
  } catch(e) {}
}

function activatePower(power) {
  // NG+ or elven: no cooldown, switch freely
  if (elvenPowersActive || ngPlusMode) {
    if (powerActive && currentPower === power) return; // already active
    if (powerActive) { deactivatePower(); }
    currentPower = power;
    powerActive = true;
    powerDuration = 999999; // effectively infinite
    player.emoji = getPowerEmoji(power);
    playPowerSound(power);
    createPowerTransformEffect(power);
    const _pc = POWER_COLORS[power];
    if (_pc) { powerFlash = 8; powerFlashColor = _pc.main; }
    if (power === 'ghost') player.ghostMode = true;
    if (power === 'fire') player.fireBounce = true;
    if (power === 'angry') player.angryAura = true;
    if (power === 'cool') { coolFreezeActive = true; coolFreezeTimer = 420; }
    powerSlots.forEach(slot => {
      slot.classList.remove('active','cooldown','disabled','selecting');
      if (slot.dataset.power === power) slot.classList.add('active');
    });
    return;
  }
  if (powerCooldowns[power] > 0 || powerActive || (purchasedAvatar && !ngPlusMode)) return;
  
  currentPower = power;
  powerActive = true;
  powerDuration = 420;
  player.emoji = getPowerEmoji(power);
  
  // === POWER ACTIVATION EFFECTS ===
  playPowerSound(power);
  createPowerTransformEffect(power);
  const _pc = POWER_COLORS[power];
  if (_pc) { powerFlash = 8; powerFlashColor = _pc.main; }
  
  if (power === 'ghost') player.ghostMode = true;
  if (power === 'fire') player.fireBounce = true;
  if (power === 'angry') player.angryAura = true;
  if (power === 'cool') {
    coolFreezeActive = true;
    coolFreezeTimer = 420; // 7s × 60fps
  }
  
  powerSlots.forEach(slot => {
    if (slot.dataset.power !== power) {
      slot.classList.add('disabled');
    } else {
      slot.classList.add('active');
      slot.classList.remove('selecting');
    }
  });
}

// Deactivate active power
function deactivatePower() {
  if (elvenPowersActive) {
    // In elven mode: only reset effects, no cooldown
    player.ghostMode = false;
    player.fireBounce = false;
    player.angryAura = false;
    coolFreezeActive = false; coolFreezeTimer = 0;
    powerActive = false;
    player.emoji = player.baseEmoji;
    powerSlots.forEach(slot => slot.classList.remove('active','disabled','selecting'));
    return;
  }
  powerActive = false;
  powerCooldowns[currentPower] = 600;
  player.emoji = player.baseEmoji;
  player.ghostMode = false;
  player.fireBounce = false;
  player.angryAura = false;
  coolFreezeActive = false;
  coolFreezeTimer = 0;
  
  powerSlots.forEach(slot => {
    slot.classList.remove('active', 'disabled', 'selecting');
  });
}

// Desactivar avatar comprado → volver a poderes base
function deactivateAvatar() {
  if (!ngPlusMode) purchasedAvatar = null;
  avatarPowerTimer = ngPlusMode ? 1200 : 0;  // NG+: auto-refill timer
  reinforcedHearts = ngPlusMode ? 3 : 0;
  avatarAttackActive = false;

  // Restore default emoji
  player.baseEmoji = '😊';
  player.emoji = '😊';

  // Re-enable power slots
  powerSlots.forEach(slot => {
    slot.classList.remove('active', 'disabled', 'selecting', 'cooldown');
    slot.querySelector('.cooldown-overlay').style.height = '0';
    slot.querySelector('.cooldown-clock').style.display = 'none';
  });

  // Hide attack button
  attackBtnWrapper.classList.add('inactive'); attackBtnWrapper.classList.remove('active-avatar');

  // Visual/audio feedback
  screenShake = 6;
  try {
    const ac = getAC(); if (ac) {
      const t = ac.currentTime;
      sfxOsc('sawtooth', 400, 100, t, 0.18, 0.3);
      sfxOsc('sawtooth', 200, 50,  t+0.15, 0.14, 0.25);
    }
  } catch(e) {}

  createPowerTransformEffect('cool'); // brief sparkle
  updateHearts();
}

// Get emoji corresponding to each power
function getPowerEmoji(power) {
  switch(power) {
    case 'angry': return '😡';
    case 'ice': return '🥶';
    case 'fire': return '🔥';
    case 'cool': return '😎';
    case 'ghost': return '🫥';
    default: return '😊';
  }
}

// Update cooldown display in the HUD
function updateCooldownDisplay(power, cooldown) {
  const slot = document.querySelector(`.power-slot[data-power="${power}"]`);
  if (!slot) return;
  
  const overlay = slot.querySelector('.cooldown-overlay');
  const clock = slot.querySelector('.cooldown-clock');
  
  if (cooldown > 0) {
    const percentage = (cooldown / 600) * 100;
    overlay.style.height = `${percentage}%`;
    clock.style.display = 'flex';
  } else {
    overlay.style.height = '0';
    clock.style.display = 'none';
  }
}

// Generate new platforms, enemies, and objects in the level
function generateLevel() {
  const levelLength = currentLevel === 1 ? LEVEL1_LENGTH : LEVEL2_LENGTH;
  const groundY = currentLevel === 1 ? roadY : trailY;

  while (lastPlatformX < player.x + canvas.width + 300 && lastPlatformX < levelLength) {
    const width = currentLevel === 1 ? (100 + Math.random() * 150) : (80 + Math.random() * 120);
    const height = currentLevel === 1 ? 20 : (20 + Math.random() * 50);
    const gap = 60 + Math.random() * 80;
    const heightVar = currentLevel === 1 ? 0 : Math.floor(Math.random() * 100);
    const y = currentLevel === 1
      ? (canvas.height - 200 - Math.random() * 150)
      : (trailY - height - heightVar);
    const type = ['flat', 'stairs'][Math.floor(Math.random() * 2)];

    platforms.push({ x: lastPlatformX + gap, y: y, w: width, h: height, type: type });

    // ── Level 2 — Trees (🌳) and fern decoration (🪾) ──────────────
    if (currentLevel === 2 && Math.random() < 0.5) {
      trees.push({
        x: lastPlatformX + gap + Math.random() * 220,
        y: trailY - 30,
        // 30% chance to have a decorative 🦉 perched on it
        hasOwl: Math.random() < 0.3
      });
    }
    // Occasional 🪾 fern in place of a tree (decorative, no collision)
    if (currentLevel === 2 && Math.random() < 0.25) {
      trees.push({
        x: lastPlatformX + gap + Math.random() * 180,
        y: trailY - 30,
        isFern: true
      });
    }

    // ── Level 2 — Animals (terrestres, estáticos, hacen daño) ───────
    if (currentLevel === 2 && Math.random() < 0.28) {
      const em = animalEmojis[Math.floor(Math.random() * animalEmojis.length)];
      animals.push({
        x: lastPlatformX + gap + 30 + Math.random() * (width - 60),
        y: trailY - 20,
        emoji: em, type: 'animal',
        dropHeart: Math.random() < 0.25,
        height: 40, initialized: false,
        static: true           // does not patrol, just stands
      });
    }

    // ── Level 2 — Troll 🧌 (baja frecuencia, estático, grande) ──────
    if (currentLevel === 2 && Math.random() < 0.10) {
      animals.push({
        x: lastPlatformX + gap + width / 2,
        y: trailY - 20,
        emoji: '🧌', type: 'troll',
        dropHeart: true,
        height: 55, initialized: false,
        static: true
      });
    }

    // ── Level 2 — Moving enemies (👻 👾 🤖) on platforms ────────────
    const ePool = currentLevel === 2 ? forestEnemyEmojis : enemyEmojis;
    if (Math.random() < (currentLevel === 2 ? 0.38 : 0.5)) {
      const em = ePool[Math.floor(Math.random() * ePool.length)];
      enemies.push({
        x: lastPlatformX + gap + width / 2,
        y: y - 20,
        vx: Math.random() < 0.5 ? -1.4 : 1.4,
        vy: 0,
        emoji: em,
        minX: lastPlatformX + gap + 20,
        maxX: lastPlatformX + gap + width - 20,
        type: currentLevel === 2 ? 'ghost' : 'enemy',
        dropHeart: Math.random() < 0.22
      });
    }

    // ── Level 2 — Bat 🦇 (volador, baja frecuencia) ─────────────────
    if (currentLevel === 2 && Math.random() < 0.14) {
      enemies.push({
        x: lastPlatformX + gap + width / 2,
        y: y - 60,
        vx: Math.random() < 0.5 ? -1.8 : 1.8,
        vy: 0,
        emoji: '🦇',
        minX: lastPlatformX + gap - 40,
        maxX: lastPlatformX + gap + width + 40,
        type: 'flying',
        dropHeart: Math.random() < 0.18
      });
    }

    // Obstacles
    if (Math.random() < 0.3) {
      const obsEmoji = currentLevel === 2 ? '🪨' : obstacleEmojisList[Math.floor(Math.random() * obstacleEmojisList.length)];
      obstacles.push({
        x: lastPlatformX + gap + 30 + Math.random() * (width - 60),
        y: y - 20,
        emoji: obsEmoji,
        type: 'cactus',
        dropHeart: Math.random() < 0.2
      });
    }

    // Coins on platform
    if (Math.random() < 0.3) {
      coins.push({ x: lastPlatformX + gap + 30 + Math.random() * (width-60), y: y - 50, rotation: 0 });
    }
    // Coins on ground
    if (Math.random() < 0.2) {
      coins.push({ x: lastPlatformX + gap + 30 + Math.random() * (width-60), y: groundY - 30, rotation: 0 });
    }
    // Holes
    if (Math.random() < 0.15) {
      holes.push({ x: lastPlatformX + gap + width/2, size: 50 });
    }
    // Cars (level 1 only)
    if (currentLevel === 1 && Math.random() < 0.25) {
      const em = carEmojis[Math.floor(Math.random() * carEmojis.length)];
      cars.push({
        x: lastPlatformX + gap + 100, y: roadY - 20,
        vx: -3 - Math.random() * 2,
        emoji: em, type: 'car',
        dropHeart: Math.random() < 0.2
      });
    }

    lastPlatformX += gap + width;
  }
}

// ── WORLD DRAWING HELPERS ──────────────────────────────────────────

// Pre-computed star positions (static array, seeded once)
const STARS = Array.from({length: 90}, (_, i) => ({
  x: (i * 137.508 * 3.7) % 1,   // normalized 0-1 position
  y: (i * 97.3   * 2.1) % 0.75,
  r: 0.5 + (i % 3) * 0.6,
  twinkle: i % 7
}));

function drawSun(cx, cy) {
  // Glow
  const grd = ctx.createRadialGradient(cx, cy, 2, cx, cy, 55);
  grd.addColorStop(0,   'rgba(255,255,200,0.95)');
  grd.addColorStop(0.2, 'rgba(255,230,80,0.7)');
  grd.addColorStop(0.6, 'rgba(255,180,0,0.15)');
  grd.addColorStop(1,   'rgba(255,140,0,0)');
  ctx.fillStyle = grd;
  ctx.beginPath(); ctx.arc(cx, cy, 55, 0, Math.PI*2); ctx.fill();
  // Disc
  const disc = ctx.createRadialGradient(cx-4, cy-4, 1, cx, cy, 22);
  disc.addColorStop(0, '#fff9d0');
  disc.addColorStop(0.5,'#ffe84d');
  disc.addColorStop(1, '#ffb700');
  ctx.fillStyle = disc;
  ctx.beginPath(); ctx.arc(cx, cy, 22, 0, Math.PI*2); ctx.fill();
}

function drawMoon(cx, cy) {
  // Glow halo
  const grd = ctx.createRadialGradient(cx, cy, 2, cx, cy, 42);
  grd.addColorStop(0,   'rgba(210,230,255,0.5)');
  grd.addColorStop(0.4, 'rgba(150,180,255,0.15)');
  grd.addColorStop(1,   'rgba(80,100,200,0)');
  ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(cx, cy, 42, 0, Math.PI*2); ctx.fill();
  // Moon disc
  ctx.fillStyle = '#e8f0ff'; ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI*2); ctx.fill();
  // Crescent shadow
  ctx.fillStyle = '#3a4a8c'; ctx.beginPath(); ctx.arc(cx+8, cy-4, 14, 0, Math.PI*2); ctx.fill();
  // Craters
  ctx.fillStyle = 'rgba(180,195,230,0.5)';
  [[cx-5, cy+4,3],[cx+2,cy-6,2],[cx-9,cy-3,1.5]].forEach(([x,y,r]) => {
    ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
  });
}

// Update canvas background based on time of day
function updateBackground() {
  const W = canvas.width, H = canvas.height;
  const t = Date.now() / 1000;

  // ── LEVEL 2 — Bosque nocturno ──────────────────────────────────
  if (currentLevel === 2) {
    // Deep forest night sky
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0,    '#01060d');
    sky.addColorStop(0.35, '#061225');
    sky.addColorStop(0.7,  '#0a1e1a');
    sky.addColorStop(1,    '#0d2010');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

    // Nebula-like forest fog bands
    const neb = ctx.createLinearGradient(0, H*0.1, W, H*0.5);
    neb.addColorStop(0,   'rgba(0,60,20,0.10)');
    neb.addColorStop(0.4, 'rgba(0,30,60,0.14)');
    neb.addColorStop(1,   'rgba(0,60,20,0.06)');
    ctx.fillStyle = neb; ctx.fillRect(0, 0, W, H*0.6);

    // Stars — draw in two passes (small/large) to minimize state changes
    const frame = Date.now();
    ctx.fillStyle = '#a0d8b0';
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    STARS.forEach(s => {
      if (s.r <= 1.2) { ctx.moveTo(s.x*W + s.r, s.y*H*0.65); ctx.arc(s.x*W, s.y*H*0.65, s.r, 0, Math.PI*2); }
    });
    ctx.fill();
    ctx.fillStyle = '#c8ffd0';
    ctx.beginPath();
    STARS.forEach(s => {
      if (s.r > 1.2) {
        const alpha = s.twinkle ? 0.55 + 0.3*Math.sin(frame*0.0012 + s.twinkle) : 0.85;
        ctx.globalAlpha = alpha;
        ctx.beginPath(); ctx.arc(s.x*W, s.y*H*0.65, s.r, 0, Math.PI*2); ctx.fill();
      }
    });
    ctx.globalAlpha = 1;

    // Forest moon (larger, greener tint)
    const mx = W * 0.75, my = H * 0.16;
    const mg = ctx.createRadialGradient(mx, my, 2, mx, my, 50);
    mg.addColorStop(0,   'rgba(180,255,200,0.4)');
    mg.addColorStop(0.5, 'rgba(100,200,120,0.12)');
    mg.addColorStop(1,   'rgba(0,80,40,0)');
    ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(mx, my, 50, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#d4fce0'; ctx.beginPath(); ctx.arc(mx, my, 20, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#1e3a20'; ctx.beginPath(); ctx.arc(mx+9, my-5, 16, 0, Math.PI*2); ctx.fill();

    // Distant silhouette forest (far parallax)
    ctx.save();
    ctx.fillStyle = '#071510';
    const treeCount = 18;
    for (let i = 0; i < treeCount; i++) {
      const wx = ((i * 173.3 + cameraX * 0.05) % W);
      const th = 55 + (i % 5) * 18;
      const tw = 28 + (i % 4) * 8;
      // Triangle tree silhouette
      ctx.beginPath();
      ctx.moveTo(wx, H * 0.62 - th);
      ctx.lineTo(wx - tw/2, H * 0.62);
      ctx.lineTo(wx + tw/2, H * 0.62);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();

    // Firefly particles
    const ffCount = 8;
    for (let i = 0; i < ffCount; i++) {
      const fx = ((i * 211.7 + t * 40 + i * 30) % W);
      const fy = H * 0.3 + Math.sin(t * 0.8 + i * 1.7) * H * 0.15;
      ctx.save();
      ctx.globalAlpha = 0.4 + 0.5 * Math.abs(Math.sin(t * 2.1 + i));
      ctx.shadowColor = '#aaff44';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#ccff88';
      ctx.beginPath(); ctx.arc(fx, fy, 2, 0, Math.PI*2); ctx.fill();
      ctx.restore();
    }

    // Ground-level fog strip
    const fog = ctx.createLinearGradient(0, H * 0.7, 0, H * 0.85);
    fog.addColorStop(0, 'rgba(0,30,10,0)');
    fog.addColorStop(1, 'rgba(0,20,8,0.55)');
    ctx.fillStyle = fog; ctx.fillRect(0, H*0.7, W, H*0.15);
    return;
  }

  // ── LEVEL 1 (original) ─────────────────────────────────────────
  if (player.x < SECTION_EVENING) {
    // ── DAY ──────────────────────────────────
    const sky = ctx.createLinearGradient(0, 0, 0, H * 0.85);
    sky.addColorStop(0,    '#1a6fc4');
    sky.addColorStop(0.45, '#4ca8f0');
    sky.addColorStop(0.75, '#7dd3fc');
    sky.addColorStop(1,    '#bae8ff');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    const haze = ctx.createLinearGradient(0, H*0.55, 0, H*0.85);
    haze.addColorStop(0, 'rgba(255,255,200,0)');
    haze.addColorStop(1, 'rgba(255,240,180,0.35)');
    ctx.fillStyle = haze; ctx.fillRect(0, H*0.55, W, H*0.3);
    drawSun(W * 0.82, H * 0.14);
    drawClouds('day');
    drawMountains('day');

  } else if (player.x < SECTION_NIGHT) {
    // ── EVENING ──────────────────────────────
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0,    '#1a0a3c');
    sky.addColorStop(0.28, '#6b1f6b');
    sky.addColorStop(0.55, '#c9391a');
    sky.addColorStop(0.78, '#f0721a');
    sky.addColorStop(1,    '#fdb96a');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    const glow = ctx.createRadialGradient(W*0.5, H*0.82, 10, W*0.5, H*0.82, W*0.7);
    glow.addColorStop(0,   'rgba(255,160,30,0.55)');
    glow.addColorStop(0.5, 'rgba(255,80,0,0.2)');
    glow.addColorStop(1,   'rgba(255,80,0,0)');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
    drawSun(W * 0.55, H * 0.72);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    STARS.slice(0,20).forEach(s => {
      ctx.beginPath(); ctx.arc(s.x*W, s.y*H*0.45, s.r*0.9, 0, Math.PI*2); ctx.fill();
    });
    drawClouds('evening');
    drawMountains('evening');

  } else {
    // ── NIGHT ────────────────────────────────
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0,   '#020818');
    sky.addColorStop(0.5, '#0a1535');
    sky.addColorStop(1,   '#16254a');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    const neb = ctx.createLinearGradient(0, H*0.05, W, H*0.4);
    neb.addColorStop(0,   'rgba(80,30,120,0.12)');
    neb.addColorStop(0.5, 'rgba(40,60,160,0.18)');
    neb.addColorStop(1,   'rgba(80,30,120,0.08)');
    ctx.fillStyle = neb; ctx.fillRect(0, 0, W, H*0.5);
    STARS.forEach(s => {
      const twinkle = s.twinkle ? 0.6 + 0.4*Math.sin(t*1.5 + s.twinkle) : 1;
      ctx.globalAlpha = twinkle * 0.9;
      ctx.fillStyle = s.r > 1.2 ? '#e8f0ff' : '#c8d8ff';
      ctx.beginPath(); ctx.arc(s.x*W, s.y*H*0.72, s.r, 0, Math.PI*2); ctx.fill();
    });
    ctx.globalAlpha = 1;
    drawMoon(W * 0.78, H * 0.18);
    drawMountains('night');
  }
}

// ── MONTAÑAS: perfil continuo (sin segmentos, sin módulo, sin saltos) ─
// La altura en cada píxel se calcula como worldX = screenX + cameraX*speed
// El perfil es una función continua: suma de senos con distintas frecuencias/fases.
// Al mover la cámara worldX cambia suavemente → sin saltos posibles.

function mountainProfile(worldX, li) {
  // Tres armónicos superpuestos, parámetros distintos por capa
  const params = [
    // [freq1,  freq2,  freq3,  phase1, phase2, phase3]   ← capa lejana
    [0.00480, 0.00820, 0.01340,  2.10,   4.70,   1.30],
    // ← capa media
    [0.00390, 0.00950, 0.01580,  3.20,   1.80,   5.60],
    // ← capa cercana
    [0.00610, 0.00540, 0.01020,  0.90,   6.10,   2.40],
  ][li];
  const [f1, f2, f3, p1, p2, p3] = params;
  // Cada armónico normalizado 0-1, pesos 50%+30%+20%
  return (
    0.50 * (0.5 + 0.5 * Math.sin(worldX * f1 + p1)) +
    0.30 * (0.5 + 0.5 * Math.sin(worldX * f2 + p2)) +
    0.20 * (0.5 + 0.5 * Math.sin(worldX * f3 + p3))
  );
}

function drawMountains(tod) {
  const W = canvas.width, H = canvas.height;
  const groundY = H * 0.76;

  // 3 capas: velocidad parallax creciente, escala creciente
  const layers = [
    { speed: 0.04, scaleMin: 0.10, scaleMax: 0.52, li: 0 }, // lejana
    { speed: 0.09, scaleMin: 0.14, scaleMax: 0.62, li: 1 }, // media
    { speed: 0.16, scaleMin: 0.18, scaleMax: 0.72, li: 2 }, // cercana
  ];

  layers.forEach(({ speed, scaleMin, scaleMax, li }) => {
    // ── Color degradado por capa y momento del día ──────────────
    let topCol, midCol, botCol;
    if (tod === 'day') {
      const c = [
        ['#7ea8d8', '#4a78aa', '#253c60'],
        ['#4e78a8', '#2e5080', '#162840'],
        ['#2e4878', '#1a3058', '#0c1c38'],
      ];
      [topCol, midCol, botCol] = c[li];
    } else if (tod === 'evening') {
      const c = [
        ['#a04090', '#6a2060', '#3c0e38'],
        ['#702468', '#481448', '#28082c'],
        ['#4a0e50', '#300838', '#180418'],
      ];
      [topCol, midCol, botCol] = c[li];
    } else {
      // noche
      const c = [
        ['#182040', '#0e1430', '#080e1e'],
        ['#101828', '#080e1c', '#040810'],
        ['#0c1420', '#070c18', '#030610'],
      ];
      [topCol, midCol, botCol] = c[li];
    }

    const grad = ctx.createLinearGradient(0, groundY * 0.08, 0, groundY);
    grad.addColorStop(0,    topCol);
    grad.addColorStop(0.45, midCol);
    grad.addColorStop(1,    botCol);
    ctx.fillStyle = grad;

    // ── Dibujar perfil como polilínea muestreada cada 3px ───────
    const layerScroll = cameraX * speed; // crece suavemente, sin módulo
    const STEP = 3;

    ctx.beginPath();
    ctx.moveTo(-STEP, groundY + 4);

    for (let sx = -STEP; sx <= W + STEP; sx += STEP) {
      const worldX = sx + layerScroll;
      const nh = mountainProfile(worldX, li);           // 0 - 1
      const h  = (scaleMin + nh * (scaleMax - scaleMin)) * groundY;
      ctx.lineTo(sx, groundY - h);
    }

    ctx.lineTo(W + STEP, groundY + 4);
    ctx.closePath();
    ctx.fill();

    // ── Línea de cresta sutil (solo capa cercana) ───────────────
    if (li === 2) {
      const alpha = tod === 'night' ? 0.18 : tod === 'evening' ? 0.13 : 0.09;
      const rgb   = tod === 'night'   ? '140,170,255' :
                    tod === 'evening' ? '255,155,95'  : '255,255,255';
      ctx.strokeStyle = `rgba(${rgb},${alpha})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      let first = true;
      for (let sx = -STEP; sx <= W + STEP; sx += STEP) {
        const worldX = sx + layerScroll;
        const nh = mountainProfile(worldX, li);
        const h  = (scaleMin + nh * (scaleMax - scaleMin)) * groundY;
        if (first) { ctx.moveTo(sx, groundY - h); first = false; }
        else        ctx.lineTo(sx, groundY - h);
      }
      ctx.stroke();
    }
  });
}

// Volumetric clouds
function drawClouds(tod) {
  const W = canvas.width, t = Date.now() / 1000;
  // 6 clouds at different depths/speeds/sizes
  const cloudDefs = [
    { depthSpeed: 0.18, yFrac: 0.12, size: 1.1, seed: 0   },
    { depthSpeed: 0.14, yFrac: 0.20, size: 0.85,seed: 200 },
    { depthSpeed: 0.22, yFrac: 0.08, size: 1.3, seed: 450 },
    { depthSpeed: 0.12, yFrac: 0.28, size: 0.7, seed: 700 },
    { depthSpeed: 0.20, yFrac: 0.16, size: 0.95,seed: 950 },
    { depthSpeed: 0.16, yFrac: 0.24, size: 1.0, seed: 1200}
  ];
  cloudDefs.forEach(cd => {
    const rawX = (cd.seed + t * 18 * cd.depthSpeed) % (W + 300) - 150;
    const cx = rawX - cameraX * cd.depthSpeed * 0.15;
    const cy = canvas.height * cd.yFrac;
    drawCloudShape(cx, cy, cd.size, tod);
  });
}

function drawCloudShape(cx, cy, scale, tod) {
  const s = scale;
  // Shadow
  ctx.save();
  ctx.globalAlpha = 0.15;
  ctx.fillStyle = tod === 'night' ? '#1a2550' : '#7fa8c8';
  ctx.beginPath();
  ctx.ellipse(cx + 5*s, cy + 14*s, 55*s, 14*s, 0, 0, Math.PI*2);
  ctx.fill();
  ctx.restore();

  // Cloud body gradient
  const topCol  = tod === 'night' ? '#2a3a6a' : tod === 'evening' ? '#e8c0a0' : '#ffffff';
  const midCol  = tod === 'night' ? '#1a2850' : tod === 'evening' ? '#c09070' : '#ddeeff';
  const botCol  = tod === 'night' ? '#0f1a38' : tod === 'evening' ? '#a07060' : '#b8d8f0';

  const cloudGrad = ctx.createLinearGradient(cx, cy - 28*s, cx, cy + 12*s);
  cloudGrad.addColorStop(0,   topCol);
  cloudGrad.addColorStop(0.5, midCol);
  cloudGrad.addColorStop(1,   botCol);

  ctx.fillStyle = cloudGrad;
  ctx.beginPath();
  // Main puffs
  ctx.arc(cx,        cy,       22*s, 0, Math.PI*2);
  ctx.arc(cx + 26*s, cy - 5*s, 28*s, 0, Math.PI*2);
  ctx.arc(cx + 52*s, cy,       20*s, 0, Math.PI*2);
  ctx.arc(cx + 14*s, cy - 16*s,18*s, 0, Math.PI*2);
  ctx.arc(cx + 38*s, cy - 18*s,16*s, 0, Math.PI*2);
  ctx.arc(cx - 14*s, cy + 4*s, 14*s, 0, Math.PI*2);
  ctx.fill();

  // Top highlight
  ctx.save();
  ctx.globalAlpha = tod === 'night' ? 0.05 : 0.5;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx + 22*s, cy - 14*s, 14*s, Math.PI, Math.PI*2);
  ctx.fill();
  ctx.restore();
}

// ── Checkpoint banner ─────────────────────────────────────────────
let checkpointBannerTimer = null;
function showCheckpointBanner(text) {
  // Create or reuse banner element
  let banner = document.getElementById('cp-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'cp-banner';
    banner.style.cssText = `
      position:absolute; top:18%; left:50%; transform:translateX(-50%);
      background:linear-gradient(135deg,rgba(17,153,142,0.92),rgba(56,239,125,0.92));
      color:#fff; font-size:clamp(13px,3.5vw,22px); font-weight:bold;
      padding:10px 28px; border-radius:40px; z-index:50; pointer-events:none;
      box-shadow:0 4px 24px rgba(56,239,125,0.5); letter-spacing:0.05em;
      white-space:nowrap; transition:opacity 0.5s;
      text-shadow:0 1px 4px rgba(0,0,0,0.4);
    `;
    document.getElementById('game-container').appendChild(banner);
  }
  banner.textContent = text;
  banner.style.opacity = '1';
  clearTimeout(checkpointBannerTimer);
  checkpointBannerTimer = setTimeout(() => { banner.style.opacity = '0'; }, 3000);
  // Sound cue
  try {
    const ac = getAC(); if (ac) {
      const t = ac.currentTime;
      sfxOsc('sine', 880, 60, t, 0.18, 0.2);
      sfxOsc('sine', 1320, 60, t+0.12, 0.15, 0.2);
      sfxOsc('sine', 1760, 80, t+0.24, 0.12, 0.22);
    }
  } catch(e) {}
}

// Resume from last checkpoint
function resumeFromCheckpoint() {
  gameOverScreen.style.display = 'none';
  document.getElementById('checkpoint-btn').style.display = 'none';
  document.getElementById('go-checkpoint-label').style.display = 'none';
  gameActive = true; paused = false;

  // ── Level 2 checkpoint: just restart level 2 from the start ──────
  if (currentLevel === 2 && level2CheckpointSaved) {
    coinsCollected = checkpointCoins;
    prevCoins = checkpointCoins;
    resizeCanvas();
    initGame(); // re-inits level 2 (currentLevel is already 2)
    if (gameTimerInterval) clearInterval(gameTimerInterval);
    gameTimerInterval = setInterval(() => {
      gameTimer--;
      timerDisplay.textContent = `⏱: ${gameTimer}s`;
      if (gameTimer <= 0) { gameOver(); }
    }, 1000);
    getAC();
    startMusicScheduler('forest');
    gameLoop();
    return;
  }

  // ── Level 1 checkpoint ────────────────────────────────────────────
  // Shared reset (keep coins from checkpoint, keep avatar)
  const savedAvatar     = purchasedAvatar;
  const savedAvatarBase = player?.baseEmoji ?? '😊';

  // Partial init — reset player + world but keep checkpoint progress
  resizeCanvas();
  player = {
    x: 100, y: roadY - 40, vx: 0, vy: 0, w: 40, h: 40,
    onGround: true, jumpCount: 0, maxJumps: 2, rotation: 0,
    emoji: "😊", baseEmoji: "😊", alive: true, health: 3,
    ghostMode: false, invincible: false, invincibleTimer: 0,
    fireBounce: false, angryAura: false, facingRight: true,
  };
  coinsCollected = checkpointCoins;
  coinsHud.textContent = `💰: ${coinsCollected}`;
  platforms = [{ x: 0, y: canvas.height - 60, w: 300, h: 20, type: 'flat' }];
  stairsPlatforms = []; cars = []; holes = []; obstacles = [];
  coins = []; enemies = []; particles = []; heartDrops = [];
  sunEnemy = null; ufo = null; weapons = []; ufoShots = [];
  star = null; storeEmoji = null;
  cameraX = 0; distance = 0; hearts = 3;
  currentPower = null; powerActive = false; roadOffset = 0;
  lastPlatformX = 300;
  screenShake = 0; damageFlash = 0; powerFlash = 0;
  powerAuraParticles = []; lastAuraSpawn = 0;
  helicopter = null; lastHeliSpawn = 0; heliSpawnCooldown = 0;
  nightBoss = null; nightBossActive = false; nightBossArena = false; bossDefeated = false;
  nightBossArenaX = 0; frozenEnemies = []; lastNightBossShot = 0;
  bossPhase2 = false; cameraY = 0; bossRainDrops = [];
  bossHitCooldown = 0; bossArenaPlatforms = [];
  avatarAttackActive = false; avatarAttackTimer = 0;
  purchasedAvatar = null; avatarPowerTimer = 0; reinforcedHearts = 0;
  selectingPower = false; currentSelectingPower = null;
  levelCompleted = false;
  gameTimer = 300;
  sunDefeated = false; lastSunSpawn = 0;
  flag = { x: LEVEL1_LENGTH, y: roadY - 40 };
  keysPressed = {}; keys = { left: false, right: false, jump: false, attack: false };
  prevKeys = { jump: false, attack: false };
  for (let p in powerCooldowns) powerCooldowns[p] = 0;
  powerSlots.forEach(sl => {
    sl.classList.remove('active','cooldown','disabled','selecting');
    sl.querySelector('.cooldown-overlay').style.height = '0';
    sl.querySelector('.cooldown-clock').style.display = 'none';
  });
  attackBtnWrapper.classList.add('inactive'); attackBtnWrapper.classList.remove('active-avatar');
  document.querySelector('#attack-btn-wrapper .base-emoji').textContent = '🟣';
  document.querySelector('#attack-btn-wrapper .overlay-emoji').textContent = '';
  updateHearts();
  timerDisplay.textContent = `⏱: ${gameTimer}s`;

  // Warp player to checkpoint position
  if (lastCheckpoint === 'evening') {
    player.x = SECTION_EVENING + 300;
    timeOfDay = 'evening';
    startMusicScheduler('evening');
  } else if (lastCheckpoint === 'night') {
    player.x = SECTION_NIGHT + 300;
    timeOfDay = 'night';
    startMusicScheduler('night');
  } else if (lastCheckpoint === 'boss') {
    // Start just before the boss arena
    const arenaW = Math.min(canvas.width * 1.6, 1100);
    player.x = LEVEL1_LENGTH - arenaW - 400;
    timeOfDay = 'night';
    startMusicScheduler('night');
  }
  cameraX = player.x - canvas.width / 3;
  player.y = roadY - 40;

  if (gameTimerInterval) clearInterval(gameTimerInterval);
  gameTimerInterval = setInterval(() => {
    gameTimer--;
    timerDisplay.textContent = `⏱: ${gameTimer}s`;
    if (gameTimer <= 0) { gameOver(); }
  }, 1000);

  gameLoop();
}

// Show Game Over screen
function gameOver() {
  gameActive = false;
  stopMusic();
  playGameOverSound();
  gameOverScreen.style.display = "flex";
  scoreDisplay.textContent = `Distancia: ${Math.floor(player.x/10)}m`;
  coinsDisplay.textContent = `💰: ${coinsCollected}`;
  clearTimeout(damageEmojiTimeout);
  prevCoins = coinsCollected;

  // Show checkpoint button in level 1 (if reached a checkpoint) OR in level 2 (always)
  const cpBtn   = document.getElementById('checkpoint-btn');
  const cpLabel = document.getElementById('go-checkpoint-label');
  if (currentLevel === 2 && level2CheckpointSaved) {
    cpLabel.textContent = '📍 Continuar en el Bosque Oscuro 🌳';
    cpLabel.style.display = 'block';
    cpBtn.style.display = 'block';
  } else if (currentLevel === 1 && lastCheckpoint !== null) {
    const labels = {
      evening: '📍 Vuelves al inicio de la tarde',
      night:   '📍 Vuelves al inicio de la noche',
      boss:    '📍 Vuelves al Jefe Final 🛸',
    };
    cpLabel.textContent = labels[lastCheckpoint] ?? '';
    cpLabel.style.display = 'block';
    cpBtn.style.display = 'block';
  } else {
    cpLabel.style.display = 'none';
    cpBtn.style.display = 'none';
  }

  if (gameLoopID) {
    cancelAnimationFrame(gameLoopID);
    gameLoopID = null;
  }
  if (gameTimerInterval) {
    clearInterval(gameTimerInterval);
    gameTimerInterval = null;
  }
}

// ── Boss defeat dialogue cutscene ─────────────────────────────────
function showBossComic() {
  gameActive = false;
  stopMusic();
  if (gameLoopID) { cancelAnimationFrame(gameLoopID); gameLoopID = null; }
  if (gameTimerInterval) { clearInterval(gameTimerInterval); gameTimerInterval = null; }

  const comic   = document.getElementById('boss-comic');
  const leftCh  = document.getElementById('bcomic-left-char');
  const rightCh = document.getElementById('bcomic-right-char');
  const name    = document.getElementById('bcomic-speaker-name');
  const text    = document.getElementById('bcomic-text');
  const dotsBox = document.getElementById('bcomic-dots');
  const hint    = document.getElementById('bcomic-tap-hint');

  // Dialogue: left = 🛸 (ship), right = 😊 (player)
  // speaker: 'ship' | 'player'
  const dialogue = [
    { speaker:'ship',   line:'¡Im-posible... ¡Me has vencido! 😤' },
    { speaker:'player', line:'¡Sí! ¡El mundo está a salvo! 🎉' },
    { speaker:'ship',   line:'¡Ingenuo! Mis aliados ya se adentran en el Bosque Oscuro... 🌳' },
    { speaker:'player', line:'¡Entonces iré a detenerlos! 💪' },
    { speaker:'ship',   line:'¡Allí encontrarás cosas que no esperas, terrícola! 👾' },
    { speaker:'player', line:'¡Me las arreglaré! Siempre lo hago 😎' },
    { speaker:'ship',   line:'¡Hasta la próxima... si sobrevives! 🚀', leaves:true },
  ];

  // Build dots
  dotsBox.innerHTML = '';
  dialogue.forEach((_, i) => {
    const d = document.createElement('div');
    d.className = 'bcomic-dot' + (i === 0 ? ' active' : '');
    dotsBox.appendChild(d);
  });
  const dots = dotsBox.querySelectorAll('.bcomic-dot');

  let step = 0;
  let autoTimer = null;
  let finished = false;

  function showStep(i) {
    if (i >= dialogue.length) { endComic(); return; }
    const d = dialogue[i];
    const isShip = d.speaker === 'ship';

    // Update dots
    dots.forEach((dot, idx) => dot.classList.toggle('active', idx === i));

    // Characters: ship on left, player on right
    leftCh.textContent  = '🛸';
    rightCh.textContent = '😊';
    leftCh.classList.toggle('speaking', isShip);
    leftCh.classList.toggle('silent',   !isShip);
    rightCh.classList.toggle('speaking', !isShip);
    rightCh.classList.toggle('silent',    isShip);

    // Ship leaves on last panel
    if (d.leaves) {
      setTimeout(() => leftCh.classList.add('leaving'), 400);
    }

    // Speaker label
    name.textContent  = isShip ? '🛸 NAVE ENEMIGA' : '😊 TÚ';
    name.style.color  = isShip ? '#c040ff' : '#0090ff';

    // Animate text in
    text.style.opacity = '0';
    setTimeout(() => {
      text.textContent  = d.line;
      text.style.transition = 'opacity 0.3s';
      text.style.opacity = '1';
    }, 80);

    // Re-trigger bubble animation
    const box = document.getElementById('bcomic-bubble-box');
    box.style.animation = 'none';
    void box.offsetWidth; // force reflow
    box.style.animation = '';

    // Auto-advance after 2.8s
    if (autoTimer) clearTimeout(autoTimer);
    autoTimer = setTimeout(() => { step++; showStep(step); }, 2800);
  }

  function endComic() {
    if (finished) return;
    finished = true;
    if (autoTimer) clearTimeout(autoTimer);
    comic.style.transition = 'opacity 0.7s';
    comic.style.opacity = '0';
    setTimeout(() => {
      comic.classList.remove('show');
      comic.style.opacity = '';
      comic.style.transition = '';
      nextLevel();
    }, 720);
  }

  // Tap anywhere to advance
  function onTap() { step++; showStep(step); }
  comic.addEventListener('click',       onTap);
  comic.addEventListener('touchstart',  onTap, { passive: true });

  // Show comic
  comic.classList.add('show');
  setTimeout(() => showStep(0), 300);
}

// Show Victory screen
function victory() {
  gameActive = false;
  levelCompleted = true;
  stopMusic();
  playVictorySound();

  if (gameLoopID) { cancelAnimationFrame(gameLoopID); gameLoopID = null; }
  if (gameTimerInterval) { clearInterval(gameTimerInterval); gameTimerInterval = null; }

  if (currentLevel === 1) {
    // Normal Level 1 win → show victory screen with next level button
    victoryScreen.style.display = "flex";
    scoreVictory.textContent = `Distancia: ${Math.floor(player.x/10)}m`;
    coinsVictory.textContent = `💰: ${coinsCollected}`;
    const victoryMsg = document.getElementById('victory-message');
    if (victoryMsg) victoryMsg.textContent = '¡Has vencido al 🛸 y completado el Nivel 1! ¡Siguiente parada: el Bosque Oscuro! 🌳';
    nextLevelBtn.style.display = 'block';
  } else {
    // Level 2 complete → show credits screen
    // Send win message to parent game (for iframe integration)
    if (window.parent && window.parent !== window) {
      setTimeout(() => {
        window.parent.postMessage('EMOJIGAME_WIN', '*');
      }, 1000);
    }
    setTimeout(() => showCredits(), 400);
  }
}

// Advance to Level 2
function nextLevel() {
  currentLevel = 2;
  prevCoins = coinsCollected;
  level2CheckpointSaved = true;          // checkpoint: player reached level 2
  checkpointCoins = coinsCollected;      // save coins for level 2 continue
  victoryScreen.style.display = 'none';
  gameActive = true;
  paused = false;
  resizeCanvas();
  initGame();
  if (gameTimerInterval) clearInterval(gameTimerInterval);
  gameTimerInterval = setInterval(() => {
    gameTimer--;
    timerDisplay.textContent = `⏱: ${gameTimer}s`;
    if (gameTimer <= 0) { gameOver(); }
  }, 1000);
  getAC();
  startMusicScheduler('forest');
  gameLoop();
}

// Start the game
function startGame() {
  stopPrologueMusic();
  startScreen.style.display = "none";
  gameActive = true;
  paused = false;
  resizeCanvas();
  initGame();
  // NG+ mode: re-enable attack button if player had weapon
  if (ngPlusMode && purchasedAvatar) {
    const atkBtn = document.getElementById('attack-btn-wrapper');
    if (atkBtn) atkBtn.classList.remove('inactive');
  }
  
  // Iniciar temporizador
  if (gameTimerInterval) clearInterval(gameTimerInterval);
  gameTimerInterval = setInterval(() => {
    gameTimer--;
    timerDisplay.textContent = `⏱: ${gameTimer}s`;
    if (gameTimer <= 0) { gameOver(); }
  }, 1000);

  // Start music
  getAC();
  startMusicScheduler(currentLevel === 2 ? 'forest' : 'day');
  
  gameLoop();
}

// Reset the game
function resetGame() {
  currentLevel = 1;
  level2CheckpointSaved = false;
  gameOverScreen.style.display = "none";
  victoryScreen.style.display = "none";
  creditsScreen.classList.remove('show');
  if (!ngPlusMode) {
    coinsCollected = 0;
    prevCoins = 0;
  }
  startGame();
}

// Open the avatar store
function openStore() {
  paused = true;
  store.style.display = 'flex';
  
  if (gameLoopID) {
    cancelAnimationFrame(gameLoopID);
    gameLoopID = null;
  }
  
  keysPressed = {};
  keys = { left: false, right: false, jump: false, attack: false };
  prevKeys = { jump: false, attack: false };
  
  document.querySelectorAll('.buy-btn').forEach(btn => {
    const cost = parseInt(btn.dataset.cost);
    btn.disabled = coinsCollected < cost;
  });
}

// Close the avatar store
function closeStore() {
  store.style.display = 'none';
  paused = false;
  
  // Restaurar corazones al salir de la tienda
  player.health = 3;
  updateHearts();
  
  keysPressed = {};
  keys = { left: false, right: false, jump: false, attack: false };
  prevKeys = { jump: false, attack: false };
  
  gameLoop();
}

// Buy an avatar
function buyAvatar(avatar, cost) {
  if (coinsCollected >= cost) {
    coinsCollected -= cost;
    coinsHud.textContent = `💰: ${coinsCollected}`;
    purchasedAvatar = avatar;

    // Start 20-second power timer and grant 3 reinforced hearts
    avatarPowerTimer = AVATAR_POWER_DURATION;
    reinforcedHearts = 3;

    switch(avatar) {
      case 'cowboy':
        player.baseEmoji = '🤠';
        document.querySelector('#attack-btn-wrapper .base-emoji').textContent = '🟣';
        document.querySelector('#attack-btn-wrapper .overlay-emoji').textContent = '🪃';
        attackBtnWrapper.classList.remove('inactive'); attackBtnWrapper.classList.add('active-avatar');
        break;
        
      case 'fist':
        player.baseEmoji = '😁';
        document.querySelector('#attack-btn-wrapper .base-emoji').textContent = '🟣';
        document.querySelector('#attack-btn-wrapper .overlay-emoji').textContent = '🤜🏻';
        attackBtnWrapper.classList.remove('inactive'); attackBtnWrapper.classList.add('active-avatar');
        break;
        
      case 'eagle':
        player.baseEmoji = '🦅';
        attackBtnWrapper.classList.add('inactive'); attackBtnWrapper.classList.remove('active-avatar');
        break;
    }
    
    player.emoji = player.baseEmoji;
    
    if (powerActive) {
      deactivatePower();
    }
    
    powerSlots.forEach(slot => {
      slot.classList.add('disabled');
    });
    
    closeStore();
  }
}

// Start the bonus level (memory game)
function startBonusGame() {
  gameActive = false;
  bonusGameActive = true;
  bonusStage.style.display = "flex";
  bonusMessage.textContent = "";
  playBonusSound();
  // Pause main music during bonus
  if (_ac && _musicGain) _musicGain.gain.setTargetAtTime(0.15, _ac.currentTime, 0.3);

  if (gameLoopID) {
    cancelAnimationFrame(gameLoopID);
    gameLoopID = null;
  }
  
  initBonusGame();
}

// End the bonus level
function endBonusGame() {
  bonusGameActive = false;
  bonusStage.style.display = "none";
  gameActive = true;
  // Restore music
  if (_ac && _musicGain) _musicGain.gain.setTargetAtTime(0.55, _ac.currentTime, 0.5);
  clearInterval(bonusGameTimer);
  bonusGameTimer = null;
  
  // Restaurar corazones al salir del bonus
  player.health = 3;
  updateHearts();
  
  gameLoop();
}

// Initialize the bonus minigame (create cards and timer)
function initBonusGame() {
  flippedCards = [];
  matchedPairs = 0;
  bonusTimeLeft = 60;
  bonusTimer.textContent = bonusTimeLeft;
  
  const emojiPairs = [];
  const selectedEmojis = [];
  
  while (selectedEmojis.length < 8) {
    const randomEmoji = bonusEmojis[Math.floor(Math.random() * bonusEmojis.length)];
    if (!selectedEmojis.includes(randomEmoji)) {
      selectedEmojis.push(randomEmoji);
    }
  }
  
  selectedEmojis.forEach(emoji => {
    emojiPairs.push(emoji);
    emojiPairs.push(emoji);
  });
  
  for (let i = emojiPairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [emojiPairs[i], emojiPairs[j]] = [emojiPairs[j], emojiPairs[i]];
  }
  
  bonusGrid.innerHTML = "";
  bonusCards = [];
  
  emojiPairs.forEach((emoji, index) => {
    const card = document.createElement('div');
    card.className = 'bonus-card';
    card.dataset.index = index;
    card.innerHTML = `
      <div class="back">?</div>
      <div class="front">${emoji}</div>
    `;
    card.addEventListener('click', () => flipCard(index));
    bonusGrid.appendChild(card);
    bonusCards.push({
      emoji: emoji,
      element: card,
      flipped: false,
      matched: false
    });
  });
  
  if (bonusGameTimer) {
    clearInterval(bonusGameTimer);
  }
  bonusGameTimer = setInterval(() => {
    bonusTimeLeft--;
    bonusTimer.textContent = bonusTimeLeft;
    
    if (bonusTimeLeft <= 0) {
      clearInterval(bonusGameTimer);
      bonusGameTimer = null;
      bonusMessage.textContent = "¡Tiempo agotado! Volviendo al juego...";
      setTimeout(endBonusGame, 2000);
    }
  }, 1000);
}

// Flip a card in the memory minigame
function flipCard(index) {
  const card = bonusCards[index];
  
  if (card.flipped || card.matched || flippedCards.length >= 2) {
    return;
  }
  
  card.flipped = true;
  card.element.classList.add('flipped');
  flippedCards.push(index);
  
  if (flippedCards.length === 2) {
    const card1 = bonusCards[flippedCards[0]];
    const card2 = bonusCards[flippedCards[1]];
    
    if (card1.emoji === card2.emoji) {
      card1.matched = true;
      card2.matched = true;
      matchedPairs++;
      
      flippedCards = [];
      
      if (matchedPairs === 8) {
        clearInterval(bonusGameTimer);
        bonusGameTimer = null;
        coinsCollected += 20;
        coinsHud.textContent = `💰: ${coinsCollected}`;
        bonusMessage.textContent = "¡Felicidades! Ganaste 20 monedas extra";
        setTimeout(endBonusGame, 3000);
      }
    } else {
      setTimeout(() => {
        card1.flipped = false;
        card2.flipped = false;
        card1.element.classList.remove('flipped');
        card2.element.classList.remove('flipped');
        flippedCards = [];
      }, 1000);
    }
  }
}

// Main game loop
function gameLoop() {
  if (!gameActive || bonusGameActive || paused) {
      gameLoopID = null;
      return;
  }
  
  gameLoopID = requestAnimationFrame(gameLoop);
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // Reset shadow state — leftover from previous frame causes unexpected glows
  ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'; ctx.globalAlpha = 1;

  // --- Screen shake ---
  let shakeApplied = false;
  if (screenShake > 0) {
    const sx = (Math.random() - 0.5) * screenShake;
    const sy = (Math.random() - 0.5) * screenShake;
    screenShake = Math.max(0, screenShake - 0.85);
    ctx.save();
    ctx.translate(sx, sy);
    shakeApplied = true;
  }

  // --- Vertical camera (phase 2 boss) ---
  // Apply vertical offset so world coords shift to correct screen position
  // cameraY is negative when camera scrolled up (e.g. cameraY=-200 → canvas shifts +200 down)
  if (cameraY !== 0) {
    ctx.save();
    ctx.translate(0, -cameraY);
  }

  updateBackground();
  updateMusicTheme();
  
  if (currentLevel === 1) {
    drawRoad();
    drawPlatforms();
    generateLevel();
    drawEnemies();
  } else {
    drawTrail();
    drawPlatformsLevel2();
    generateLevel();
    drawTrees();
    drawAnimals();
    drawEnemiesLevel2();
    if (!bossActive) {
      updateAsteroids();
      for (let a of asteroids) a.draw();
    }
    // Hide timer + coins during boss fight so health bar is unobstructed
    timerDisplay.style.display = bossActive ? 'none' : '';
    coinsHud.style.display     = bossActive ? 'none' : '';
  }
  drawCoins();
  
  if (purchasedAvatar || elvenPowersActive) {
    drawWeapons();
  }

  // --- Power aura effects ---
  spawnAuraParticles();
  drawAuraParticles();
  drawPowerAura();
  
  // Draw player
  let rotation = player.rotation;
  if (purchasedAvatar === 'kangaroo' || purchasedAvatar === 'eagle') {
    rotation = 0;
  }
  const playerGlow = (powerActive && currentPower && POWER_COLORS[currentPower]) ? POWER_COLORS[currentPower].glow : null;
  drawEmoji(player.x, player.y, player.emoji, player.w, rotation, playerGlow);
  
  updatePlayer();
  
  drawParticles();
  drawHeartDrops();

  // Restore vertical camera transform (HUD draws in screen space below)
  if (cameraY !== 0) {
    ctx.restore();

    // Phase 2 rain streaks — atmospheric effect in screen space
    if (bossPhase2) {
      ctx.save();
      ctx.globalAlpha = 0.15;
      ctx.strokeStyle = '#88bbff';
      ctx.lineWidth = 1.2;
      for (let r = 0; r < 22; r++) {
        const rx = ((r * 137 + Date.now() * 0.08) % (canvas.width - 60)) + 30;
        const ry = ((r * 89  + Date.now() * 0.13) % canvas.height);
        ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - 2, ry + 16); ctx.stroke();
      }
      ctx.restore();
    }
  }

  // Restore shake transform
  if (shakeApplied) ctx.restore();

  // --- Cool freeze overlay (enemies frozen) ---
  if (coolFreezeActive) {
    ctx.save();
    const freezeAlpha = 0.07 + 0.04 * Math.sin(Date.now() / 120);
    ctx.fillStyle = `rgba(100,210,255,${freezeAlpha})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Timer bar at bottom showing remaining freeze time
    const barW = canvas.width * 0.5;
    const barX = (canvas.width - barW) / 2;
    const barY = canvas.height - 8;
    const frac = coolFreezeTimer / 420;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(barX - 1, barY - 1, barW + 2, 7);
    ctx.fillStyle = `rgba(100,220,255,0.85)`;
    ctx.fillRect(barX, barY, barW * frac, 5);
    ctx.font = 'bold 10px sans-serif';
    ctx.fillStyle = 'rgba(200,240,255,0.9)';
    ctx.textAlign = 'center';
    ctx.fillText('😎 FREEZE', canvas.width / 2, barY - 4);
    ctx.restore();
  }

  // --- Damage flash overlay ---
  if (damageFlash > 0) {
    ctx.save();
    ctx.fillStyle = `rgba(255,20,20,${(damageFlash / 12) * 0.4})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    damageFlash--;
    ctx.restore();
  }

  // --- Power flash overlay ---
  if (powerFlash > 0) {
    ctx.save();
    const alphaHex = Math.floor((powerFlash / 8) * 80).toString(16).padStart(2, '0');
    ctx.fillStyle = powerFlashColor + alphaHex;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    powerFlash--;
    ctx.restore();
  }
}

// (drawCloud replaced by drawClouds/drawCloudShape above)

// Adjust canvas size to container
function resizeCanvas() {
  const container = canvas.parentElement;
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight * 0.65;
  roadY = canvas.height - 60;
  trailY = canvas.height - 60;
}

// Set up event listeners for controls and buttons
function setupEventListeners() {
  // Left and Right buttons
  [leftBtn, rightBtn].forEach(btn => {
    const action = btn.id;
    btn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      if (gameActive) keys[action] = true;
      keysPressed[action] = true;
    });
    btn.addEventListener("touchend", (e) => {
      e.preventDefault();
      keys[action] = false;
      keysPressed[action] = false;
    });
    btn.addEventListener("touchcancel", (e) => {
      e.preventDefault();
      keys[action] = false;
      keysPressed[action] = false;
    });
    btn.addEventListener("mousedown", () => {
      if (gameActive) keys[action] = true;
      keysPressed[action] = true;
    });
    btn.addEventListener("mouseup", () => {
      keys[action] = false;
      keysPressed[action] = false;
    });
    btn.addEventListener("mouseleave", () => {
      keys[action] = false;
      keysPressed[action] = false;
    });
  });

  // Jump button
  jumpBtnWrapper.addEventListener("touchstart", (e) => {
    e.preventDefault();
    if (gameActive) keys.jump = true;
    keysPressed.jump = true;
  });
  jumpBtnWrapper.addEventListener("touchend", (e) => {
    e.preventDefault();
    keys.jump = false;
    keysPressed.jump = false;
  });
  jumpBtnWrapper.addEventListener("touchcancel", (e) => {
    e.preventDefault();
    keys.jump = false;
    keysPressed.jump = false;
  });
  jumpBtnWrapper.addEventListener("mousedown", () => {
    if (gameActive) keys.jump = true;
    keysPressed.jump = true;
  });
  jumpBtnWrapper.addEventListener("mouseup", () => {
    keys.jump = false;
    keysPressed.jump = false;
  });
  jumpBtnWrapper.addEventListener("mouseleave", () => {
    keys.jump = false;
    keysPressed.jump = false;
  });

  // Attack button
  attackBtnWrapper.addEventListener("touchstart", (e) => {
    e.preventDefault();
    if (gameActive && !attackBtnWrapper.classList.contains('inactive')) keys.attack = true;
    keysPressed.attack = true;
  });
  attackBtnWrapper.addEventListener("touchend", (e) => {
    e.preventDefault();
    keys.attack = false;
    keysPressed.attack = false;
  });
  attackBtnWrapper.addEventListener("touchcancel", (e) => {
    e.preventDefault();
    keys.attack = false;
    keysPressed.attack = false;
  });
  attackBtnWrapper.addEventListener("mousedown", () => {
    if (gameActive && !attackBtnWrapper.classList.contains('inactive')) keys.attack = true;
    keysPressed.attack = true;
  });
  attackBtnWrapper.addEventListener("mouseup", () => {
    keys.attack = false;
    keysPressed.attack = false;
  });
  attackBtnWrapper.addEventListener("mouseleave", () => {
    keys.attack = false;
    keysPressed.attack = false;
  });

  // Power slots — free switching when elvenPowersActive
  powerSlots.forEach(slot => {
    const tryActivate = (e) => {
      e.preventDefault(); e.stopPropagation();
      if (!gameActive) return;
      const power = slot.dataset.power;
      if (elvenPowersActive) {
        activatePower(power); // always allowed
        return;
      }
      if (slot.classList.contains('cooldown') || slot.classList.contains('disabled') || powerActive || purchasedAvatar) return;
      slot.classList.add('selecting');
      currentSelectingPower = power;
      selectingPower = true;
    };
    const tryConfirm = (e) => {
      e.preventDefault(); e.stopPropagation();
      if (elvenPowersActive) return; // already handled in tryActivate
      if (selectingPower && slot.classList.contains('selecting')) {
        activatePower(slot.dataset.power);
      }
      slot.classList.remove('selecting');
      selectingPower = false; currentSelectingPower = null;
    };
    const cancel = (e) => {
      e.preventDefault();
      slot.classList.remove('selecting');
      selectingPower = false; currentSelectingPower = null;
    };
    slot.addEventListener('touchstart',  tryActivate, { passive: false });
    slot.addEventListener('touchend',    tryConfirm,  { passive: false });
    slot.addEventListener('touchcancel', cancel,      { passive: false });
    slot.addEventListener('mousedown',   tryActivate, { passive: false });
    slot.addEventListener('mouseup',     tryConfirm,  { passive: false });
    slot.addEventListener('mouseleave',  cancel,      { passive: false });
  });

  restartBtn.addEventListener('click', () => { ngPlusMode = false; resetGame(); });
  playBtn.addEventListener("click", startGame);
  playAgainBtn.addEventListener('click', () => { ngPlusMode = false; resetGame(); });
  nextLevelBtn.addEventListener("click", nextLevel);
  window.addEventListener('resize', resizeCanvas);
  
  backBtn.addEventListener('click', closeStore);
  
  buyBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const avatar = this.dataset.avatar;
      const cost = parseInt(this.dataset.cost);
      buyAvatar(avatar, cost);
    });
  });
  
  document.addEventListener('selectstart', e => e.preventDefault());
  document.addEventListener('mousedown', e => {
    if (e.target.nodeName !== 'BUTTON') {
      e.preventDefault();
    }
  });
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') keysPressed.left = true;
    if (e.key === 'ArrowRight') keysPressed.right = true;
    if (e.key === 'ArrowUp' || e.key === ' ') keysPressed.jump = true;
    if (e.key === 'a' || e.key === 'A') keysPressed.attack = true;
  });
  
  document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft') keysPressed.left = false;
    if (e.key === 'ArrowRight') keysPressed.right = false;
    if (e.key === 'ArrowUp' || e.key === ' ') keysPressed.jump = false;
    if (e.key === 'a' || e.key === 'A') keysPressed.attack = false;
  });
  
  if (keyCheckInterval) clearInterval(keyCheckInterval);
  keyCheckInterval = setInterval(() => {
    keys.left = keysPressed.left;
    keys.right = keysPressed.right;
    keys.jump = keysPressed.jump;
    keys.attack = keysPressed.attack;
  }, 50);
}

// ═══════════════════════════════════════════════════════════════════
//  MELODÍA DEL PRÓLOGO — Intro épica tipo aventura animada
//  Re mayor | 72 BPM | Cuerda + viento + bajo + pad
//  Sistema simple y robusto: un setTimeout por nota, sin scheduler complejo
// ═══════════════════════════════════════════════════════════════════

let _prlAC    = null;
let _prlGain  = null;
let _prlTimers = [];   // IDs de setTimeout para poder cancelar
let _prlRunning = false;

// Frecuencias (Re mayor)
const PF = {
  D3:146.83, E3:164.81, Fs3:185.00, G3:196.00, A3:220.00, B3:246.94, Cs4:277.18,
  D4:293.66, E4:329.63, Fs4:369.99, G4:392.00, A4:440.00, B4:493.88, Cs5:554.37,
  D5:587.33, E5:659.25, Fs5:739.99, G5:783.99, A5:880.00,
  R: 0
};

const _PB = 60 / 72; // segundos por negra (72 BPM)

// Secuencias: [frecuencia, duracion_negras]
const PRL_MEL = [
  // Frase A — apertura heroica
  [PF.D5,2],[PF.B4,1],[PF.G4,1],
  [PF.A4,1.5],[PF.B4,0.5],[PF.D5,1],[PF.R,1],
  [PF.E5,1.5],[PF.D5,0.5],[PF.B4,1],[PF.A4,1],
  [PF.G4,2],[PF.Fs4,1],[PF.R,1],
  // Frase B — tensión
  [PF.G4,1],[PF.A4,1],[PF.B4,1],[PF.Cs5,1],
  [PF.D5,1],[PF.E5,1],[PF.Cs5,2],
  [PF.B4,1.5],[PF.A4,0.5],[PF.G4,1],[PF.Fs4,1],
  [PF.A4,3],[PF.R,1],
  // Frase A' — reexposición alta
  [PF.D5,1],[PF.E5,1],[PF.Fs5,1],[PF.G5,1],
  [PF.A5,2],[PF.G5,1],[PF.E5,1],
  [PF.Fs5,1.5],[PF.E5,0.5],[PF.D5,1],[PF.B4,1],
  [PF.G4,1.5],[PF.A4,0.5],[PF.R,2],
  // Cadencia — resolución
  [PF.Cs5,1],[PF.D5,1],[PF.E5,1],[PF.D5,1],
  [PF.B4,1],[PF.G4,1],[PF.A4,2],
  [PF.G4,1],[PF.Fs4,1],[PF.E4,1],[PF.D4,1],
  [PF.D4,4],
];

const PRL_HARM = [
  [PF.B4,2],[PF.G4,1],[PF.E4,1],
  [PF.Fs4,1.5],[PF.G4,0.5],[PF.B4,1],[PF.R,1],
  [PF.Cs5,1.5],[PF.B4,0.5],[PF.G4,1],[PF.Fs4,1],
  [PF.E4,2],[PF.D4,1],[PF.R,1],
  [PF.E4,1],[PF.Fs4,1],[PF.G4,1],[PF.A4,1],
  [PF.B4,1],[PF.Cs5,1],[PF.A4,2],
  [PF.G4,1.5],[PF.Fs4,0.5],[PF.E4,1],[PF.D4,1],
  [PF.Fs4,3],[PF.R,1],
  [PF.B4,1],[PF.Cs5,1],[PF.D5,1],[PF.E5,1],
  [PF.Fs5,2],[PF.E5,1],[PF.Cs5,1],
  [PF.D5,1.5],[PF.Cs5,0.5],[PF.B4,1],[PF.G4,1],
  [PF.E4,1.5],[PF.Fs4,0.5],[PF.R,2],
  [PF.A4,1],[PF.B4,1],[PF.Cs5,1],[PF.B4,1],
  [PF.G4,1],[PF.E4,1],[PF.Fs4,2],
  [PF.E4,1],[PF.D4,1],[PF.Cs4,1],[PF.B3,1],
  [PF.Fs4,4],
];

const PRL_BASS = [
  [PF.D3,4],[PF.A3,4],[PF.G3,4],[PF.D3,4],
  [PF.G3,4],[PF.A3,4],[PF.D3,4],[PF.A3,4],
  [PF.G3,4],[PF.D3,4],[PF.B3,4],[PF.G3,4],
  [PF.A3,4],[PF.D3,4],[PF.A3,4],[PF.D3,4],
];

// Sintetiza una nota de cuerda directamente en el AudioContext
function _prlNote(freq, startSec, durSec, vol, type) {
  if (!freq || !_prlAC || !_prlGain) return;
  try {
    const o = _prlAC.createOscillator();
    const g = _prlAC.createGain();

    if (type === 'string') {
      o.type = 'sawtooth';
      const flt = _prlAC.createBiquadFilter();
      flt.type = 'lowpass';
      flt.frequency.value = 1600;
      o.connect(flt); flt.connect(g);
    } else if (type === 'wind') {
      o.type = 'sine';
      const o2 = _prlAC.createOscillator();
      const g2 = _prlAC.createGain();
      o2.type = 'sine'; o2.frequency.value = freq * 2;
      g2.gain.value = 0.18;
      o2.connect(g2); g2.connect(g);
      o2.start(startSec); o2.stop(startSec + durSec + 0.1);
      o.connect(g);
    } else if (type === 'bass') {
      o.type = 'triangle';
      o.connect(g);
      // Pizzicato: decay corto
      durSec = Math.min(durSec, 1.0);
    } else {
      o.connect(g);
    }

    o.frequency.value = freq;

    // ADSR
    const att = type === 'bass' ? 0.01 : 0.06;
    const rel = type === 'bass' ? 0.4  : 0.2;
    g.gain.setValueAtTime(0, startSec);
    g.gain.linearRampToValueAtTime(vol, startSec + att);
    g.gain.setValueAtTime(vol * 0.85, startSec + durSec * 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, startSec + durSec + rel);

    g.connect(_prlGain);
    o.start(startSec);
    o.stop(startSec + durSec + rel + 0.05);
  } catch(e) {}
}

// Convierte secuencia a lista de {t_ms, freq, dur_sec}
function _seqMs(seq) {
  const out = []; let t = 0;
  seq.forEach(([f, b]) => {
    out.push({ t_ms: Math.round(t * 1000), freq: f, dur: b * _PB * 0.88 });
    t += b * _PB;
  });
  return { notes: out, total_ms: Math.round(t * 1000) };
}

function _schedulePrlLoop(delayMs) {
  if (!_prlRunning || !_prlAC) return;

  const mel  = _seqMs(PRL_MEL);
  const harm = _seqMs(PRL_HARM);
  const bass = _seqMs(PRL_BASS);
  const loopMs = mel.total_ms;

  // Fade-in en el primer loop
  const now = _prlAC.currentTime;
  if (_prlGain.gain.value < 0.05) {
    _prlGain.gain.setValueAtTime(0, now);
    _prlGain.gain.linearRampToValueAtTime(0.60, now + 2.5);
  }

  mel.notes.forEach(n => {
    const id = setTimeout(() => {
      if (!_prlRunning || !_prlAC) return;
      const t = _prlAC.currentTime;
      _prlNote(n.freq, t + 0.01, n.dur, 0.22, 'string');
    }, delayMs + n.t_ms);
    _prlTimers.push(id);
  });

  harm.notes.forEach(n => {
    const id = setTimeout(() => {
      if (!_prlRunning || !_prlAC) return;
      const t = _prlAC.currentTime;
      _prlNote(n.freq, t + 0.01, n.dur, 0.13, 'wind');
    }, delayMs + n.t_ms);
    _prlTimers.push(id);
  });

  bass.notes.forEach(n => {
    const id = setTimeout(() => {
      if (!_prlRunning || !_prlAC) return;
      const t = _prlAC.currentTime;
      _prlNote(n.freq, t + 0.01, n.dur, 0.30, 'bass');
    }, delayMs + n.t_ms);
    _prlTimers.push(id);
  });

  // Programar el siguiente loop al final de este
  const nextId = setTimeout(() => {
    if (_prlRunning) _schedulePrlLoop(0);
  }, delayMs + loopMs);
  _prlTimers.push(nextId);
}

function startPrologueMusic() {
  if (_prlRunning) return;
  try {
    _prlAC   = new (window.AudioContext || window.webkitAudioContext)();
    _prlGain = _prlAC.createGain();
    _prlGain.gain.value = 0;
    _prlGain.connect(_prlAC.destination);
    _prlAC.resume().catch(() => {});
  } catch(e) { return; }
  _prlRunning = true;
  _schedulePrlLoop(80); // pequeño delay inicial
}

function stopPrologueMusic() {
  _prlRunning = false;
  _prlTimers.forEach(id => clearTimeout(id));
  _prlTimers = [];
  if (_prlGain && _prlAC) {
    try { _prlGain.gain.setTargetAtTime(0, _prlAC.currentTime, 0.4); } catch(e) {}
  }
  setTimeout(() => {
    if (_prlAC) { try { _prlAC.close(); } catch(e) {} _prlAC = null; _prlGain = null; }
  }, 1500);
}


// ===== PRÓLOGO — CHAT MESSENGER STYLE =====
let currentPage = 0;
let ngPlusMode  = false; // New Game+ after beating game

const chatArea   = document.getElementById('chat-messages-area');
const prevPageBtn = document.getElementById('prev-page');
const nextPageBtn = document.getElementById('next-page');
const pageDotsEl  = document.getElementById('page-dots');

// Chat-style prologue pages
// Each page = one or more chat messages revealed in sequence
const prologuePages = [
  {
    messages: [
      { side:'left',  type:'narrator', emoji:'🌍', secondary:['🏜️','🏞️','🏙️'],
        sender:'Narrador', text:'Un mundo lleno de paisajes y emociones...' },
      { side:'right', emoji:'😊', secondary:['😉','😁','😏'],
        sender:'Tú', text:'¡Qué lugar tan hermoso!' },
    ]
  },
  {
    messages: [
      { side:'left',  type:'villain', emoji:'👽', secondary:['👾','🤖'],
        sender:'Señal desconocida', text:'Fue invadido por criaturas de otro mundo. 👾' },
      { side:'left',  type:'villain', emoji:'🛸', secondary:['👾','🤖','👻','🌪️'],
        sender:'Nave enemiga 🛸', text:'¡Naves extraterrestres y criaturas oscuras surcaron los cielos!' },
    ]
  },
  {
    messages: [
      { side:'right', emoji:'😱', secondary:['😡','🥶'],
        sender:'Tú', text:'¡¿Qué está pasando?! ¡Hay que detenerlos!' },
      { side:'left',  type:'narrator', emoji:'🧝🏻', secondary:['✨'],
        sender:'Elfa Mágica', text:'Calma... Tú tienes el poder de los emojis. ¡Úsalos para salvar el mundo! 🌟' },
    ]
  },
  {
    messages: [
      { side:'left',  type:'narrator', emoji:'💪', secondary:['🔥','🥶','😡','😎'],
        sender:'Elfa Mágica', text:'Con fuego 🔥, hielo 🥶 y furia 😡 podrás vencer a cualquier enemigo.' },
      { side:'right', emoji:'😎', secondary:['🤠','🔥','🥶','😡'],
        sender:'Tú', text:'¡Entendido! Defenderé este mundo con todo lo que tengo. ¡Vamos! 🚀' },
    ]
  }
];

// Times for chat message timestamps
const TIMES = ['10:23','10:23','10:24','10:24','10:25','10:25','10:26','10:26'];
let timeIdx = 0;

function buildChatPage(pageIdx) {
  const page = prologuePages[pageIdx];
  chatArea.innerHTML = '';
  timeIdx = pageIdx * 2;

  // Date separator
  const sep = document.createElement('div');
  sep.className = 'chat-date-sep';
  sep.textContent = 'HOY';
  chatArea.appendChild(sep);

  // Render all messages for this page, staggered
  page.messages.forEach((msg, i) => {
    const msgEl = document.createElement('div');
    const typeClass = msg.type ? ` ${msg.type}` : '';
    msgEl.className = `chat-msg ${msg.side}${typeClass}`;

    const senderEl = document.createElement('div');
    senderEl.className = 'chat-sender';
    senderEl.textContent = msg.sender;
    msgEl.appendChild(senderEl);

    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble';

    // Big emoji
    const bigE = document.createElement('span');
    bigE.className = 'bubble-emoji';
    bigE.textContent = msg.emoji;
    bubble.appendChild(bigE);

    // Text
    const textEl = document.createElement('div');
    textEl.textContent = msg.text;
    bubble.appendChild(textEl);

    // Secondary emojis
    if (msg.secondary && msg.secondary.length) {
      const secDiv = document.createElement('div');
      secDiv.className = 'bubble-secondary';
      msg.secondary.forEach(e => {
        const sp = document.createElement('span');
        sp.textContent = e;
        secDiv.appendChild(sp);
      });
      bubble.appendChild(secDiv);
    }
    msgEl.appendChild(bubble);

    const timeEl = document.createElement('div');
    timeEl.className = 'chat-time';
    timeEl.textContent = TIMES[timeIdx++ % TIMES.length];
    msgEl.appendChild(timeEl);

    chatArea.appendChild(msgEl);

    // Staggered reveal
    setTimeout(() => {
      msgEl.classList.add('visible');
      chatArea.scrollTop = chatArea.scrollHeight;
    }, 80 + i * 260);
  });

  // Update dots
  pageDotsEl.innerHTML = '';
  prologuePages.forEach((_, i) => {
    const d = document.createElement('div');
    d.className = 'chat-dot' + (i === pageIdx ? ' active' : '');
    pageDotsEl.appendChild(d);
  });

  // Nav buttons
  prevPageBtn.disabled = pageIdx === 0;
  if (pageIdx === prologuePages.length - 1) {
    nextPageBtn.disabled = true;
    setTimeout(() => {
      playBtn.classList.remove('hidden');
      chatArea.scrollTop = chatArea.scrollHeight;
    }, 80 + page.messages.length * 260 + 200);
  } else {
    nextPageBtn.disabled = false;
    playBtn.classList.add('hidden');
  }
}

prevPageBtn.addEventListener('click', () => {
  if (currentPage > 0) { currentPage--; buildChatPage(currentPage); }
});
nextPageBtn.addEventListener('click', () => {
  if (currentPage < prologuePages.length - 1) { currentPage++; buildChatPage(currentPage); }
});

// ─── NG+ MODE: powers combine with weapons ─────────────────────────
// In NG+, avatar weapons can freely combine with 🔥🥶😡 powers
// (already works via useAvatarAttack checking currentPower)
// We just need to set the flag and make powers not expire when avatar timer = 0
// but keep the timer visible on the HUD.
// In NG+, purchasedAvatar persists after being bought (no deactivation)

// ═══════════════════════════════════════════════════════════════
//  CREDITS SCREEN
// ═══════════════════════════════════════════════════════════════
const creditsScreen = document.getElementById('credits-screen');
const creditsPlayAgainBtn = document.getElementById('credits-play-again-btn');

function showCredits() {
  // Build star field
  const starsEl = document.getElementById('credits-stars-bg');
  starsEl.innerHTML = '';
  for (let i = 0; i < 80; i++) {
    const s = document.createElement('div');
    s.className = 'credits-star';
    const size = Math.random() * 2.5 + 0.8;
    s.style.cssText = `width:${size}px;height:${size}px;top:${Math.random()*100}%;left:${Math.random()*100}%;
      opacity:${Math.random()*0.6+0.2};animation-delay:${Math.random()*2}s;animation-duration:${1.5+Math.random()*2}s;`;
    starsEl.appendChild(s);
  }
  creditsScreen.classList.add('show');
}

creditsPlayAgainBtn.addEventListener('click', () => {
  creditsScreen.classList.remove('show');
  ngPlusMode = true;
  resetGame();
});

    // Initialization on window load
function initOnLoad() {
  console.log('Emoji City: Initializing level...');
  resizeCanvas();
  setupEventListeners();
  // Show prologue chat screen
  buildChatPage(0);
  // play-btn starts game
  const pBtn = document.getElementById('play-btn');
  if (pBtn) {
    pBtn.onclick = () => {
      console.log('Emoji City: Play button clicked');
      startGame();
    };
  }
}

if (document.readyState === 'loading') {
  window.addEventListener('load', initOnLoad);
} else {
  initOnLoad();
}


