/**
 * Sci-Fi Pack
 */
(function () {
    const Pack = {
        name: "Sci-Fi",
        description: "Defend the galaxy from the alien armada!",

        Enemies: {
            'fighter': {
                hp: 4, radius: 8, color: '#0ff', score: 150,
                ai: (me, ctx) => {
                    me.local.y += 5; // Fast
                    if (me.age % 30 === 0) {
                        ctx.spawn(GameData.Types.E_BULLET, me.world.x, me.world.y, {
                            vx: 0, vy: 8, // Fast straight shot
                            radius: 2, color: '#0f0'
                        });
                    }
                }
            },
            'turret': {
                hp: 30, radius: 15, color: '#888', score: 400,
                ai: (me, ctx) => {
                    me.local.y += 0.5; // Slow
                    // Aimed burst
                    if (me.age % 120 === 0) {
                        const p = ctx.getPlayerPosition();
                        const angle = Math.atan2(p.y - me.world.y, p.x - me.world.x);
                        for (let i = 0; i < 5; i++) {
                            setTimeout(() => {
                                if (!me.active) return;
                                ctx.spawn(GameData.Types.E_BULLET, me.world.x, me.world.y, {
                                    vx: Math.cos(angle) * 6, vy: Math.sin(angle) * 6,
                                    radius: 3, color: '#f00'
                                });
                            }, i * 100);
                        }
                    }
                }
            }
        },

        Boss: {
            name: "Mothership",
            hp: 5000, radius: 80, color: '#44f', score: 200000,
            ai: (me, ctx) => {
                me.local.y = 100;
                me.local.x = 300 + Math.sin(me.age * 0.01) * 200;

                // Beam Attack (Line of bullets)
                if (me.age % 180 === 0) {
                    for (let i = 0; i < 20; i++) {
                        ctx.spawn(GameData.Types.E_BULLET, me.world.x, me.world.y + i * 20, {
                            vx: 0, vy: 10,
                            radius: 10, color: '#0ff'
                        });
                    }
                }

                // Fighter Launch
                if (me.age % 200 === 0) {
                    ctx.spawnEnemy('fighter', me.world.x - 50, me.world.y);
                    ctx.spawnEnemy('fighter', me.world.x + 50, me.world.y);
                }
            }
        },

        Stages: [
            {
                duration: 1000,
                terrainThreshold: 0.9, // Space
                update: (t, ctx) => {
                    if (t % 40 === 0) ctx.spawnEnemy('fighter', Math.random() * 500 + 50, -20);
                    if (t % 400 === 0) ctx.spawnEnemy('turret', Math.random() * 500 + 50, -20);
                }
            },
            {
                duration: 99999,
                terrainThreshold: 0.95,
                onStart: (ctx) => ctx.spawnBoss(300, -100),
                update: (t, ctx) => { }
            }
        ]
    };
    GameData.registerPack("Sci-Fi", Pack);
})();
