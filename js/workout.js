import { state } from './app.js';
import * as db from './db.js';
import { getCurrentExercise, getExercisesForCategory, getExerciseForLevel } from './progression.js';
import { showToast, $, $$, iconCheck, iconPlus, CATEGORY_LABELS, formatDuration, iconFlame } from './utils.js';
import { startTimer } from './timer.js';

// ========================================
// Workout Module
// ========================================

let sessionExercises = [];
let elapsedInterval = null;

export async function initWorkout() {
    const incomplete = await db.getIncompleteSession(state.user.id);

    if (incomplete) {
        state.currentSession = incomplete;
        await loadSessionExercises();
        renderActiveWorkout();
    } else {
        renderStartScreen();
    }

    bindEvents();
}

function renderStartScreen() {
    const container = $('#workout-container');
    if (!container) return;

    container.innerHTML = `
        <div class="empty-state animate-fade-in-up">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
                <path d="M6.5 6.5h11M6.5 17.5h11"/><rect x="2" y="4" width="4.5" height="16" rx="1"/><rect x="17.5" y="4" width="4.5" height="16" rx="1"/>
            </svg>
            <h3>Siap Latihan?</h3>
            <p class="text-muted mt-sm">Mulai sesi workout baru dan catat setiap set kamu</p>
        </div>
        <button class="btn btn--primary btn--lg btn--full mt-lg" id="start-workout-btn">
            Mulai Latihan
        </button>
    `;

    $('#start-workout-btn').addEventListener('click', startWorkout);
}

async function startWorkout() {
    const btn = $('#start-workout-btn');
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Memulai...';
    }

    const { data, error } = await db.createSession(state.user.id);
    if (error) {
        showToast('Gagal memulai workout');
        if (btn) { btn.disabled = false; btn.textContent = 'Mulai Latihan'; }
        return;
    }

    state.currentSession = data;
    sessionExercises = [];

    const categories = ['push', 'pull', 'squat', 'core', 'hinge'];
    for (let i = 0; i < categories.length; i++) {
        const cat = categories[i];
        const exercise = getCurrentExercise(cat);
        if (exercise) {
            const { data: exData } = await db.addExerciseToSession(
                state.currentSession.id, exercise.id, cat, i
            );
            if (exData) {
                const targetMatches = exercise.target_reps?.match(/(\d+)/g);
                const targetVal = targetMatches?.length >= 2 ? parseInt(targetMatches[1]) : (targetMatches ? parseInt(targetMatches[0]) : 0);
                const sets = [];
                for (let s = 1; s <= 3; s++) {
                    const { data: setData } = await db.addSet(
                        exData.id, s,
                        exercise.is_hold ? null : targetVal,
                        exercise.is_hold ? targetVal : null
                    );
                    if (setData) sets.push(setData);
                }
                exData.sets = sets;
                sessionExercises.push(exData);
            }
        }
    }

    // Add supplementary exercises (e.g. Dead Hang alongside Australian Pull-up)
    const pullLevel = state.userProgression['pull'] || 1;
    if (pullLevel >= 2) {
        const deadHang = getExerciseForLevel('pull', 1);
        if (deadHang) {
            const { data: exData } = await db.addExerciseToSession(
                state.currentSession.id, deadHang.id, 'pull', sessionExercises.length
            );
            if (exData) {
                const targetMatches = deadHang.target_reps?.match(/(\d+)/g);
                const targetVal = targetMatches?.length >= 2 ? parseInt(targetMatches[1]) : (targetMatches ? parseInt(targetMatches[0]) : 0);
                const sets = [];
                for (let s = 1; s <= 3; s++) {
                    const { data: setData } = await db.addSet(
                        exData.id, s,
                        deadHang.is_hold ? null : targetVal,
                        deadHang.is_hold ? targetVal : null
                    );
                    if (setData) sets.push(setData);
                }
                exData.sets = sets;
                sessionExercises.push(exData);
            }
        }
    }

    startElapsedTimer();
    renderActiveWorkout();
}

async function loadSessionExercises() {
    const { data } = await db.getSessionExercises(state.currentSession.id);
    if (data) {
        sessionExercises = data;
        for (const ex of sessionExercises) {
            const { data: sets } = await db.getExerciseSets(ex.id);
            ex.sets = sets || [];
        }
    }
    startElapsedTimer();
}

