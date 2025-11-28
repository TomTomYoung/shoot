/**
 * Game Engine Core
 */

// --- Entity System ---
class Entity {
    constructor(type, x, y) {
        this.id = Math.random().toString(36).substr(2, 9);
        this.type = type;
        this.active = true;

        this.local = { x, y, angle: 0 };
        this.world = { x, y, matrix: Mat3.identity() };

        this.parent = null;
        this.children = [];

        this.hp = 10;
        this.age = 0;
        this.radius = 5;
        this.grid = null; // For boss/blocks

        // Rendering properties (defaults)
        this.color = '#fff';
        this.shape = 'circle'; // circle, rect, custom

        // Gameplay props
        this.score = 0;
        this.itemDrop = null;
    }

    addChild(child) {
        child.parent = this;
        this.children.push(child);
    }
}

// --- Engine State ---
let ENTITIES = [];
let PARTICLES = [];
let SCROLL_Y = 0;
let CANVAS, CTX;
let INPUT = { x: 0, y: 0, shot: false, slow: false, bomb: false, enter: false };
let STAGE = { waveId: 0, timer: 0, scripts: [] };
let PLAYER = null;

const STATE = {
    TITLE: 0,
    PLAY: 1,
    GAMEOVER: 2
};
let CURRENT_STATE = STATE.TITLE;

const GAME_STATS = {
    score: 0,
    lives: 3,
    bombs: 2,
    power: 0,
    hiscore: 0
};

// --- Context Bridge ---
const GAME_CONTEXT = {
    spawn: (type, x, y, props, returnEntity) => {
        const e = new Entity(type, x, y);
        if (props) Object.assign(e, props);
        ensureCollision(e);
        ENTITIES.push(e);
        return returnEntity ? e : undefined;
    },
    spawnEnemy: (archetype, x, y) => {
        // 1. Try Current Pack
        let def = GameData.CurrentPack && GameData.CurrentPack.Enemies ? GameData.CurrentPack.Enemies[archetype] : null;
        // 2. Try Global Library
        if (!def) def = GameData.Library.Enemies[archetype];

        if (!def) return;
        const e = new Entity(GameData.Types.ENEMY, x, y);
        Object.assign(e, def);
        if (def.collision) e.collision = cloneCollision(def.collision);
        ensureCollision(e);
        ENTITIES.push(e);
    },
    spawnBoss: (archetype, x, y) => {
        // Handle legacy call (x, y)
        if (typeof archetype === 'number') {
            y = x; x = archetype;
            if (GameData.CurrentPack && GameData.CurrentPack.Boss) {
                const def = GameData.CurrentPack.Boss;
                const e = new Entity(GameData.Types.BOSS, x, y);
                Object.assign(e, def);
                if (def.collision) e.collision = cloneCollision(def.collision);
                ensureCollision(e);
                if (def.grid) e.grid = JSON.parse(JSON.stringify(def.grid));
                ENTITIES.push(e);
                if (def.init) def.init(e, GAME_CONTEXT);
            }
            return;
        }

        // ID based lookup
        let def = GameData.CurrentPack && GameData.CurrentPack.Bosses ? GameData.CurrentPack.Bosses[archetype] : null;
        if (!def) def = GameData.Library.Bosses[archetype];

        if (!def) return;

        const e = new Entity(GameData.Types.BOSS, x, y);
        Object.assign(e, def);
        if (def.collision) e.collision = cloneCollision(def.collision);
        ensureCollision(e);
        if (def.grid) e.grid = JSON.parse(JSON.stringify(def.grid));
        ENTITIES.push(e);
        if (def.init) def.init(e, GAME_CONTEXT);
    },
    spawnParticle: (x, y, c, n) => spawnParticle(x, y, c, n),
    addChild: (parent, child) => parent.addChild(child),
    spawnBullet: (id, x, y, props) => {
        const def = GameData.Library.Bullets[id];
        if (!def) return;
        const b = new Entity(def.type || GameData.Types.E_BULLET, x, y);
        Object.assign(b, def);
        if (def.collision) b.collision = cloneCollision(def.collision);
        ensureCollision(b);
        if (props) Object.assign(b, props);
        ensureCollision(b);
        ENTITIES.push(b);
        return b;
    },
    getPlayerPosition: () => PLAYER ? ({ x: PLAYER.world.x, y: PLAYER.world.y }) : { x: 0, y: 0 }
};

