const KEY = "doomsday_stats_v2";

export function loadStats() {
    const data = localStorage.getItem(KEY);
    return data ? JSON.parse(data) : [];
}

export function saveStats(stats) {
    localStorage.setItem(KEY, JSON.stringify(stats));
}

export function addGameResult(result) {
    const stats = loadStats();
    stats.push(result);
    saveStats(stats);
}

export function clearStats() {
    localStorage.removeItem(KEY);
}