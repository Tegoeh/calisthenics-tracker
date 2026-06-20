// ========================================
// Utility Functions
// ========================================

export function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

export function formatDateShort(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short'
    });
}

export function formatDuration(seconds) {
    if (!seconds) return '0m';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}d`;
    if (secs === 0) return `${mins}m`;
    return `${mins}m ${secs}d`;
}

export function formatTime(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

export function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 11) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
}

export function getTodayStr() {
    return new Date().toISOString().split('T')[0];
}

export function getDayName(dateStr) {
    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    return days[new Date(dateStr).getDay()];
}

export function isSameDay(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
}

export function getWeekDates() {
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    const dates = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        dates.push(d);
    }
    return dates;
}

export function showToast(message, duration = 3000) {
    let toast = document.querySelector('.toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');

    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

export function $(selector, parent = document) {
    return parent.querySelector(selector);
}

export function $$(selector, parent = document) {
    return [...parent.querySelectorAll(selector)];
}

export function createElement(tag, classes = '', html = '') {
    const el = document.createElement(tag);
    if (classes) el.className = classes;
    if (html) el.innerHTML = html;
    return el;
}

export function initNavigation() {
    const nav = document.querySelector('.bottom-nav');
    if (!nav) return;

    const currentPage = document.body.dataset.page;

    nav.innerHTML = `
        <div class="bottom-nav__inner">
            <a href="index.html" class="nav-item ${currentPage === 'dashboard' ? 'active' : ''}" data-nav="dashboard">
                ${iconHome()}
                <span>Beranda</span>
            </a>
            <a href="workout.html" class="nav-item ${currentPage === 'workout' ? 'active' : ''}" data-nav="workout">
                ${iconDumbbell()}
                <span>Latihan</span>
            </a>
            <a href="progress.html" class="nav-item ${currentPage === 'progress' ? 'active' : ''}" data-nav="progress">
                ${iconChart()}
                <span>Progress</span>
            </a>
            <a href="settings.html" class="nav-item ${currentPage === 'settings' ? 'active' : ''}" data-nav="settings">
                ${iconSettings()}
                <span>Setting</span>
            </a>
        </div>
    `;
}

// SVG Icons
function iconHome() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;
}

function iconDumbbell() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 6.5h11M6.5 17.5h11"/><rect x="2" y="4" width="4.5" height="16" rx="1"/><rect x="17.5" y="4" width="4.5" height="16" rx="1"/><rect x="5" y="8" width="2" height="8" rx="0.5"/><rect x="17" y="8" width="2" height="8" rx="0.5"/></svg>`;
}

function iconChart() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`;
}

function iconSettings() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>`;
}

export function iconFlame() {
    return `<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="0.5"><path d="M12 23c-3.866 0-7-2.686-7-6 0-1.665.678-3.17 1.764-4.236C7.878 11.65 9 9.768 9 8c0-.344-.028-.681-.082-1.013C10.146 8.725 11.5 10.56 11.5 13c0 .298-.024.592-.07.88C12.57 12.76 13.5 11 13.5 9c0-.34-.027-.673-.078-1 .86.97 2.078 2.74 2.078 5 0 .684-.126 1.34-.355 1.941C16.27 15.6 17 16.728 17 18c0 2.761-2.239 5-5 5z"/></svg>`;
}

export function iconCheck() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
}

export function iconPlus() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
}

export function iconPlay() {
    return `<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
}

export function iconPause() {
    return `<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`;
}

export function iconSkip() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>`;
}

export function iconBulb() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 22h4M12 2v1M4.22 5.64l.7.7M1 12h1M21 12h1M18.36 5.64l-.7.7"/><path d="M15 14.5A5 5 0 109 14.5c0 2 1.5 2.5 1.5 4.5h3c0-2 1.5-2.5 1.5-4.5z"/></svg>`;
}

export const CATEGORY_COLORS = {
    push: 'terracotta',
    pull: '#6B4E9B',
    squat: 'olive',
    core: '#3A6B8A',
    hinge: '#8A6B3A'
};

export const CATEGORY_LABELS = {
    push: 'Push',
    pull: 'Pull',
    squat: 'Squat',
    core: 'Core',
    hinge: 'Hinge'
};
