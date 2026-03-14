/**
 * Emoji City Level - Configuration
 * The main world map level
 */

export const EmojiCityLevel = {
    id: "emoji-city",
    name: "Emoji City",
    description: "El mundo principal de aventura",
    icon: "🏙️",
    
    spawnPoint: { x: 1350, y: 930 },
    
    assets: [],
    
    scripts: [],
    
    // Level type
    type: "world-map",
    
    // World settings
    world: {
        width: 2800,
        height: 2000,
        background: "#5b8a38"
    }
};

export default EmojiCityLevel;
