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
})();
