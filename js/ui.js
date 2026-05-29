import { subjectNames } from './questions.js';
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
export function openModal(subject, question, onAnswer) {
    document.getElementById('modalSubject').textContent = subjectNames[subject];
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
            handleAnswer(btn, correct, grid, () => onAnswer(correct));
        });
        grid.appendChild(btn);
    });

    document.getElementById('modal').classList.add('open');
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
    document.querySelectorAll('.subjectBtn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.subjectBtn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');

            const startBtn = document.getElementById('startBtn');
            startBtn.classList.add('ready');
            startBtn.disabled = false;
            startBtn.dataset.subject = btn.dataset.subject;
        });
    });

    document.getElementById('startBtn').addEventListener('click', () => {
        const subject = document.getElementById('startBtn').dataset.subject;
        if (!subject) return;
        document.getElementById('startScreen').style.display = 'none';
        onStart(subject);
    });
}