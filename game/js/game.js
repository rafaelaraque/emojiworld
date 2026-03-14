/**
 * Emoji World - Main Game Engine
 * Core game loop and initialization
 */

const Game = {
  initialized: false,
  running: false,
  lastTime: 0,
  
  // Game state
  state: {
    player: null,
    map: null,
    camera: { x: 0, y: 0 },
    zones: [],
    npcs: [],
    items: []
  },
  
  // Configuration
  config: {
    worldWidth: 2800,
    worldHeight: 2000,
    tileSize: 48
  },
  
  // Initialize the game
  init() {
    if (this.initialized) return;
    
    console.log('Emoji World - Initializing...');
    
    this.setupCanvas();
    this.setupControls();
    this.loadMap();
    this.loadNPCs();
    this.loadZones();
    
    this.initialized = true;
    this.start();
  },
  
  // Setup rendering
  setupCanvas() {
    const mapVP = document.getElementById('mapVP');
    const mapWorld = document.getElementById('mapWorld');
    
    if (mapWorld) {
      mapWorld.style.width = this.config.worldWidth + 'px';
      mapWorld.style.height = this.config.worldHeight + 'px';
    }
  },
  
  // Setup input controls
  setupControls() {
    // Keyboard controls
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    document.addEventListener('keyup', (e) => this.handleKeyUp(e));
    
    // Touch controls (joystick)
    this.setupJoystick();
  },
  
  // Setup virtual joystick
  setupJoystick() {
    const joystick = document.getElementById('joystick');
    if (!joystick) return;
    
    let startX, startY, active = false;
    
    joystick.addEventListener('touchstart', (e) => {
      e.preventDefault();
      active = true;
      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
    });
    
    joystick.addEventListener('touchmove', (e) => {
      if (!active) return;
      e.preventDefault();
      // Handle joystick movement
    });
    
    joystick.addEventListener('touchend', () => {
      active = false;
    });
  },
  
  // Handle key down
  handleKeyDown(e) {
    const keys = Game.state.keys || {};
    
    switch(e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        keys.up = true;
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        keys.down = true;
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        keys.left = true;
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        keys.right = true;
        break;
      case ' ':
        keys.jump = true;
        break;
      case 'e':
      case 'E':
        keys.interact = true;
        break;
      case 'c':
      case 'C':
        keys.chat = true;
        break;
    }
    
    Game.state.keys = keys;
  },
  
  // Handle key up
  handleKeyUp(e) {
    const keys = Game.state.keys || {};
    
    switch(e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        keys.up = false;
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        keys.down = false;
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        keys.left = false;
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        keys.right = false;
        break;
      case ' ':
        keys.jump = false;
        break;
      case 'e':
      case 'E':
        keys.interact = false;
        break;
      case 'c':
      case 'C':
        keys.chat = false;
        break;
    }
    
    Game.state.keys = keys;
  },
  
  // Load map data
  loadMap() {
    // Map is rendered in HTML, this loads any additional data
    console.log('Loading map...');
  },
  
  // Load NPCs
  loadNPCs() {
    console.log('Loading NPCs...');
  },
  
  // Load zones
  loadZones() {
    console.log('Loading zones...');
  },
  
  // Start the game loop
  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame((time) => this.gameLoop(time));
  },
  
  // Main game loop
  gameLoop(time) {
    if (!this.running) return;
    
    const deltaTime = time - this.lastTime;
    this.lastTime = time;
    
    this.update(deltaTime);
    this.render();
    
    requestAnimationFrame((t) => this.gameLoop(t));
  },
  
  // Update game state
  update(deltaTime) {
    // Update player
    if (Player) {
      Player.update(deltaTime);
    }
    
    // Update camera
    this.updateCamera();
    
    // Update NPCs
    this.updateNPCs();
    
    // Check collisions
    this.checkCollisions();
  },
  
  // Update camera position
  updateCamera() {
    const player = this.state.player;
    if (!player) return;
    
    const mapVP = document.getElementById('mapVP');
    if (!mapVP) return;
    
    const vpWidth = mapVP.clientWidth;
    const vpHeight = mapVP.clientHeight;
    
    // Center camera on player
    let camX = player.x - vpWidth / 2;
    let camY = player.y - vpHeight / 2;
    
    // Clamp to world bounds
    camX = Math.max(0, Math.min(camX, this.config.worldWidth - vpWidth));
    camY = Math.max(0, Math.min(camY, this.config.worldHeight - vpHeight));
    
    this.state.camera.x = camX;
    this.state.camera.y = camY;
    
    // Apply transform to map
    const mapWorld = document.getElementById('mapWorld');
    if (mapWorld) {
      mapWorld.style.transform = `translate(${-camX}px, ${-camY}px)`;
    }
  },
  
  // Update NPCs
  updateNPCs() {
    // NPC AI updates
  },
  
  // Check collisions
  checkCollisions() {
    // Collision detection
  },
  
  // Render the game
  render() {
    // Most rendering is done via CSS/HTML
    // This is for canvas-based effects if needed
  },
  
  // Pause the game
  pause() {
    this.running = false;
  },
  
  // Resume the game
  resume() {
    if (!this.running) {
      this.start();
    }
  },
  
  // Get current zone
  getCurrentZone() {
    const cam = this.state.camera;
    const cx = cam.x + (document.getElementById('mapVP')?.clientWidth || 0) / 2;
    const cy = cam.y + (document.getElementById('mapVP')?.clientHeight || 0) / 2;
    
    const zones = [
      { name: '🏙️ Emoji City', x1: 0, y1: 0, x2: 2800, y2: 2000 },
      { name: '🥬 El Huerto', x1: 80, y1: 80, x2: 780, y2: 630 },
      { name: '🏛️ Plaza Central', x1: 1050, y1: 700, x2: 1750, y2: 1200 },
      { name: '🏰 Zona Real', x1: 1950, y1: 80, x2: 2650, y2: 680 },
      { name: '🔬 Tecnozona', x1: 2000, y1: 800, x2: 2700, y2: 1350 },
      { name: '🔥 Reino de Fuego', x1: 1600, y1: 1400, x2: 2300, y2: 1900 },
      { name: '🌳 Bosque Ancestral', x1: 100, y1: 1300, x2: 800, y2: 1850 }
    ];
    
    for (const zone of zones) {
      if (cx >= zone.x1 && cx <= zone.x2 && cy >= zone.y1 && cy <= zone.y2) {
        return zone.name;
      }
    }
    
    return '🏙️ Emoji City';
  }
};

// Make available globally
window.Game = Game;

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Delay to ensure all elements are loaded
  setTimeout(() => {
    Game.init();
  }, 100);
});
