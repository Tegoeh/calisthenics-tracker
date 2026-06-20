// ========================================
// Streak Module
// ========================================

export function checkStreakStatus(streakData) {
    if (!streakData || !streakData.last_workout_date) {
        return { status: 'new', message: 'Mulai workout pertamamu!' };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastDate = new Date(streakData.last_workout_date);
    const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        return { status: 'today', message: 'Sudah latihan hari ini!' };
    }

    if (diffDays <= 2) {
        return { status: 'active', message: `${streakData.current_streak} hari berturut-turut!` };
    }

    return { status: 'broken', message: 'Streak terputus. Mulai lagi!' };
}

export function getStreakMessage(streak) {
    if (!streak || streak.current_streak === 0) return 'Mulai perjalananmu hari ini';
    if (streak.current_streak <= 2) return 'Awal yang bagus! Terus lanjutkan';
    if (streak.current_streak <= 5) return `${streak.current_streak} hari kuat! Konsisten!`;
    if (streak.current_streak <= 10) return 'Luar biasa! Kamu on fire!';
    return 'Legendaris! Dedikasi tingkat tinggi!';
}
