import { state } from './app.js';
import * as db from './db.js';
import { showToast } from './utils.js';

// ========================================
// CSV Export Module
// ========================================

export async function exportCSV() {
    showToast('Menyiapkan export...');

    const { data: sessions } = await db.getSessions({ limit: 1000 });
    if (!sessions || sessions.length === 0) {
        showToast('Belum ada data untuk di-export');
        return;
    }

    const completedSessions = sessions.filter(s => s.ended_at);
    const rows = ['Tanggal,Latihan,Kategori,Set,Reps,Tahan(detik),Selesai'];

    for (const session of completedSessions) {
        const date = new Date(session.started_at).toLocaleDateString('id-ID');
        const { data: exercises } = await db.getSessionExercises(session.id);

        if (!exercises) continue;

        for (const ex of exercises) {
            const name = ex.progression_levels?.exercise_name || 'Exercise';
            const category = ex.category;
            const { data: sets } = await db.getExerciseSets(ex.id);

            if (!sets) continue;

            sets.forEach((set, i) => {
                rows.push(
                    `${date},${name},${category},${i + 1},${set.reps || ''},${set.hold_seconds || ''},${set.completed ? 'Ya' : 'Tidak'}`
                );
            });
        }
    }

    const csv = rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `calisthenics-workout-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('Data berhasil di-export');
}
