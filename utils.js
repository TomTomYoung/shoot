/**
 * Math & Noise Library
 */
const Mat3 = {
    identity: () => [1, 0, 0, 0, 1, 0, 0, 0, 1],
    multiply: (a, b) => {
        const out = new Array(9);
        for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++)
            out[r * 3 + c] = a[r * 3 + 0] * b[0 * 3 + c] + a[r * 3 + 1] * b[1 * 3 + c] + a[r * 3 + 2] * b[2 * 3 + c];
        return out;
    },
    translation: (x, y) => [1, 0, x, 0, 1, y, 0, 0, 1],
    rotation: (rad) => [Math.cos(rad), -Math.sin(rad), 0, Math.sin(rad), Math.cos(rad), 0, 0, 0, 1],
    invert: (m) => {
        const [a, b, c, d, e, f] = m;
        const det = a * e - b * d;
        if (Math.abs(det) < 1e-6) return null;
        const iDet = 1 / det;
        return [e * iDet, -b * iDet, (b * f - c * e) * iDet, -d * iDet, a * iDet, (c * d - a * f) * iDet, 0, 0, 1];
    },
    transform: (m, x, y) => ({ x: m[0] * x + m[1] * y + m[2], y: m[3] * x + m[4] * y + m[5] })
};

// Simple Pseudo-Noise for Terrain
// (Deterministic random based on coordinates)
const Noise = {
    map: new Map(), // Dynamic changes (destruction)
    seed: Math.random() * 100,
    get: (x, y) => {
        // Quantize coordinates to "Dots"
        const qx = Math.floor(x / 10);
        const qy = Math.floor(y / 10);
        const key = `${qx},${qy}`;

        // Check dynamic map (destruction)
        if (Noise.map.has(key)) return Noise.map.get(key);

        // Procedural generation
        const s = Math.sin(qx * 12.9898 + qy * 78.233 + Noise.seed) * 43758.5453;
        return s - Math.floor(s); // 0.0 - 1.0
    },
    set: (x, y, val) => {
        const qx = Math.floor(x / 10);
        const qy = Math.floor(y / 10);
        Noise.map.set(`${qx},${qy}`, val);
    }
};

if (typeof window !== 'undefined') {
    window.Mat3 = Mat3;
    window.Noise = Noise;
}
