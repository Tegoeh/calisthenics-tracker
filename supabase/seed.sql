-- ========================================
-- Seed Data - Progression Levels
-- Run this AFTER schema.sql
-- ========================================

INSERT INTO progression_levels (category, level, exercise_name, description, target_reps, upgrade_criteria, is_hold) VALUES
-- PUSH
('push', 1, 'Wall Push-up', 'Berdiri menghadap tembok, tangan setinggi dada. Dorong badan menjauh dari tembok.', '3x15', '3x15 dengan tempo lambat', false),
('push', 2, 'Incline Push-up', 'Tangan di permukaan tinggi (meja/kursi). Badan lurus dari kepala ke kaki.', '3x12', '3x12 dengan form bagus', false),
('push', 3, 'Knee Push-up', 'Lutut di lantai, badan lurus dari lutut ke kepala. Turun pelan.', '3x10', '3x10 dengan kontrol penuh', false),
('push', 4, 'Regular Push-up', 'Posisi plank penuh, dada mendekati lantai. Push-up standar.', '3x12', '3x12 dengan form sempurna', false),
('push', 5, 'Diamond Push-up', 'Tangan rapat membentuk diamond. Fokus tricep dan dada bagian dalam.', '3x10', 'Mastery tercapai', false),

-- PULL
('pull', 1, 'Dead Hang', 'Gelantung di bar dengan rileks, bahu tidak naik ke telinga. Latih grip.', '3x30s', '3x45s dengan nyaman', true),
('pull', 2, 'Scapular Pull', 'Gelantung lalu tarik bahu ke bawah dan belakang. Gerakan kecil tapi penting.', '3x10', '3x12 terkontrol', false),
('pull', 3, 'Negative Pull-up', 'Lompat ke atas bar, turunkan badan sepelan mungkin (3-5 detik).', '3x5', '3x5 dengan descent 5 detik', false),
('pull', 4, 'Assisted Pull-up', 'Pull-up dengan bantuan karet resistance band atau kursi.', '3x8', '3x8 dengan bantuan minimal', false),
('pull', 5, 'Pull-up', 'Full dead-hang pull-up, dagu melewati bar. The real deal.', '3x8', 'Mastery tercapai', false),

-- SQUAT
('squat', 1, 'Assisted Squat', 'Pegang tiang/kursi untuk keseimbangan. Turun setengah dulu.', '3x15', '3x15 tanpa butuh bantuan', false),
('squat', 2, 'Bodyweight Squat', 'Turun penuh, paha sejajar lantai, tumit tetap di lantai.', '3x15', '3x20 dengan kedalaman bagus', false),
('squat', 3, 'Lunge', 'Langkah ke depan bergantian, lutut belakang hampir menyentuh lantai.', '3x10/kaki', '3x12/kaki', false),
('squat', 4, 'Bulgarian Split Squat', 'Kaki belakang di atas kursi/bench. Turun dengan kaki depan.', '3x8/kaki', '3x10/kaki', false),
('squat', 5, 'Pistol Squat', 'Single-leg squat, kaki lain lurus ke depan. Ultimate leg strength.', '3x5/kaki', 'Mastery tercapai', false),

-- CORE
('core', 1, 'Plank', 'Forearm plank, badan lurus dari kepala ke tumit. Kencangkan perut.', '3x30s', '3x45s form solid', true),
('core', 2, 'Lying Leg Raise', 'Tiduran, angkat kaki lurus sampai 90 derajat. Turun pelan.', '3x10', '3x12 terkontrol', false),
('core', 3, 'Hanging Knee Raise', 'Gelantung di bar, angkat lutut ke arah dada. Jangan ayun.', '3x10', '3x12 tanpa ayunan', false),
('core', 4, 'Hollow Hold', 'Tiduran, tangan dan kaki terangkat, punggung bawah menempel lantai.', '3x30s', '3x45s', true),
('core', 5, 'Hanging Leg Raise', 'Gelantung, angkat kaki lurus ke bar. Level tertinggi core.', '3x8', 'Mastery tercapai', false),

-- HINGE
('hinge', 1, 'Glute Bridge', 'Tiduran, tekuk lutut, angkat pinggul ke atas. Kencangkan glutes di atas.', '3x15', '3x15 dengan tahan 2 detik di atas', false),
('hinge', 2, 'Single Leg Glute Bridge', 'Satu kaki lurus, angkat pinggul dengan kaki satunya. Lebih menantang.', '3x10/kaki', 'Mastery tercapai', false);