// --- Core Functions ---

function initGame(canvasId) {
    CANVAS = document.getElementById(canvasId);
    CTX = CANVAS.getContext('2d');
    setupInput();
    gameLoop();
}

function startGame(packName) {
    if (GameData.loadPack(packName)) {
        STAGE.scripts = GameData.CurrentPack.Stages;
        STAGE.waveId = 0;
        STAGE.timer = 0;

        ENTITIES = [];
        PARTICLES = [];
        SCROLL_Y = 0;

        GAME_STATS.score = 0;
        GAME_STATS.lives = 3;
        GAME_STATS.bombs = 2;
        GAME_STATS.power = 0;

        spawnPlayer();

        CURRENT_STATE = STATE.PLAY;
    }
}

function spawnPlayer() {
    PLAYER = new Entity(GameData.Types.PLAYER, 300, 700);
    const playerDef = GameData.Library.Player || {};
    Object.assign(PLAYER, playerDef);
    if (!PLAYER.collision) {
        PLAYER.collision = {
            layer: GameData.Types.LAYER_PLAYER,
            mask: [GameData.Types.LAYER_E_BULLET, GameData.Types.LAYER_ENEMY, GameData.Types.LAYER_BOSS, GameData.Types.LAYER_ITEM, GameData.Types.LAYER_TERRAIN],
            shape: 'circle',
            size: 4
        };
    } else {
        PLAYER.collision = cloneCollision(PLAYER.collision);
        if (PLAYER.collision.behavior && PLAYER.collision.behavior.type === GameData.Behaviors.DESTROY) {
            delete PLAYER.collision.behavior;
        }
    }
    ENTITIES.push(PLAYER);
}

function updateStage() {
    STAGE.timer++;
    let currentScript = STAGE.scripts[STAGE.waveId];

    // Resolve from Library if string
    if (typeof currentScript === 'string') {
        currentScript = GameData.Library.Scripts[currentScript];
        // Cache it? Or just use it. For now just use it.
        // But we need to handle duration and update.
        // If it's a string in the array, we can't easily replace it in place without mutating the original pack data which might be bad if we restart.
        // Better to resolve it once when wave starts?
        // Let's resolve it here dynamically.
    }

    if (!currentScript) return; // Should not happen

    if (STAGE.timer > currentScript.duration && STAGE.waveId < STAGE.scripts.length - 1) {
        STAGE.waveId++;
        STAGE.timer = 0;

        let nextScript = STAGE.scripts[STAGE.waveId];
        if (typeof nextScript === 'string') nextScript = GameData.Library.Scripts[nextScript];

        if (nextScript && nextScript.onStart) {
            nextScript.onStart(GAME_CONTEXT);
        }
        showStatus(`WAVE ${STAGE.waveId + 1}`);
    }

    if (currentScript.update) {
        currentScript.update(STAGE.timer, GAME_CONTEXT);
    }

    SCROLL_Y += 1;
}

function showStatus(text) {
    const div = document.getElementById('status');
    if (div) {
        div.innerText = text;
        div.style.color = '#fff';
        setTimeout(() => div.innerText = '', 2000);
    }
}

function getTerrainConfig() {
    let t = STAGE.scripts[STAGE.waveId].Terrain;
    if (typeof t === 'string') {
        t = GameData.Library.Terrains[t];
    }
    return t || {
        Background: { type: 'noise2d', scale: 0.02, threshold: 0.6, color: '#222' },
        Ground: { type: 'noise2d', scale: 0.05, threshold: 0.8, color: '#555' },
        Walls: []
    };
}

