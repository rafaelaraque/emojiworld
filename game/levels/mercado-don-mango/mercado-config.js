/**
 * Mercado Don Mango Level Configuration
 * Minimal configuration for the level loader
 */

export const mercadoLevel = {
    id: "mercado-don-mango",
    name: "Mercado Feliz de Don Mango",
    description: "Puzzle de organización de estantería",
    icon: "🏪",
    
    spawnPoint: { x: 400, y: 400 },
    
    assets: [],
    
    scripts: [
        "mercado-level.js"
    ],
    
    // Level type
    type: "puzzle",
    
    // World settings
    world: {
        width: 800,
        height: 600,
        background: "#FFF8F0"
    }
};

export default mercadoLevel;
