import { cellX, cellZ } from "./maze-builder.js";
import {
  isModalOpen,
  setExitLocked,
  showLevelComplete,
  updateHUD,
  openModal,
} from "../ui.js";
import { getQuestionPool } from "../questions.js";

const S = 2.6;
const AXIS_DEADZONE = 0.15;
const FORWARD = new THREE.Vector3();
const RIGHT = new THREE.Vector3();
const WORLD_UP = new THREE.Vector3(0, 1, 0);
const GAMEPAD_AXIS_PAIRS = [
  [2, 3],
  [0, 1],
];

AFRAME.registerComponent("player-controller", {
  schema: {
    speed: { type: "number", default: 0.055 },
    subject: { type: "string", default: "" },
    grade: { type: "int", default: 7 },
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
    this.questionPoolKey = "";
    this.totalQuestionsAnswered = 0;
    this.questionsForLevel = 0;
    this.vrAxes = { x: 0, y: 0 };

    this.onKeyDown = (e) => {
      this.keys[e.code] = true;
    };
    this.onKeyUp = (e) => {
      this.keys[e.code] = false;
    };
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);

    this.onAxisMove = (e) => {
      const axis = e.detail.axis || [];
      this.setVrAxes(axis[0], axis[1]);
    };

    this.onThumbstickMove = (e) => {
      this.setVrAxes(e.detail.x, e.detail.y);
    };

    this.onTrackpadMove = (e) => {
      this.setVrAxes(e.detail.x, e.detail.y);
    };

    this.onControllerDisconnected = () => {
      this.setVrAxes(0, 0);
    };

    ["leftHand", "rightHand"].forEach((id) => {
      const hand = document.getElementById(id);
      if (!hand) return;
      hand.addEventListener("axismove", this.onAxisMove);
      hand.addEventListener("thumbstickmoved", this.onThumbstickMove);
      hand.addEventListener("trackpadmoved", this.onTrackpadMove);
      hand.addEventListener(
        "controllerdisconnected",
        this.onControllerDisconnected,
      );
    });

    console.log("player-controller init");

    this.el.sceneEl.addEventListener("level-built", (e) => {
      console.log("level-built mottaget", e.detail);
      const { level, lvl, ROWS, COLS } = e.detail;
      this.setupLevel(level, lvl, ROWS, COLS);
    });
  },

  setupLevel(levelIndex, lvl, ROWS, COLS) {
    console.log("setupLevel anropas för nivå", levelIndex);
    this.maze = lvl.maze;
    this.ROWS = ROWS;
    this.COLS = COLS;
    this.lvl = lvl;
    this.levelIndex = levelIndex;
    this.triggersAnswered = new Set();
    this.totalQuestionsAnswered = 0;
    this.questionsForLevel = lvl.totalQuestions;

    const nextPoolKey = `${this.data.grade}-${this.data.subject}`;
    if (levelIndex === 0 || this.questionPoolKey !== nextPoolKey) {
      this.usedQuestions = [];
      this.questionPoolKey = nextPoolKey;
    }

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
    if (!this.maze) {
      console.log("tick: maze är null");
      return;
    }
    if (isModalOpen()) {
      console.log("modal är öppen, blockerar rörelse");
      return;
    }

    const rig = document.getElementById("rig");
    const pos = { ...rig.getAttribute("position") };
    let dx = 0,
      dz = 0;
    const keyboardYaw = this.getDesktopYaw();
    const speed = this.data.speed;

    if (this.keys["KeyW"] || this.keys["ArrowUp"]) {
      dx -= Math.sin(keyboardYaw) * speed;
      dz -= Math.cos(keyboardYaw) * speed;
    }
    if (this.keys["KeyS"] || this.keys["ArrowDown"]) {
      dx += Math.sin(keyboardYaw) * speed;
      dz += Math.cos(keyboardYaw) * speed;
    }
    if (this.keys["KeyA"] || this.keys["ArrowLeft"]) {
      dx -= Math.cos(keyboardYaw) * speed;
      dz += Math.sin(keyboardYaw) * speed;
    }
    if (this.keys["KeyD"] || this.keys["ArrowRight"]) {
      dx += Math.cos(keyboardYaw) * speed;
      dz -= Math.sin(keyboardYaw) * speed;
    }

    const gamepadAxes = this.getGamepadAxes();
    const vrX = gamepadAxes.x !== 0 ? gamepadAxes.x : this.vrAxes.x;
    const vrY = gamepadAxes.y !== 0 ? gamepadAxes.y : this.vrAxes.y;

    if (vrX !== 0 || vrY !== 0) {
      this.updateVrMovementVectors();
      dx += (FORWARD.x * vrY + RIGHT.x * -vrX) * speed;
      dz += (FORWARD.z * vrY + RIGHT.z * -vrX) * speed;
    }

    const nx = pos.x + dx;
    const nz = pos.z + dz;
    if (!this.isWall(nx, pos.z)) pos.x = nx;
    if (!this.isWall(pos.x, nz)) pos.z = nz;
    rig.setAttribute("position", `${pos.x} ${pos.y} ${pos.z}`);

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
        this.el.sceneEl.emit("load-level", { level: nextIndex });
      });
    }
  },

  triggerQuestion(index) {
    if (isModalOpen()) return;
    if (this.totalQuestionsAnswered >= this.questionsForLevel) return;

    const q = this.getQuestion();
    openModal(
      this.data.subject,
      this.data.grade,
      q,
      (correct) => {
        if (correct) {
          this.totalQuestionsAnswered++;
          updateHUD(
            this.levelIndex,
            this.totalQuestionsAnswered,
            this.questionsForLevel,
          );
          this.triggersAnswered.add(index);
          this.hideDisc(index);
          if (this.totalQuestionsAnswered >= this.questionsForLevel) {
            setExitLocked(false);
          }
        }
      },
      {
        answered: this.totalQuestionsAnswered,
        total: this.questionsForLevel,
      },
    );
  },

  getQuestion() {
    const pool = getQuestionPool(this.data.subject, this.data.grade);
    const avail = pool.filter((_, i) => !this.usedQuestions.includes(i));
    const src = avail.length > 0 ? avail : pool;
    const q = src[Math.floor(Math.random() * src.length)];
    this.usedQuestions.push(pool.indexOf(q));
    return q;
  },

  hideDisc(index) {
    this.el.sceneEl.querySelectorAll("a-cylinder").forEach((el) => {
      if (parseInt(el.dataset.triggerIndex) === index) {
        el.setAttribute("visible", "false");
      }
    });
  },

  setVrAxes(x = 0, y = 0) {
    this.vrAxes.x = Math.abs(x) > AXIS_DEADZONE ? x : 0;
    this.vrAxes.y = Math.abs(y) > AXIS_DEADZONE ? y : 0;
  },

  getGamepadAxes() {
    if (!navigator.getGamepads) return { x: 0, y: 0 };

    let best = { x: 0, y: 0, strength: 0 };
    navigator.getGamepads().forEach((gamepad) => {
      if (!gamepad) return;

      GAMEPAD_AXIS_PAIRS.forEach(([xIndex, yIndex]) => {
        const x = gamepad.axes[xIndex] || 0;
        const y = gamepad.axes[yIndex] || 0;
        const filteredX = Math.abs(x) > AXIS_DEADZONE ? x : 0;
        const filteredY = Math.abs(y) > AXIS_DEADZONE ? y : 0;
        const strength = Math.abs(filteredX) + Math.abs(filteredY);

        if (strength > best.strength) {
          best = { x: filteredX, y: filteredY, strength };
        }
      });
    });

    return { x: best.x, y: best.y };
  },

  updateVrMovementVectors() {
    const cam = document.getElementById("cam");
    cam.object3D.getWorldDirection(FORWARD);
    FORWARD.y = 0;

    if (FORWARD.lengthSq() === 0) {
      const yaw = this.getDesktopYaw();
      FORWARD.set(-Math.sin(yaw), 0, -Math.cos(yaw));
    } else {
      FORWARD.normalize();
    }

    RIGHT.copy(FORWARD).cross(WORLD_UP).normalize();
  },

  getDesktopYaw() {
    const cam = document.getElementById("cam");
    const lc = cam.components["look-controls"];
    if (lc && lc.yawObject) return lc.yawObject.rotation.y;
    const r = cam.getAttribute("rotation");
    return r ? (r.y * Math.PI) / 180 : 0;
  },

  isWall(wx, wz, margin = 0.5) {
    const pts = [
      [wx - margin, wz - margin],
      [wx + margin, wz - margin],
      [wx - margin, wz + margin],
      [wx + margin, wz + margin],
    ];
    return pts.some(([cx, cz]) => {
      const col = Math.floor((cx + (this.COLS * S) / 2) / S);
      const row = Math.floor((cz + (this.ROWS * S) / 2) / S);
      if (row < 0 || row >= this.ROWS || col < 0 || col >= this.COLS)
        return true;
      return this.maze[row][col] === 1;
    });
  },

  remove() {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    ["leftHand", "rightHand"].forEach((id) => {
      const hand = document.getElementById(id);
      if (!hand) return;
      hand.removeEventListener("axismove", this.onAxisMove);
      hand.removeEventListener("thumbstickmoved", this.onThumbstickMove);
      hand.removeEventListener("trackpadmoved", this.onTrackpadMove);
      hand.removeEventListener(
        "controllerdisconnected",
        this.onControllerDisconnected,
      );
    });
  },
});
