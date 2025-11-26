/**
 * Shared Terrain Definitions
 */
(function () {
    // Space Theme
    GameData.registerTerrain('space_debris', {
        Background: { type: 'noise2d', scale: 0.02, threshold: 0.6, color: '#112' },
        Ground: { type: 'noise2d', scale: 0.05, threshold: 0.85, color: '#445' },
        Walls: []
    });

    // Cloud Theme
    GameData.registerTerrain('clouds', {
        Background: { type: 'noise2d', scale: 0.01, threshold: 0.4, color: '#88a' },
        Ground: { type: 'noise2d', scale: 0.03, threshold: 0.7, color: '#fff' },
        Walls: []
    });

    // Cavern Theme
    GameData.registerTerrain('cavern', {
        Background: { type: 'noise2d', scale: 0.02, threshold: 0.5, color: '#210' },
        Ground: { type: 'noise2d', scale: 0.04, threshold: 0.8, color: '#531' },
        Walls: [
            { side: 'left', amp: 30, freq: 0.015, offset: 30, color: '#421' },
            { side: 'right', amp: 30, freq: 0.015, offset: 30, color: '#421' }
        ]
    });
})();
