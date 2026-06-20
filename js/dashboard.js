import { state } from './app.js';
import * as db from './db.js';
import { getCurrentExercise, canLevelUp, getNextExercise } from './progression.js';
import { getGreeting, getWeekDates, getDayName, isSameDay, showToast, $, iconFlame, iconCheck, iconPlus, iconBulb, CATEGORY_LABELS } from './utils.js';
import { getStreakMessage } from './streak.js';

// ========================================
// Dashboard Module
// ========================================

export async function initDashboard() {
    await renderDashboard();
}

async function renderDashboard() {
    const container = $('#dashboard-container');
    if (!container) return;

    container.innerHTML = `
        <div class="greeting animate-fade-in">
            <div class="greeting__time">${getGreeting()}</div>
            <div class="greeting__name">${state.profile?.username || 'Pejuang'}</div>
        </div>
        <div id="dashboard-content">
            <div class="skeleton skeleton--card mb-md"></div>
            <div class="skeleton skeleton--card mb-md"></div>
            <div class="skeleton skeleton--card"></div>
        </div>
    `;

    const [streakResult, todaySessions, weekSessions, totalStats] = await Promise.all([
        db.getStreak(state.user.id),
        db.getSessions({ todayOnly: true, limit: 1 }),
        db.getSessionsThisWeek(state.user.id),
        db.getTotalStats(state.user.id)
    ]);

    const streak = streakResult.data;
    const todaySession = todaySessions.data?.[0] || null;
    const weekData = weekSessions.data || [];
    const incomplete = await db.getIncompleteSession(state.user.id);

    renderDashboardContent(streak, todaySession, incomplete, weekData, totalStats);
}

