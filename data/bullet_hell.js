
/**
 * Bullet Hell Pack
 */
(function () {
    const Pack = {
        name: "Bullet Hell",
        description: "Dodge the rain of bullets!",

        // Enemies and Boss are now in Library, referenced by ID in spawn calls
        // or we can define Pack-specific overrides here if needed.
        // For now, we rely on the Engine to look up in Library if not found here.
        Enemies: {},
        Boss: null, // Will look up 'scarlet_devil' in Library if we change spawn call

        Stages: [
            {
                duration: 600,
                Terrain: 'space_debris', // Library reference
                update: (t, ctx) => {
                    if (t % 60 === 0) ctx.spawnEnemy('fairy', Math.random() * 500 + 50, -20);
                    if (t % 200 === 0) ctx.spawnEnemy('butterfly', Math.random() * 500 + 50, -20);
                    // Test spawnBullet
                    if (t % 100 === 0) ctx.spawnBullet('red_orb', Math.random() * 600, 50, { vy: 3 });
                }
            },
            'basic_wave', // Library script reference test
            {
                duration: 99999,
                Terrain: {
                    Background: { type: 'noise2d', scale: 0.02, threshold: 0.4, color: '#311' }, // Reddish
                    Ground: { type: 'noise2d', scale: 0.05, threshold: 0.9, color: '#633' },
                    Walls: []
                },
                onStart: (ctx) => ctx.spawnBoss('scarlet_devil', 300, -100),
                update: (t, ctx) => { }
            }
        ]
    };
    GameData.registerPack("Bullet Hell", Pack);
})();
