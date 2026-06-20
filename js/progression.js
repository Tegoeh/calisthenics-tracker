import { state } from './app.js';

// ========================================
// Progression Module
// ========================================

export function getProgressionTree() {
    const tree = {};
    state.progressionLevels.forEach(ex => {
        if (!tree[ex.category]) tree[ex.category] = [];
        tree[ex.category].push(ex);
    });
    return tree;
}

export function getCurrentExercise(category) {
    const level = state.userProgression[category] || 1;
    return state.progressionLevels.find(
        ex => ex.category === category && ex.level === level
    );
}

export function getExerciseForLevel(category, level) {
    return state.progressionLevels.find(
        ex => ex.category === category && ex.level === level
    );
}

export function canLevelUp(category) {
    const currentLevel = state.userProgression[category] || 1;
    const maxLevel = state.progressionLevels
        .filter(ex => ex.category === category)
        .length;
    return currentLevel < maxLevel;
}

export function getNextExercise(category) {
    const currentLevel = state.userProgression[category] || 1;
    return getExerciseForLevel(category, currentLevel + 1);
}

export function getExercisesForCategory(category) {
    return state.progressionLevels
        .filter(ex => ex.category === category)
        .sort((a, b) => a.level - b.level);
}
