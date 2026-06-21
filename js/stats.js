import { state, supabase } from './app.js';
import * as db from './db.js';
import { getProgressionTree } from './progression.js';
import { showToast, $, $$, formatDateShort, CATEGORY_LABELS } from './utils.js';
import { drawLineChart } from './charts.js';

// ========================================
// Progress & Stats Page
// ========================================

export async function initProgress() {
    const container = $('#progress-container');
    if (!container) return;

    renderProgressionTree();
    await renderBodyStats();
}

function renderProgressionTree() {
    const treeEl = $('#progression-tree');
    if (!treeEl) return;

    const tree = getProgressionTree();
    let html = '';

    Object.keys(tree).forEach(cat => {
        const currentLevel = state.userProgression[cat] || 1;
        const exercises = tree[cat];

        html += `
            <div class="progression-category">
                <div class="progression-category__header">
                    <span class="tag tag--${cat}">${CATEGORY_LABELS[cat]}</span>
                    <span class="badge badge--terracotta">Level ${currentLevel}</span>
                </div>
                <div class="timeline">
                    ${exercises.map(ex => {
                        const status = ex.level < currentLevel ? 'completed'
                            : ex.level === currentLevel ? 'current' : 'locked';
                        return `
                            <div class="timeline-item ${status}">
                                <div class="timeline-item__dot"></div>
                                <div class="timeline-item__name">${ex.exercise_name}</div>
                                <div class="timeline-item__desc">${ex.description}</div>
                                <div class="timeline-item__criteria">${ex.upgrade_criteria}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    });

    treeEl.innerHTML = html;
}

async function renderBodyStats() {
    const statsEl = $('#body-stats-section');
    if (!statsEl) return;

    const { data: stats } = await db.getBodyStats(state.user.id);
    const weightList = stats || [];

    statsEl.innerHTML = `
        <div class="card mb-md">
            <h4 class="mb-md">Catat Berat Badan</h4>
            <form id="weight-form" class="weight-input-group">
                <div class="input-group" style="flex:1">
                    <label>Berat (kg)</label>
                    <input type="number" class="input" id="weight-input" step="0.1" min="20" max="200"
                        value="${state.profile?.weight_kg || ''}" placeholder="45.0" inputmode="decimal">
                </div>
                <button type="submit" class="btn btn--primary" style="align-self:flex-end">Simpan</button>
            </form>
        </div>

        ${weightList.length >= 2 ? `
            <div class="card chart-container mb-md">
                <div class="chart-container__title">Grafik Berat Badan</div>
                <canvas id="weight-chart" style="height: 200px"></canvas>
            </div>
        ` : ''}

        <div class="card">
            <h4 class="mb-md">Riwayat Berat</h4>
            <div class="weight-log">
                ${weightList.length === 0 ? '<p class="text-muted">Belum ada data berat badan</p>' :
                    weightList.map((s, i) => {
                        const prev = weightList[i + 1];
                        const diff = prev ? (s.weight_kg - prev.weight_kg).toFixed(1) : null;
                        const changeClass = diff > 0 ? 'positive' : diff < 0 ? 'negative' : 'neutral';
                        const changeText = diff > 0 ? `+${diff}` : diff < 0 ? diff : '-';
                        return `
                            <div class="weight-log__item">
                                <span class="weight-log__date">${formatDateShort(s.recorded_at)}</span>
                                <span class="weight-log__value">${s.weight_kg} kg</span>
                                ${diff !== null ? `<span class="weight-log__change ${changeClass}">${changeText} kg</span>` : ''}
                            </div>
                        `;
                    }).join('')
                }
            </div>
        </div>
    `;

    const weightForm = $('#weight-form');
    if (weightForm) {
        weightForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const weight = parseFloat($('#weight-input').value);
            if (!weight || weight < 20 || weight > 200) {
                showToast('Masukkan berat yang valid');
                return;
            }

            const { error } = await db.addBodyStat(state.user.id, weight);
            if (error) {
                showToast('Gagal menyimpan berat badan');
                return;
            }

            showToast('Berat badan tersimpan');
            await renderBodyStats();
        });
    }

    const chartCanvas = $('#weight-chart');
    if (chartCanvas && weightList.length >= 2) {
        const chartData = [...weightList].reverse().map(s => ({
            label: formatDateShort(s.recorded_at),
            value: parseFloat(s.weight_kg)
        }));
        drawLineChart(chartCanvas, chartData);
    }
}