function checkCollision(wx, wy) {
    const config = getTerrainConfig();
    const ny = wy - SCROLL_Y;

    // 1. Ground (2D Noise)
    if (config.Ground) {
        const n = Noise.get(wx * config.Ground.scale, ny * config.Ground.scale);
        if (n > config.Ground.threshold) return true;
    }

    // 2. Walls (1D Noise)
    if (config.Walls) {
        for (let w of config.Walls) {
            // Noise.get(x, y) -> use y for 1D noise along vertical axis
            const n = Noise.get(0, ny * w.freq);
            // Map -1..1 to 0..1? Noise.get returns 0..1 usually in this implementation? 
            // Let's check utils.js later. Assuming 0..1 for now based on previous usage.
            // Actually previous usage was simple threshold.

            const offset = (n * w.amp) + w.offset;

            if (w.side === 'left') {
                if (wx < offset) return true;
            } else if (w.side === 'right') {
                if (wx > 600 - offset) return true;
            }
        }
    }

    return false;
}

// --- Generic Collision System ---

function checkOverlap(a, b) {
    // 1. Get World Positions
    const ax = a.world.x, ay = a.world.y;
    const bx = b.world.x, by = b.world.y;

    // 2. Determine Shapes
    const aShape = a.collision.shape;
    const bShape = b.collision.shape;
    const aSize = a.collision.size;
    const bSize = b.collision.size;

    // 3. Check Overlap
    if (aShape === 'circle' && bShape === 'circle') {
        const dx = ax - bx;
        const dy = ay - by;
        const r = aSize + bSize;
        return (dx * dx + dy * dy) < (r * r);
    }
    else if (aShape === 'rect' && bShape === 'rect') {
        // Size is [w, h] for rect. Center origin assumed.
        const aw = Array.isArray(aSize) ? aSize[0] : aSize;
        const ah = Array.isArray(aSize) ? aSize[1] : aSize;
        const bw = Array.isArray(bSize) ? bSize[0] : bSize;
        const bh = Array.isArray(bSize) ? bSize[1] : bSize;

        return Math.abs(ax - bx) < (aw + bw) / 2 &&
            Math.abs(ay - by) < (ah + bh) / 2;
    }
    else if ((aShape === 'circle' && bShape === 'rect') || (aShape === 'rect' && bShape === 'circle')) {
        const c = aShape === 'circle' ? a : b;
        const r = aShape === 'rect' ? a : b;
        const cSize = c.collision.size;
        const rSize = r.collision.size;
        const rw = Array.isArray(rSize) ? rSize[0] : rSize;
        const rh = Array.isArray(rSize) ? rSize[1] : rSize;

        const distX = Math.abs(c.world.x - r.world.x);
        const distY = Math.abs(c.world.y - r.world.y);

        if (distX > (rw / 2 + cSize)) return false;
        if (distY > (rh / 2 + cSize)) return false;

        if (distX <= (rw / 2)) return true;
        if (distY <= (rh / 2)) return true;

        const dx = distX - rw / 2;
        const dy = distY - rh / 2;
        return (dx * dx + dy * dy <= (cSize * cSize));
    }

    return false;
}

function cloneCollision(collision) {
    if (!collision) return collision;
    const cloned = { ...collision };
    if (Array.isArray(collision.mask)) cloned.mask = [...collision.mask];
    if (Array.isArray(collision.size)) cloned.size = [...collision.size];
    if (collision.behavior) cloned.behavior = JSON.parse(JSON.stringify(collision.behavior));
    return cloned;
}

