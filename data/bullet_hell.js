/**
 * Bullet Hell Pack
 */
(function () {
    const Pack = {
        name: "Bullet Hell",
        description: "Dodge the rain of bullets!",

        Enemies: {
            'fairy': {
                hp: 5, radius: 12, color: '#f88', score: 100,
                ai: (me, ctx) => {
                    me.local.y += 2;
                    me.local.x += Math.sin(me.age * 0.05) * 3;
                    if (me.age % 40 === 0) {
                        // Spiral shot
                        for (let i = 0; i < 3; i++) {
                            const angle = me.age * 0.1 + (i * (Math.PI * 2 / 3));
                            ctx.spawn(GameData.Types.E_BULLET, me.world.x, me.world.y, {
                                vx: Math.cos(angle) * 2, vy: Math.sin(angle) * 2,
                                radius: 3, color: '#f0f'
                            });
                        }
                    }
                }
            },
            'butterfly': {
                hp: 15, radius: 15, color: '#88f', score: 300,
                ai: (me, ctx) => {
                    me.local.y += 1;
                    if (me.age % 90 === 0) {
                        // Wavy aimed shot
                        const p = ctx.getPlayerPosition();
                        const angle = Math.atan2(p.y - me.world.y, p.x - me.world.x);
                        for (let i = -2; i <= 2; i++) {
                            ctx.spawn(GameData.Types.E_BULLET, me.world.x, me.world.y, {
                                vx: Math.cos(angle + i * 0.2) * 3, vy: Math.sin(angle + i * 0.2) * 3,
                                radius: 4, color: '#0ff'
                            });
                        }
                    }
                }
            }
        },

        Boss: {
            name: "Scarlet Devil",
            hp: 2000, radius: 40, color: '#f00', score: 50000,
            ai: (me, ctx) => {
                me.local.y = 150 + Math.sin(me.age * 0.01) * 20;
                me.local.x = 300 + Math.cos(me.age * 0.02) * 150;

                // Phase 1: Dense Ring
                if (me.age % 20 === 0) {
                    for (let i = 0; i < 20; i++) {
                        const a = (me.age * 0.05) + (i * (Math.PI * 2 / 20));
                        ctx.spawn(GameData.Types.E_BULLET, me.world.x, me.world.y, {
                            vx: Math.cos(a) * 2, vy: Math.sin(a) * 2,
                            radius: 3, color: '#f00'
                        });
                    }
                }
                // Phase 2: Random fast shots
                if (me.age % 5 === 0) {
                    const a = Math.random() * Math.PI * 2;
                    ctx.spawn(GameData.Types.E_BULLET, me.world.x, me.world.y, {
                        vx: Math.cos(a) * 4, vy: Math.sin(a) * 4,
                        radius: 2, color: '#fff'
                    });
                }
            }
        },

        Stages: [
            {
                duration: 600,
                terrainThreshold: 0.6,
                update: (t, ctx) => {
                    if (t % 60 === 0) ctx.spawnEnemy('fairy', Math.random() * 500 + 50, -20);
                    if (t % 200 === 0) ctx.spawnEnemy('butterfly', Math.random() * 500 + 50, -20);
                }
            },
            {
                duration: 99999,
                terrainThreshold: 0.9,
                onStart: (ctx) => ctx.spawnBoss(300, -100),
                update: (t, ctx) => { }
            }
        ]
    };
    GameData.registerPack("Bullet Hell", Pack);
})();
