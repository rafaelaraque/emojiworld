/**
 * Level Loader System for Emoji World
 * Loads level configuration files and initializes them in the game engine
 */

const LevelLoader = {
  currentLevel: null,
  currentConfig: null,
  containerId: 'level-container',
  levels: {},
  
  /**
   * Register a level configuration
   */
  registerLevel(levelId, config) {
    this.levels[levelId] = config;
    console.log(`Level registered: ${levelId}`);
  },
  
  /**
   * Load a level by ID
   */
  async loadLevel(levelId, options = {}) {
    const containerId = options.containerId || this.containerId;
    const onLoad = options.onLoad;
    const onError = options.onError;
    
    console.log(`Loading level: ${levelId}`);
    
    // Check if level is already registered
    if (this.levels[levelId]) {
      this.currentLevel = levelId;
      this.currentConfig = this.levels[levelId];
      
      if (onLoad) onLoad(this.currentConfig);
      return this.currentConfig;
    }
    
    // Try to load from external file
    try {
      // Map level IDs to their config files
      const levelPaths = {
        'cave': 'levels/cave/cave-config.js',
        'mercado-don-mango': 'levels/mercado-don-mango/mercado-config.js',
        'emoji-city': 'levels/emoji-city.js'
      };
      
      const levelPath = levelPaths[levelId];
      
      if (!levelPath) {
        throw new Error(`Unknown level: ${levelId}`);
      }
      
      // Load the level script
      await this.loadScript(levelPath);
      
      // Get the level config from global
      const configName = levelId.charAt(0).toUpperCase() + levelId.slice(1).replace(/-([a-z])/g, g => g[1].toUpperCase()) + 'Level';
      const levelConfig = window[configName];
      
      if (!levelConfig) {
        throw new Error(`Level configuration not found: ${levelId}`);
      }
      
      this.registerLevel(levelId, levelConfig);
      this.currentLevel = levelId;
      this.currentConfig = levelConfig;
      
      if (onLoad) onLoad(levelConfig);
      
      return levelConfig;
      
    } catch (error) {
      console.error('Level load error:', error);
      
      if (onError) {
        onError(error);
      } else {
        this.showError(error.message);
      }
      
      return null;
    }
  },
  
  /**
   * Load a JavaScript file
   */
  loadScript(src) {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        resolve();
        return;
      }
      
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.head.appendChild(script);
    });
  },
  
  /**
   * Load level in iframe for embedded play
   */
  async loadLevelInFrame(levelId, options = {}) {
    const { width = '100%', height = '100%' } = options;
    
    // Create or get container
    let container = document.getElementById(this.containerId);
    if (!container) {
      container = document.createElement('div');
      container.id = this.containerId;
      container.style.cssText = 'position:fixed;inset:0;z-index:1000;background:rgba(0,0,0,0.95);';
      document.body.appendChild(container);
    }
    
    // Map level IDs to their HTML files
    const levelHtmlPaths = {
      'cave': 'levels/cave/cave.html',
      'mercado-don-mango': 'levels/mercado-don-mango/mercado.html',
      'emoji-city': 'levels/emoji-city.html'
    };
    
    const htmlPath = levelHtmlPaths[levelId];
    
    if (!htmlPath) {
      throw new Error(`Unknown level: ${levelId}`);
    }
    
    // Load the level HTML in an iframe
    container.innerHTML = `
      <iframe 
        src="${htmlPath}" 
        style="width:${width};height:${height};border:none;"
        allow="fullscreen"
      ></iframe>
    `;
    
    this.currentLevel = levelId;
    
    return container;
  },
  
  /**
   * Start a level in the game engine
   */
  startLevel(levelConfig, gameEngine) {
    if (!levelConfig) {
      console.error('No level configuration provided');
      return;
    }
    
    console.log(`Starting level: ${levelConfig.name}`);
    
    // Initialize level in game engine
    if (gameEngine && typeof gameEngine.loadLevel === 'function') {
      gameEngine.loadLevel(levelConfig);
    } else {
      // Fallback: emit event for external handler
      const event = new CustomEvent('levelStart', { 
        detail: { level: levelConfig }
      });
      document.dispatchEvent(event);
    }
    
    // Call level's onStart if defined
    if (levelConfig.events && typeof levelConfig.events.onStart === 'function') {
      levelConfig.events.onStart();
    }
  },
  
  /**
   * Load and start a level (legacy function)
   */
  async playLevel(levelId, gameEngine) {
    const config = await this.loadLevel(levelId);
    
    if (config) {
      this.startLevel(config, gameEngine);
    }
    
    return config;
  },
  
  /**
   * Close the current level
   */
  closeLevel(callback) {
    const container = document.getElementById(this.containerId);
    if (container) {
      container.remove();
    }
    
    // Call level's onEnd if defined
    if (this.currentConfig && this.currentConfig.events && typeof this.currentConfig.events.onEnd === 'function') {
      this.currentConfig.events.onEnd();
    }
    
    this.currentLevel = null;
    this.currentConfig = null;
    
    if (callback) callback();
  },
  
  /**
   * Show error message
   */
  showError(message) {
    const container = document.getElementById(this.containerId);
    if (container) {
      container.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:#ff6b6b;font-family:sans-serif;padding:20px;text-align:center;">
          <div style="font-size:48px;margin-bottom:20px;">⚠️</div>
          <div style="font-size:18px;margin-bottom:10px;">Error al cargar nivel</div>
          <div style="color:#888;">${message}</div>
          <button onclick="LevelLoader.closeLevel()" style="margin-top:20px;padding:12px 24px;background:#ff6b6b;border:none;border-radius:8px;color:white;cursor:pointer;">
            Cerrar
          </button>
        </div>
      `;
    }
  },
  
  /**
   * Get list of available levels
   */
  getLevels() {
    return {
      cave: {
        id: 'cave',
        name: 'Cueva Oscura',
        path: 'levels/cave/cave.html',
        icon: '🕳️',
        type: 'platformer',
        description: 'Plataforma de cuevas con enemigos y jefe'
      },
      'mercado-don-mango': {
        id: 'mercado-don-mango',
        name: 'Mercado Feliz de Don Mango',
        path: 'levels/mercado-don-mango/mercado.html',
        icon: '🏪',
        type: 'puzzle',
        description: 'Puzzle de organización de estantería'
      },
      'emoji-city': {
        id: 'emoji-city',
        name: 'Emoji City',
        path: 'levels/emoji-city.html',
        icon: '🏙️',
        type: 'action',
        description: 'El mundo principal de aventura'
      }
    };
  },
  
  /**
   * Get current level configuration
   */
  getCurrentLevel() {
    return this.currentConfig;
  }
};

// Pre-register levels from config files (if already loaded)
// CaveLevel, MercadoDonMangoLevel, EmojiCityLevel

// Make available globally
window.LevelLoader = LevelLoader;

// Utility functions for quick loading
window.loadLevel = function(levelId) {
  return LevelLoader.loadLevelInFrame(levelId);
};

window.startGame = function(levelId) {
  return LevelLoader.loadLevelInFrame(levelId);
};

// Legacy compatibility
window.openLevel = function(levelId) {
  return LevelLoader.loadLevelInFrame(levelId);
};

// Listen for messages from embedded levels
window.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'LEVEL_READY') {
    console.log('Level ready received:', e.data.levelId);
    
    // Dispatch event for game engine
    const event = new CustomEvent('levelReady', { 
      detail: { 
        levelId: e.data.levelId,
        config: e.data.config
      }
    });
    document.dispatchEvent(event);
  }
});