function startElapsedTimer() {
    if (elapsedInterval) clearInterval(elapsedInterval);

    const timerEl = $('#workout-elapsed');
    if (!timerEl) return;

    const updateElapsed = () => {
        if (!state.currentSession) return;
        const elapsed = Math.floor((Date.now() - new Date(state.currentSession.started_at).getTime()) / 1000);
        timerEl.textContent = formatDuration(elapsed);
    };

    updateElapsed();
    elapsedInterval = setInterval(updateElapsed, 1000);
}

function renderActiveWorkout() {
    const container = $('#workout-container');
    if (!container) return;

    container.innerHTML = `
        <div class="workout-header">
            <span class="label">Sesi Aktif</span>
            <span class="workout-header__timer" id="workout-elapsed">0m</span>
        </div>

        <div class="exercise-block warmup-block" style="border-left: 3px solid var(--color-warning)">
            <div class="exercise-block__header">
                <div>
                    <span class="badge badge--neutral">PEMANASAN</span>
                    <div class="exercise-block__name">Pemanasan (5-10 menit)</div>
                </div>
            </div>
            <div class="exercise-block__desc">Lakukan sebelum mulai latihan inti. Jangan skip!</div>
            <ul class="warmup-list">
                <li>Putar pergelangan tangan — 10x tiap arah</li>
                <li>Putar lengan (arm circle) — 10x depan, 10x belakang</li>
                <li>Jumping jack — 30 detik</li>
                <li>Dead hang di pull-up bar — 15-20 detik</li>
                <li>Squat ringan (bodyweight) — 10x pelan</li>
            </ul>
            <div class="set-check warmup-check" id="warmup-done" style="margin-top:12px">
                ${iconCheck()}
            </div>
            <span class="label" style="margin-left:12px;vertical-align:middle" id="warmup-label">Tandai selesai pemanasan</span>
        </div>

        <div id="exercise-list" class="stagger"></div>
        <button class="add-exercise-btn" id="add-exercise-btn">
            ${iconPlus()}
            Tambah Latihan
        </button>
        <div class="finish-bar">
            <button class="btn btn--olive btn--full" id="finish-workout-btn">Selesai Latihan</button>
        </div>
    `;

    const warmupCheck = $('#warmup-done');
    const warmupLabel = $('#warmup-label');
    if (warmupCheck) {
        const done = sessionStorage.getItem('warmup_done') === 'true';
        if (done) {
            warmupCheck.classList.add('checked');
            if (warmupLabel) warmupLabel.textContent = 'Pemanasan selesai!';
        }
        warmupCheck.addEventListener('click', () => {
            warmupCheck.classList.toggle('checked');
            const isChecked = warmupCheck.classList.contains('checked');
            sessionStorage.setItem('warmup_done', isChecked);
            if (warmupLabel) warmupLabel.textContent = isChecked ? 'Pemanasan selesai!' : 'Tandai selesai pemanasan';
        });
    }

    renderExercises();
    startElapsedTimer();
    bindWorkoutEvents();
}

function parseTargetValue(targetReps) {
    if (!targetReps) return 0;
    const matches = targetReps.match(/(\d+)/g);
    if (matches && matches.length >= 2) return parseInt(matches[1]);
    if (matches && matches.length === 1) return parseInt(matches[0]);
    return 0;
}

