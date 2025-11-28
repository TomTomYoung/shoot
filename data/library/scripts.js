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

    // Reflection test wave: ricochet bullets and crates along a lane
    GameData.registerScript('reflect_lab', {
        duration: 420,
        onStart: (ctx) => {
            [200, 300, 400].forEach(x => ctx.spawnEnemy('collision_crate', x, 220));
            for (let i = 0; i < 3; i++) {
                ctx.spawnBullet('ricochet_orb', 180 + i * 120, -10, { vx: 0, vy: 4 });
            }
        },
        update: (t, ctx) => {
            if (t % 140 === 0) {
                ctx.spawnBullet('ricochet_orb', 150 + (t % 300), -10, { vx: (Math.random() - 0.5) * 2, vy: 4 });
            }
        }
    });

    // Split test wave: single burst beam that breaks into multiple shots on contact
    GameData.registerScript('split_lab', {
        duration: 260,
        onStart: (ctx) => {
            [180, 240, 300, 360, 420].forEach(y => ctx.spawnEnemy('collision_crate', 300, y));
            ctx.spawnBullet('split_burst', 300, 760, { vy: -10 });
        },
        update: (t, ctx) => {
            if (t === 120) ctx.spawnBullet('split_burst', 300, 760, { vy: -11 });
        }
    });

    // Directional shield lab: shielded drones drifting downward
    GameData.registerScript('shield_lab', {
        duration: 520,
        onStart: (ctx) => {
            ctx.spawnEnemy('shield_drone', 220, -30);
            ctx.spawnEnemy('shield_drone', 380, -120);
        },
        update: (t, ctx) => {
            if (t % 160 === 0) ctx.spawnEnemy('shield_drone', 300 + (Math.random() - 0.5) * 140, -40);
            if (t % 100 === 0) ctx.spawnBullet('player_normal', 300, 780, { vy: -14 });
        }
    });
})();
