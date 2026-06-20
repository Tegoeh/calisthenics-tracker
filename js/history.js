import { state } from './app.js';
import * as db from './db.js';
import { formatDate, formatDateShort, formatDuration, formatTime, $, $$, CATEGORY_LABELS } from './utils.js';

// ========================================
// History Module
// ========================================

export async function initHistory() {
    const container = $('#history-container');
    if (!container) return;

    container.innerHTML = '<div class="skeleton skeleton--card mb-md"></div><div class="skeleton skeleton--card mb-md"></div><div class="skeleton skeleton--card"></div>';

    const { data: sessions, error } = await db.getSessions({ limit: 30 });

    if (error || !sessions || sessions.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <p>Belum ada riwayat workout. Mulai latihan pertamamu!</p>
            </div>
        `;
        return;
    }

    const completedSessions = sessions.filter(s => s.ended_at);
    if (completedSessions.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>Belum ada workout yang selesai. Selesaikan sesi aktifmu dulu!</p>
                <a href="workout.html" class="btn btn--primary mt-lg">Lanjut Latihan</a>
            </div>
        `;
        return;
    }

    let html = '<div class="history-list stagger">';

    for (const session of completedSessions) {
        const { data: exercises } = await db.getSessionExercises(session.id);

        let exerciseDetails = [];
        let totalSets = 0;
        let completedSets = 0;

        if (exercises) {
            for (const ex of exercises) {
                const { data: sets } = await db.getExerciseSets(ex.id);
                const exSets = sets || [];
                totalSets += exSets.length;
                completedSets += exSets.filter(s => s.completed).length;
                exerciseDetails.push({
                    name: ex.progression_levels?.exercise_name || 'Exercise',
                    category: ex.category,
                    sets: exSets
                });
            }
        }

        const moods = ['', '😫', '😐', '🙂', '😊', '🔥'];
        const mood = session.mood ? moods[session.mood] : '';

        html += `
            <div class="card history-item" data-session-id="${session.id}">
                <div class="history-item__header">
                    <div class="history-item__date">${formatDateShort(session.started_at)}</div>
                    ${mood ? `<span class="history-item__mood">${mood}</span>` : ''}
                </div>
                <div class="history-item__meta">
                    <span>${formatDuration(session.duration_sec)}</span>
                    <span>${exercises?.length || 0} latihan</span>
                    <span>${completedSets}/${totalSets} set</span>
                </div>
                <div class="history-item__detail">
                    ${exerciseDetails.map(ex => `
                        <div class="history-exercise">
                            <div class="history-exercise__name">
                                <span class="tag tag--${ex.category}">${CATEGORY_LABELS[ex.category]}</span>
                                ${ex.name}
                            </div>
                            <div class="history-exercise__sets">
                                ${ex.sets.map((s, i) => {
                                    const val = s.hold_seconds != null && s.reps == null
                                        ? `${s.hold_seconds}s`
                                        : `${s.reps || 0} reps`;
                                    return `<span class="history-set ${s.completed ? 'completed' : ''}">Set ${i + 1}: ${val}</span>`;
                                }).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    html += '</div>';
    container.innerHTML = html;

    $$('.history-item').forEach(item => {
        item.addEventListener('click', () => {
            item.classList.toggle('expanded');
        });
    });
}
