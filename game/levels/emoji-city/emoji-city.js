/**
 * Emoji City Level Configuration - Emoji World
 * Exports level data for the centralized game engine
 */

const EmojiCityLevel = {
  // Level metadata
  id: 'emoji-city',
  name: 'Emoji City',
  description: 'Defiende la ciudad de la invasión alienígena',
  icon: '🏙️',
  
  // Level type
  type: 'action',
  
  // World settings
  world: {
    width: 2800,
    height: 2000,
    background: '#5b8a38'
  },
  
  // Player spawn point
  spawn: {
    x: 1350,
    y: 930
  },
  
  // Camera bounds
  camera: {
    minX: 0,
    minY: 0,
    maxX: 2000,
    maxY: 1500,
    followPlayer: true,
    smoothing: 0.1
  },
  
  // Zones in the world
  zones: [
    {
      id: 'plaza-central',
      name: 'Plaza Central',
      x: 1050,
      y: 700,
      width: 700,
      height: 500,
      background: '#8a9e7a',
      icon: '🏛️'
    },
    {
      id: 'mercado-feliz',
      name: 'Mercado Feliz',
      x: 80,
      y: 80,
      width: 700,
      height: 550,
      background: '#72b840',
      icon: '🏪',
      entrance: { x: 330, y: 280 }
    },
    {
      id: 'zona-real',
      name: 'Zona Real',
      x: 1950,
      y: 80,
      width: 700,
      height: 600,
      background: '#3a2e38',
      icon: '🏰'
    },
    {
      id: 'tecnozona',
      name: 'Tecnozona',
      x: 2000,
      y: 800,
      width: 700,
      height: 550,
      background: '#283a50',
      icon: '🔬'
    },
    {
      id: 'reino-fuego',
      name: 'Reino de Fuego',
      x: 1600,
      y: 1400,
      width: 700,
      height: 500,
      background: '#5a2010',
      icon: '🔥'
    },
    {
      id: 'bosque-ancestral',
      name: 'Bosque Ancestral',
      x: 100,
      y: 1300,
      width: 700,
      height: 550,
      background: '#2d5c1e',
      icon: '🌳'
    }
  ],
  
  // Roads
  roads: [
    { type: 'horizontal', y: 960, width: 2800, height: 40 },
    { type: 'horizontal', y: 480, width: 2800, height: 40 },
    { type: 'horizontal', y: 1440, width: 2800, height: 40 },
    { type: 'vertical', x: 700, height: 2000, width: 40 },
    { type: 'vertical', x: 1400, height: 2000, width: 40 },
    { type: 'vertical', x: 2100, height: 2000, width: 40 }
  ],
  
  // Water features
  water: [
    { x: 790, y: 1030, width: 200, height: 130 },
    { x: 1660, y: 170, width: 280, height: 170 },
    { x: 200, y: 600, width: 180, height: 110 },
    { x: 1500, y: 1600, width: 150, height: 90, borderRadius: '40%' }
  ],
  
  // Interactive objects / landmarks
  objects: [
    // Cave entrance
    {
      id: 'cave-entrance',
      type: 'entrance',
      emoji: '🕳️',
      x: 1220,
      y: 1290,
      name: 'Cueva Oscura',
      level: 'cave',
      locked: true,
      requires: 'permit'
    },
    // Market
    {
      id: 'market',
      type: 'building',
      emoji: '🏪',
      x: 330,
      y: 280,
      name: 'Mercado Feliz',
      level: 'mercado-don-mango'
    },
    // Castle
    {
      id: 'castle',
      type: 'landmark',
      emoji: '🏰',
      x: 2275,
      y: 330,
      name: 'Castillo Real'
    },
    // Fountain
    {
      id: 'fountain',
      type: 'decoration',
      emoji: '⛲',
      x: 1365,
      y: 925
    }
  ],
  
  // NPCs
  npcs: [
    {
      id: 'emma',
      emoji: '🤗',
      x: 1400,
      y: 850,
      name: 'Emma',
      role: 'Guía',
      chatEnabled: true,
      quests: ['fruit-quest', 'ring-quest']
    },
    {
      id: 'mango',
      emoji: '👨‍🌾',
      x: 408,
      y: 340,
      name: 'Don Mango',
      role: 'Dueño del Mercado',
      chatEnabled: true,
      quests: ['market-organize']
    },
    {
      id: 'void',
      emoji: '🫅',
      x: 2300,
      y: 400,
      name: 'Rey Roland',
      role: 'Rey de la Zona Real',
      chatEnabled: true,
      quests: ['castle-towers']
    },
    {
      id: 'guardia',
      emoji: '💂',
      x: 2250,
      y: 450,
      name: 'Guardia del Castillo',
      chatEnabled: true
    },
    {
      id: 'robo',
      emoji: '👨‍🔬',
      x: 2200,
      y: 1000,
      name: 'Dr. Bits',
      role: 'Científico Principal',
      chatEnabled: true,
      quests: ['generator-color']
    },
    {
      id: 'blaze',
      emoji: '🥷',
      x: 1800,
      y: 1600,
      name: 'Blaze',
      role: 'Guerrero del Fuego',
      chatEnabled: true,
      quests: ['dragon-sacred']
    },
    {
      id: 'sage',
      emoji: '🧙',
      x: 400,
      y: 1550,
      name: 'Sage',
      role: 'El Sabio Ancestral',
      chatEnabled: true,
      quests: ['grimorio-location']
    },
    {
      id: 'miner',
      emoji: '👷',
      x: 1148,
      y: 1268,
      name: 'Minero',
      role: 'Guardián de la Cueva',
      chatEnabled: true,
      quests: ['cave-permit']
    },
    {
      id: 'elfa',
      emoji: '🧝🏻',
      x: 310,
      y: 1530,
      name: 'Elfa Mágica',
      role: 'Guardián del Bosque',
      chatEnabled: true,
      quests: ['elfa-powers'],
      hidden: true // Appears during invasion
    }
  ],
  
  // Collectibles
  collectibles: [
    { id: 'coin-1', type: 'coins', value: 15, x: 500, y: 300 },
    { id: 'coin-2', type: 'coins', value: 25, x: 2100, y: 400 },
    { id: 'relic-1', type: 'item', item: 'relic', x: 400, y: 1600 },
    { id: 'gem-1', type: 'item', item: 'gem', x: 2400, y: 300 }
  ],
  
  // Buried spots (digging)
  buriedSpots: [
    { id: 'bspot-0', item: 'coins', value: 15, x: 800, y: 800 },
    { id: 'bspot-1', item: 'relic', x: 1200, y: 1000 },
    { id: 'bspot-2', item: 'coins', value: 25, x: 1800, y: 600 },
    { id: 'bspot-3', item: 'gem', x: 600, y: 1400 },
    { id: 'bspot-4', item: 'coins', value: 40, x: 2200, y: 1200 }
  ],
  
  // Level-specific events
  events: {
    onStart: function() {
      console.log('Emoji City level started');
    },
    onZoneEnter: function(zone) {
      console.log('Entered zone:', zone.name);
    },
    onNpcInteract: function(npcId) {
      console.log('Interacting with NPC:', npcId);
    },
    onCollectItem: function(item) {
      console.log('Collected:', item);
    },
    onQuestComplete: function(questId) {
      console.log('Quest completed:', questId);
    },
    // Phase events
    onPhase1Complete: function() {
      // Ring found - start invasion timer
      setTimeout(() => {
        if (typeof triggerInvasion === 'function') {
          triggerInvasion();
        }
      }, 90000);
    },
    onPhase2Start: function() {
      // Show alien ship
      const ship = document.getElementById('alienShip');
      if (ship) ship.style.display = 'block';
    },
    onElfaPowersGiven: function() {
      // Unlock alien combat
      console.log('Elfa powers granted - alien combat unlocked');
    }
  },
  
  // Quest definitions
  quests: {
    'fruit-quest': {
      title: 'La Fruta Oficial',
      npc: 'emma',
      description: '¿Cuál es la fruta oficial de Emoji City?',
      answer: ['sandía', 'sandia', '🍉'],
      xp: 80,
      coins: 20
    },
    'ring-quest': {
      title: 'El Anillo Perdido',
      npc: 'emma',
      description: 'Encontrar el anillo de Emma en la cueva',
      requires: 'permit',
      xp: 150,
      coins: 50
    },
    'market-organize': {
      title: 'Organizar el Mercado',
      npc: 'mango',
      type: 'level',
      levelId: 'mercado-don-mango',
      xp: 50,
      coins: 20
    },
    'castle-towers': {
      title: 'Las Torres del Castillo',
      npc: 'void',
      description: '¿Cuántas torres tiene el Castillo Real?',
      answer: ['4', 'cuatro'],
      xp: 150,
      coins: 50
    }
  },
  
  // Level completion criteria
  objectives: [
    {
      id: 'explore-zones',
      type: 'exploration',
      description: 'Explorar todas las zonas',
      zones: ['plaza-central', 'mercado-feliz', 'zona-real', 'tecnozona', 'reino-fuego', 'bosque-ancestral']
    },
    {
      id: 'complete-quests',
      type: 'quest',
      description: 'Completar misiones',
      required: 3
    },
    {
      id: 'defeat-invasion',
      type: 'combat',
      description: 'Derrotar la invasión alienígena',
      requires: 'phase2'
    }
  ],
  
  // Visual settings
  visual: {
    showMinimap: true,
    showZoneName: true,
    showQuestMarkers: true,
    particleEffects: ['leaves', 'dust']
  },
  
  // Audio settings
  audio: {
    backgroundMusic: 'emoji-city-theme',
    sfx: ['step', 'jump', 'interact', 'collect', 'quest-complete']
  }
};

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EmojiCityLevel;
} else if (typeof window !== 'undefined') {
  window.EmojiCityLevel = EmojiCityLevel;
}
