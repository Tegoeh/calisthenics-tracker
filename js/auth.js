import { supabase, state, isConfigured } from './app.js';

// ========================================
// Auth Module
// ========================================

const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');

let isLoginMode = true;

export async function initAuth() {
    if (!isConfigured) {
        showSetupScreen();
        return;
    }

    try {
        const { data } = await supabase.auth.getSession();
        const session = data?.session;

        if (session) {
            state.user = session.user;
            await loadProfile();
            showApp();
        } else {
            showAuth();
        }

        supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                state.user = session.user;
                loadProfile().then(() => showApp());
            } else {
                state.user = null;
                state.profile = null;
                showAuth();
            }
        });
    } catch (e) {
        console.warn('Supabase connection failed, showing login screen:', e.message);
        showAuth();
    }

    bindAuthEvents();
}

async function loadProfile() {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', state.user.id)
        .single();

    if (error) {
        console.error('Profile load error:', error);
        return;
    }

    state.profile = data;

    if (!data.height_cm && !data.weight_kg) {
        showOnboarding();
        return;
    }

    await loadProgressionData();
}

async function loadProgressionData() {
    const { data: levels } = await supabase
        .from('progression_levels')
        .select('*')
        .order('category')
        .order('level');

    if (levels) {
        state.progressionLevels = levels;
    }

    const { data: userProg } = await supabase
        .from('user_progression')
        .select('*')
        .eq('user_id', state.user.id);

    if (userProg) {
        userProg.forEach(p => {
            state.userProgression[p.category] = p.current_level;
        });

        const categories = ['push', 'pull', 'squat', 'core', 'hinge'];
        const existing = Object.keys(state.userProgression);
        const missing = categories.filter(c => !existing.includes(c));

        if (missing.length > 0) {
            const inserts = missing.map(c => ({
                user_id: state.user.id,
                category: c,
                current_level: 1
            }));
            await supabase.from('user_progression').insert(inserts);
            missing.forEach(c => { state.userProgression[c] = 1; });
        }
    }
}

function showAuth() {
    if (authContainer) authContainer.style.display = 'flex';
    if (appContainer) appContainer.style.display = 'none';
}

function showApp() {
    if (authContainer) authContainer.style.display = 'none';
    if (appContainer) appContainer.style.display = 'block';
}

function showOnboarding() {
    showApp();
    const onboarding = document.getElementById('onboarding-modal');
    if (onboarding) onboarding.classList.add('active');
}

function showSetupScreen() {
    if (authContainer) authContainer.style.display = 'none';
    if (appContainer) {
        appContainer.style.display = 'block';
        const page = appContainer.querySelector('.page');
        if (page) {
            page.innerHTML = `
                <div class="auth-page" style="min-height:80vh">
                    <div class="auth-card" style="max-width:440px">
                        <h1 style="margin-bottom:8px">Setup Dulu</h1>
                        <p class="subtitle" style="margin-bottom:24px">Hubungkan ke Supabase supaya data tersimpan di cloud</p>
                        <div class="card" style="text-align:left">
                            <ol style="list-style:decimal;padding-left:20px;font-size:0.875rem;line-height:2;color:var(--color-text)">
                                <li>Buka <strong>supabase.com</strong> dan buat project gratis</li>
                                <li>Buka <strong>SQL Editor</strong>, jalankan <code style="background:var(--color-cream-dark);padding:2px 6px;border-radius:4px;font-size:0.8em">schema.sql</code> lalu <code style="background:var(--color-cream-dark);padding:2px 6px;border-radius:4px;font-size:0.8em">seed.sql</code></li>
                                <li>Di <strong>Settings > API</strong>, copy <em>Project URL</em> dan <em>anon public key</em></li>
                                <li>Edit file <code style="background:var(--color-cream-dark);padding:2px 6px;border-radius:4px;font-size:0.8em">js/config.js</code> dan paste kedua nilai tersebut</li>
                                <li>Refresh halaman ini</li>
                            </ol>
                        </div>
                        <div class="card mt-md" style="background:var(--color-olive-bg);border-color:var(--color-olive)">
                            <p style="font-size:0.8125rem;color:var(--color-olive);margin:0">
                                File SQL ada di folder <strong>supabase/</strong> di project ini.
                            </p>
                        </div>
                    </div>
                </div>
            `;
        }
    }
}

