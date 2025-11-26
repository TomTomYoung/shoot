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
        EFFECT: 7
    },
    Packs: {}, // Registry for Game Packs (Genres)
    Library: { // Shared Data Library
        Enemies: {},
        Bosses: {},
        Bullets: {},
        Terrains: {},
        Scripts: {}
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
