/**
 * Core Data Registry
 */
const GameData = {
    Types: {
        PLAYER: 0,
        ENEMY: 1,
        P_BULLET: 2,
        E_BULLET: 3,
        SPAWNER: 4,
        BOSS: 5,
        ITEM: 6,
        EFFECT: 7,
        // Collision Layers
        LAYER_PLAYER: 'player',
        LAYER_ENEMY: 'enemy',
        LAYER_BOSS: 'boss',
        LAYER_P_BULLET: 'p_bullet',
        LAYER_E_BULLET: 'e_bullet',
        LAYER_ITEM: 'item',
        LAYER_TERRAIN: 'terrain'
    },
    // Collision Behavior Types
    Behaviors: {
        DESTROY: 'destroy',
        PIERCE: 'pierce',
        BOUNCE: 'bounce'
    },
    Packs: {}, // Registry for Game Packs (Genres)
    Library: { // Shared Data Library
        Enemies: {},
        Bosses: {},
        Bullets: {},
        Terrains: {},
        Scripts: {},
        Noise: {},
        Player: {
            // Default player collision profile
            collision: {},
            color: '#0ff',
            radius: 4,
            shape: 'player',
            shot: 'player_normal'
        }
    },
    CurrentPack: null,

    registerPack: (name, data) => {
        GameData.Packs[name] = data;
    },

    registerEnemy: (id, def) => {
        GameData.Library.Enemies[id] = def;
    },

    registerBoss: (id, def) => {
        GameData.Library.Bosses[id] = def;
    },

    registerBullet: (id, def) => {
        GameData.Library.Bullets[id] = def;
    },

    registerTerrain: (id, def) => {
        GameData.Library.Terrains[id] = def;
    },

    registerScript: (id, def) => {
        GameData.Library.Scripts[id] = def;
    },

    registerNoise: (id, def) => {
        GameData.Library.Noise[id] = def;
    },

    loadPack: (name) => {
        if (GameData.Packs[name]) {
            GameData.CurrentPack = GameData.Packs[name];
            return true;
        }
        return false;
    }
};

if (typeof window !== 'undefined') {
    window.GameData = GameData;
}

// Initialize player collision profile with shared constants
GameData.Library.Player.collision = {
    layer: GameData.Types.LAYER_PLAYER,
    mask: [
        GameData.Types.LAYER_E_BULLET,
        GameData.Types.LAYER_ENEMY,
        GameData.Types.LAYER_BOSS,
        GameData.Types.LAYER_ITEM,
        GameData.Types.LAYER_TERRAIN
    ],
    shape: 'circle',
    size: 4
};
