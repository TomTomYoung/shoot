/**
 * Enemy Library
 */
(function () {
    // Bullet Hell Enemies
    GameData.registerEnemy('fairy', {
        hp: 5, radius: 12, color: '#f88', score: 100,
        collision: {
            layer: GameData.Types.LAYER_ENEMY,
            mask: [GameData.Types.LAYER_P_BULLET, GameData.Types.LAYER_PLAYER],
            shape: 'circle',
            size: 12,
            behavior: { type: GameData.Behaviors.DESTROY }
        },
        ai: (me, ctx) => {
            me.local.y += 2;
            me.local.x += Math.sin(me.age * 0.05) * 3;
            if (me.age % 40 === 0) {
                for (let i = 0; i < 3; i++) {
                    const angle = me.age * 0.1 + (i * (Math.PI * 2 / 3));
                    ctx.spawn(GameData.Types.E_BULLET, me.world.x, me.world.y, {
                        vx: Math.cos(angle) * 2, vy: Math.sin(angle) * 2,
                        radius: 3, color: '#f0f'
                    });
                }
            }
        }
    });

    GameData.registerEnemy('butterfly', {
        hp: 15, radius: 15, color: '#88f', score: 300,
        collision: {
            layer: GameData.Types.LAYER_ENEMY,
            mask: [GameData.Types.LAYER_P_BULLET, GameData.Types.LAYER_PLAYER],
            shape: 'circle',
            size: 15,
            behavior: { type: GameData.Behaviors.DESTROY }
        },
        ai: (me, ctx) => {
            me.local.y += 1;
            if (me.age % 90 === 0) {
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
    });

    // Fantasy Enemies
    GameData.registerEnemy('mage', {
        hp: 8, radius: 10, color: '#80f', score: 200,
        collision: {
            layer: GameData.Types.LAYER_ENEMY,
            mask: [GameData.Types.LAYER_P_BULLET, GameData.Types.LAYER_PLAYER],
            shape: 'circle',
            size: 10,
            behavior: { type: GameData.Behaviors.DESTROY }
        },
        ai: (me, ctx) => {
            me.local.y += 1.5;
            if (me.age % 60 === 0) me.local.x += (Math.random() - 0.5) * 100;

            if (me.age % 120 === 0) {
                const p = ctx.getPlayerPosition();
                const angle = Math.atan2(p.y - me.world.y, p.x - me.world.x);
                ctx.spawn(GameData.Types.E_BULLET, me.world.x, me.world.y, {
                    vx: Math.cos(angle) * 3, vy: Math.sin(angle) * 3,
                    radius: 5, color: '#ff0', homing: true
                });
            }
        }
    });

    GameData.registerEnemy('dragon_hatchling', {
        hp: 20, radius: 20, color: '#0a0', score: 500,
        collision: {
            layer: GameData.Types.LAYER_ENEMY,
            mask: [GameData.Types.LAYER_P_BULLET, GameData.Types.LAYER_PLAYER],
            shape: 'circle',
            size: 20,
            behavior: { type: GameData.Behaviors.DESTROY }
        },
        ai: (me, ctx) => {
            me.local.y += 2;
            if (me.age % 5 === 0) {
                ctx.spawn(GameData.Types.E_BULLET, me.world.x, me.world.y + 20, {
                    vx: (Math.random() - 0.5) * 2, vy: 3,
                    radius: 3, color: '#f80'
                });
            }
        }
    });

    // Sci-Fi Enemies
    GameData.registerEnemy('fighter', {
        hp: 4, radius: 8, color: '#0ff', score: 150,
        collision: {
            layer: GameData.Types.LAYER_ENEMY,
            mask: [GameData.Types.LAYER_P_BULLET, GameData.Types.LAYER_PLAYER],
            shape: 'circle',
            size: 8,
            behavior: { type: GameData.Behaviors.DESTROY }
        },
        ai: (me, ctx) => {
            me.local.y += 5;
            if (me.age % 30 === 0) {
                ctx.spawn(GameData.Types.E_BULLET, me.world.x, me.world.y, {
                    vx: 0, vy: 8,
                    radius: 2, color: '#0f0'
                });
            }
        }
    });

    GameData.registerEnemy('turret', {
        hp: 30, radius: 15, color: '#888', score: 400,
        collision: {
            layer: GameData.Types.LAYER_ENEMY,
            mask: [GameData.Types.LAYER_P_BULLET, GameData.Types.LAYER_PLAYER],
            shape: 'circle',
            size: 15,
            behavior: { type: GameData.Behaviors.DESTROY }
        },
        ai: (me, ctx) => {
            me.local.y += 0.5;
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
    });
    // Standard Enemies (from GameData)
    GameData.registerEnemy('zako', {
        hp: 3, radius: 10, color: '#f88',
        collision: {
            layer: GameData.Types.LAYER_ENEMY,
            mask: [GameData.Types.LAYER_P_BULLET, GameData.Types.LAYER_PLAYER],
            shape: 'circle',
            size: 10,
            behavior: { type: GameData.Behaviors.DESTROY }
        },
        ai: (me, ctx) => {
            me.local.y += 3;
            me.local.x += Math.sin(me.age * 0.1) * 2;
            if (me.age % 60 === 0) {
                const playerPos = ctx.getPlayerPosition();
                const vx = (playerPos.x - me.world.x) * 0.01;
                const vy = (playerPos.y - me.world.y) * 0.01;
                ctx.spawn(GameData.Types.E_BULLET, me.world.x, me.world.y, {
                    vx: vx, vy: vy, radius: 4, color: '#ff0'
                });
            }
        }
    });

    GameData.registerEnemy('spawner', {
        hp: 50, radius: 20, color: '#f0f',
        collision: {
            layer: GameData.Types.LAYER_ENEMY,
            mask: [GameData.Types.LAYER_P_BULLET, GameData.Types.LAYER_PLAYER],
            shape: 'circle',
            size: 20,
            behavior: { type: GameData.Behaviors.DESTROY }
        },
        ai: (me, ctx) => {
            me.local.angle += 0.05;
            if (me.age % 120 === 0) {
                ctx.spawnEnemy('zako', me.world.x, me.world.y + 20);
                ctx.spawnParticle(me.world.x, me.world.y, '#f0f', 5);
            }
        }
    });
    // --- New Enemies ---

    // Sniper: Shoots fast needles at the player
    GameData.registerEnemy('sniper', {
        hp: 8, radius: 12, color: '#aa0', score: 300,
        collision: {
            layer: GameData.Types.LAYER_ENEMY,
            mask: [GameData.Types.LAYER_P_BULLET, GameData.Types.LAYER_PLAYER],
            shape: 'circle',
            size: 12,
            behavior: { type: GameData.Behaviors.DESTROY }
        },
        ai: (me, ctx) => {
            me.local.y += 1;
            // Aiming behavior
            if (me.age % 120 === 60) {
                // Warning flash or sound could go here
            }
            if (me.age % 120 === 0) {
                const p = ctx.getPlayerPosition();
                const angle = Math.atan2(p.y - me.world.y, p.x - me.world.x);
                ctx.spawn(GameData.Types.E_BULLET, me.world.x, me.world.y, {
                    vx: Math.cos(angle) * 8, vy: Math.sin(angle) * 8,
                    radius: 2, color: '#ff0', shape: 'line', length: 15
                });
            }
        }
    });

    // Gatling: Shoots a stream of bullets
    GameData.registerEnemy('gatling', {
        hp: 20, radius: 18, color: '#555', score: 400,
        collision: {
            layer: GameData.Types.LAYER_ENEMY,
            mask: [GameData.Types.LAYER_P_BULLET, GameData.Types.LAYER_PLAYER],
            shape: 'circle',
            size: 18,
            behavior: { type: GameData.Behaviors.DESTROY }
        },
        ai: (me, ctx) => {
            me.local.y += 0.5;
            if (me.age > 60 && me.age < 200 && me.age % 5 === 0) {
                ctx.spawn(GameData.Types.E_BULLET, me.world.x, me.world.y + 10, {
                    vx: (Math.random() - 0.5) * 1, vy: 5,
                    radius: 3, color: '#fa0'
                });
            }
        }
    });

    // Star Spinner: Spiraling star bullets
    GameData.registerEnemy('star_spinner', {
        hp: 15, radius: 15, color: '#d0d', score: 350,
        collision: {
            layer: GameData.Types.LAYER_ENEMY,
            mask: [GameData.Types.LAYER_P_BULLET, GameData.Types.LAYER_PLAYER],
            shape: 'circle',
            size: 15,
            behavior: { type: GameData.Behaviors.DESTROY }
        },
        ai: (me, ctx) => {
            me.local.y += 1;
            me.local.angle += 0.1;
            if (me.age % 10 === 0) {
                const angle = me.age * 0.2;
                for (let i = 0; i < 2; i++) {
                    const a = angle + i * Math.PI;
                    ctx.spawn(GameData.Types.E_BULLET, me.world.x, me.world.y, {
                        vx: Math.cos(a) * 3, vy: Math.sin(a) * 3,
                        radius: 5, color: '#ff8', shape: 'star'
                    });
                }
            }
        }
    });

    // Heavy Tank: High HP, slow, shoots plasma
    GameData.registerEnemy('heavy_tank', {
        hp: 60, radius: 25, color: '#040', score: 600,
        collision: {
            layer: GameData.Types.LAYER_ENEMY,
            mask: [GameData.Types.LAYER_P_BULLET, GameData.Types.LAYER_PLAYER],
            shape: 'circle',
            size: 25,
            behavior: { type: GameData.Behaviors.DESTROY }
        },
        ai: (me, ctx) => {
            me.local.y += 0.2;
            if (me.age % 180 === 0) {
                const p = ctx.getPlayerPosition();
                const angle = Math.atan2(p.y - me.world.y, p.x - me.world.x);
                ctx.spawn(GameData.Types.E_BULLET, me.world.x, me.world.y, {
                    vx: Math.cos(angle) * 2, vy: Math.sin(angle) * 2,
                    radius: 10, color: '#a0f', shape: 'circle', pulse: true
                });
            }
        }
    });
})();
