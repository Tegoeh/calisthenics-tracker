import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

export let supabase;
export let isConfigured = false;

try {
    if (SUPABASE_URL && !SUPABASE_URL.startsWith('YOUR_')) {
        supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        isConfigured = true;
    }
} catch (e) {
    console.warn('Supabase init failed:', e.message);
}

export const state = {
    user: null,
    profile: null,
    currentSession: null,
    progressionLevels: [],
    userProgression: {},
    listeners: [],

    subscribe(fn) {
        this.listeners.push(fn);
    },

    notify(key) {
        this.listeners.forEach(fn => fn(key));
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    const { initAuth } = await import('./auth.js');
    const { initNavigation } = await import('./utils.js');
    const { initTheme } = await import('./theme.js');

    initTheme();
    initNavigation();
    await initAuth();

    const page = document.body.dataset.page;
    if (page && state.user) {
        loadPage(page);
    }
});

async function loadPage(page) {
    switch (page) {
        case 'dashboard':
            (await import('./dashboard.js')).initDashboard();
            break;
        case 'workout':
            (await import('./workout.js')).initWorkout();
            break;
        case 'history':
            (await import('./history.js')).initHistory();
            break;
        case 'progress':
            (await import('./stats.js')).initProgress();
            break;
        case 'settings':
            (await import('./stats.js')).initStats();
            break;
    }
}
