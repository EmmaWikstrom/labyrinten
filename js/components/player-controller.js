import { cellX, cellZ } from './maze-builder.js';
import { isModalOpen, setExitLocked, showLevelComplete, setHUDMessage, updateHUD, openModal } from '../ui.js';
import { questions } from '../questions.js';

const S = 2;

AFRAME.registerComponent('player-controller', {
    schema: {
        speed: { type: 'number', default: 0.055 },
        subject: { type: 'string', default: '' },
    },

    init() {
        this.keys = {};
        this.maze = null;
        this.ROWS = 0;
        this.COLS = 0;
        this.lvl = null;
        this.levelIndex = 0;
        this.triggerMarkers = [];
        this.triggersAnswered = new Set();
        this.usedQuestions = [];
        this.totalQuestionsAnswered = 0;
        this.questionsForLevel = 0;

        this.onKeyDown = (e) => { this.keys[e.code] = true; };
        this.onKeyUp = (e) => { this.keys[e.code] = false; };
        window.addEventListener('keydown', this.onKeyDown);
        window.addEventListener('keyup', this.onKeyUp);

        console.log('player-controller init');

        this.el.sceneEl.addEventListener('level-built', (e) => {
            console.log('level-built mottaget', e.detail);
            const { level, lvl, ROWS, COLS } = e.detail;
            this.setupLevel(level, lvl, ROWS, COLS);
        });
    },

    setupLevel(levelIndex, lvl, ROWS, COLS) {
        console.log('setupLevel anropas för nivå', levelIndex);
        this.maze = lvl.maze;
        this.ROWS = ROWS;
        this.COLS = COLS;
        this.lvl = lvl;
        this.levelIndex = levelIndex;
        this.triggersAnswered = new Set();
        this.usedQuestions = [];
        this.totalQuestionsAnswered = 0;
        this.questionsForLevel = lvl.totalQuestions;

        this.triggerMarkers = [];
        lvl.triggerCells.forEach((cell, i) => {
            const [cx, cz] = cell;
            if (!lvl.maze[cz] || lvl.maze[cz][cx] === 1) return;
            this.triggerMarkers.push({ col: cx, row: cz, index: i });
        });

        setExitLocked(true);
        updateHUD(levelIndex, 0, lvl.totalQuestions);
    },

    tick() {
        if (!this.maze) { console.log('tick: maze är null'); return; }
        if (isModalOpen()) { console.log('modal är öppen, blockerar rörelse'); return; }

        const rig = document.getElementById('rig');
        const pos = { ...rig.getAttribute('position') };
        let dx = 0, dz = 0;
        const yaw = this.getYaw();
        const speed = this.data.speed;

        if (this.keys['KeyW'] || this.keys['ArrowUp']) {
            dx -= Math.sin(yaw) * speed;
            dz -= Math.cos(yaw) * speed;
        }
        if (this.keys['KeyS'] || this.keys['ArrowDown']) {
            dx += Math.sin(yaw) * speed;
            dz += Math.cos(yaw) * speed;
        }
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) {
            dx -= Math.cos(yaw) * speed;
            dz += Math.sin(yaw) * speed;
        }
        if (this.keys['KeyD'] || this.keys['ArrowRight']) {
            dx += Math.cos(yaw) * speed;
            dz -= Math.sin(yaw) * speed;
        }

        const nx = pos.x + dx;
        const nz = pos.z + dz;
        if (!this.isWall(nx, pos.z)) pos.x = nx;
        if (!this.isWall(pos.x, nz)) pos.z = nz;
        rig.setAttribute('position', `${pos.x} ${pos.y} ${pos.z}`);

        this.checkTriggers(pos);
        this.checkExit(pos);
    },

    checkTriggers(pos) {
        this.triggerMarkers.forEach(({ col, row, index }) => {
            if (this.triggersAnswered.has(index)) return;
            const wx = cellX(col, this.COLS);
            const wz = cellZ(row, this.ROWS);
            if (Math.abs(pos.x - wx) < 0.85 && Math.abs(pos.z - wz) < 0.85) {
                this.triggerQuestion(index);
            }
        });
    },

    checkExit(pos) {
        if (this.totalQuestionsAnswered < this.questionsForLevel) return;
        const [ec, er] = this.lvl.exitCell;
        const ex = cellX(ec, this.COLS);
        const ez = cellZ(er, this.ROWS);
        if (Math.abs(pos.x - ex) < 1.3 && Math.abs(pos.z - ez) < 1.3) {
            showLevelComplete(this.levelIndex, this.data.subject, (nextIndex) => {
                this.el.sceneEl.emit('load-level', { level: nextIndex });
            });
        }
    },

    triggerQuestion(index) {
        if (isModalOpen()) return;
        if (this.totalQuestionsAnswered >= this.questionsForLevel) return;

        const q = this.getQuestion();
        openModal(this.data.subject, q, (correct) => {
            if (correct) {
                this.totalQuestionsAnswered++;
                updateHUD(this.levelIndex, this.totalQuestionsAnswered, this.questionsForLevel);
                this.triggersAnswered.add(index);
                this.hideDisc(index);
                if (this.totalQuestionsAnswered >= this.questionsForLevel) {
                    setExitLocked(false);
                    setHUDMessage('Hitta den gula porten! 🚪');
                }
            }
        });
    },

    getQuestion() {
        const pool = questions[this.data.subject];
        const avail = pool.filter((_, i) => !this.usedQuestions.includes(i));
        const src = avail.length > 0 ? avail : pool;
        const q = src[Math.floor(Math.random() * src.length)];
        this.usedQuestions.push(pool.indexOf(q));
        return q;
    },

    hideDisc(index) {
        this.el.sceneEl.querySelectorAll('a-cylinder').forEach(el => {
            if (parseInt(el.dataset.triggerIndex) === index) {
                el.setAttribute('visible', 'false');
            }
        });
    },

    getYaw() {
        const cam = document.getElementById('cam');
        const lc = cam.components['look-controls'];
        if (lc && lc.yawObject) return lc.yawObject.rotation.y;
        const r = cam.getAttribute('rotation');
        return r ? r.y * Math.PI / 180 : 0;
    },

    isWall(wx, wz, margin = 0.5) {
        const pts = [
            [wx - margin, wz - margin],
            [wx + margin, wz - margin],
            [wx - margin, wz + margin],
            [wx + margin, wz + margin],
        ];
        return pts.some(([cx, cz]) => {
            const col = Math.floor((cx + this.COLS * S / 2) / S);
            const row = Math.floor((cz + this.ROWS * S / 2) / S);
            if (row < 0 || row >= this.ROWS || col < 0 || col >= this.COLS) return true;
            return this.maze[row][col] === 1;
        });
    },

    remove() {
        window.removeEventListener('keydown', this.onKeyDown);
        window.removeEventListener('keyup', this.onKeyUp);
    },
});