import { gradeNames, subjectNames } from './questions.js';
import { levels } from './levels.js';

const SUBJECTS = [
    'matte',
    'svenska',
    'engelska',
    'no',
    'so',
    'historia',
];

const VR_FONT = '/assets/fonts/inter/Inter-Regular.json';
const VR_FONT_IMAGE = '/assets/fonts/inter/inter.png';

function applyVRFont(text) {
    text.setAttribute('font', VR_FONT);
    text.setAttribute('font-image', VR_FONT_IMAGE);
    text.setAttribute('negate', 'false');
}

// =============================================
// HUD
// =============================================
export function showHUD() {
    ['hud', 'levelBadge', 'progressBar'].forEach(id => {
        document.getElementById(id).style.display = 'block';
    });
}

export function updateHUD(levelIndex, qDone, qTotal) {
    document.getElementById('levelNum').textContent = levelIndex + 1;
    document.getElementById('qDone').textContent = qDone;
    document.getElementById('qTotal').textContent = qTotal;
}

export function setHUDMessage(msg) {
    document.getElementById('hud').innerHTML = msg;
}

// =============================================
// UTGÅNG
// =============================================
export function setExitLocked(locked) {
    document.getElementById('exitGlow').setAttribute('material',
        locked
            ? 'color: #ff4444; emissive: #aa0000; emissiveIntensity: 0.5; opacity: 0.5; transparent: true'
            : 'color: #ffdd00; emissive: #cc9900; emissiveIntensity: 0.6; opacity: 0.6; transparent: true'
    );
    document.getElementById('exitText').setAttribute('value',
        locked ? 'Svara på alla frågor' : 'UTGÅNG!'
    );
    document.getElementById('exitText').setAttribute('color', locked ? '#ff8888' : '#ffdd00');
    document.getElementById('exitLight').setAttribute('color', locked ? '#ff4444' : '#ffdd44');
}

// =============================================
// MODAL
// =============================================
export function openModal(subject, grade, question, onAnswer) {
    document.getElementById('modalSubject').textContent = `${subjectNames[subject]} | ${gradeNames[grade]}`;
    document.getElementById('modalQuestion').textContent = question.q;
    document.getElementById('modalFeedback').textContent = '';

    const grid = document.getElementById('answerGrid');
    grid.innerHTML = '';

    question.answers.forEach((ans, i) => {
        const btn = document.createElement('button');
        btn.className = 'answerBtn';
        btn.textContent = ans;
        btn.addEventListener('click', () => {
            const correct = i === question.correct;
            handleAnswer(btn, correct, grid, () => {
                closeVRModal();
                onAnswer(correct);
            });
        });
        grid.appendChild(btn);
    });

    document.getElementById('modal').classList.add('open');
    openVRModal(subject, grade, question, onAnswer);
}

function handleAnswer(btn, correct, grid, callback) {
    grid.querySelectorAll('.answerBtn').forEach(b => b.disabled = true);
    const fb = document.getElementById('modalFeedback');

    if (correct) {
        btn.classList.add('correct');
        fb.textContent = '✅ Rätt!';
        setTimeout(() => {
            document.getElementById('modal').classList.remove('open');
            callback();
        }, 800);
    } else {
        btn.classList.add('wrong');
        fb.textContent = '❌ Fel — försök igen!';
        setTimeout(() => {
            grid.querySelectorAll('.answerBtn').forEach(b => {
                b.disabled = false;
                b.classList.remove('wrong', 'correct');
            });
            fb.textContent = '';
        }, 900);
    }
}

export function isModalOpen() {
    return document.getElementById('modal').classList.contains('open');
}

