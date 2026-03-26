export function filterData(data, mode, difficulty) {
    return data.filter(d =>
        d.mode === mode &&
        d.difficulty === difficulty
    );
}

export function computeStats(data) {
    const correct = data.filter(d => d.correct);

    const winrate = data.length
        ? (correct.length / data.length) * 100
        : 0;

    const best = correct.length
        ? Math.min(...correct.map(d => d.time))
        : null;

    const avg = correct.length
        ? correct.reduce((a, b) => a + b.time, 0) / correct.length
        : null;

    return { winrate, best, avg };
}

export function groupByDay(data) {
    const groups = {};

    data.forEach(d => {
        const date = d.timestamp.split("T")[0];

        if (!groups[date]) {
            groups[date] = [];
        }

        groups[date].push(d);
    });

    return groups;
}

export function buildChartData(groups) {
    const labels = [];
    const times = [];
    const winrates = [];

    let totalCorrect = 0;
    let total = 0;

    Object.keys(groups).forEach(date => {
        const entries = groups[date];

        const correct = entries.filter(e => e.correct);
        const avgTime = correct.length
            ? correct.reduce((a,b) => a + b.time, 0) / correct.length
            : null;

        totalCorrect += correct.length;
        total += entries.length;

        const wr = total ? (totalCorrect / total) * 100 : 0;

        labels.push(date);
        times.push(avgTime);
        winrates.push(wr);
    });

    return { labels, times, winrates };
}