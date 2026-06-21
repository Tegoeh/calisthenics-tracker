import { supabase, state, isConfigured } from './app.js';

// ========================================
// Auth Module - Custom auth via app_users table
// ========================================

const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');

let isLoginMode = true;

export async function initAuth() {
    if (!isConfigured) {
        showSetupScreen();
        return;
    }

    const saved = localStorage.getItem('cal_user');
    if (saved) {
        try {
            const user = JSON.parse(saved);
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profile) {
                state.user = { id: user.id };
                state.profile = profile;
                await loadProgressionData();
                showApp();
                bindAuthEvents();
                return;
            }
        } catch (e) {
            localStorage.removeItem('cal_user');
        }
    }

    showAuth();
    bindAuthEvents();
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

    const resetBtn = () => {
        btn.disabled = false;
        btn.textContent = isLoginMode ? 'Masuk' : 'Daftar';
    };

    try {
        let result;
        if (isLoginMode) {
            result = await supabase.rpc('app_login', {
                p_email: email,
                p_password: password
            });
        } else {
            result = await supabase.rpc('app_signup', {
                p_email: email,
                p_password: password,
                p_username: name || email.split('@')[0]
            });
        }

        const rpcData = result.data;
        const rpcError = result.error;

        if (rpcError) {
            console.log('RPC error:', rpcError.message);
            showToast(rpcError.message);
            resetBtn();
            return;
        }

        if (rpcData && rpcData.success) {
            const user = rpcData.user;
            state.user = { id: user.id };
            localStorage.setItem('cal_user', JSON.stringify(user));

            await loadProfile();
            showApp();
        } else if (rpcData && !rpcData.success) {
            showToast(rpcData.error || 'Terjadi kesalahan');
            resetBtn();
        } else {
            showToast('Respon tidak valid dari server');
            resetBtn();
        }
    } catch (err) {
        console.error('Auth exception:', err);
        showToast('Gagal terhubung. Periksa koneksi internet.');
        resetBtn();
    }
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