function openVRModal(subject, grade, question, onAnswer) {
    const scene = document.querySelector('a-scene');
    const camera = document.getElementById('cam');
    if (!scene || !camera || !scene.is('vr-mode')) return;

    closeVRModal();

    const panel = document.createElement('a-entity');
    panel.id = 'vrQuestionModal';
    panel.setAttribute('position', '0 -0.05 -2.3');

    const background = document.createElement('a-plane');
    background.setAttribute('width', '2.6');
    background.setAttribute('height', '2.1');
    background.setAttribute('material', 'color: #0d2a0d; opacity: 0.96; transparent: true; side: double');
    panel.appendChild(background);

    const subjectLabel = document.createElement('a-text');
    applyVRFont(subjectLabel);
    subjectLabel.setAttribute('value', `${subjectNames[subject]} | ${gradeNames[grade]}`);
    subjectLabel.setAttribute('align', 'center');
    subjectLabel.setAttribute('position', '0 0.85 0.02');
    subjectLabel.setAttribute('color', '#90ee90');
    subjectLabel.setAttribute('width', '2.3');
    panel.appendChild(subjectLabel);

    const questionText = document.createElement('a-text');
    applyVRFont(questionText);
    questionText.setAttribute('value', question.q);
    questionText.setAttribute('align', 'center');
    questionText.setAttribute('position', '0 0.55 0.02');
    questionText.setAttribute('color', '#ffffff');
    questionText.setAttribute('width', '2.3');
    questionText.setAttribute('wrap-count', '34');
    panel.appendChild(questionText);

    const feedback = document.createElement('a-text');
    applyVRFont(feedback);
    feedback.setAttribute('value', '');
    feedback.setAttribute('align', 'center');
    feedback.setAttribute('position', '0 -0.86 0.03');
    feedback.setAttribute('color', '#ffdd00');
    feedback.setAttribute('width', '2.2');
    panel.appendChild(feedback);

    let answered = false;
    question.answers.forEach((answer, index) => {
        const option = createVRAnswer(answer, index);
        option.addEventListener('click', () => {
            if (answered) return;

            const correct = index === question.correct;
            if (correct) {
                answered = true;
                option.setAttribute('material', 'color: #2f9e44; emissive: #1f7a34; emissiveIntensity: 0.25');
                feedback.setAttribute('value', 'Ratt!');
                setTimeout(() => {
                    document.getElementById('modal').classList.remove('open');
                    closeVRModal();
                    onAnswer(true);
                }, 650);
            } else {
                option.setAttribute('material', 'color: #b02a37; emissive: #7a1018; emissiveIntensity: 0.25');
                feedback.setAttribute('value', 'Fel - forsok igen!');
                setTimeout(() => {
                    option.setAttribute('material', 'color: #155c9e; emissive: #0b3563; emissiveIntensity: 0.15');
                    feedback.setAttribute('value', '');
                }, 900);
            }
        });
        panel.appendChild(option);
    });

    camera.appendChild(panel);
}

function createVRAnswer(answer, index) {
    const option = document.createElement('a-plane');
    const y = 0.12 - index * 0.3;
    option.classList.add('clickable');
    option.setAttribute('width', '2.15');
    option.setAttribute('height', '0.22');
    option.setAttribute('position', `0 ${y} 0.03`);
    option.setAttribute('material', 'color: #155c9e; emissive: #0b3563; emissiveIntensity: 0.15');

    const label = document.createElement('a-text');
    applyVRFont(label);
    label.setAttribute('value', answer);
    label.setAttribute('align', 'center');
    label.setAttribute('position', '0 -0.035 0.02');
    label.setAttribute('color', '#ffffff');
    label.setAttribute('width', '2');
    label.setAttribute('wrap-count', '28');
    option.appendChild(label);

    return option;
}

function closeVRModal() {
    const vrModal = document.getElementById('vrQuestionModal');
    if (vrModal && vrModal.parentNode) {
        vrModal.parentNode.removeChild(vrModal);
    }
}

// =============================================
// NIVÅ KLAR
// =============================================
export function showLevelComplete(levelIndex, subject, onNext) {
    const lc = document.getElementById('levelComplete');
    if (lc.classList.contains('open')) return;

    const isLast = levelIndex >= levels.length - 1;
    document.getElementById('lcTitle').textContent = isLast ? '🏆 Du klarade allt!' : '🎉 Nivå klar!';
    document.getElementById('lcText').textContent = isLast
        ? `Imponerande! Du klarade ${subjectNames[subject]} på alla nivåer.`
        : 'Bra jobbat! Nästa labyrint är större med fler frågor.';
    document.getElementById('nextLevelBtn').textContent = isLast ? '🔄 Spela igen' : 'Nästa nivå →';

    lc.classList.add('open');
    openVRLevelComplete(levelIndex, subject, onNext);

    document.getElementById('nextLevelBtn').addEventListener('click', () => {
        lc.classList.remove('open');
        closeVRLevelComplete();
        onNext(isLast ? 0 : levelIndex + 1);
    }, { once: true });
}

