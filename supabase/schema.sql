-- ========================================
-- Calisthenics Tracker - Database Schema
-- Run this in Supabase SQL Editor
-- ========================================

-- 1. Profiles (extends Supabase auth.users)
CREATE TABLE profiles (
    id          UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username    TEXT,
    height_cm   NUMERIC,
    weight_kg   NUMERIC,
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'username');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Progression Levels (static reference data)
CREATE TABLE progression_levels (
    id               SERIAL PRIMARY KEY,
    category         TEXT NOT NULL,
    level            INTEGER NOT NULL,
    exercise_name    TEXT NOT NULL,
    description      TEXT,
    target_reps      TEXT,
    upgrade_criteria TEXT,
    is_hold          BOOLEAN DEFAULT false,
    UNIQUE(category, level)
);

-- 3. User Progression (current level per category)
CREATE TABLE user_progression (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id         UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    category        TEXT NOT NULL,
    current_level   INTEGER NOT NULL DEFAULT 1,
    updated_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, category)
);

-- 4. Workout Sessions
CREATE TABLE workout_sessions (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id         UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    started_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
    ended_at        TIMESTAMPTZ,
    duration_sec    INTEGER,
    notes           TEXT,
    mood            INTEGER CHECK (mood BETWEEN 1 AND 5),
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sessions_user_date ON workout_sessions(user_id, started_at DESC);

-- 5. Workout Exercises (exercises within a session)
CREATE TABLE workout_exercises (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id      UUID REFERENCES workout_sessions(id) ON DELETE CASCADE NOT NULL,
    exercise_id     INTEGER REFERENCES progression_levels(id) NOT NULL,
    category        TEXT NOT NULL,
    order_index     INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- 6. Workout Sets (individual sets)
CREATE TABLE workout_sets (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    exercise_entry_id UUID REFERENCES workout_exercises(id) ON DELETE CASCADE NOT NULL,
    set_number      INTEGER NOT NULL,
    reps            INTEGER,
    hold_seconds    INTEGER,
    completed       BOOLEAN DEFAULT false,
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- 7. Body Stats
CREATE TABLE body_stats (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id         UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    recorded_at     DATE NOT NULL DEFAULT CURRENT_DATE,
    weight_kg       NUMERIC NOT NULL,
    notes           TEXT,
    UNIQUE(user_id, recorded_at)
);

-- 8. Workout Streaks (cached)
CREATE TABLE workout_streaks (
    user_id         UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
    current_streak  INTEGER DEFAULT 0,
    longest_streak  INTEGER DEFAULT 0,
    last_workout_date DATE,
    updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ========================================
-- Row Level Security
-- ========================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE progression_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progression ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_streaks ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Progression levels (read-only for authenticated)
CREATE POLICY "Authenticated can read progressions" ON progression_levels FOR SELECT USING (auth.role() = 'authenticated');

-- User progression
CREATE POLICY "Users can view own progression" ON user_progression FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progression" ON user_progression FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progression" ON user_progression FOR UPDATE USING (auth.uid() = user_id);

-- Workout sessions
CREATE POLICY "Users can view own sessions" ON workout_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON workout_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON workout_sessions FOR UPDATE USING (auth.uid() = user_id);

-- Workout exercises
CREATE POLICY "Users can view own exercises" ON workout_exercises FOR SELECT USING (
    EXISTS (SELECT 1 FROM workout_sessions WHERE id = workout_exercises.session_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert own exercises" ON workout_exercises FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM workout_sessions WHERE id = workout_exercises.session_id AND user_id = auth.uid())
);
CREATE POLICY "Users can update own exercises" ON workout_exercises FOR UPDATE USING (
    EXISTS (SELECT 1 FROM workout_sessions WHERE id = workout_exercises.session_id AND user_id = auth.uid())
);
CREATE POLICY "Users can delete own exercises" ON workout_exercises FOR DELETE USING (
    EXISTS (SELECT 1 FROM workout_sessions WHERE id = workout_exercises.session_id AND user_id = auth.uid())
);

-- Workout sets
CREATE POLICY "Users can view own sets" ON workout_sets FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM workout_exercises we
        JOIN workout_sessions ws ON ws.id = we.session_id
        WHERE we.id = workout_sets.exercise_entry_id AND ws.user_id = auth.uid()
    )
);
CREATE POLICY "Users can insert own sets" ON workout_sets FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM workout_exercises we
        JOIN workout_sessions ws ON ws.id = we.session_id
        WHERE we.id = workout_sets.exercise_entry_id AND ws.user_id = auth.uid()
    )
);
CREATE POLICY "Users can update own sets" ON workout_sets FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM workout_exercises we
        JOIN workout_sessions ws ON ws.id = we.session_id
        WHERE we.id = workout_sets.exercise_entry_id AND ws.user_id = auth.uid()
    )
);
CREATE POLICY "Users can delete own sets" ON workout_sets FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM workout_exercises we
        JOIN workout_sessions ws ON ws.id = we.session_id
        WHERE we.id = workout_sets.exercise_entry_id AND ws.user_id = auth.uid()
    )
);

-- Body stats
CREATE POLICY "Users can view own stats" ON body_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own stats" ON body_stats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own stats" ON body_stats FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own stats" ON body_stats FOR DELETE USING (auth.uid() = user_id);

-- Workout streaks
CREATE POLICY "Users can view own streaks" ON workout_streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own streaks" ON workout_streaks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own streaks" ON workout_streaks FOR UPDATE USING (auth.uid() = user_id);
