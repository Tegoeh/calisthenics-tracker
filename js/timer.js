// ========================================
// Rest Timer Module
// ========================================

let timerState = {
    remaining: 0,
    total: 0,
    paused: false,
    interval: null
};

export function startTimer(seconds = 90) {
    const overlay = document.getElementById('timer-overlay');
    if (!overlay) return;

    clearTimer();

    timerState.total = seconds;
    timerState.remaining = seconds;
    timerState.paused = false;

    renderTimer();
    overlay.classList.add('active');

    timerState.interval = setInterval(tick, 1000);
}

function tick() {
    if (timerState.paused) return;

    timerState.remaining--;

    if (timerState.remaining <= 3 && timerState.remaining > 0) {
        playBeep(440, 100);
    }

    if (timerState.remaining <= 0) {
        timerState.remaining = 0;
        clearInterval(timerState.interval);
        playBeep(880, 300);

        if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
        }

        setTimeout(dismissTimer, 1500);
    }

    renderTimer();
}

function renderTimer() {
    const overlay = document.getElementById('timer-overlay');
    if (!overlay) return;

    const mins = Math.floor(timerState.remaining / 60);
    const secs = timerState.remaining % 60;
    const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;

    const circumference = 2 * Math.PI * 108;
    const progress = timerState.total > 0
        ? (timerState.total - timerState.remaining) / timerState.total
        : 0;
    const offset = circumference * (1 - progress);

    let strokeClass = '';
    if (timerState.remaining <= 5 && timerState.remaining > 0) strokeClass = 'warning';
    if (timerState.remaining === 0) strokeClass = 'done';

    overlay.innerHTML = `
        <div class="timer-ring">
            <svg viewBox="0 0 240 240">
                <circle class="timer-ring__bg" cx="120" cy="120" r="108"/>
                <circle class="timer-ring__progress ${strokeClass}" cx="120" cy="120" r="108"
                    stroke-dasharray="${circumference}"
                    stroke-dashoffset="${offset}"/>
            </svg>
            <div class="timer-display">
                <div class="timer-display__time ${timerState.remaining <= 3 && timerState.remaining > 0 ? 'timer-countdown' : ''}">${timeStr}</div>
                <div class="timer-display__label">Istirahat</div>
            </div>
        </div>

        <div class="timer-controls">
            <button class="timer-btn" id="timer-pause" title="${timerState.paused ? 'Lanjut' : 'Pause'}">
                ${timerState.paused
                    ? '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>'
                    : '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>'
                }
            </button>
        </div>

        <div class="flex gap-md">
            <button class="timer-plus" id="timer-plus-15">+15 dtk</button>
            <button class="timer-skip" id="timer-skip">Skip</button>
        </div>
    `;

    bindTimerEvents();
}

function bindTimerEvents() {
    const pauseBtn = document.getElementById('timer-pause');
    const skipBtn = document.getElementById('timer-skip');
    const plusBtn = document.getElementById('timer-plus-15');

    if (pauseBtn) {
        pauseBtn.addEventListener('click', () => {
            timerState.paused = !timerState.paused;
            renderTimer();
        });
    }

    if (skipBtn) {
        skipBtn.addEventListener('click', dismissTimer);
    }

    if (plusBtn) {
        plusBtn.addEventListener('click', () => {
            timerState.remaining += 15;
            timerState.total += 15;
            if (!timerState.interval || timerState.remaining > 0) {
                if (timerState.remaining > 0) {
                    clearInterval(timerState.interval);
                    timerState.interval = setInterval(tick, 1000);
                }
            }
            renderTimer();
        });
    }
}

function dismissTimer() {
    clearTimer();
    const overlay = document.getElementById('timer-overlay');
    if (overlay) overlay.classList.remove('active');
}

function clearTimer() {
    if (timerState.interval) {
        clearInterval(timerState.interval);
        timerState.interval = null;
    }
}

function playBeep(frequency, duration) {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();

        oscillator.connect(gain);
        gain.connect(ctx.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        gain.gain.value = 0.3;

        oscillator.start(ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);
        oscillator.stop(ctx.currentTime + duration / 1000);
    } catch (e) {
        // Audio not available
    }
}
