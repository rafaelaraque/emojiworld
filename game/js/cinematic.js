'use strict';

/* ═══════════════════════════════════════
   CINEMATIC INTRO MODULE
   ═══════════════════════════════════════ */

const Cinematic = {
  active: false,
  skipped: false,
  timers: [],
  safetyTimer: null,

  /* ── PUBLIC ── */

  play() {
    console.log('[Cinematic] Starting intro sequence');
    this.active = true;
    this.skipped = false;
    window._cinematicActive = true;

    // Safety: force end after 15 seconds no matter what
    const self = this;
    this.safetyTimer = setTimeout(function() {
      console.log('[Cinematic] Safety timeout triggered, forcing end');
      self.skipped = true;
      self._cleanup();
    }, 15000);

    this._run();
  },

  skip() {
    console.log('[Cinematic] Skipped by user');
    this.skipped = true;
    this.active = false;
    this.timers.forEach(function(t) { clearTimeout(t); });
    this.timers = [];
    if (this.safetyTimer) { clearTimeout(this.safetyTimer); this.safetyTimer = null; }
    this._cleanup();
  },

  /* ── MAIN SEQUENCE ── */

  _run() {
    const self = this;

    console.log('[Cinematic] Step 1: Splash screen');
    this._animateSplash(2000, function() {
      if (self.skipped) return;
      console.log('[Cinematic] Step 2: Aerial pan');
      self._aerialPan(function() {
        if (self.skipped) return;
        console.log('[Cinematic] Step 3: Emma arrives');
        self._emmaArrives(function() {
          if (self.skipped) return;
          console.log('[Cinematic] Step 4: Welcome dialogue');
          self._welcomeDialogue(function() {
            if (self.skipped) return;
            console.log('[Cinematic] Step 5: Emma leaves');
            self._emmaLeaves(function() {
              if (self.skipped) return;
              console.log('[Cinematic] Sequence complete');
              self._finish();
            });
          });
        });
      });
    });
  },

  /* ── SPLASH SCREEN ── */

  _animateSplash(duration, callback) {
    const self = this;
    const overlay = document.getElementById('splashScreen');
    const fill = document.querySelector('.splash-fill');

    // If splash element doesn't exist, continue immediately
    if (!overlay) {
      console.log('[Cinematic] Splash element not found, continuing');
      callback();
      return;
    }

    const start = Date.now();

    function tick() {
      if (self.skipped) return;
      const elapsed = Date.now() - start;
      const progress = Math.min(100, (elapsed / duration) * 100);
      if (fill) fill.style.width = progress + '%';

      if (progress >= 100) {
        overlay.classList.add('fade-out');
        const t = setTimeout(function() {
          overlay.style.display = 'none';
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

  /* ── AERIAL PAN ── */

  _aerialPan(callback) {
    const self = this;
    const overlay = document.getElementById('cinematicOverlay');
    if (!overlay) { callback(); return; }
    overlay.classList.add('active');

    const waypoints = [
      [0, 0],
      [200, 200],
      [2100, 200],
      [2200, 900],
      [1800, 1600],
      [300, 1500],
      [1350, 930],
    ];

    let i = 0;
    const stepMs = 500;

    function next() {
      if (self.skipped || i >= waypoints.length) { callback(); return; }
      const [tx, ty] = waypoints[i];
      i++;
      self._smoothCamera(tx, ty, stepMs, next);
    }
    next();
  },

  /* ── EMMA ARRIVES ── */

  _emmaArrives(callback) {
    const self = this;
    const mapWorld = document.getElementById('mapWorld');
    if (!mapWorld) { callback(); return; }

    const emma = document.createElement('div');
    emma.className = 'emma-temp';
    emma.id = 'emmaTemp';
    emma.innerHTML = '<span class="npe">🤗</span>';
    emma.style.left = '1350px';
    emma.style.top = '-50px';
    mapWorld.appendChild(emma);

    const startY = -50;
    const endY = 870;
    const duration = 1500;
    const start = Date.now();

    function animate() {
      if (self.skipped) { callback(); return; }
      const elapsed = Date.now() - start;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const bounce = t < 1 ? Math.sin(t * Math.PI * 4) * (1 - t) * 20 : 0;
      const y = startY + (endY - startY) * eased + bounce;
      emma.style.top = y + 'px';

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        emma.style.top = endY + 'px';
        callback();
      }
    }
    requestAnimationFrame(animate);
  },

  /* ── WELCOME DIALOGUE ── */

  _welcomeDialogue(callback) {
    const self = this;
    const emma = document.getElementById('emmaTemp');
    if (!emma) { callback(); return; }

    const messages = [
      { text: '¡Hola! 😊 ¡Bienvenido a Emoji City!', delay: 0 },
      { text: 'Soy Emma, tu guía en esta aventura.', delay: 1800 },
      { text: 'Si necesitas ayuda, contáctame por Emoji Chat 💬', delay: 3600 },
      { text: '¡Mira! Ya te envié un mensaje. ¡Léelo!', delay: 5400 },
    ];

    messages.forEach(function(msg) {
      const t = setTimeout(function() {
        if (self.skipped) return;
        self._showBubble(emma, msg.text);
      }, msg.delay);
      self.timers.push(t);
    });

    const t = setTimeout(callback, 7400);
    this.timers.push(t);
  },

  /* ── EMMA LEAVES ── */

  _emmaLeaves(callback) {
    const self = this;
    const emma = document.getElementById('emmaTemp');
    if (!emma) { callback(); return; }

    document.querySelectorAll('.cine-bubble').forEach(function(b) { b.remove(); });

    emma.classList.add('emma-spin');
    const t = setTimeout(function() {
      emma.remove();
      callback();
    }, 1500);
    this.timers.push(t);
  },

  /* ── FINISH ── */

  _finish() {
    this.active = false;
    window._cinematicActive = false;
    if (this.safetyTimer) { clearTimeout(this.safetyTimer); this.safetyTimer = null; }

    console.log('[Cinematic] Finishing, setting storyProgress=1');

    if (typeof G !== 'undefined') {
      G.storyProgress = 1;
      if (typeof sv === 'function') sv();
    }

    if (typeof enableControls === 'function') enableControls();

    // Show Emma NPC on map for 8 seconds
    const emmaNpc = document.getElementById('emmaNpc');
    if (emmaNpc) {
      emmaNpc.style.display = '';
      const t = setTimeout(function() {
        emmaNpc.style.transition = 'opacity 1s';
        emmaNpc.style.opacity = '0';
        setTimeout(function() {
          emmaNpc.style.display = 'none';
          emmaNpc.style.opacity = '';
          emmaNpc.style.transition = '';
        }, 1000);
      }, 8000);
      this.timers.push(t);
    }

    // Auto-open chat
    const t = setTimeout(function() {
      if (typeof openChat === 'function') openChat('emma');
    }, 800);
    this.timers.push(t);

    this._cleanup();
  },

  /* ── CLEANUP ── */

  _cleanup() {
    this.active = false;
    window._cinematicActive = false;
    if (this.safetyTimer) { clearTimeout(this.safetyTimer); this.safetyTimer = null; }
    this.timers.forEach(function(t) { clearTimeout(t); });
    this.timers = [];

    const splash = document.getElementById('splashScreen');
    if (splash) splash.remove();

    const overlay = document.getElementById('cinematicOverlay');
    if (overlay) overlay.classList.remove('active');

    const emma = document.getElementById('emmaTemp');
    if (emma) emma.remove();

    document.querySelectorAll('.cine-bubble').forEach(function(b) { b.remove(); });

    if (typeof enableControls === 'function') enableControls();

    // If skipped, still set progress and open chat
    if (this.skipped) {
      console.log('[Cinematic] Cleanup after skip, opening chat');
      if (typeof G !== 'undefined') {
        G.storyProgress = 1;
        if (typeof sv === 'function') sv();
      }
      setTimeout(function() {
        if (typeof openChat === 'function') openChat('emma');
      }, 500);
    }
  },

  /* ── HELPERS ── */

  _smoothCamera(tx, ty, duration, callback) {
    const self = this;
    const start = Date.now();
    const startMx = G.mx;
    const startMy = G.my;
    const targetMx = Math.max(0, Math.min(tx - vpW / 2 + 21, MW - vpW));
    const targetMy = Math.max(0, Math.min(ty - vpH / 2 + 21, MH - vpH));

    function animate() {
      if (self.skipped) { callback(); return; }
      const elapsed = Date.now() - start;
      const t = Math.min(elapsed / duration, 1);
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

      G.mx = startMx + (targetMx - startMx) * eased;
      G.my = startMy + (targetMy - startMy) * eased;
      if (typeof applyMap === 'function') applyMap();

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        G.mx = targetMx;
        G.my = targetMy;
        if (typeof applyMap === 'function') applyMap();
        callback();
      }
    }
    requestAnimationFrame(animate);
  },

  _showBubble(targetEl, text) {
    document.querySelectorAll('.cine-bubble').forEach(function(b) { b.remove(); });

    const bubble = document.createElement('div');
    bubble.className = 'cine-bubble';
    bubble.textContent = text;

    const rect = targetEl.getBoundingClientRect();
    bubble.style.left = (rect.left - 60) + 'px';
    bubble.style.top = (rect.top - 60) + 'px';
    bubble.style.maxWidth = '260px';

    const overlay = document.getElementById('cinematicOverlay');
    if (overlay) overlay.appendChild(bubble);

    requestAnimationFrame(function() {
      bubble.classList.add('show');
    });
  }
};
