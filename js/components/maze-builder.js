import { levels } from '../levels.js';

const S = 2.6;
const HEDGE_H = 2.2;

export function cellX(col, COLS) {
    return col * S - COLS * S / 2 + S / 2;
}

export function cellZ(row, ROWS) {
    return row * S - ROWS * S / 2 + S / 2;
}

AFRAME.registerComponent('maze-builder', {
    schema: {
        level: { type: 'int', default: 0 },
    },

    init() {
        this.builtEntities = [];
        console.log('maze-builder init');

        this.el.addEventListener('load-level', e => {
            console.log('load-level mottaget', e.detail);
            this.data.level = e.detail.level;
            this.build();
        });
    },

    build() {
        console.log('build anropas för nivå', this.data.level);
        this.clear();

        const lvl = levels[this.data.level];
        const maze = lvl.maze;
        const ROWS = maze.length;
        const COLS = maze[0].length;

        const floor = document.getElementById('floor');
        floor.setAttribute('width', COLS * S + 4);
        floor.setAttribute('height', ROWS * S + 4);

        maze.forEach((row, z) => {
            row.forEach((cell, x) => {
                if (cell !== 1) return;

                const wall = document.createElement('a-box');
                wall.setAttribute('width', S);
                wall.setAttribute('height', HEDGE_H);
                wall.setAttribute('depth', S);
                wall.setAttribute('position', `${cellX(x, COLS)} ${HEDGE_H / 2} ${cellZ(z, ROWS)}`);
                wall.setAttribute('material', 'color: #2d7a2d; roughness: 1; metalness: 0');
                this.el.sceneEl.appendChild(wall);
                this.builtEntities.push(wall);
            });
        });

        lvl.triggerCells.forEach((cell, i) => {
            const [cx, cz] = cell;
            if (!maze[cz] || maze[cz][cx] === 1) return;

            const disc = document.createElement('a-cylinder');
            disc.setAttribute('radius', '0.55');
            disc.setAttribute('height', '0.07');
            disc.setAttribute('position', `${cellX(cx, COLS)} 0.04 ${cellZ(cz, ROWS)}`);
            disc.setAttribute('material', 'color: #ffdd00; emissive: #cc9900; emissiveIntensity: 0.8');
            disc.setAttribute('animation', 'property: material.emissiveIntensity; to: 1.5; loop: true; dur: 800; dir: alternate');
            disc.dataset.triggerIndex = i;
            this.el.sceneEl.appendChild(disc);
            this.builtEntities.push(disc);
        });

        const [ec, er] = lvl.exitCell;
        document.getElementById('exit').setAttribute('position',
            `${cellX(ec, COLS)} 0 ${cellZ(er, ROWS)}`
        );

        const [sc, sr] = lvl.startCell;
        document.getElementById('rig').setAttribute('position',
            `${cellX(sc, COLS)} 0 ${cellZ(sr, ROWS)}`
        );

        this.el.sceneEl.emit('level-built', { level: this.data.level, lvl, ROWS, COLS });
    },

    clear() {
        this.builtEntities.forEach(e => e.parentNode && e.parentNode.removeChild(e));
        this.builtEntities = [];
    },
});