/**
 * Shared Bullet Definitions
 */
(function () {
    // Standard Red Bullet
    GameData.registerBullet('red_orb', {
        type: GameData.Types.E_BULLET,
        color: '#f00',
        radius: 5,
        shape: 'circle'
    });

    // Standard Blue Bullet
    GameData.registerBullet('blue_orb', {
        type: GameData.Types.E_BULLET,
        color: '#00f',
        radius: 5,
        shape: 'circle'
    });

    // Homing Missile
    GameData.registerBullet('missile', {
        type: GameData.Types.E_BULLET,
        color: '#fa0',
        radius: 3,
        shape: 'rect',
        homing: true,
        speed: 3
    });
    // Needle
    GameData.registerBullet('needle', {
        type: GameData.Types.E_BULLET,
        color: '#ff0',
        radius: 2,
        length: 10,
        shape: 'line', // Engine needs to support this, or just use it as metadata
        speed: 6
    });

    // Star
    GameData.registerBullet('star', {
        type: GameData.Types.E_BULLET,
        color: '#ff8',
        radius: 6,
        shape: 'star',
        speed: 3
    });

    // Laser
    GameData.registerBullet('laser', {
        type: GameData.Types.E_BULLET,
        color: '#0ff',
        radius: 3,
        length: 20,
        shape: 'rect',
        speed: 10
    });

    // Plasma
    GameData.registerBullet('plasma', {
        type: GameData.Types.E_BULLET,
        color: '#a0f',
        radius: 8,
        shape: 'circle',
        pulse: true
    });
})();
