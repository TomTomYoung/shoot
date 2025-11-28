/**
 * Collision Lab Pack
 * Dedicated pack for running collision_lab without affecting other packs.
 */
(function () {
    const Pack = {
        name: "Collision Lab",
        description: "Focused collision regression wave",
        Enemies: {},
        Boss: null,
        Stages: [
            'collision_lab'
        ]
    };

    GameData.registerPack("Collision Lab", Pack);
})();
