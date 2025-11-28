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

    // Collision-focused wave to validate pierce lasers against circle and rect targets
    GameData.registerScript('collision_lab', {
        duration: 480,
        onStart: (ctx) => {
            const pathX = 300;
            // Circle targets stacked along the beam path
            [180, 240, 300].forEach(y => ctx.spawnEnemy('fairy', pathX, y));
            // Rectangular targets lower on the same path
            [360, 440].forEach(y => ctx.spawnEnemy('collision_crate', pathX, y));
            ctx.spawnBullet('test_piercing_laser', pathX, 760);
        },
        update: (t, ctx) => {
            if (t === 160 || t === 320) {
                ctx.spawnBullet('test_piercing_laser', 300, 760);
            }
            // Extra drifting crates to check off-path rectangle overlap
            if (t % 120 === 0) {
                ctx.spawnEnemy('collision_crate', 200 + (t % 240), -30);
            }
        }
    });
})();
