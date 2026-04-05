'use strict';

/* ═══════════════════════════════════════
   CINEMATIC INTRO MODULE (Simplified Map Intro)
   ═══════════════════════════════════════ */

const Cinematic = {
  active: false,
  skipped: false,
  timers: [],
  safetyTimer: null,

  /* ── PUBLIC ── */

  play() {
    console.log('[Cinematic] Starting simplified map intro');
    this.active = true;
    this.skipped = false;
    window._cinematicActive = true;

    // Safety: force end after 30 seconds
    const self = this;
    this.safetyTimer = setTimeout(function() {
      self.skip();
    }, 30000);

    this._run();
  },

  skip() {
    console.log('[Cinematic] Skip requested');
    this.skipped = true;
    this._cleanup();
  },

  /* ── MAIN SEQUENCE ── */

  _run() {
    const self = this;

    // Step 1: Splash Screen
    console.log('[Cinematic] Step 1: Splash screen');
    this._animateSplash(5000, function() {
      if (self.skipped) return;
      
      // Step 2: On-Map Dialogue
      console.log('[Cinematic] Step 2: On-map dialogues');
      self._onMapDialogue();
    });
  },

  /* ── SPLASH SCREEN ── */

  _animateSplash(duration, callback) {
    const self = this;
    const overlay = document.getElementById('splashScreen');
    const fill = document.querySelector('.splash-fill');
    const loadingText = document.querySelector('.splash-text');

    console.log('[Cinematic] _animateSplash called', {
      hasOverlay: !!overlay,
      hasFill: !!fill,
      hasText: !!loadingText,
      duration: duration
    });

    if (!overlay) {
      console.warn('[Cinematic] Splash screen not found, skipping');
      callback();
      return;
    }

    // Ensure splash is visible
    overlay.style.opacity = '1';
    overlay.style.display = 'flex';

    const start = Date.now();

    function tick() {
      if (self.skipped) return;
      const elapsed = Date.now() - start;
      const progress = Math.min(100, (elapsed / duration) * 100);
      
      if (fill) fill.style.width = progress + '%';
      if (loadingText) loadingText.textContent = 'cargando... ' + Math.floor(progress) + '%';

      if (progress >= 100) {
        overlay.classList.add('fade-out');
        const t = setTimeout(function() {
          overlay.remove();
          callback();
        }, 600);
        self.timers.push(t);
      } else {
        const t = setTimeout(tick, 50);
        self.timers.push(t);
      }
    }
    const t = setTimeout(tick, 100);
    this.timers.push(t);
  },

  /* ── ON-MAP DIALOGUE ── */

  _onMapDialogue() {
    const self = this;
    
    // Ensure controls are disabled
    if (typeof disableControls === 'function') disableControls();
    
    // Ensure Player is visible
    const pl = document.getElementById('player');
    if (pl) {
        pl.style.opacity = '1';
        pl.style.display = 'block';
    }

    // Ensure Emma NPC is visible
    const emma = document.getElementById('emmaNpc');
    if (emma) {
      emma.style.opacity = '1';
      emma.style.display = 'block';
    }

    const dialogue = [
      { speaker: 'emma', text: '¡Hola! 😊 ¡Bienvenido a Emoji World!', delay: 500 },
      { speaker: 'player', text: '¡Hola! ¿Dónde estoy?', delay: 3000 },
      { speaker: 'emma', text: 'Estás en la Plaza Central de Emoji City. 🏙️', delay: 5500 },
      { speaker: 'emma', text: 'Soy Emma, tu guía oficial en esta gran aventura.', delay: 8500 },
      { speaker: 'emma', text: 'Tengo una misión muy especial para ti...', delay: 11500 },
      { speaker: 'emma', text: '¡Te he enviado todos los detalles por el **Emoji Chat**! 📱', delay: 14500 }
    ];

    dialogue.forEach(function(step) {
      const t = setTimeout(function() {
        if (self.skipped) return;
        const target = step.speaker === 'emma' ? document.getElementById('emmaNpc') : document.getElementById('player');
        if (target) self._showMapBubble(target, step.text);
      }, step.delay);
      self.timers.push(t);
    });

    const finishT = setTimeout(function() {
       if (!self.skipped) self._finish();
    }, 18000);
    this.timers.push(finishT);
  },

  _showMapBubble(targetEl, text) {
    // Remove previous bubbles
    document.querySelectorAll('.map-speech-bubble').forEach(b => b.remove());

    const bubble = document.createElement('div');
    bubble.className = 'map-speech-bubble';
    bubble.innerHTML = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Append to target entity (so it follows it if it moves, though it shouldn't here)
    targetEl.appendChild(bubble);

    // Trigger animation
    requestAnimationFrame(() => {
      bubble.classList.add('visible');
    });
  },

  _finish() {
    this.active = false;
    window._cinematicActive = false;
    if (this.safetyTimer) { clearTimeout(this.safetyTimer); this.safetyTimer = null; }

    console.log('[Cinematic] Sequence finished');

    if (typeof G !== 'undefined') {
      G.storyProgress = 1;
      if (typeof sv === 'function') sv();
    }

    // Clear bubbles
    document.querySelectorAll('.map-speech-bubble').forEach(b => b.remove());

    // Keep controls locked - they will be enabled when user closes the inbox
    // Do NOT enable controls here - let closeIb() handle it

    // Set flag to block chat closure during Emma's intro mission
    G.emmaIntroActive = true;
    if (typeof sv === 'function') sv();

    // Trigger Notification & Open Chat
    if (typeof MN !== 'undefined') {
       MN.push('emma', '¡Hola! 😊 ¡Bienvenido a Emoji City! Soy Emma, tu guía. Visita a Don Mango en el Mercado Feliz 🏪 — tiene una misión para ti.');
    }

    setTimeout(function() {
      if (typeof openIb === 'function') openIb();
      if (typeof openChat === 'function') openChat('emma');
    }, 1000);

    this._cleanup();
  },

  _cleanup() {
    this.active = false;
    window._cinematicActive = false;
    this.timers.forEach(function(t) { clearTimeout(t); });
    this.timers = [];
    if (this.safetyTimer) { clearTimeout(this.safetyTimer); this.safetyTimer = null; }

    const splash = document.getElementById('splashScreen');
    if (splash) splash.remove();

    document.querySelectorAll('.map-speech-bubble').forEach(b => b.remove());

    const pl = document.getElementById('player');
    if (pl) pl.style.opacity = '1';

    const emma = document.getElementById('emmaNpc');
    if (emma) {
        emma.style.opacity = '1';
        emma.style.display = 'block';
    }

    if (this.skipped) {
      // If skipped, enable controls immediately and open chat
      if (typeof enableControls === 'function') enableControls();
      G.storyProgress = 1;
      if (typeof sv === 'function') sv();
      if (typeof openIb === 'function') openIb();
      if (typeof openChat === 'function') openChat('emma');
    }
    // If NOT skipped, controls remain locked until user closes the inbox (see closeIb)
  }
};
