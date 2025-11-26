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
        ENTITIES.push(e);
        return returnEntity ? e : undefined;
    },
    spawnEnemy: (archetype, x, y) => {
        if (!GameData.CurrentPack) return;
        const def = GameData.CurrentPack.Enemies[archetype];
        if (!def) return;
        const e = new Entity(GameData.Types.ENEMY, x, y);
        Object.assign(e, def);
        ENTITIES.push(e);
    },
    spawnBoss: (x, y) => {
        if (!GameData.CurrentPack) return;
        const def = GameData.CurrentPack.Boss;
        const e = new Entity(GameData.Types.BOSS, x, y);
        Object.assign(e, def);
        if (def.grid) e.grid = JSON.parse(JSON.stringify(def.grid));
        ENTITIES.push(e);
        if (def.init) def.init(e, GAME_CONTEXT);
    },
    spawnParticle: (x, y, c, n) => spawnParticle(x, y, c, n),
    addChild: (parent, child) => parent.addChild(child),
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
    PLAYER.radius = 4;
    PLAYER.color = '#0ff';
    PLAYER.shape = 'player';
    ENTITIES.push(PLAYER);
}

function updateStage() {
    STAGE.timer++;
    const currentScript = STAGE.scripts[STAGE.waveId];

    if (STAGE.timer > currentScript.duration && STAGE.waveId < STAGE.scripts.length - 1) {
        STAGE.waveId++;
        STAGE.timer = 0;
        if (STAGE.scripts[STAGE.waveId].onStart) {
            STAGE.scripts[STAGE.waveId].onStart(GAME_CONTEXT);
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

function getTerrainAt(wx, wy) {
    const ny = wy - SCROLL_Y;
    const thresh = STAGE.scripts[STAGE.waveId].terrainThreshold || 0.7;
    const n = Noise.get(wx, ny);
    return n > thresh;
}

function gameLoop() {
    // Clear Screen
    CTX.fillStyle = '#000';
    CTX.fillRect(0, 0, 600, 800);

    if (CURRENT_STATE === STATE.TITLE) {
        renderTitle();
    } else if (CURRENT_STATE === STATE.PLAY) {
        updateGame();
        renderGame();
        renderUI();
    } else if (CURRENT_STATE === STATE.GAMEOVER) {
        renderGame(); // Show background
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
            const b = new Entity(GameData.Types.P_BULLET, PLAYER.world.x, PLAYER.world.y - 10);
            b.vy = -15;
            b.color = '#fff';
            b.shape = 'rect';
            ENTITIES.push(b);
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

    // D. Collision
    const bullets = ENTITIES.filter(e => e.type === GameData.Types.P_BULLET && e.active);
    const targets = ENTITIES.filter(e => (e.type === GameData.Types.ENEMY || e.type === GameData.Types.SPAWNER || e.type === GameData.Types.BOSS) && e.active);
    const items = ENTITIES.filter(e => e.type === GameData.Types.ITEM && e.active);

    // Player vs Items
    if (PLAYER && PLAYER.active) {
        items.forEach(i => {
            const dx = PLAYER.world.x - i.world.x;
            const dy = PLAYER.world.y - i.world.y;
            if (dx * dx + dy * dy < (PLAYER.radius + i.radius + 10) ** 2) {
                i.active = false;
                collectItem(i);
            }
        });
    }

    bullets.forEach(b => {
        if (getTerrainAt(b.world.x, b.world.y)) {
            b.active = false;
            Noise.set(b.world.x, b.world.y - SCROLL_Y, 0);
            spawnParticle(b.world.x, b.world.y, '#888', 2);
        }

        targets.forEach(t => {
            const dx = b.world.x - t.world.x;
            const dy = b.world.y - t.world.y;
            if (dx * dx + dy * dy < (t.radius + 5) ** 2) {
                if (t.type === GameData.Types.BOSS) {
                    if (resolveBossHit(t, b)) b.active = false;
                } else {
                    t.hp--;
                    b.active = false;
                    spawnParticle(t.world.x, t.world.y, '#fff');
                    if (t.hp <= 0) {
                        t.active = false;
                        spawnExplosion(t.world.x, t.world.y);
                        addScore(t.score || 100);
                        trySpawnItem(t.world.x, t.world.y);
                    }
                }
            }
        });

        if (b.world.y < 0) b.active = false;
    });

    if (PLAYER && PLAYER.active) {
        // Player vs Terrain
        if (getTerrainAt(PLAYER.world.x, PLAYER.world.y)) {
            playerHit();
        }
        // Player vs Enemy/Bullet
        const hazards = ENTITIES.filter(e => (e.type === GameData.Types.E_BULLET || e.type === GameData.Types.ENEMY || e.type === GameData.Types.BOSS) && e.active);
        hazards.forEach(h => {
            const dx = PLAYER.world.x - h.world.x;
            const dy = PLAYER.world.y - h.world.y;
            if (dx * dx + dy * dy < (PLAYER.radius + (h.radius || 2)) ** 2) {
                playerHit();
            }
        });
    }

    ENTITIES = ENTITIES.filter(e => e.active);
    updateParticles();
}

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

// --- Rendering ---
function renderGame() {
    // Terrain
    CTX.fillStyle = '#444';
    for (let y = 0; y < 800; y += 10) {
        for (let x = 0; x < 600; x += 10) {
            if (getTerrainAt(x, y)) {
                CTX.fillRect(x, y, 9, 9);
            }
        }
    }

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
