/**
 * Emoji World - Player Module
 * Player behavior and movement
 */

const Player = {
  // Player state
  x: 100,
  y: 100,
  width: 42,
  height: 42,
  speed: 4,
  vx: 0,
  vy: 0,
  
  // Direction: 'r', 'l', 'u', 'd', 'ur', 'ul', 'dr', 'dl'
  direction: 'r',
  
  // State flags
  isWalking: false,
  isJumping: false,
  jumpVelocity: 0,
  
  // Constants
  JUMP_FORCE: -12,
  GRAVITY: 0.6,
  GROUND_Y: 1800, // Approximate ground level
  
  // DOM element
  element: null,
  spriteElement: null,
  
  // Initialize player
  init() {
    this.element = document.getElementById('player');
    this.spriteElement = document.getElementById('playerSprite');
    
    // Set initial position
    this.updatePosition();
  },
  
  // Update player state
  update(deltaTime) {
    const keys = Game.state.keys || {};
    
    // Reset velocity
    this.vx = 0;
    this.vy += this.GRAVITY;
    
    // Handle input
    if (keys.up) {
      this.vy = -this.speed;
      this.direction = keys.right ? 'ur' : keys.left ? 'ul' : 'u';
    }
    if (keys.down) {
      this.vy = this.speed;
      this.direction = keys.right ? 'dr' : keys.left ? 'dl' : 'd';
    }
    if (keys.left) {
      this.vx = -this.speed;
      if (!keys.up && !keys.down) this.direction = 'l';
    }
    if (keys.right) {
      this.vx = this.speed;
      if (!keys.up && !keys.down) this.direction = 'r';
    }
    
    // Handle jumping
    if (keys.jump && !this.isJumping) {
      this.jump();
    }
    
    // Apply gravity when jumping
    if (this.isJumping) {
      this.vy += this.JUMP_FORCE * 0.1;
      if (this.vy > 20) this.vy = 20;
    }
    
    // Update walking state
    this.isWalking = (this.vx !== 0 || this.vy !== 0);
    
    // Apply movement
    this.x += this.vx;
    this.y += this.vy;
    
    // Clamp to world bounds
    this.clampToWorld();
    
    // Check if on ground
    if (this.y >= this.GROUND_Y) {
      this.y = this.GROUND_Y;
      this.isJumping = false;
      this.vy = 0;
    }
    
    // Update DOM
    this.updatePosition();
    this.updateSprite();
  },
  
  // Jump action
  jump() {
    if (this.isJumping) return;
    
    this.isJumping = true;
    this.vy = this.JUMP_FORCE;
    
    // Add jumping class for animation
    if (this.element) {
      this.element.classList.add('jumping');
      setTimeout(() => {
        this.element.classList.remove('jumping');
      }, 600);
    }
    
    // Trigger jump button animation if exists
    const jumpBtn = document.getElementById('jumpBtn');
    if (jumpBtn) {
      jumpBtn.classList.add('pressed');
      setTimeout(() => jumpBtn.classList.remove('pressed'), 150);
    }
  },
  
  // Clamp player position to world bounds
  clampToWorld() {
    const worldWidth = Game.config.worldWidth;
    const worldHeight = Game.config.worldHeight;
    
    this.x = Math.max(0, Math.min(this.x, worldWidth - this.width));
    this.y = Math.max(0, Math.min(this.y, worldHeight - this.height));
  },
  
  // Update player DOM position
  updatePosition() {
    if (!this.element) return;
    
    this.element.style.left = this.x + 'px';
    this.element.style.top = this.y + 'px';
  },
  
  // Update sprite direction and animation
  updateSprite() {
    if (!this.element) return;
    
    // Remove all direction classes
    this.element.classList.remove('dir-r', 'dir-l', 'dir-u', 'dir-d', 
                                   'dir-ur', 'dir-ul', 'dir-dr', 'dir-dl');
    
    // Add current direction class
    this.element.classList.add('dir-' + this.direction);
    
    // Toggle walking class
    if (this.isWalking) {
      this.element.classList.add('walk');
    } else {
      this.element.classList.remove('walk');
    }
  },
  
  // Get player bounds for collision
  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      centerX: this.x + this.width / 2,
      centerY: this.y + this.height / 2
    };
  },
  
  // Check collision with an object
  collidesWith(obj) {
    const bounds = this.getBounds();
    return bounds.x < obj.x + obj.width &&
           bounds.x + bounds.width > obj.x &&
           bounds.y < obj.y + obj.height &&
           bounds.y + bounds.height > obj.y;
  },
  
  // Move to specific position
  teleport(x, y) {
    this.x = x;
    this.y = y;
    this.updatePosition();
  },
  
  // Reset player to spawn
  reset() {
    this.x = 100;
    this.y = 100;
    this.vx = 0;
    this.vy = 0;
    this.direction = 'r';
    this.isJumping = false;
    this.updatePosition();
    this.updateSprite();
  }
};

// Make available globally
window.Player = Player;