function renderDashboardContent(streak, todaySession, incomplete, weekData, totalStats) {
    const container = $('#dashboard-content');
    if (!container) return;

    const weekDates = getWeekDates();
    const streakMsg = getStreakMessage(streak);

    container.innerHTML = `
        <!-- Streak Card -->
        <div class="card streak-card mb-lg animate-fade-in-up">
            <div class="streak-card__icon">${iconFlame()}</div>
            <div class="streak-card__info">
                <div class="streak-card__number">${streak?.current_streak || 0} <span style="font-size:0.875rem;font-family:var(--font-body);font-weight:400">hari</span></div>
                <div class="streak-card__label">${streakMsg}</div>
                ${streak?.longest_streak > 0 ? `<div class="streak-card__best">Terpanjang: ${streak.longest_streak} hari</div>` : ''}
            </div>
        </div>

        <!-- Today's Workout -->
        <div class="section animate-fade-in-up" style="animation-delay:60ms">
            <div class="section__header">
                <span class="section__title">Hari Ini</span>
            </div>
            ${renderTodayCard(todaySession, incomplete)}
        </div>

        <!-- Weekly Overview -->
        <div class="section animate-fade-in-up" style="animation-delay:120ms">
            <div class="section__header">
                <span class="section__title">Minggu Ini</span>
                <span class="label">${weekData.length} sesi</span>
            </div>
            <div class="card">
                <div class="week-circles">
                    ${weekDates.map(d => {
                        const isToday = isSameDay(d, new Date());
                        const hasWorkout = weekData.some(s => isSameDay(s.started_at, d));
                        return `
                            <div class="week-circle">
                                <div class="week-circle__dot ${isToday ? 'today' : ''} ${hasWorkout ? 'filled' : ''}">
                                    ${hasWorkout ? iconCheck() : ''}
                                </div>
                                <span class="week-circle__label">${getDayName(d)}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        </div>

        <!-- Current Levels -->
        <div class="section animate-fade-in-up" style="animation-delay:180ms">
            <div class="section__header">
                <span class="section__title">Level Kamu</span>
                <a href="progress.html" class="section__action">Lihat Semua</a>
            </div>
            <div class="grid-2 stagger">
                ${renderLevelCards()}
            </div>
        </div>

        <!-- Quick Stats -->
        <div class="section animate-fade-in-up" style="animation-delay:240ms">
            <div class="card">
                <div class="quick-stats">
                    <div class="quick-stat">
                        <div class="quick-stat__number">${totalStats.totalSessions}</div>
                        <div class="quick-stat__label">Total Workout</div>
                    </div>
                    <div class="quick-stat">
                        <div class="quick-stat__number">${totalStats.daysSince}</div>
                        <div class="quick-stat__label">Hari</div>
                    </div>
                    <div class="quick-stat">
                        <div class="quick-stat__number">${streak?.longest_streak || 0}</div>
                        <div class="quick-stat__label">Best Streak</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Tip -->
        ${renderTip(streak)}
    `;
}

function renderTodayCard(todaySession, incomplete) {
    if (incomplete) {
        return `
            <div class="card today-card">
                <div class="today-card__status">
                    <div class="today-card__icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                    </div>
                    <div class="today-card__text">
                        <h3>Workout Sedang Berjalan</h3>
                        <p>Lanjutkan sesi yang belum selesai</p>
                    </div>
                </div>
                <a href="workout.html" class="btn btn--primary btn--full mt-md">Lanjutkan</a>
            </div>
        `;
    }

    if (todaySession && todaySession.ended_at) {
        return `
            <div class="card" style="border-color: var(--color-olive)">
                <div class="today-card__status">
                    <div class="today-card__icon" style="background: var(--color-olive)">
                        ${iconCheck()}
                    </div>
                    <div class="today-card__text">
                        <h3>Workout Selesai!</h3>
                        <p>Kamu sudah latihan hari ini</p>
                    </div>
                </div>
                <a href="history.html" class="btn btn--ghost btn--full mt-md">Lihat Detail</a>
            </div>
        `;
    }

    return `
        <div class="card today-card">
            <div class="today-card__status">
                <div class="today-card__icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
                <div class="today-card__text">
                    <h3>Belum Latihan</h3>
                    <p>Waktunya mulai workout hari ini!</p>
                </div>
            </div>
            <a href="workout.html" class="btn btn--primary btn--full mt-md">Mulai Latihan</a>
        </div>
    `;
}

function renderLevelCards() {
    const categories = ['push', 'pull', 'squat', 'core', 'hinge'];
    return categories.map(cat => {
        const exercise = getCurrentExercise(cat);
        const currentLevel = state.userProgression[cat] || 1;
        const maxLevel = 5;

        return `
            <div class="card level-card animate-fade-in-up">
                <div class="level-card__category">
                    <span class="tag tag--${cat}">${CATEGORY_LABELS[cat]}</span>
                    <div class="level-dots">
                        ${Array.from({ length: maxLevel }, (_, i) => `
                            <div class="level-dot ${i < currentLevel ? 'filled' : ''} ${i === currentLevel - 1 ? 'current' : ''}"></div>
                        `).join('')}
                    </div>
                </div>
                <div class="level-card__exercise">${exercise?.exercise_name || '-'}</div>
                <div class="level-card__target">${exercise?.target_reps || ''}</div>
            </div>
        `;
    }).join('');
}

function renderTip(streak) {
    const tips = [];

    if ((streak?.current_streak || 0) >= 3) {
        tips.push(`${streak.current_streak} hari berturut-turut! Konsistensi adalah kunci. Jangan berhenti sekarang.`);
    }

    if ((streak?.current_streak || 0) === 0) {
        tips.push('Mulai dari yang paling ringan. Yang penting hadir dulu, intensitas bisa ditambah nanti.');
    }

    const categories = ['push', 'pull', 'squat', 'core', 'hinge'];
    categories.forEach(cat => {
        if (canLevelUp(cat)) {
            const next = getNextExercise(cat);
            if (next) {
                tips.push(`Kalau ${CATEGORY_LABELS[cat]} sudah terasa mudah, coba naik ke ${next.exercise_name}!`);
            }
        }
    });

    if (tips.length === 0) {
        tips.push('Makan cukup protein & kalori, tidur 7-8 jam. Otot tumbuh saat istirahat, bukan saat latihan.');
    }

    const tip = tips[Math.floor(Math.random() * tips.length)];

    return `
        <div class="section animate-fade-in-up" style="animation-delay:300ms">
            <div class="card tip-card">
                <div class="tip-card__header">
                    ${iconBulb()}
                    Tips Hari Ini
                </div>
                <p>${tip}</p>
            </div>
        </div>
    `;
}