function bindAuthEvents() {
    const authForm = document.getElementById('auth-form');
    const toggleLink = document.getElementById('auth-toggle-link');

    if (authForm) {
        authForm.addEventListener('submit', handleAuthSubmit);
    }

    if (toggleLink) {
        toggleLink.addEventListener('click', () => {
            isLoginMode = !isLoginMode;
            updateAuthUI();
        });
    }

    const onboardingForm = document.getElementById('onboarding-form');
    if (onboardingForm) {
        onboardingForm.addEventListener('submit', handleOnboardingSubmit);
    }
}

function updateAuthUI() {
    const title = document.getElementById('auth-title');
    const subtitle = document.getElementById('auth-subtitle');
    const submitBtn = document.getElementById('auth-submit');
    const toggleText = document.getElementById('auth-toggle-text');
    const toggleLink = document.getElementById('auth-toggle-link');
    const nameField = document.getElementById('name-field');

    if (isLoginMode) {
        if (title) title.textContent = 'Selamat Datang Kembali';
        if (subtitle) subtitle.textContent = 'Masuk untuk lanjut latihan';
        if (submitBtn) submitBtn.textContent = 'Masuk';
        if (toggleText) toggleText.textContent = 'Belum punya akun? ';
        if (toggleLink) toggleLink.textContent = 'Daftar';
        if (nameField) nameField.style.display = 'none';
    } else {
        if (title) title.textContent = 'Mulai Perjalanan';
        if (subtitle) subtitle.textContent = 'Daftar untuk mulai tracking workout';
        if (submitBtn) submitBtn.textContent = 'Daftar';
        if (toggleText) toggleText.textContent = 'Sudah punya akun? ';
        if (toggleLink) toggleLink.textContent = 'Masuk';
        if (nameField) nameField.style.display = 'block';
    }
}

async function handleAuthSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    const name = document.getElementById('auth-name')?.value.trim();
    const btn = document.getElementById('auth-submit');

    btn.disabled = true;
    btn.textContent = 'Memproses...';

    let result;
    if (isLoginMode) {
        result = await supabase.auth.signInWithPassword({ email, password });
    } else {
        result = await supabase.auth.signUp({
            email, password,
            options: { data: { username: name || email.split('@')[0] } }
        });
    }

    if (result.error) {
        showToast(result.error.message);
        btn.disabled = false;
        btn.textContent = isLoginMode ? 'Masuk' : 'Daftar';
        return;
    }

    if (isLoginMode && result.data.session) {
        state.user = result.data.session.user;
        await loadProfile();
        showApp();
    }

    btn.disabled = false;
    btn.textContent = isLoginMode ? 'Masuk' : 'Daftar';
}

async function handleOnboardingSubmit(e) {
    e.preventDefault();
    const height = parseInt(document.getElementById('onboard-height').value);
    const weight = parseFloat(document.getElementById('onboard-weight').value);

    const { error } = await supabase
        .from('profiles')
        .update({ height_cm: height, weight_kg: weight })
        .eq('id', state.user.id);

    if (error) {
        showToast('Gagal menyimpan data profil');
        return;
    }

    await supabase.from('body_stats').insert({
        user_id: state.user.id,
        weight_kg: weight
    });

    state.profile.height_cm = height;
    state.profile.weight_kg = weight;

    const modal = document.getElementById('onboarding-modal');
    if (modal) modal.classList.remove('active');

    await loadProgressionData();
    state.notify('profile');
}

export { showAuth, showApp, loadProfile, loadProgressionData };
