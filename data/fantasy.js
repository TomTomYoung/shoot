

/**
 * Fantasy Pack
 */
(function () {
    const Pack = {
        name: "Fantasy",
        description: "Slay the dragon and save the kingdom!",

        Enemies: {},
        Boss: null,

        Stages: [
            {
                duration: 800,
                Terrain: {
                    Background: { type: 'noise2d', scale: 0.015, threshold: 0.4, color: '#004' }, // Deep water
                    Ground: { type: 'noise2d', scale: 0.04, threshold: 0.75, color: '#484' }, // Islands
                    Walls: [
                        { side: 'left', amp: 40, freq: 0.01, offset: 20, color: '#363' },
                        { side: 'right', amp: 40, freq: 0.01, offset: 20, color: '#363' }
                    ]
                },
                update: (t, ctx) => {
                    if (t % 100 === 0) ctx.spawnEnemy('mage', Math.random() * 500 + 50, -20);
                    if (t % 300 === 0) ctx.spawnEnemy('dragon_hatchling', Math.random() * 500 + 50, -20);
                }
            },
            {
                duration: 99999,
                Terrain: {
                    Background: { type: 'noise2d', scale: 0.02, threshold: 0.5, color: '#200' }, // Lava bg
                    Ground: { type: 'noise2d', scale: 0.04, threshold: 0.8, color: '#622' }, // Rocks
                    Walls: []
                },
                onStart: (ctx) => ctx.spawnBoss('ancient_dragon', 300, -100),
                update: (t, ctx) => { }
            }
        ]
    };
    GameData.registerPack("Fantasy", Pack);
})();
