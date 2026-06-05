import { gradeNames, subjectNames } from './questions.js';
import { levels } from './levels.js';

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
    subjectLabel.setAttribute('value', `${subjectNames[subject]} | ${gradeNames[grade]}`);
    subjectLabel.setAttribute('align', 'center');
    subjectLabel.setAttribute('position', '0 0.85 0.02');
    subjectLabel.setAttribute('color', '#90ee90');
    subjectLabel.setAttribute('width', '2.3');
    panel.appendChild(subjectLabel);

    const questionText = document.createElement('a-text');
    questionText.setAttribute('value', question.q);
    questionText.setAttribute('align', 'center');
    questionText.setAttribute('position', '0 0.55 0.02');
    questionText.setAttribute('color', '#ffffff');
    questionText.setAttribute('width', '2.3');
    questionText.setAttribute('wrap-count', '34');
    panel.appendChild(questionText);

    const feedback = document.createElement('a-text');
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

    document.getElementById('nextLevelBtn').addEventListener('click', () => {
        lc.classList.remove('open');
        onNext(isLast ? 0 : levelIndex + 1);
    }, { once: true });
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

    function updateStartButton() {
        const ready = startBtn.dataset.grade && startBtn.dataset.subject;
        startBtn.disabled = !ready;
        startBtn.classList.toggle('ready', ready);
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
        if (!grade || !subject) return;
        document.getElementById('startScreen').style.display = 'none';
        onStart(grade, subject);
    });
}
