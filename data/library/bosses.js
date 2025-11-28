/**
 * Boss Library
 */
(function () {
    // Bullet Hell Boss
    GameData.registerBoss('scarlet_devil', {
        name: "Scarlet Devil",
        hp: 2000, radius: 40, color: '#f00', score: 50000,
        collision: {
            layer: GameData.Types.LAYER_BOSS,
            mask: [],
            shape: 'circle',
            size: 40
        },
        ai: (me, ctx) => {
            me.local.y = 150 + Math.sin(me.age * 0.01) * 20;
            me.local.x = 300 + Math.cos(me.age * 0.02) * 150;

            if (me.age % 20 === 0) {
                for (let i = 0; i < 20; i++) {
                    const a = (me.age * 0.05) + (i * (Math.PI * 2 / 20));
                    ctx.spawn(GameData.Types.E_BULLET, me.world.x, me.world.y, {
                        vx: Math.cos(a) * 2, vy: Math.sin(a) * 2,
                        radius: 3, color: '#f00'
                    });
                }
            }
            if (me.age % 5 === 0) {
                const a = Math.random() * Math.PI * 2;
                ctx.spawn(GameData.Types.E_BULLET, me.world.x, me.world.y, {
                    vx: Math.cos(a) * 4, vy: Math.sin(a) * 4,
                    radius: 2, color: '#fff'
                });
            }
        }
    });

    // Fantasy Boss
    GameData.registerBoss('ancient_dragon', {
        name: "Ancient Dragon",
        hp: 3000, radius: 60, color: '#d00', score: 100000,
        collision: {
            layer: GameData.Types.LAYER_BOSS,
            mask: [],
            shape: 'circle',
            size: 60
        },
        ai: (me, ctx) => {
            me.local.y = 100 + Math.sin(me.age * 0.005) * 50;

            if (me.age % 60 === 0) {
                const p = ctx.getPlayerPosition();
                const angle = Math.atan2(p.y - me.world.y, p.x - me.world.x);
                ctx.spawn(GameData.Types.E_BULLET, me.world.x, me.world.y, {
                    vx: Math.cos(angle) * 5, vy: Math.sin(angle) * 5,
                    radius: 15, color: '#f40'
                });
            }

            if (me.age % 300 === 0) {
                ctx.spawnEnemy('mage', me.world.x - 100, me.world.y);
                ctx.spawnEnemy('mage', me.world.x + 100, me.world.y);
            }
        }
    });

    // Sci-Fi Boss
    GameData.registerBoss('mothership', {
        name: "Mothership",
        hp: 5000, radius: 80, color: '#44f', score: 200000,
        collision: {
            layer: GameData.Types.LAYER_BOSS,
            mask: [],
            shape: 'circle',
            size: 80
        },
        ai: (me, ctx) => {
            me.local.y = 100;
            me.local.x = 300 + Math.sin(me.age * 0.01) * 200;

            if (me.age % 180 === 0) {
                for (let i = 0; i < 20; i++) {
                    ctx.spawn(GameData.Types.E_BULLET, me.world.x, me.world.y + i * 20, {
                        vx: 0, vy: 10,
                        radius: 10, color: '#0ff'
                    });
                }
            }

            if (me.age % 200 === 0) {
                ctx.spawnEnemy('fighter', me.world.x - 50, me.world.y);
                ctx.spawnEnemy('fighter', me.world.x + 50, me.world.y);
            }
        }
    });
})();
