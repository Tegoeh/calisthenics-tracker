import { supabase } from './app.js';

// ========================================
// Database Module - All Supabase queries
// ========================================

export async function getSessions(options = {}) {
    const { limit = 20, todayOnly = false } = options;

    let query = supabase
        .from('workout_sessions')
        .select('*')
        .order('started_at', { ascending: false });

    if (todayOnly) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        query = query.gte('started_at', today.toISOString());
    }

    if (limit) query = query.limit(limit);

    return query;
}

export async function getSessionById(sessionId) {
    return supabase
        .from('workout_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();
}

export async function createSession(userId) {
    return supabase
        .from('workout_sessions')
        .insert({ user_id: userId })
        .select()
        .single();
}

export async function finishSession(sessionId) {
    const now = new Date().toISOString();
    const { data: session } = await getSessionById(sessionId);
    const duration = session
        ? Math.round((new Date(now) - new Date(session.started_at)) / 1000)
        : null;

    return supabase
        .from('workout_sessions')
        .update({ ended_at: now, duration_sec: duration })
        .eq('id', sessionId)
        .select()
        .single();
}

export async function updateSessionMood(sessionId, mood) {
    return supabase
        .from('workout_sessions')
        .update({ mood })
        .eq('id', sessionId);
}

export async function getSessionExercises(sessionId) {
    return supabase
        .from('workout_exercises')
        .select('*, progression_levels(*)')
        .eq('session_id', sessionId)
        .order('order_index');
}

export async function addExerciseToSession(sessionId, exerciseId, category, orderIndex) {
    return supabase
        .from('workout_exercises')
        .insert({
            session_id: sessionId,
            exercise_id: exerciseId,
            category,
            order_index: orderIndex
        })
        .select('*, progression_levels(*)')
        .single();
}

export async function removeExercise(exerciseEntryId) {
    return supabase
        .from('workout_exercises')
        .delete()
        .eq('id', exerciseEntryId);
}

export async function getExerciseSets(exerciseEntryId) {
    return supabase
        .from('workout_sets')
        .select('*')
        .eq('exercise_entry_id', exerciseEntryId)
        .order('set_number');
}

export async function addSet(exerciseEntryId, setNumber, reps = null, holdSeconds = null) {
    return supabase
        .from('workout_sets')
        .insert({
            exercise_entry_id: exerciseEntryId,
            set_number: setNumber,
            reps,
            hold_seconds: holdSeconds,
            completed: false
        })
        .select()
        .single();
}

export async function updateSet(setId, data) {
    return supabase
        .from('workout_sets')
        .update(data)
        .eq('id', setId)
        .select()
        .single();
}

export async function removeSet(setId) {
    return supabase
        .from('workout_sets')
        .delete()
        .eq('id', setId);
}

export async function getProgressionLevels() {
    return supabase
        .from('progression_levels')
        .select('*')
        .order('category')
        .order('level');
}

export async function getUserProgression(userId) {
    return supabase
        .from('user_progression')
        .select('*')
        .eq('user_id', userId);
}

export async function updateUserProgression(userId, category, level) {
    return supabase
        .from('user_progression')
        .upsert({
            user_id: userId,
            category,
            current_level: level,
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,category' });
}

export async function getBodyStats(userId) {
    return supabase
        .from('body_stats')
        .select('*')
        .eq('user_id', userId)
        .order('recorded_at', { ascending: false });
}

export async function addBodyStat(userId, weightKg, notes = null) {
    return supabase
        .from('body_stats')
        .upsert({
            user_id: userId,
            weight_kg: weightKg,
            notes
        }, { onConflict: 'user_id,recorded_at' })
        .select()
        .single();
}

export async function getStreak(userId) {
    const { data, error } = await supabase
        .from('workout_streaks')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error && error.code === 'PGRST116') {
        await supabase.from('workout_streaks').insert({
            user_id: userId,
            current_streak: 0,
            longest_streak: 0
        });
        return { data: { current_streak: 0, longest_streak: 0, last_workout_date: null }, error: null };
    }

    return { data, error };
}

export async function updateStreak(userId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0];

    const { data: streak } = await getStreak(userId);

    let currentStreak = streak.current_streak || 0;
    let longestStreak = streak.longest_streak || 0;
    const lastDate = streak.last_workout_date;

    if (lastDate === todayStr) {
        return { data: streak, error: null };
    }

    if (lastDate === yesterdayStr || lastDate === twoDaysAgoStr) {
        currentStreak += 1;
    } else if (!lastDate) {
        currentStreak = 1;
    } else {
        currentStreak = 1;
    }

    longestStreak = Math.max(longestStreak, currentStreak);

    return supabase
        .from('workout_streaks')
        .upsert({
            user_id: userId,
            current_streak: currentStreak,
            longest_streak: longestStreak,
            last_workout_date: todayStr,
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })
        .select()
        .single();
}

export async function getSessionsThisWeek(userId) {
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    monday.setHours(0, 0, 0, 0);

    return supabase
        .from('workout_sessions')
        .select('started_at')
        .eq('user_id', userId)
        .gte('started_at', monday.toISOString())
        .not('ended_at', 'is', null);
}

export async function getWeeklyVolume(userId, weeks = 8) {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - (weeks * 7));

    const { data: sessions } = await supabase
        .from('workout_sessions')
        .select('id, started_at')
        .eq('user_id', userId)
        .gte('started_at', startDate.toISOString())
        .not('ended_at', 'is', null);

    if (!sessions || sessions.length === 0) return [];

    const sessionIds = sessions.map(s => s.id);

    const { data: sets } = await supabase
        .from('workout_sets')
        .select('exercise_entry_id, completed')
        .in('exercise_entry_id',
            (await supabase
                .from('workout_exercises')
                .select('id')
                .in('session_id', sessionIds)
            ).data?.map(e => e.id) || []
        )
        .eq('completed', true);

    const weeklyData = {};
    for (let i = 0; i < weeks; i++) {
        const weekStart = new Date(startDate);
        weekStart.setDate(weekStart.getDate() + (i * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        const key = `W${i + 1}`;
        weeklyData[key] = {
            label: `${weekStart.getDate()}/${weekStart.getMonth() + 1}`,
            sets: 0
        };
    }

    if (sessions && sets) {
        sessions.forEach(session => {
            const sessionDate = new Date(session.started_at);
            const weekIndex = Math.floor((sessionDate - startDate) / (7 * 24 * 60 * 60 * 1000));
            if (weekIndex >= 0 && weekIndex < weeks) {
                const key = `W${weekIndex + 1}`;
                const sessionSets = sets.filter(s => {
                    // This is approximate since we don't have direct session->set mapping here
                    return true;
                });
                weeklyData[key].sets = (weeklyData[key].sets || 0);
            }
        });
    }

    return Object.values(weeklyData);
}

export async function getTotalStats(userId) {
    const { count: totalSessions } = await supabase
        .from('workout_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .not('ended_at', 'is', null);

    const { data: firstSession } = await supabase
        .from('workout_sessions')
        .select('started_at')
        .eq('user_id', userId)
        .order('started_at', { ascending: true })
        .limit(1)
        .single();

    const daysSince = firstSession
        ? Math.floor((new Date() - new Date(firstSession.started_at)) / (1000 * 60 * 60 * 24)) + 1
        : 0;

    return {
        totalSessions: totalSessions || 0,
        daysSince
    };
}

export async function getIncompleteSession(userId) {
    const { data } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', userId)
        .is('ended_at', null)
        .order('started_at', { ascending: false })
        .limit(1)
        .single();

    return data;
}