export async function initStats() {
    const container = $('#settings-container');
    if (!container) return;

    const timerDuration = localStorage.getItem('restTimerDuration') || '90';
    const darkMode = document.documentElement.getAttribute('data-theme') === 'dark';

    container.innerHTML = `
        <div class="settings-section animate-fade-in-up">
            <div class="settings-section__title">Profil</div>
            <div class="card">
                <div class="input-group mb-md">
                    <label>Nama</label>
                    <input type="text" class="input" id="profile-name" value="${state.profile?.username || ''}" placeholder="Nama kamu">
                </div>
                <div class="grid-2 mb-md">
                    <div class="input-group">
                        <label>Tinggi (cm)</label>
                        <input type="number" class="input" id="profile-height" value="${state.profile?.height_cm || ''}" inputmode="numeric">
                    </div>
                    <div class="input-group">
                        <label>Berat (kg)</label>
                        <input type="number" class="input" id="profile-weight" value="${state.profile?.weight_kg || ''}" step="0.1" inputmode="decimal">
                    </div>
                </div>
                <button class="btn btn--primary btn--full" id="save-profile">Simpan Profil</button>
            </div>
        </div>

        <div class="settings-section animate-fade-in-up" style="animation-delay:60ms">
            <div class="settings-section__title">Timer</div>
            <div class="card">
                <div class="settings-item">
                    <div>
                        <div class="settings-item__label">Durasi Istirahat</div>
                        <div class="settings-item__desc">Waktu istirahat antar set</div>
                    </div>
                    <div class="stepper">
                        <button class="stepper__btn" id="timer-decrease">-</button>
                        <input class="stepper__value" id="timer-value" value="${timerDuration}" readonly>
                        <button class="stepper__btn" id="timer-increase">+</button>
                    </div>
                </div>
            </div>
        </div>

        <div class="settings-section animate-fade-in-up" style="animation-delay:120ms">
            <div class="settings-section__title">Tampilan</div>
            <div class="card">
                <div class="settings-item">
                    <div>
                        <div class="settings-item__label">Mode Gelap</div>
                        <div class="settings-item__desc">Tema gelap dengan warna warm</div>
                    </div>
                    <div class="toggle ${darkMode ? 'active' : ''}" id="dark-toggle">
                        <div class="toggle__knob"></div>
                    </div>
                </div>
            </div>
        </div>

        <div class="settings-section animate-fade-in-up" style="animation-delay:180ms">
            <div class="settings-section__title">Data</div>
            <div class="card">
                <button class="btn btn--secondary btn--full mb-sm" id="export-csv">Export Data (CSV)</button>
                <button class="btn btn--ghost btn--full text-terracotta" id="logout-btn">Keluar</button>
            </div>
        </div>
    `;

    bindSettingsEvents();
}

function bindSettingsEvents() {
    const saveProfile = $('#save-profile');
    if (saveProfile) {
        saveProfile.addEventListener('click', async () => {
            const name = $('#profile-name').value.trim();
            const height = parseFloat($('#profile-height').value);
            const weight = parseFloat($('#profile-weight').value);

            const update = {};
            if (name) update.username = name;
            if (height > 0) update.height_cm = height;
            if (weight > 0) update.weight_kg = weight;

            const { error } = await supabase
                .from('profiles')
                .update(update)
                .eq('id', state.user.id);

            if (error) {
                showToast('Gagal menyimpan profil');
                return;
            }

            Object.assign(state.profile, update);
            showToast('Profil tersimpan');
        });
    }

    const timerDecrease = $('#timer-decrease');
    const timerIncrease = $('#timer-increase');
    const timerValue = $('#timer-value');

    if (timerDecrease) {
        timerDecrease.addEventListener('click', () => {
            let val = parseInt(timerValue.value) - 15;
            if (val < 15) val = 15;
            timerValue.value = val;
            localStorage.setItem('restTimerDuration', val.toString());
        });
    }

    if (timerIncrease) {
        timerIncrease.addEventListener('click', () => {
            let val = parseInt(timerValue.value) + 15;
            if (val > 300) val = 300;
            timerValue.value = val;
            localStorage.setItem('restTimerDuration', val.toString());
        });
    }

    const darkToggle = $('#dark-toggle');
    if (darkToggle) {
        darkToggle.addEventListener('click', () => {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
            localStorage.setItem('theme', isDark ? 'light' : 'dark');
            darkToggle.classList.toggle('active');
        });
    }

    const exportBtn = $('#export-csv');
    if (exportBtn) {
        exportBtn.addEventListener('click', async () => {
            const { exportCSV } = await import('./export.js');
            await exportCSV();
        });
    }

    const logoutBtn = $('#logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            localStorage.removeItem('cal_user');
            window.location.href = 'index.html';
        });
    }
}