function defaultCollisionForEntity(e) {
    const size = () => {
        if (Array.isArray(e.size)) return [...e.size];
        if (typeof e.size === 'number') return e.size;
        return e.radius || 4;
    };

    switch (e.type) {
        case GameData.Types.ENEMY:
            return {
                layer: GameData.Types.LAYER_ENEMY,
                mask: [GameData.Types.LAYER_P_BULLET, GameData.Types.LAYER_PLAYER],
                shape: e.shape || 'circle',
                size: size(),
                behavior: { type: GameData.Behaviors.DESTROY }
            };
        case GameData.Types.P_BULLET:
            return {
                layer: GameData.Types.LAYER_P_BULLET,
                mask: [GameData.Types.LAYER_ENEMY, GameData.Types.LAYER_BOSS, GameData.Types.LAYER_TERRAIN],
                shape: e.shape || 'circle',
                size: size(),
                behavior: { type: GameData.Behaviors.DESTROY, onHit: { type: 'damage', value: e.power || 1 } }
            };
        case GameData.Types.E_BULLET:
            return {
                layer: GameData.Types.LAYER_E_BULLET,
                mask: [GameData.Types.LAYER_PLAYER, GameData.Types.LAYER_TERRAIN],
                shape: e.shape || 'circle',
                size: size(),
                behavior: { type: GameData.Behaviors.DESTROY }
            };
        case GameData.Types.ITEM:
            return {
                layer: GameData.Types.LAYER_ITEM,
                mask: [GameData.Types.LAYER_PLAYER],
                shape: e.shape || 'circle',
                size: size()
            };
        case GameData.Types.BOSS:
            return {
                layer: GameData.Types.LAYER_BOSS,
                mask: [GameData.Types.LAYER_P_BULLET, GameData.Types.LAYER_PLAYER],
                shape: e.shape || 'circle',
                size: size()
            };
        default:
            return null;
    }
}

function ensureCollision(e) {
    if (e.collision) {
        e.collision = cloneCollision(e.collision);
        return;
    }

    const fallback = defaultCollisionForEntity(e);
    if (fallback) e.collision = fallback;
}

function isDestroyBehavior(collision) {
    return collision && collision.behavior && collision.behavior.type === GameData.Behaviors.DESTROY;
}

function resolveCollision(a, b) {
    // Apply effects based on 'a' hitting 'b'

    const behavior = a.collision.behavior;
    if (!behavior) return;

    // 1. Self Behavior
    if (behavior.type === GameData.Behaviors.DESTROY) {
        a.active = false;
        spawnParticle(a.world.x, a.world.y, a.color || '#fff');
    } else if (behavior.type === GameData.Behaviors.PIERCE) {
        if (behavior.pierce > 0) {
            behavior.pierce--;
        } else {
            a.active = false;
        }
    }

    // 2. Target Effect (onHit)
    if (behavior.onHit) {
        const effects = Array.isArray(behavior.onHit) ? behavior.onHit : [behavior.onHit];
        effects.forEach(eff => {
            if (eff.type === 'damage') {
                if (b.hp !== undefined) {
                    b.hp -= eff.value || 1;
                    spawnParticle(b.world.x, b.world.y, '#fff');
                    if (b.hp <= 0) {
                        b.active = false;
                        spawnExplosion(b.world.x, b.world.y);
                        if (b.score) addScore(b.score);
                        trySpawnItem(b.world.x, b.world.y);
                        if (b.type === GameData.Types.BOSS) showStatus("BOSS DESTROYED");
                    }
                }
            } else if (eff.type === 'status') {
                // Implement status effects later
            } else if (eff.type === 'modify') {
                if (b[eff.prop] !== undefined) {
                    b[eff.prop] *= eff.mul;
                }
            }
        });
    } else {
        // Default damage if not specified but collision happened?
        // For backward compatibility or simple logic:
        if (a.type === GameData.Types.P_BULLET && (b.type === GameData.Types.ENEMY || b.type === GameData.Types.BOSS)) {
            if (b.hp !== undefined) {
                b.hp -= a.power || 1;
                spawnParticle(b.world.x, b.world.y, '#fff');
                if (b.hp <= 0) {
                    b.active = false;
                    spawnExplosion(b.world.x, b.world.y);
                    if (b.score) addScore(b.score);
                    trySpawnItem(b.world.x, b.world.y);
                }
            }
        }
    }
}

function gameLoop() {
    // Clear Screen
    CTX.fillStyle = '#000';
    CTX.fillRect(0, 0, 600, 800);

    if (CURRENT_STATE === STATE.TITLE) {
        renderTitle();
    } else if (CURRENT_STATE === STATE.PLAY) {
        updateGame();
        renderBackground(); // New: Render non-colliding bg
        renderTerrain();    // New: Render colliding terrain
        renderGame();       // Entities
        renderUI();
    } else if (CURRENT_STATE === STATE.GAMEOVER) {
        renderBackground();
        renderTerrain();
        renderGame();
        renderGameOver();
    }

    requestAnimationFrame(gameLoop);
}

