/**
 * Emoji World - UI Module
 * Interface and user interaction
 */

const UI = {
  // Current panel open
  currentPanel: null,
  
  // Initialize UI
  init() {
    this.setupButtons();
    this.setupJoystick();
    this.updateZoneDisplay();
  },
  
  // Setup UI buttons
  setupButtons() {
    // FAB button (inventory/chat toggle)
    const fab = document.getElementById('fab');
    if (fab) {
      fab.addEventListener('click', () => this.toggleMainMenu());
    }
    
    // Bottom navigation
    const bnav = document.getElementById('bNav');
    if (bnav) {
      const buttons = bnav.querySelectorAll('.bnb');
      buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const onclick = btn.getAttribute('onclick');
          if (onclick) {
            // Let the onclick handler work
          }
        });
      });
    }
    
    // Jump button
    const jumpBtn = document.getElementById('jumpBtn');
    if (jumpBtn) {
      jumpBtn.addEventListener('click', () => {
        if (Player) Player.jump();
      });
    }
  },
  
  // Setup virtual joystick
  setupJoystick() {
    const joystick = document.getElementById('joystick');
    const knob = document.getElementById('joyKnob');
    
    if (!joystick || !knob) return;
    
    let active = false;
    let startX, startY;
    
    const handleMove = (clientX, clientY) => {
      if (!active) return;
      
      const rect = joystick.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      let dx = clientX - centerX;
      let dy = clientY - centerY;
      
      // Clamp to joystick bounds
      const maxDist = rect.width / 2 - 23;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > maxDist) {
        dx = (dx / dist) * maxDist;
        dy = (dy / dist) * maxDist;
      }
      
      // Move knob
      knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
      
      // Update player movement based on joystick position
      const keys = Game.state.keys || {};
      const threshold = 10;
      
      keys.right = dx > threshold;
      keys.left = dx < -threshold;
      keys.down = dy > threshold;
      keys.up = dy < -threshold;
      
      Game.state.keys = keys;
    };
    
    joystick.addEventListener('touchstart', (e) => {
      e.preventDefault();
      active = true;
      knob.classList.add('active');
      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      handleMove(startX, startY);
    });
    
    joystick.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY);
    });
    
    joystick.addEventListener('touchend', () => {
      active = false;
      knob.classList.remove('active');
      knob.style.transform = 'translate(-50%, -50%)';
      
      // Reset keys
      const keys = Game.state.keys || {};
      keys.up = false;
      keys.down = false;
      keys.left = false;
      keys.right = false;
      Game.state.keys = keys;
    });
  },
  
  // Toggle main menu (FAB)
  toggleMainMenu() {
    const ibPanel = document.getElementById('ibPanel');
    const chPanel = document.getElementById('chPanel');
    
    if (ibPanel && ibPanel.classList.contains('open')) {
      ibPanel.classList.remove('open');
      this.currentPanel = null;
    } else if (chPanel && chPanel.classList.contains('show')) {
      chPanel.classList.remove('show');
      this.currentPanel = null;
    } else {
      // Open inventory panel by default
      if (ibPanel) ibPanel.classList.add('open');
      this.currentPanel = 'inventory';
    }
  },
  
  // Update zone display
  updateZoneDisplay() {
    const hudZone = document.getElementById('hudZone');
    if (!hudZone) return;
    
    // Update every second
    setInterval(() => {
      const zone = Game.getCurrentZone();
      hudZone.textContent = zone;
    }, 1000);
  },
  
  // Show toast notification
  showToast(message, duration = 2000) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
      toast.classList.remove('show');
    }, duration);
  },
  
  // Show NPC dialog
  showDialog(npcId, messages, callback) {
    const npcOv = document.getElementById('npcOv');
    const npcAv = document.getElementById('ndAv');
    const npcNm = document.getElementById('ndNm');
    const npcRl = document.getElementById('ndRl');
    const npcMs = document.getElementById('ndMs');
    
    if (!npcOv || !npcMs) return;
    
    // Set NPC info
    const npc = NPCs.get(npcId);
    if (npc) {
      if (npcAv) npcAv.textContent = npc.emoji || '😊';
      if (npcNm) npcNm.textContent = npc.name || 'NPC';
      if (npcRl) npcRl.textContent = npc.role || '';
    }
    
    // Build messages
    npcMs.innerHTML = messages.map(msg => 
      `<div class="ndm">${msg}</div>`
    ).join('');
    
    // Show dialog
    npcOv.classList.add('show');
    
    // Setup close handler
    const closeBtn = npcOv.querySelector('.ndcl');
    const closeHandler = () => {
      npcOv.classList.remove('show');
      closeBtn.removeEventListener('click', closeHandler);
      if (callback) callback();
    };
    
    closeBtn.addEventListener('click', closeHandler);
  },
  
  // Close NPC dialog
  closeDialog() {
    const npcOv = document.getElementById('npcOv');
    if (npcOv) {
      npcOv.classList.remove('show');
    }
  },
  
  // Show mission complete popup
  showMissionComplete(title, description, xp) {
    const rwPop = document.getElementById('rwPop');
    const rwT = document.getElementById('rwT');
    const rwD = document.getElementById('rwD');
    const rwXP = document.getElementById('rwXP');
    const rwEm = document.getElementById('rwEm');
    
    if (!rwPop) return;
    
    if (rwT) rwT.textContent = title || '¡Misión completada!';
    if (rwD) rwD.textContent = description || '';
    if (rwXP) rwXP.textContent = xp ? `+${xp} XP` : '+100 XP';
    if (rwEm) rwEm.textContent = '🏆';
    
    rwPop.classList.add('show');
  },
  
  // Close mission popup
  closeMissionPopup() {
    const rwPop = document.getElementById('rwPop');
    if (rwPop) {
      rwPop.classList.remove('show');
    }
  },
  
  // Update minimap
  updateMinimap() {
    const mmd = document.getElementById('mmd');
    if (!mmd || !Game.state.player) return;
    
    const mapVP = document.getElementById('mapVP');
    if (!mapVP) return;
    
    const vpW = mapVP.clientWidth;
    const vpH = mapVP.clientHeight;
    const worldW = Game.config.worldWidth;
    const worldH = Game.config.worldHeight;
    
    const playerX = Game.state.player.x;
    const playerY = Game.state.player.y;
    
    const dotX = (playerX / (worldW - vpW)) * 84;
    const dotY = (playerY / (worldH - vpH)) * 58;
    
    mmd.style.left = Math.max(2, Math.min(dotX, 84)) + '%';
    mmd.style.top = Math.max(2, Math.min(dotY, 58)) + '%';
  }
};

// Make available globally
window.UI = UI;

// Close modal when clicking outside
document.addEventListener('click', (e) => {
  const npcOv = document.getElementById('npcOv');
  if (e.target === npcOv) {
    UI.closeDialog();
  }
});
