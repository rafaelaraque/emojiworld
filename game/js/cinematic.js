'use strict';

/* ═══════════════════════════════════════
   CINEMATIC INTRO MODULE
   Splash screen → Aerial pan → Emma arrives → Welcome dialogue → Auto-open chat
   ═══════════════════════════════════════ */

const Cinematic = {
  active: false,
  skipped: false,
  _resolve: null,
  _timeouts: [],

  /* ── PUBLIC ── */

  async play() {
    this.active = true;
    this.skipped = false;

    // 1. Splash screen
    await this._showSplash();
    if (this.skipped) return this._cleanup();

    // 2. Aerial pan
    await this._aerialPan();
    if (this.skipped) return this._cleanup();

    // 3. Zoom to player
    await this._zoomToPlayer();
    if (this.skipped) return this._cleanup();

    // 4. Emma arrives bouncing
    await this._emmaArrives();
    if (this.skipped) return this._cleanup();

    // 5. Welcome dialogue
    await this._welcomeDialogue();
    if (this.skipped) return this._cleanup();

    // 6. Emma leaves spinning
    await this._emmaLeaves();

    // 7. Finish
    this._cleanup();
    this._finish();
  },

  skip() {
    this.skipped = true;
    this._timeouts.forEach(t => clearTimeout(t));
    this._timeouts = [];
    if (this._resolve) { this._resolve(); this._resolve = null; }
  },

  /* ── SPLASH SCREEN ── */

  _showSplash() {
    return new Promise(resolve => {
      const overlay = document.getElementById('splashScreen');
      const fill = document.querySelector('.splash-fill');
      if (!overlay || !fill) { resolve(); return; }

      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 15 + 5;
        if (progress >= 100) {
          progress = 100;
          fill.style.width = '100%';
          clearInterval(interval);
          setTimeout(() => {
            overlay.classList.add('fade-out');
            setTimeout(resolve, 600);
          }, 400);
        } else {
          fill.style.width = progress + '%';
        }
      }, 100);
    });
  },

  /* ── AERIAL PAN ── */

  _aerialPan() {
    return new Promise(resolve => {
      const overlay = document.getElementById('cinematicOverlay');
      if (!overlay) { resolve(); return; }
      overlay.classList.add('active');

      // Camera waypoints: [mx, my] — corners of the map
      const waypoints = [
        [0, 0],           // Top-left
        [200, 200],       // Mercado Feliz area
        [2100, 200],      // Zona Real
        [2200, 900],      // Tecnozona
        [1800, 1600],     // Zona de Fuego
        [300, 1500],      // Bosque Ancestral
        [1350, 930],      // Plaza Central (player)
      ];

      let i = 0;
      const stepDuration = 500; // ms per waypoint

      const animate = () => {
        if (this.skipped || i >= waypoints.length) { resolve(); return; }
        const [tx, ty] = waypoints[i];
        this._smoothCamera(tx, ty, stepDuration, () => {
          i++;
          animate();
        });
      };
      animate();
    });
  },

  /* ── ZOOM TO PLAYER ── */

  _zoomToPlayer() {
    return new Promise(resolve => {
      this._smoothCamera(1350, 930, 1200, resolve);
    });
  },

  /* ── EMMA ARRIVES ── */

  _emmaArrives() {
    return new Promise(resolve => {
      // Create temporary Emma element
      const emma = document.createElement('div');
      emma.className = 'emma-temp';
      emma.id = 'emmaTemp';
      emma.innerHTML = '<span class="npe">🤗</span>';
      emma.style.left = '1350px';
      emma.style.top = '-50px';
      emma.style.display = 'block';
      document.getElementById('mapWorld').appendChild(emma);

      // Animate Emma bouncing down to player position
      const startY = -50;
      const endY = 870; // Just above player (player is at 930)
      const duration = 1500;
      const startTime = performance.now();

      const bounce = (now) => {
        const elapsed = now - startTime;
        const t = Math.min(elapsed / duration, 1);

        // Easing with bounce effect
        const eased = 1 - Math.pow(1 - t, 3);
        const bounceOffset = t < 1 ? Math.sin(t * Math.PI * 4) * (1 - t) * 20 : 0;
        const currentY = startY + (endY - startY) * eased + bounceOffset;

        emma.style.top = currentY + 'px';

        if (t < 1 && !this.skipped) {
          requestAnimationFrame(bounce);
        } else {
          emma.style.top = endY + 'px';
          resolve();
        }
      };
      requestAnimationFrame(bounce);
    });
  },

  /* ── WELCOME DIALOGUE ── */

  _welcomeDialogue() {
    return new Promise(resolve => {
      const messages = [
        { text: '¡Hola! 😊 ¡Bienvenido a Emoji City!', delay: 0 },
        { text: 'Soy Emma, tu guía en esta aventura.', delay: 1800 },
        { text: 'Si necesitas ayuda, contáctame por Emoji Chat 💬', delay: 3600 },
        { text: '¡Mira! Ya te envié un mensaje. ¡Léelo!', delay: 5400 },
      ];

      const emma = document.getElementById('emmaTemp');
      if (!emma) { resolve(); return; }

      messages.forEach(msg => {
        const t = this._setTimeout(() => {
          if (this.skipped) return;
          this._showBubble(emma, msg.text);
        }, msg.delay);
        this._timeouts.push(t);
      });

      // Total dialogue time
      const totalTime = messages[messages.length - 1].delay + 2000;
      const t = this._setTimeout(resolve, totalTime);
      this._timeouts.push(t);
    });
  },

  /* ── EMMA LEAVES ── */

  _emmaLeaves() {
    return new Promise(resolve => {
      const emma = document.getElementById('emmaTemp');
      if (!emma) { resolve(); return; }

      // Remove dialogue bubble
      const bubble = document.querySelector('.cine-bubble');
      if (bubble) bubble.remove();

      // Add spin animation
      emma.classList.add('emma-spin');

      const t = this._setTimeout(() => {
        emma.remove();
        resolve();
      }, 1500);
      this._timeouts.push(t);
    });
  },

  /* ── FINISH ── */

  _finish() {
    this.active = false;

    // Set story progress
    if (typeof G !== 'undefined') {
      G.storyProgress = 1;
      if (typeof sv === 'function') sv();
    }

    // Enable controls
    if (typeof enableControls === 'function') enableControls();

    // Show Emma NPC on the map briefly
    const emmaNpc = document.getElementById('emmaNpc');
    if (emmaNpc) {
      emmaNpc.style.display = '';
      // Emma stays visible for 8 seconds then disappears (spinning away)
      const t = this._setTimeout(() => {
        emmaNpc.style.transition = 'opacity 1s';
        emmaNpc.style.opacity = '0';
        const t2 = this._setTimeout(() => {
          emmaNpc.style.display = 'none';
          emmaNpc.style.opacity = '';
          emmaNpc.style.transition = '';
        }, 1000);
        this._timeouts.push(t2);
      }, 8000);
      this._timeouts.push(t);
    }

    // Auto-open chat with Emma after a short delay
    const t = this._setTimeout(() => {
      if (typeof openChat === 'function') {
        openChat('emma');
      }
    }, 800);
    this._timeouts.push(t);
  },

  /* ── CLEANUP ── */

  _cleanup() {
    this.active = false;
    this._timeouts.forEach(t => clearTimeout(t));
    this._timeouts = [];

    // Remove splash
    const splash = document.getElementById('splashScreen');
    if (splash) splash.remove();

    // Remove cinematic overlay
    const overlay = document.getElementById('cinematicOverlay');
    if (overlay) overlay.classList.remove('active');

    // Remove temporary Emma
    const emma = document.getElementById('emmaTemp');
    if (emma) emma.remove();

    // Remove any dialogue bubbles
    document.querySelectorAll('.cine-bubble').forEach(b => b.remove());

    // Enable controls
    if (typeof enableControls === 'function') enableControls();

    // If skipped, still set progress and open chat
    if (this.skipped) {
      if (typeof G !== 'undefined') {
        G.storyProgress = 1;
        if (typeof sv === 'function') sv();
      }
      // Show Emma NPC
      const emmaNpc = document.getElementById('emmaNpc');
      if (emmaNpc) {
        emmaNpc.style.display = '';
        const t = setTimeout(() => {
          emmaNpc.style.transition = 'opacity 1s';
          emmaNpc.style.opacity = '0';
          setTimeout(() => {
            emmaNpc.style.display = 'none';
            emmaNpc.style.opacity = '';
            emmaNpc.style.transition = '';
          }, 1000);
        }, 8000);
      }
      // Open chat
      setTimeout(() => {
        if (typeof openChat === 'function') openChat('emma');
      }, 500);
    }
  },

  /* ── HELPERS ── */

  _smoothCamera(tx, ty, duration, callback) {
    const startTime = performance.now();
    const startMx = G.mx;
    const startMy = G.my;

    // Calculate target camera position (centered on target)
    const targetMx = Math.max(0, Math.min(tx - vpW / 2 + 21, MW - vpW));
    const targetMy = Math.max(0, Math.min(ty - vpH / 2 + 21, MH - vpH));

    const animate = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);

      // Smooth easing
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

      G.mx = startMx + (targetMx - startMx) * eased;
      G.my = startMy + (targetMy - startMy) * eased;

      if (typeof applyMap === 'function') applyMap();

      if (t < 1 && !this.skipped) {
        requestAnimationFrame(animate);
      } else {
        G.mx = targetMx;
        G.my = targetMy;
        if (typeof applyMap === 'function') applyMap();
        if (callback) callback();
      }
    };
    requestAnimationFrame(animate);
  },

  _showBubble(targetEl, text) {
    // Remove existing bubble
    document.querySelectorAll('.cine-bubble').forEach(b => b.remove());

    const bubble = document.createElement('div');
    bubble.className = 'cine-bubble';
    bubble.textContent = text;

    // Position above Emma
    const rect = targetEl.getBoundingClientRect();
    bubble.style.left = (rect.left - 60) + 'px';
    bubble.style.top = (rect.top - 60) + 'px';
    bubble.style.maxWidth = '260px';

    document.getElementById('cinematicOverlay').appendChild(bubble);

    // Trigger animation
    requestAnimationFrame(() => {
      bubble.classList.add('show');
    });
  },

  _setTimeout(fn, ms) {
    return setTimeout(fn, ms);
  }
};