function updateGame() {
    // A. Stage
    updateStage();

    // B. Logic
    if (PLAYER && PLAYER.active) {
        const speed = INPUT.slow ? 2 : 5;
        PLAYER.local.x += INPUT.x * speed;
        PLAYER.local.y += INPUT.y * speed;
        PLAYER.local.x = Math.max(0, Math.min(600, PLAYER.local.x));
        PLAYER.local.y = Math.max(0, Math.min(800, PLAYER.local.y));

        if (INPUT.shot && PLAYER.age % 4 === 0) {
            const shotId = PLAYER.shot || (GameData.Library.Player && GameData.Library.Player.shot) || 'player_normal';
            GAME_CONTEXT.spawnBullet(shotId, PLAYER.world.x, PLAYER.world.y - 10);
        }

        if (INPUT.bomb && GAME_STATS.bombs > 0) {
            useBomb();
            INPUT.bomb = false; // Trigger once
        }

        PLAYER.age++;
    }

    ENTITIES.forEach(e => {
        e.age++;
        if (e.vx) e.local.x += e.vx;
        if (e.vy) e.local.y += e.vy;
        if (e.ai) e.ai(e, GAME_CONTEXT);

        // Homing logic
        if (e.homing) {
            const p = GAME_CONTEXT.getPlayerPosition();
            const angle = Math.atan2(p.y - e.world.y, p.x - e.world.x);
            e.vx = e.vx * 0.95 + Math.cos(angle) * 0.5;
            e.vy = e.vy * 0.95 + Math.sin(angle) * 0.5;
        }
    });

    // C. Hierarchy
    const updateMatrix = (e, pMat) => {
        const T = Mat3.translation(e.local.x, e.local.y);
        const R = Mat3.rotation(e.local.angle);
        const local = Mat3.multiply(T, R);
        e.world.matrix = Mat3.multiply(pMat, local);
        const pos = Mat3.transform(e.world.matrix, 0, 0);
        e.world.x = pos.x; e.world.y = pos.y;
        e.children.forEach(c => updateMatrix(c, e.world.matrix));
    };
    ENTITIES.filter(e => !e.parent).forEach(e => updateMatrix(e, Mat3.identity()));

    // D. Collision (Generic)
    // Filter entities with collision props
    const colliders = ENTITIES.filter(e => e.active && e.collision);

    // 1. Terrain Check
    colliders.forEach(a => {
        if (!a.active) return;
        if (a.collision.mask.includes(GameData.Types.LAYER_TERRAIN)) {
            if (checkCollision(a.world.x, a.world.y)) {
                // Hit Terrain
                if (isDestroyBehavior(a.collision)) {
                    a.active = false;
                    spawnParticle(a.world.x, a.world.y, '#888', 2);
                }
                if (a.type === GameData.Types.PLAYER) playerHit();
            }
        }
    });

    // 2. Entity vs Entity (pairwise to avoid double-processing)
    for (let i = 0; i < colliders.length; i++) {
        const a = colliders[i];
        if (!a.active) continue;

        for (let j = i + 1; j < colliders.length; j++) {
            const b = colliders[j];
            if (!b.active) continue;

            const aTargetsB = a.collision.mask.includes(b.collision.layer);
            const bTargetsA = b.collision.mask.includes(a.collision.layer);

            if (!aTargetsB && !bTargetsA) continue;

            // Boss grid stays directional (attacker -> boss grid)
            if (aTargetsB && b.type === GameData.Types.BOSS && b.grid) {
                if (resolveBossHit(b, a) && isDestroyBehavior(a.collision)) {
                    a.active = false;
                    spawnParticle(a.world.x, a.world.y, '#ff0');
                }
            } else if (bTargetsA && a.type === GameData.Types.BOSS && a.grid) {
                if (resolveBossHit(a, b) && isDestroyBehavior(b.collision)) {
                    b.active = false;
                    spawnParticle(b.world.x, b.world.y, '#ff0');
                }
            } else if (checkOverlap(a, b)) {
                if (aTargetsB) {
                    resolveCollision(a, b);
                    if (b.type === GameData.Types.PLAYER) playerHit();
                    if (b.type === GameData.Types.ITEM && a.type === GameData.Types.PLAYER) collectItem(b);
                }
                if (bTargetsA && a.active && b.active) {
                    resolveCollision(b, a);
                    if (a.type === GameData.Types.PLAYER) playerHit();
                    if (a.type === GameData.Types.ITEM && b.type === GameData.Types.PLAYER) collectItem(a);
                }
            }
        }
    }

    // 3. Out of bounds check for bullets
    colliders.forEach(a => {
        if ((a.type === GameData.Types.P_BULLET || a.type === GameData.Types.E_BULLET) && (a.world.y < -50 || a.world.y > 850 || a.world.x < -50 || a.world.x > 650)) {
            a.active = false;
        }
    });

    ENTITIES = ENTITIES.filter(e => e.active);
    updateParticles();
}

