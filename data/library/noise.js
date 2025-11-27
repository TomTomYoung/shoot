/**
 * Noise Library & Math Helpers
 */
(function () {
    // --- Math Helper ---
    const NoiseMath = {
        fract: (x) => x - Math.floor(x),
        mix: (a, b, t) => a * (1 - t) + b * t,
        smoothstep: (t) => t * t * (3 - 2 * t),
        hash2: (x, y) => NoiseMath.fract(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453),
        dist: (x1, y1, x2, y2) => Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2),
        grad: (x, y) => {
            const h = NoiseMath.hash2(x, y) * 2 * Math.PI;
            return { x: Math.cos(h), y: Math.sin(h) };
        }
    };

    // Expose Math globally for AST usage if needed, or attach to GameData
    GameData.NoiseMath = NoiseMath;

    // --- Standard Algorithms ---
    const Algos = {
        value: (x, y) => {
            const i = Math.floor(x), j = Math.floor(y);
            const f = { x: x - i, y: y - j };
            const u = { x: NoiseMath.smoothstep(f.x), y: NoiseMath.smoothstep(f.y) };
            return NoiseMath.mix(
                NoiseMath.mix(NoiseMath.hash2(i, j), NoiseMath.hash2(i + 1, j), u.x),
                NoiseMath.mix(NoiseMath.hash2(i, j + 1), NoiseMath.hash2(i + 1, j + 1), u.x),
                u.y
            );
        },
        perlin: (x, y) => {
            const i = Math.floor(x), j = Math.floor(y);
            const f = { x: x - i, y: y - j };
            const u = { x: NoiseMath.smoothstep(f.x), y: NoiseMath.smoothstep(f.y) };
            const dot = (ix, iy, dx, dy) => { const g = NoiseMath.grad(ix, iy); return g.x * dx + g.y * dy; };
            return NoiseMath.mix(
                NoiseMath.mix(dot(i, j, f.x, f.y), dot(i + 1, j, f.x - 1, f.y), u.x),
                NoiseMath.mix(dot(i, j + 1, f.x, f.y - 1), dot(i + 1, j + 1, f.x - 1, f.y - 1), u.x),
                u.y
            ) * 0.5 + 0.5;
        },
        worley: (x, y) => {
            const i = Math.floor(x), j = Math.floor(y);
            const f = { x: x - i, y: y - j };
            let minDist = 1.0;
            for (let yOff = -1; yOff <= 1; yOff++) {
                for (let xOff = -1; xOff <= 1; xOff++) {
                    const p = { x: xOff + NoiseMath.hash2(i + xOff, j + yOff), y: yOff + NoiseMath.hash2(i + xOff + 5, j + yOff + 7) };
                    const d = NoiseMath.dist(p.x, p.y, f.x, f.y);
                    minDist = Math.min(minDist, d);
                }
            }
            return 1.0 - minDist;
        },
        simplex: (x, y) => {
            const F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
            const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;
            const s = (x + y) * F2;
            const i = Math.floor(x + s), j = Math.floor(y + s);
            const t = (i + j) * G2;
            const X0 = i - t, Y0 = j - t;
            const x0 = x - X0, y0 = y - Y0;
            let i1 = x0 > y0 ? 1 : 0, j1 = x0 > y0 ? 0 : 1;
            const x1 = x0 - i1 + G2, y1 = y0 - j1 + G2;
            const x2 = x0 - 1.0 + 2.0 * G2, y2 = y0 - 1.0 + 2.0 * G2;
            const contrib = (ix, iy, dx, dy) => {
                let t = 0.5 - dx * dx - dy * dy;
                if (t < 0) return 0; t *= t;
                const g = NoiseMath.grad(ix, iy);
                return t * t * (g.x * dx + g.y * dy);
            };
            const n = contrib(i, j, x0, y0) + contrib(i + i1, j + j1, x1, y1) + contrib(i + 1, j + 1, x2, y2);
            return 40.0 * n * 0.5 + 0.5;
        },
        // --- Trig ---
        sin_basic: (x, y) => Math.sin(x) * 0.5 + 0.5,
        sin_plasma: (x, y) => {
            const v = Math.sin(x) + Math.sin(y) + Math.sin((x + y) * 0.5) + Math.sin(Math.sqrt(x * x + y * y));
            return v / 4 * 0.5 + 0.5;
        },
        sin_lattice: (x, y) => (Math.sin(x) * Math.cos(y)) * 0.5 + 0.5,
        sin_interference: (x, y) => {
            const v1 = Math.sin(x * 0.5 + y * 0.5);
            const v2 = Math.sin(x * 0.6 - y * 0.4 + 2.0);
            return (v1 + v2) / 2 * 0.5 + 0.5;
        },
        sin_rings: (x, y) => Math.sin(Math.sqrt(x * x + y * y)) * 0.5 + 0.5,
        // --- Experimental ---
        trig_warp: (x, y) => {
            const qx = x + Math.sin(y); const qy = y + Math.cos(x);
            return Math.sin(qx + qy) * 0.5 + 0.5;
        },
        moire: (x, y) => Math.sin(x * 10) * Math.sin(y * 8) * 0.5 + 0.5,
        alien_circuit: (x, y) => { const v = Math.sin(x * x ^ y * y); return v * 0.5 + 0.5; },
        // --- Fractal ---
        perlin_fbm: (x, y) => {
            let v = 0, a = 0.5, f = 1.0;
            // Note: 'this' context might be tricky if not bound. 
            // We use Algos.perlin explicitly or GameData.Library.Noise.perlin
            // Ideally we pass context or use closure. 
            // For simplicity here, we assume Algos.perlin is available.
            const p = Algos.perlin;
            for (let i = 0; i < 4; i++) { v += p(x * f, y * f) * a; a *= 0.5; f *= 2.0; }
            return v * 0.8;
        },
        perlin_turbulence: (x, y) => {
            let v = 0, a = 0.5, f = 1.0;
            const p = Algos.perlin;
            for (let i = 0; i < 4; i++) { v += Math.abs(p(x * f, y * f) * 2 - 1) * a; a *= 0.5; f *= 2.0; }
            return v;
        },
        perlin_ridge: (x, y) => {
            let v = 0, a = 0.5, f = 1.0;
            const p = Algos.perlin;
            for (let i = 0; i < 4; i++) { let n = 1.0 - Math.abs(p(x * f, y * f) * 2 - 1); v += n * n * a; a *= 0.5; f *= 2.0; }
            return v;
        },
        user_custom: (x, y, t) => {
            return Math.sin(x * 2 + t * 2) * Math.cos(y * 2) * 0.5 + 0.5;
        }
    };

    // Register all
    for (const key in Algos) {
        GameData.registerNoise(key, Algos[key]);
    }
})();