function renderExercises() {
    const list = $('#exercise-list');
    if (!list) return;

    list.innerHTML = sessionExercises.map((ex, idx) => {
        const prog = ex.progression_levels;
        const isHold = prog?.is_hold;
        const targetVal = parseTargetValue(prog?.target_reps);
        const targetLabel = prog?.target_reps || '';

        return `
            <div class="exercise-block" data-exercise-id="${ex.id}" data-category="${ex.category}">
                <div class="exercise-block__header">
                    <div>
                        <span class="tag tag--${ex.category}">${CATEGORY_LABELS[ex.category]}</span>
                        <div class="exercise-block__name">${prog?.exercise_name || 'Exercise'}</div>
                    </div>
                    <span class="badge badge--terracotta">${targetLabel}</span>
                </div>
                ${prog?.description ? `<div class="exercise-block__desc">${prog.description}</div>` : ''}
                <div class="set-list" data-exercise-entry="${ex.id}">
                    ${(ex.sets || []).map((set, sIdx) => {
                        const currentVal = isHold
                            ? (set.hold_seconds || targetVal)
                            : (set.reps || targetVal);
                        return `
                        <div class="set-row ${set.completed ? 'completed' : ''}" data-set-id="${set.id}">
                            <span class="set-row__label">Set ${sIdx + 1}</span>
                            <div class="set-row__input-group">
                                ${isHold
                                    ? `<input type="number" class="set-reps-input" value="${currentVal}" min="0" inputmode="numeric" data-type="hold"> <span>detik</span>`
                                    : `<input type="number" class="set-reps-input" value="${currentVal}" min="0" inputmode="numeric" data-type="reps"> <span>reps</span>`
                                }
                            </div>
                            <div class="set-check ${set.completed ? 'checked' : ''}" data-set-id="${set.id}">
                                ${iconCheck()}
                            </div>
                        </div>
                    `}).join('')}
                </div>
            </div>
        `;
    }).join('');

    bindSetEvents();
}

function bindWorkoutEvents() {
    const finishBtn = $('#finish-workout-btn');
    if (finishBtn) {
        finishBtn.addEventListener('click', finishWorkout);
    }

    const addBtn = $('#add-exercise-btn');
    if (addBtn) {
        addBtn.addEventListener('click', () => showExercisePicker());
    }
}

function bindSetEvents() {
    $$('.set-check').forEach(el => {
        el.addEventListener('click', handleSetComplete);
    });

    $$('.set-reps-input').forEach(input => {
        input.addEventListener('change', handleRepsChange);
    });
}

async function handleSetComplete(e) {
    const checkEl = e.currentTarget;
    const setId = checkEl.dataset.setId;
    const row = checkEl.closest('.set-row');
    const input = row.querySelector('.set-reps-input');
    const isHold = input.dataset.type === 'hold';
    const value = parseInt(input.value) || 0;

    const updateData = { completed: true };
    if (isHold) {
        updateData.hold_seconds = value;
    } else {
        updateData.reps = value;
    }

    const { error } = await db.updateSet(setId, updateData);
    if (error) {
        showToast('Gagal menyimpan set');
        return;
    }

    checkEl.classList.add('checked');
    row.classList.add('completed');
    row.classList.add('set-complete-pulse');
    setTimeout(() => row.classList.remove('set-complete-pulse'), 300);

    const timerDuration = parseInt(localStorage.getItem('restTimerDuration') || '90');
    startTimer(timerDuration);
}

async function handleRepsChange(e) {
    const input = e.target;
    const row = input.closest('.set-row');
    const setId = row.dataset.setId;
    const isHold = input.dataset.type === 'hold';
    const value = parseInt(input.value) || 0;

    const updateData = {};
    if (isHold) {
        updateData.hold_seconds = value;
    } else {
        updateData.reps = value;
    }

    await db.updateSet(setId, updateData);
}

async function finishWorkout() {
    const btn = $('#finish-workout-btn');
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Menyimpan...';
    }

    if (elapsedInterval) clearInterval(elapsedInterval);

    const { data, error } = await db.finishSession(state.currentSession.id);
    if (error) {
        showToast('Gagal menyimpan workout');
        if (btn) { btn.disabled = false; btn.textContent = 'Selesai Latihan'; }
        return;
    }

    await db.updateStreak(state.user.id);

    renderSummary(data);
}