function openVRLevelComplete(levelIndex, subject, onNext) {
    const scene = document.querySelector('a-scene');
    const camera = document.getElementById('cam');
    if (!scene || !camera || !scene.is('vr-mode')) return;

    closeVRLevelComplete();

    const isLast = levelIndex >= levels.length - 1;
    const panel = createVRPanel('vrLevelComplete', 2.5, 1.25, '0 -0.05 -2.2');

    const title = createVRText(isLast ? 'Du klarade allt!' : 'Niva klar!', '0 0.38 0.03', '#ffdd00', 2.2, 28);
    title.setAttribute('align', 'center');
    panel.appendChild(title);

    const message = createVRText(
        isLast
            ? `Imponerande! Du klarade ${subjectNames[subject]} pa alla nivaer.`
            : 'Bra jobbat! Nasta labyrint ar storre med fler fragor.',
        '0 0.08 0.03',
        '#ffffff',
        2.15,
        34
    );
    message.setAttribute('align', 'center');
    panel.appendChild(message);

    const nextButton = createVRButton(isLast ? 'Spela igen' : 'Nasta niva', '0 -0.36 0.04', 1.6, 0.28);
    nextButton.addEventListener('click', () => {
        document.getElementById('levelComplete').classList.remove('open');
        closeVRLevelComplete();
        onNext(isLast ? 0 : levelIndex + 1);
    }, { once: true });
    panel.appendChild(nextButton);

    camera.appendChild(panel);
}

function closeVRLevelComplete() {
    removeElementById('vrLevelComplete');
}

