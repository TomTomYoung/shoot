/**
 * Shared Bullet Definitions
 * Now includes 'behavior' logic for AST parsing
 */
(function () {
    // Standard Red Bullet
    GameData.registerBullet('red_orb', {
        type: GameData.Types.E_BULLET,
        color: '#f00',
        radius: 5,
        shape: 'circle',
        collision: {
            layer: GameData.Types.LAYER_E_BULLET,
            mask: [GameData.Types.LAYER_PLAYER, GameData.Types.LAYER_TERRAIN],
            shape: 'circle',
            size: 5,
            behavior: { type: GameData.Behaviors.DESTROY }
        },
        behavior: `
            b.x += b.vx;
            b.y += b.vy;
        `
    });

    // Standard Blue Bullet
    GameData.registerBullet('blue_orb', {
        type: GameData.Types.E_BULLET,
        color: '#00f',
        radius: 5,
        shape: 'circle',
        collision: {
            layer: GameData.Types.LAYER_E_BULLET,
            mask: [GameData.Types.LAYER_PLAYER, GameData.Types.LAYER_TERRAIN],
            shape: 'circle',
            size: 5,
            behavior: { type: GameData.Behaviors.DESTROY }
        },
        behavior: `
            b.x += b.vx;
            b.y += b.vy;
        `
    });

    // Homing Missile
    GameData.registerBullet('missile', {
        type: GameData.Types.E_BULLET,
        color: '#fa0',
        radius: 3,
        shape: 'rect',
        speed: 3,
        collision: {
            layer: GameData.Types.LAYER_E_BULLET,
            mask: [GameData.Types.LAYER_PLAYER, GameData.Types.LAYER_TERRAIN],
            shape: 'rect',
            size: [6, 6],
            behavior: { type: GameData.Behaviors.DESTROY }
        },
        behavior: `
            // Simple Homing Logic
            const target = ctx.getPlayerPosition();
            const dx = target.x - b.x;
            const dy = target.y - b.y;
            const angle = Math.atan2(dy, dx);
            
            // Steer towards target (simple lerp for direction)
            // For now, just simple tracking
            const speed = 3;
            b.vx = b.vx * 0.95 + Math.cos(angle) * speed * 0.05;
            b.vy = b.vy * 0.95 + Math.sin(angle) * speed * 0.05;
            
            // Normalize velocity to maintain speed
            const currentSpeed = Math.sqrt(b.vx*b.vx + b.vy*b.vy);
            if(currentSpeed > 0) {
                b.vx = (b.vx / currentSpeed) * speed;
                b.vy = (b.vy / currentSpeed) * speed;
            }
 
            b.x += b.vx;
            b.y += b.vy;
        `
    });

    // Needle
    GameData.registerBullet('needle', {
        type: GameData.Types.E_BULLET,
        color: '#ff0',
        radius: 2,
        length: 10,
        shape: 'line',
        speed: 6,
        collision: {
            layer: GameData.Types.LAYER_E_BULLET,
            mask: [GameData.Types.LAYER_PLAYER, GameData.Types.LAYER_TERRAIN],
            shape: 'rect', // Line approximated as rect for now
            size: [2, 10],
            behavior: { type: GameData.Behaviors.DESTROY }
        },
        behavior: `
            b.x += b.vx;
            b.y += b.vy;
        `
    });

    // Star
    GameData.registerBullet('star', {
        type: GameData.Types.E_BULLET,
        color: '#ff8',
        radius: 6,
        shape: 'star',
        speed: 3,
        collision: {
            layer: GameData.Types.LAYER_E_BULLET,
            mask: [GameData.Types.LAYER_PLAYER, GameData.Types.LAYER_TERRAIN],
            shape: 'circle',
            size: 6,
            behavior: { type: GameData.Behaviors.DESTROY }
        },
        behavior: `
            b.x += b.vx;
            b.y += b.vy;
            b.angle += 0.1; // Rotate star
        `
    });

    // Laser
    GameData.registerBullet('laser', {
        type: GameData.Types.E_BULLET,
        color: '#0ff',
        radius: 3,
        length: 20,
        shape: 'rect',
        speed: 10,
        collision: {
            layer: GameData.Types.LAYER_E_BULLET,
            mask: [GameData.Types.LAYER_PLAYER, GameData.Types.LAYER_TERRAIN],
            shape: 'rect',
            size: [6, 20],
            behavior: { type: GameData.Behaviors.PIERCE, pierce: 999 }
        },
        behavior: `
            b.x += b.vx;
            b.y += b.vy;
        `
    });

    // Test laser with player-layer collision and pierce to validate multi-hit logic
    GameData.registerBullet('test_piercing_laser', {
        type: GameData.Types.P_BULLET,
        color: '#0ff',
        radius: 4,
        shape: 'rect',
        vy: -12,
        collision: {
            layer: GameData.Types.LAYER_P_BULLET,
            mask: [GameData.Types.LAYER_ENEMY, GameData.Types.LAYER_BOSS, GameData.Types.LAYER_TERRAIN],
            shape: 'rect',
            size: [6, 24],
            behavior: {
                type: GameData.Behaviors.PIERCE,
                pierce: 4,
                onHit: { type: 'damage', value: 3 }
            }
        },
        behavior: `
            b.x += b.vx;
            b.y += b.vy;
        `
    });

    // Plasma
    GameData.registerBullet('plasma', {
        type: GameData.Types.E_BULLET,
        color: '#a0f',
        radius: 8,
        shape: 'circle',
        collision: {
            layer: GameData.Types.LAYER_E_BULLET,
            mask: [GameData.Types.LAYER_PLAYER, GameData.Types.LAYER_TERRAIN],
            shape: 'circle',
            size: 8,
            behavior: { type: GameData.Behaviors.DESTROY }
        },
        behavior: `
            b.x += b.vx;
            b.y += b.vy;
            // Pulse effect
            b.radius = 8 + Math.sin(b.age * 0.2) * 2;
        `
    });

    // Ricochet orb to validate reflection and bounce dampening against terrain and shields
    GameData.registerBullet('ricochet_orb', {
        type: GameData.Types.E_BULLET,
        color: '#0af',
        radius: 6,
        shape: 'circle',
        collision: {
            layer: GameData.Types.LAYER_E_BULLET,
            mask: [GameData.Types.LAYER_PLAYER, GameData.Types.LAYER_TERRAIN],
            shape: 'circle',
            size: 6,
            behavior: {
                type: GameData.Behaviors.REFLECT,
                axis: 'auto',
                maxBounces: 3,
                dampen: 0.92
            }
        },
        behavior: `
            b.x += b.vx;
            b.y += b.vy;
        `
    });

    // Player burst shot that splits into a spread on hit
    GameData.registerBullet('split_burst', {
        type: GameData.Types.P_BULLET,
        color: '#6ff',
        shape: 'rect',
        vy: -12,
        collision: {
            layer: GameData.Types.LAYER_P_BULLET,
            mask: [GameData.Types.LAYER_ENEMY, GameData.Types.LAYER_BOSS, GameData.Types.LAYER_TERRAIN],
            shape: 'rect',
            size: [5, 18],
            behavior: {
                type: GameData.Behaviors.SPLIT,
                bullet: 'player_normal',
                count: 5,
                spread: Math.PI / 2,
                speed: 10,
                onHit: { type: 'damage', value: 2 }
            }
        },
        behavior: `
            b.x += b.vx;
            b.y += b.vy;
        `
    });

    // Player Normal Shot
    GameData.registerBullet('player_normal', {
        type: GameData.Types.P_BULLET,
        color: '#fff',
        shape: 'rect',
        vy: -15,
        collision: {
            layer: GameData.Types.LAYER_P_BULLET,
            mask: [GameData.Types.LAYER_ENEMY, GameData.Types.LAYER_BOSS, GameData.Types.LAYER_TERRAIN],
            shape: 'rect',
            size: [4, 16],
            behavior: {
                type: GameData.Behaviors.DESTROY,
                onHit: { type: 'damage', value: 1 }
            }
        }
    });
})();