function renderSummary(session) {
    const container = $('#workout-container');
    if (!container) return;

    let totalSets = 0;
    let completedSets = 0;
    sessionExercises.forEach(ex => {
        (ex.sets || []).forEach(set => {
            totalSets++;
            if (set.completed) completedSets++;
        });
    });

    container.innerHTML = `
        <div class="summary animate-fade-in-up">
            <div class="summary__icon">
                ${iconCheck()}
            </div>
            <h2>Workout Selesai!</h2>
            <p class="text-muted mt-sm">Kerja bagus hari ini</p>

            <div class="summary__stats">
                <div class="summary__stat">
                    <div class="summary__stat-number text-terracotta">${sessionExercises.length}</div>
                    <div class="summary__stat-label">Latihan</div>
                </div>
                <div class="summary__stat">
                    <div class="summary__stat-number text-olive">${completedSets}</div>
                    <div class="summary__stat-label">Set Selesai</div>
                </div>
                <div class="summary__stat">
                    <div class="summary__stat-number">${formatDuration(session.duration_sec)}</div>
                    <div class="summary__stat-label">Durasi</div>
                </div>
            </div>

            <div class="card">
                <h4 class="mb-md">Gimana rasanya?</h4>
                <div class="mood-selector">
                    <button class="mood-btn" data-mood="1">😫</button>
                    <button class="mood-btn" data-mood="2">😐</button>
                    <button class="mood-btn" data-mood="3">🙂</button>
                    <button class="mood-btn" data-mood="4">😊</button>
                    <button class="mood-btn" data-mood="5">🔥</button>
                </div>
            </div>

            <a href="index.html" class="btn btn--primary btn--full mt-lg">Kembali ke Beranda</a>
        </div>
    `;

    $$('.mood-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            $$('.mood-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            await db.updateSessionMood(session.id, parseInt(btn.dataset.mood));
        });
    });
}

function showExercisePicker() {
    const overlay = $('#exercise-picker-overlay');
    if (!overlay) return;

    const categories = ['push', 'pull', 'squat', 'core', 'hinge'];
    let html = '<div class="modal"><div class="modal__header"><h3>Pilih Latihan</h3><button class="btn btn--ghost btn--sm" id="close-picker">Tutup</button></div>';
    html += '<div class="exercise-picker">';

    categories.forEach(cat => {
        const exercises = getExercisesForCategory(cat);
        const currentLevel = state.userProgression[cat] || 1;

        html += `<div class="mb-md"><span class="tag tag--${cat} mb-sm" style="display:inline-block">${CATEGORY_LABELS[cat]}</span>`;
        exercises.forEach(ex => {
            const isCurrent = ex.level === currentLevel;
            html += `
                <div class="exercise-picker__item ${isCurrent ? 'current' : ''}" data-exercise-id="${ex.id}" data-category="${cat}">
                    <div>
                        <div class="exercise-picker__name">${ex.exercise_name}</div>
                        <div class="exercise-picker__level">Level ${ex.level} · ${ex.target_reps}</div>
                    </div>
                    ${isCurrent ? '<span class="badge badge--terracotta">Aktif</span>' : ''}
                </div>
            `;
        });
        html += '</div>';
    });

    html += '</div></div>';
    overlay.innerHTML = html;
    overlay.classList.add('active');

    $('#close-picker').addEventListener('click', () => overlay.classList.remove('active'));

    $$('.exercise-picker__item').forEach(item => {
        item.addEventListener('click', async () => {
            const exId = parseInt(item.dataset.exerciseId);
            const cat = item.dataset.category;
            const exercise = state.progressionLevels.find(e => e.id === exId);

            if (!exercise) return;

            const existing = sessionExercises.find(e => e.category === cat);
            if (existing) {
                await db.removeExercise(existing.id);
                sessionExercises = sessionExercises.filter(e => e.category !== cat);
            }

            const { data: exData } = await db.addExerciseToSession(
                state.currentSession.id, exercise.id, cat, sessionExercises.length
            );

            if (exData) {
                const targetMatches = exercise.target_reps?.match(/(\d+)/g);
                const targetVal = targetMatches?.length >= 2 ? parseInt(targetMatches[1]) : (targetMatches ? parseInt(targetMatches[0]) : 0);
                const sets = [];
                for (let s = 1; s <= 3; s++) {
                    const { data: setData } = await db.addSet(
                        exData.id, s,
                        exercise.is_hold ? null : targetVal,
                        exercise.is_hold ? targetVal : null
                    );
                    if (setData) sets.push(setData);
                }
                exData.sets = sets;
                sessionExercises.push(exData);
            }

            renderExercises();
            overlay.classList.remove('active');
        });
    });
}

function bindEvents() {
    const overlay = $('#exercise-picker-overlay');
    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.classList.remove('active');
        });
    }
}
