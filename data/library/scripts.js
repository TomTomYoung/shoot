/**
 * Shared Stage Scripts
 */
(function () {
    // Basic Wave
    GameData.registerScript('basic_wave', {
        duration: 500,
        update: (t, ctx) => {
            if (t % 50 === 0) ctx.spawnEnemy('fairy', Math.random() * 500 + 50, -20);
        }
    });

    // Rush Wave
    GameData.registerScript('rush_wave', {
        duration: 300,
        update: (t, ctx) => {
            if (t % 20 === 0) ctx.spawnEnemy('fighter', Math.random() * 500 + 50, -20);
        }
    });
})();