// --- Rendering ---

function playerHit() {
    spawnExplosion(PLAYER.world.x, PLAYER.world.y);
    PLAYER.active = false;
    GAME_STATS.lives--;
    GAME_STATS.power = Math.max(0, GAME_STATS.power - 1);

    if (GAME_STATS.lives < 0) {
        CURRENT_STATE = STATE.GAMEOVER;
    } else {
        setTimeout(() => {
            if (CURRENT_STATE === STATE.PLAY) {
                spawnPlayer();
                // Invincibility could be added here
            }
        }, 1000);
    }
}

function useBomb() {
    GAME_STATS.bombs--;
    // Clear all enemy bullets
    ENTITIES.forEach(e => {
        if (e.type === GameData.Types.E_BULLET) {
            e.active = false;
            spawnParticle(e.world.x, e.world.y, '#aaa', 1);
        }
        if (e.type === GameData.Types.ENEMY) {
            e.hp -= 10;
            if (e.hp <= 0) {
                e.active = false;
                spawnExplosion(e.world.x, e.world.y);
                addScore(e.score || 100);
            }
        }
    });
    // Flash screen
    const flash = new Entity(GameData.Types.EFFECT, 300, 400);
    flash.life = 10;
    flash.render = (ctx) => {
        ctx.fillStyle = `rgba(255,255,255,${flash.life / 10})`;
        ctx.fillRect(0, 0, 600, 800);
    };
    ENTITIES.push(flash);
}

function trySpawnItem(x, y) {
    if (Math.random() < 0.3) {
        const type = Math.random() < 0.2 ? 'bomb' : 'power';
        const item = new Entity(GameData.Types.ITEM, x, y);
        item.itemType = type;
        item.vy = 2;
        item.radius = 8;
        item.color = type === 'bomb' ? '#f00' : '#0f0';
        ensureCollision(item);
        ENTITIES.push(item);
    }
}

function collectItem(item) {
    if (item.itemType === 'bomb') {
        GAME_STATS.bombs++;
        showStatus("BOMB EXTEND!");
    } else if (item.itemType === 'power') {
        GAME_STATS.power++;
        GAME_STATS.score += 1000;
        showStatus("POWER UP!");
    }
}

function addScore(pts) {
    GAME_STATS.score += pts;
    if (GAME_STATS.score > GAME_STATS.hiscore) GAME_STATS.hiscore = GAME_STATS.score;
}

function resolveBossHit(boss, bullet) {
    const inv = Mat3.invert(boss.world.matrix);
    if (!inv) return false;
    const lp = Mat3.transform(inv, bullet.world.x, bullet.world.y);

    const gx = lp.x + (boss.grid.cols * boss.grid.size) / 2;
    const gy = lp.y + (boss.grid.rows * boss.grid.size) / 2;
    const c = Math.floor(gx / boss.grid.size);
    const r = Math.floor(gy / boss.grid.size);

    if (r >= 0 && r < boss.grid.rows && c >= 0 && c < boss.grid.cols) {
        const cell = boss.grid.cells[r][c];
        if (cell) {
            cell.hp--;
            spawnParticle(bullet.world.x, bullet.world.y, '#ff0');
            if (cell.hp <= 0) {
                boss.grid.cells[r][c] = null;
                spawnExplosion(bullet.world.x, bullet.world.y);
                addScore(1000);
                if (cell.core) {
                    boss.active = false;
                    spawnExplosion(boss.world.x, boss.world.y);
                    addScore(boss.score || 50000);
                    showStatus("BOSS DESTROYED");
                }
            }
            return true;
        }
    }
    return false;
}

