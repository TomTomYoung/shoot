/**
 * Fantasy Pack
 */
(function () {
    const Pack = {
        name: "Fantasy",
        description: "Slay the dragon and save the kingdom!",

        Enemies: {
            'mage': {
                hp: 8, radius: 10, color: '#80f', score: 200,
                ai: (me, ctx) => {
                    me.local.y += 1.5;
                    // Teleportish movement
                    if (me.age % 60 === 0) me.local.x += (Math.random() - 0.5) * 100;

                    if (me.age % 120 === 0) {
                        // Homing shot
                        const p = ctx.getPlayerPosition();
                        const angle = Math.atan2(p.y - me.world.y, p.x - me.world.x);
                        ctx.spawn(GameData.Types.E_BULLET, me.world.x, me.world.y, {
                            vx: Math.cos(angle) * 3, vy: Math.sin(angle) * 3,
                            radius: 5, color: '#ff0', homing: true
                        });
                    }
                }
            },
            'dragon_hatchling': {
                hp: 20, radius: 20, color: '#0a0', score: 500,
                ai: (me, ctx) => {
                    me.local.y += 2;
                    // Fire breath
                    if (me.age % 5 === 0) {
                        ctx.spawn(GameData.Types.E_BULLET, me.world.x, me.world.y + 20, {
                            vx: (Math.random() - 0.5) * 2, vy: 3,
                            radius: 3, color: '#f80'
                        });
                    }
                }
            }
        },

        Boss: {
            name: "Ancient Dragon",
            hp: 3000, radius: 60, color: '#d00', score: 100000,
            ai: (me, ctx) => {
                me.local.y = 100 + Math.sin(me.age * 0.005) * 50;

                // Fireball
                if (me.age % 60 === 0) {
                    const p = ctx.getPlayerPosition();
                    const angle = Math.atan2(p.y - me.world.y, p.x - me.world.x);
                    ctx.spawn(GameData.Types.E_BULLET, me.world.x, me.world.y, {
                        vx: Math.cos(angle) * 5, vy: Math.sin(angle) * 5,
                        radius: 15, color: '#f40'
                    });
                }

                // Minion Summon
                if (me.age % 300 === 0) {
                    ctx.spawnEnemy('mage', me.world.x - 100, me.world.y);
                    ctx.spawnEnemy('mage', me.world.x + 100, me.world.y);
                }
            }
        },

        Stages: [
            {
                duration: 800,
                terrainThreshold: 0.5, // Mountains
                update: (t, ctx) => {
                    if (t % 100 === 0) ctx.spawnEnemy('mage', Math.random() * 500 + 50, -20);
                    if (t % 300 === 0) ctx.spawnEnemy('dragon_hatchling', Math.random() * 500 + 50, -20);
                }
            },
            {
                duration: 99999,
                terrainThreshold: 0.8,
                onStart: (ctx) => ctx.spawnBoss(300, -100),
                update: (t, ctx) => { }
            }
        ]
    };
    GameData.registerPack("Fantasy", Pack);
})();
