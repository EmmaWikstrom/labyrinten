import './components/maze-builder.js';
import './components/player-controller.js';

import { initStartScreen, showHUD } from './ui.js';

initStartScreen((grade, subject) => {
    showHUD();
    const rig = document.getElementById('rig');
    const scene = document.querySelector('a-scene');

    rig.setAttribute('player-controller', `grade: ${grade}; subject: ${subject}`);
    scene.emit('load-level', { level: 0 });
});
