

/**
 * Sci-Fi Pack
 */
(function () {
    const Pack = {
        name: "Sci-Fi",
        description: "Defend the galaxy from the alien armada!",

        Enemies: {},
        Boss: null,

        Stages: [
            {
                duration: 1000,
                Terrain: {
                    Background: { type: 'noise2d', scale: 0.03, threshold: 0.7, color: '#113' }, // Nebula
                    Ground: { type: 'noise2d', scale: 0.06, threshold: 0.9, color: '#445' }, // Debris
                    Walls: [
                        { side: 'left', amp: 20, freq: 0.02, offset: 50, color: '#334' }, // Corridor
                        { side: 'right', amp: 20, freq: 0.02, offset: 50, color: '#334' }
                    ]
                },
                update: (t, ctx) => {
                    if (t % 40 === 0) ctx.spawnEnemy('fighter', Math.random() * 500 + 50, -20);
                    if (t % 400 === 0) ctx.spawnEnemy('turret', Math.random() * 500 + 50, -20);
                }
            },
            {
                duration: 99999,
                Terrain: {
                    Background: { type: 'noise2d', scale: 0.01, threshold: 0.2, color: '#001' }, // Deep space
                    Ground: { type: 'noise2d', scale: 0.05, threshold: 0.95, color: '#556' },
                    Walls: []
                },
                onStart: (ctx) => ctx.spawnBoss('mothership', 300, -100),
                update: (t, ctx) => { }
            }
        ]
    };
    GameData.registerPack("Sci-Fi", Pack);
})();