function renderBackground() {
    const config = getTerrainConfig();
    if (!config.Background) return;

    CTX.fillStyle = config.Background.color;
    const scale = config.Background.scale;
    const thresh = config.Background.threshold;

    // Optimization: Render lower resolution for background?
    // For now, keep 10px grid
    for (let y = 0; y < 800; y += 10) {
        const ny = (y - SCROLL_Y) * scale;
        for (let x = 0; x < 600; x += 10) {
            const nx = x * scale;
            if (Noise.get(nx, ny) > thresh) {
                CTX.fillRect(x, y, 10, 10);
            }
        }
    }
}

function renderTerrain() {
    const config = getTerrainConfig();

    // Ground
    if (config.Ground) {
        CTX.fillStyle = config.Ground.color;
        const scale = config.Ground.scale;
        const thresh = config.Ground.threshold;

        for (let y = 0; y < 800; y += 10) {
            const ny = (y - SCROLL_Y) * scale;
            for (let x = 0; x < 600; x += 10) {
                const nx = x * scale;
                if (Noise.get(nx, ny) > thresh) {
                    CTX.fillRect(x, y, 10, 10);
                }
            }
        }
    }

    // Walls
    if (config.Walls) {
        for (let w of config.Walls) {
            CTX.fillStyle = w.color;
            for (let y = 0; y < 800; y += 10) {
                const ny = (y - SCROLL_Y) * w.freq;
                const n = Noise.get(0, ny);
                const offset = (n * w.amp) + w.offset;

                if (w.side === 'left') {
                    CTX.fillRect(0, y, offset, 10);
                } else if (w.side === 'right') {
                    CTX.fillRect(600 - offset, y, offset, 10);
                }
            }
        }
    }
}

function renderGame() {
    // Entities only now
    ENTITIES = ENTITIES.filter(e => e.active);
    ENTITIES.forEach(e => drawEntity(e));

    updateParticles();
}

function drawEntity(e) {
    CTX.save();

    if (e.render) {
        e.render(CTX);
        CTX.restore();
        return;
    }

    const m = e.world.matrix;
    CTX.transform(m[0], m[3], m[1], m[4], m[2], m[5]);

    if (e.type === GameData.Types.BOSS && e.grid) {
        const g = e.grid;
        const hw = (g.cols * g.size) / 2, hh = (g.rows * g.size) / 2;
        CTX.translate(-hw, -hh);
        for (let r = 0; r < g.rows; r++) for (let c = 0; c < g.cols; c++) {
            const cell = g.cells[r][c];
            if (cell) {
                CTX.fillStyle = cell.c;
                CTX.fillRect(c * g.size, r * g.size, g.size - 1, g.size - 1);
            }
        }
    } else {
        CTX.fillStyle = e.color || '#fff';
        if (e.shape === 'player') {
            CTX.beginPath(); CTX.moveTo(0, -10); CTX.lineTo(8, 8); CTX.lineTo(-8, 8); CTX.fill();
        } else if (e.shape === 'rect') {
            CTX.fillRect(-2, -8, 4, 16);
        } else if (e.type === GameData.Types.ITEM) {
            CTX.font = '12px monospace';
            CTX.fillStyle = e.color;
            CTX.fillText(e.itemType === 'bomb' ? 'B' : 'P', -4, 4);
            CTX.strokeStyle = e.color;
            CTX.strokeRect(-6, -6, 12, 12);
        } else {
            CTX.beginPath(); CTX.arc(0, 0, e.radius || 5, 0, Math.PI * 2); CTX.fill();
        }
    }

    CTX.restore();
}

