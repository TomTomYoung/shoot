/**
 * Game Data Module
 * Pure data and logic definitions. No dependencies on engine globals.
 */

const GameData = {
    // --- Definitions ---
    Types: {
        PLAYER: 0,
        ENEMY: 1,
        P_BULLET: 2,
        E_BULLET: 3,
        SPAWNER: 4,
        BOSS: 5
    },

    // --- Enemy Definitions ---
    Enemies: {
        'zako': {
            hp: 3,
            radius: 10,
            color: '#f88',
            ai: (me, ctx) => {
                me.local.y += 3;
                me.local.x += Math.sin(me.age * 0.1) * 2;
                // Shoot
                if(me.age % 60 === 0) {
                    const playerPos = ctx.getPlayerPosition();
                    const vx = (playerPos.x - me.world.x) * 0.01;
                    const vy = (playerPos.y - me.world.y) * 0.01;
                    
                    ctx.spawn(GameData.Types.E_BULLET, me.world.x, me.world.y, {
                        vx: vx,
                        vy: vy,
                        radius: 4,
                        color: '#ff0'
                    });
                }
            }
        },
        'spawner': {
            hp: 50,
            radius: 20,
            color: '#f0f',
            ai: (me, ctx) => {
                me.local.angle += 0.05;
                if (me.age % 120 === 0) {
                    ctx.spawnEnemy('zako', me.world.x, me.world.y + 20);
                    ctx.spawnParticle(me.world.x, me.world.y, '#f0f', 5);
                }
            }
        }
    },

    // --- Boss Data ---
    Boss: {
        hp: 1000,
        radius: 50,
        grid: {
            rows: 5, cols: 5, size: 20,
            cells: [
                [null, {hp:50,c:'#888'}, null, {hp:50,c:'#888'}, null],
                [{hp:50,c:'#888'}, {hp:20,c:'#f0f'}, {hp:50,c:'#888'}, {hp:20,c:'#f0f'}, {hp:50,c:'#888'}],
                [null, {hp:50,c:'#888'}, {hp:100,c:'#f00',core:true}, {hp:50,c:'#888'}, null],
                [null, {hp:50,c:'#888'}, null, {hp:50,c:'#888'}, null],
                [null, null, {hp:50,c:'#888'}, null, null],
            ]
        },
        ai: (me, ctx) => {
            if(me.local.y < 200) me.local.y += 1; // Entry
            me.local.x = 300 + Math.sin(me.age*0.01)*100;
            me.local.angle = Math.sin(me.age*0.02)*0.1;
            // Rotate children (bits)
            if(me.children) {
                me.children.forEach(c => c.local.angle += 0.1);
            }
        },
        init: (boss, ctx) => {
             // Bits
             ctx.addChild(boss, ctx.spawn(GameData.Types.ENEMY, -60, 0, {radius:10}, true));
             ctx.addChild(boss, ctx.spawn(GameData.Types.ENEMY, 60, 0, {radius:10}, true));
        }
    },

    // --- Stage Scripts ---
    Stages: [
        {   // Wave 0: Intro / Asteroid Field
            duration: 300,
            terrainThreshold: 0.65,
            update: (t, ctx) => {
                if(t % 60 === 0) ctx.spawnEnemy('zako', Math.random()*500+50, -20);
            }
        },
        {   // Wave 1: Spawner Attack
            duration: 500,
            terrainThreshold: 0.8,
            onStart: (ctx) => {
                ctx.spawnEnemy('spawner', 100, 100);
                ctx.spawnEnemy('spawner', 500, 100);
            },
            update: (t, ctx) => {}
        },
        {   // Wave 2: Boss
            duration: 99999,
            terrainThreshold: 0.95,
            onStart: (ctx) => {
                ctx.spawnBoss(300, -100);
            },
            update: (t, ctx) => {}
        }
    ]
};

// Export for browser (global) or module
if (typeof window !== 'undefined') {
    window.GameData = GameData;
}
