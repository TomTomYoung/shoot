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
    CurrentPack: null,

    registerPack: (name, data) => {
        GameData.Packs[name] = data;
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
