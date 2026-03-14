/**
 * Emoji World - Enemies Module
 * Enemy behavior and AI
 */

const Enemies = {
  // Active enemies
  list: [],
  
  // Enemy types
  types: {
    ghost: { emoji: '👻', speed: 2, damage: 1 },
    alien: { emoji: '👾', speed: 3, damage: 1 },
    robot: { emoji: '🤖', speed: 1.5, damage: 2 },
    bat: { emoji: '🦇', speed: 4, damage: 1 },
    spider: { emoji: '🕷️', speed: 2, damage: 2 }
  },
  
  // Initialize enemies for current zone
  init() {
    this.loadZoneEnemies();
  },
  
  // Load enemies for the current zone
  loadZoneEnemies() {
    const zone = Game.getCurrentZone();
    
    // Clear existing enemies
    this.list = [];
    
    // Load enemies based on zone
    switch(zone) {
      case '🕳️ Cave':
        this.addEnemy('spider', 1200, 1300);
        this.addEnemy('spider', 1300, 1350);
        this.addEnemy('ghost', 1250, 1400);
        break;
        
      case '🔥 Reino de Fuego':
        this.addEnemy('robot', 1700, 1500);
        this.addEnemy('robot', 1800, 1600);
        this.addEnemy('alien', 1650, 1550);
        break;
        
      case '🌳 Bosque Ancestral':
        this.addEnemy('ghost', 200, 1400);
        this.addEnemy('ghost', 400, 1500);
        this.addEnemy('bat', 300, 1450);
        this.addEnemy('bat', 500, 1550);
        break;
        
      case '🔬 Tecnozona':
        this.addEnemy('robot', 2100, 900);
        this.addEnemy('robot', 2200, 1000);
        this.addEnemy('alien', 2150, 950);
        break;
        
      default:
        // No enemies in safe zones
        break;
    }
    
    // Render enemies
    this.render();
  },
  
  // Add an enemy
  addEnemy(type, x, y) {
    const enemyType = this.types[type];
    if (!enemyType) return;
    
    const enemy = {
      id: 'enemy_' + Date.now() + '_' + Math.random(),
      type: type,
      emoji: enemyType.emoji,
      x: x,
      y: y,
      width: 34,
      height: 34,
      speed: enemyType.speed,
      damage: enemyType.damage,
      direction: 1, // 1 = right, -1 = left
      patrolStart: x - 100,
      patrolEnd: x + 100,
      alive: true
    };
    
    this.list.push(enemy);
  },
  
  // Update all enemies
  update(deltaTime) {
    if (!Game.running) return;
    
    for (const enemy of this.list) {
      if (!enemy.alive) continue;
      
      // Patrol movement
      enemy.x += enemy.speed * enemy.direction;
      
      // Reverse direction at patrol bounds
      if (enemy.x >= enemy.patrolEnd) {
        enemy.direction = -1;
      } else if (enemy.x <= enemy.patrolStart) {
        enemy.direction = 1;
      }
      
      // Check collision with player
      if (Player.collidesWith(enemy)) {
        this.onPlayerHit(enemy);
      }
    }
    
    // Re-render
    this.render();
  },
  
  // Handle player hit by enemy
  onPlayerHit(enemy) {
    // Trigger damage (handled by game.js)
    console.log('Player hit by enemy:', enemy.emoji);
    
    // Flash player
    const playerEl = document.getElementById('player');
    if (playerEl) {
      playerEl.style.filter = 'brightness(2) sepia(1) hue-rotate(-50deg)';
      setTimeout(() => {
        playerEl.style.filter = '';
      }, 200);
    }
  },
  
  // Render enemies to DOM
  render() {
    const mapWorld = document.getElementById('mapWorld');
    if (!mapWorld) return;
    
    // Remove existing enemy elements
    mapWorld.querySelectorAll('.enemy').forEach(el => el.remove());
    
    // Create enemy elements
    for (const enemy of this.list) {
      if (!enemy.alive) continue;
      
      const el = document.createElement('div');
      el.className = 'enemy npc';
      el.id = enemy.id;
      el.style.left = enemy.x + 'px';
      el.style.top = enemy.y + 'px';
      el.innerHTML = `<span class="npe">${enemy.emoji}</span>`;
      
      mapWorld.appendChild(el);
    }
  },
  
  // Kill an enemy
  kill(enemyId) {
    const enemy = this.list.find(e => e.id === enemyId);
    if (enemy) {
      enemy.alive = false;
      
      // Remove from DOM
      const el = document.getElementById(enemyId);
      if (el) {
        el.innerHTML = '<span class="npe">💫</span>';
        setTimeout(() => el.remove(), 500);
      }
      
      // Give player XP or coins
      console.log('Enemy defeated:', enemy.emoji);
    }
  },
  
  // Check if all enemies in zone are defeated
  allDefeated() {
    return this.list.every(e => !e.alive);
  },
  
  // Get enemies in range
  getEnemiesInRange(x, y, range) {
    return this.list.filter(enemy => {
      const dx = enemy.x - x;
      const dy = enemy.y - y;
      return Math.sqrt(dx * dx + dy * dy) < range;
    });
  }
};

// Make available globally
window.Enemies = Enemies;