// =============================================
// START
// =============================================
export function initStartScreen(onStart) {
    const startBtn = document.getElementById('startBtn');
    const gradeChoice = document.getElementById('gradeChoice');
    const subjectChoice = document.getElementById('subjectChoice');
    const selectedGradeText = document.getElementById('selectedGradeText');
    const backToGradeBtn = document.getElementById('backToGradeBtn');
    const scene = document.querySelector('a-scene');
    let selectedVRGrade = null;

    function updateStartButton() {
        const ready = startBtn.dataset.grade && startBtn.dataset.subject;
        startBtn.disabled = !ready;
        startBtn.classList.toggle('ready', ready);
    }

    function startGame(grade, subject) {
        if (!grade || !subject) return;
        document.getElementById('startScreen').style.display = 'none';
        closeVRStartScreen();
        onStart(grade, subject);
    }

    document.querySelectorAll('.gradeBtn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.gradeBtn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            startBtn.dataset.grade = btn.dataset.grade;
            selectedGradeText.textContent = `${gradeNames[btn.dataset.grade]} vald. Välj ett ämne för att fortsätta.`;
            gradeChoice.classList.add('hidden');
            subjectChoice.classList.remove('hidden');
            updateStartButton();
        });
    });

    document.querySelectorAll('.subjectBtn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.subjectBtn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');

            startBtn.dataset.subject = btn.dataset.subject;
            updateStartButton();
        });
    });

    backToGradeBtn.addEventListener('click', () => {
        document.querySelectorAll('.subjectBtn').forEach(b => b.classList.remove('selected'));
        delete startBtn.dataset.subject;
        startBtn.disabled = true;
        startBtn.classList.remove('ready');
        subjectChoice.classList.add('hidden');
        gradeChoice.classList.remove('hidden');
    });

    startBtn.addEventListener('click', () => {
        const { grade, subject } = startBtn.dataset;
        startGame(grade, subject);
    });

    function showVRGradeChoice() {
        if (!scene || !scene.is('vr-mode')) return;
        if (document.getElementById('startScreen').style.display === 'none') return;

        selectedVRGrade = null;
        closeVRStartScreen();

        const camera = document.getElementById('cam');
        const panel = createVRPanel('vrStartScreen', 2.75, 2.25, '0 -0.05 -2.4');
        panel.appendChild(createVRText('aMAZEing Minds', '0 0.88 0.03', '#90ee90', 2.4, 26));
        panel.appendChild(createVRText('Valj arskurs', '0 0.62 0.03', '#ffffff', 2.2, 28));

        for (let grade = 1; grade <= 9; grade++) {
            const col = (grade - 1) % 3;
            const row = Math.floor((grade - 1) / 3);
            const x = -0.72 + col * 0.72;
            const y = 0.28 - row * 0.34;
            const button = createVRButton(String(grade), `${x} ${y} 0.04`, 0.5, 0.24);
            button.addEventListener('click', () => {
                selectedVRGrade = String(grade);
                showVRSubjectChoice();
            });
            panel.appendChild(button);
        }

        camera.appendChild(panel);
    }

    function showVRSubjectChoice() {
        if (!selectedVRGrade) return;
        const camera = document.getElementById('cam');
        closeVRStartScreen();

        const panel = createVRPanel('vrStartScreen', 2.75, 2.25, '0 -0.05 -2.4');
        panel.appendChild(createVRText(gradeNames[selectedVRGrade], '0 0.88 0.03', '#90ee90', 2.4, 26));
        panel.appendChild(createVRText('Valj amne', '0 0.62 0.03', '#ffffff', 2.2, 28));

        SUBJECTS.forEach((subject, index) => {
            const col = index % 2;
            const row = Math.floor(index / 2);
            const x = -0.53 + col * 1.06;
            const y = 0.25 - row * 0.35;
            const button = createVRButton(subjectNames[subject], `${x} ${y} 0.04`, 0.9, 0.24);
            button.addEventListener('click', () => {
                startBtn.dataset.grade = selectedVRGrade;
                startBtn.dataset.subject = subject;
                startGame(selectedVRGrade, subject);
            });
            panel.appendChild(button);
        });

        const backButton = createVRButton('Tillbaka', '0 -0.84 0.04', 0.9, 0.24);
        backButton.addEventListener('click', showVRGradeChoice);
        panel.appendChild(backButton);

        camera.appendChild(panel);
    }

    function closeVRStartScreen() {
        removeElementById('vrStartScreen');
    }

    if (scene) {
        scene.addEventListener('enter-vr', () => {
            setTimeout(showVRGradeChoice, 0);
        });
        scene.addEventListener('exit-vr', closeVRStartScreen);
    }
}

function createVRPanel(id, width, height, position) {
    const panel = document.createElement('a-entity');
    panel.id = id;
    panel.setAttribute('position', position);

    const background = document.createElement('a-plane');
    background.setAttribute('width', String(width));
    background.setAttribute('height', String(height));
    background.setAttribute('material', 'color: #0d2a0d; opacity: 0.96; transparent: true; side: double');
    panel.appendChild(background);

    return panel;
}

function createVRButton(label, position, width, height) {
    const button = document.createElement('a-plane');
    button.classList.add('clickable');
    button.setAttribute('width', String(width));
    button.setAttribute('height', String(height));
    button.setAttribute('position', position);
    button.setAttribute('material', 'color: #155c9e; emissive: #0b3563; emissiveIntensity: 0.15');

    const text = createVRText(label, '0 -0.035 0.02', '#ffffff', width * 1.8, 24);
    text.setAttribute('align', 'center');
    button.appendChild(text);

    return button;
}

function createVRText(value, position, color, width, wrapCount) {
    const text = document.createElement('a-text');
    applyVRFont(text);
    text.setAttribute('value', value);
    text.setAttribute('align', 'center');
    text.setAttribute('position', position);
    text.setAttribute('color', color);
    text.setAttribute('width', String(width));
    text.setAttribute('wrap-count', String(wrapCount));
    return text;
}

function removeElementById(id) {
    const el = document.getElementById(id);
    if (el && el.parentNode) {
        el.parentNode.removeChild(el);
    }
}