function renderUI() {
    CTX.fillStyle = '#fff';
    CTX.font = '20px monospace';
    CTX.textAlign = 'left';
    CTX.fillText(`SCORE: ${GAME_STATS.score}`, 10, 30);
    CTX.fillText(`HI:    ${GAME_STATS.hiscore}`, 10, 55);

    CTX.textAlign = 'right';
    CTX.fillText(`LIVES: ${GAME_STATS.lives}`, 590, 30);
    CTX.fillText(`BOMBS: ${GAME_STATS.bombs}`, 590, 55);

    if (GameData.CurrentPack) {
        CTX.textAlign = 'center';
        CTX.font = '14px monospace';
        CTX.fillStyle = '#888';
        CTX.fillText(GameData.CurrentPack.name, 300, 790);
    }
}

function renderTitle() {
    CTX.fillStyle = '#000';
    CTX.fillRect(0, 0, 600, 800);

    CTX.fillStyle = '#0f0';
    CTX.font = '40px monospace';
    CTX.textAlign = 'center';
    CTX.fillText("STG ENGINE V3", 300, 200);

    CTX.fillStyle = '#fff';
    CTX.font = '20px monospace';
    CTX.fillText("Select Game Pack:", 300, 300);

    const packs = Object.keys(GameData.Packs);
    packs.forEach((p, i) => {
        CTX.fillText(`${i + 1}. ${p}`, 300, 350 + i * 30);
        CTX.fillStyle = '#888';
        CTX.font = '14px monospace';
        CTX.fillText(GameData.Packs[p].description, 300, 365 + i * 30);
        CTX.fillStyle = '#fff';
        CTX.font = '20px monospace';
    });

    CTX.fillStyle = '#ff0';
    CTX.fillText("Press Number Key to Start", 300, 600);
}

function renderGameOver() {
    CTX.fillStyle = 'rgba(0,0,0,0.7)';
    CTX.fillRect(0, 0, 600, 800);

    CTX.fillStyle = '#f00';
    CTX.font = '50px monospace';
    CTX.textAlign = 'center';
    CTX.fillText("GAME OVER", 300, 300);

    CTX.fillStyle = '#fff';
    CTX.font = '30px monospace';
    CTX.fillText(`Final Score: ${GAME_STATS.score}`, 300, 400);

    CTX.font = '20px monospace';
    CTX.fillText("Press R to Restart", 300, 500);
}

function updateParticles() {
    for (let i = PARTICLES.length - 1; i >= 0; i--) {
        const p = PARTICLES[i];
        p.x += p.vx; p.y += p.vy;
        p.life--;
        CTX.fillStyle = p.color;
        CTX.fillRect(p.x, p.y, 2, 2);
        if (p.life <= 0) PARTICLES.splice(i, 1);
    }
}
function spawnParticle(x, y, c, n = 1) {
    for (let i = 0; i < n; i++) PARTICLES.push({ x, y, vx: (Math.random() - .5) * 5, vy: (Math.random() - .5) * 5, life: 20, color: c });
}
function spawnExplosion(x, y) { spawnParticle(x, y, '#fa0', 30); }

function setupInput() {
    window.addEventListener('keydown', e => {
        if (e.key === 'ArrowUp') INPUT.y = -1; if (e.key === 'ArrowDown') INPUT.y = 1;
        if (e.key === 'ArrowLeft') INPUT.x = -1; if (e.key === 'ArrowRight') INPUT.x = 1;
        if (e.key === 'z') INPUT.shot = true; if (e.key === 'Shift') INPUT.slow = true;
        if (e.key === 'x') INPUT.bomb = true;

        if (CURRENT_STATE === STATE.TITLE) {
            const num = parseInt(e.key);
            if (!isNaN(num)) {
                const packs = Object.keys(GameData.Packs);
                if (num > 0 && num <= packs.length) {
                    startGame(packs[num - 1]);
                }
            }
        } else if (CURRENT_STATE === STATE.GAMEOVER) {
            if (e.key === 'r') {
                CURRENT_STATE = STATE.TITLE;
            }
        }
    });
    window.addEventListener('keyup', e => {
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') INPUT.y = 0;
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') INPUT.x = 0;
        if (e.key === 'z') INPUT.shot = false; if (e.key === 'Shift') INPUT.slow = false;
        if (e.key === 'x') INPUT.bomb = false;
    });
}
