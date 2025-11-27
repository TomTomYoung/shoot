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
    // Alien Hive
    GameData.registerTerrain('alien_hive', {
        Background: { type: 'worley', scale: 0.05, threshold: 0.7, color: '#220011' },
        Ground: { type: 'worley', scale: 0.08, threshold: 0.6, color: '#552244' },
        Walls: []
    });

    // Retro Plasma
    GameData.registerTerrain('retro_plasma', {
        Background: { type: 'sin_lattice', scale: 0.1, threshold: 0.5, color: '#220033' },
        Ground: { type: 'sin_plasma', scale: 0.05, threshold: 0.6, color: '#ff00cc' },
        Walls: []
    });

    // Cyber Circuit
    GameData.registerTerrain('cyber_circuit', {
        Background: { type: 'alien_circuit', scale: 0.05, threshold: 0.2, color: '#001100' },
        Ground: { type: 'moire', scale: 0.15, threshold: 0.85, color: '#00ff00' },
        Walls: []
    });

    // Fractal Mountains
    GameData.registerTerrain('fractal_mountains', {
        Background: { type: 'perlin_fbm', scale: 0.01, threshold: 0.4, color: '#334455' },
        Ground: { type: 'perlin_ridge', scale: 0.02, threshold: 0.75, color: '#aaeeff' },
        Walls: []
    });

    // Warp Zone
    GameData.registerTerrain('warp_zone', {
        Background: { type: 'trig_warp', scale: 0.03, threshold: 0.5, color: '#440000' },
        Ground: { type: 'sin_interference', scale: 0.04, threshold: 0.6, color: '#ffaa00' },
        Walls: []
    });
})();
