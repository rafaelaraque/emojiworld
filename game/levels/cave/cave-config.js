/**
 * Cave Level Configuration
 * Minimal configuration for the level loader
 */

export const caveLevel = {
    id: "cave",
    name: "Cueva Oscura",
    description: "Plataforma de cuevas con enemigos y jefe",
    icon: "🕳️",
    
    spawnPoint: { x: 100, y: 300 },
    
    assets: [],
    
    scripts: [
        "cave-level.js"
    ],
    
    // Level type
    type: "platformer",
    
    // World settings
    world: {
        width: 5120,
        height: 3200,
        background: "#0a0705"
    }
};

export default caveLevel;
