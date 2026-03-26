const stats = {
    filterMode: 'Giorno Preciso',
    filterDiff: 'facile',
    anchorDate: new Date(),
    currentTab: 'temp',
    chart: null,

    init() {
        document.getElementById('home-screen').classList.add('hidden');
        document.getElementById('quiz-screen').classList.add('hidden');
        document.getElementById('stats-screen').classList.remove('hidden');

        this.filterMode = 'Giorno Preciso';
        this.filterDiff = 'facile';

        this.refresh();
    },

    updateFilter(type, val, el) {
        if (type === 'mode') this.filterMode = val;
        if (type === 'diff') this.filterDiff = val;

        // Update UI attiva
        el.parentElement.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        el.classList.add('active');

        this.refresh();
    },

    getData() {
        const rawData = JSON.parse(localStorage.getItem("doomsday_stats_v2") || "[]");
        return rawData.filter(d => d.mode === this.filterMode && d.difficulty === this.filterDiff);
    },

    refresh() {
        const filtered = this.getData();
        this.updateSummary(filtered);
        this.renderChart(filtered);
    },

    updateSummary(data) {
        const total = data.length;
        const correct = data.filter(d => d.correct).length;
        const avgTime = total > 0 ? (data.reduce((acc, d) => acc + d.time, 0) / total).toFixed(2) : 0;

        document.getElementById('stats-summary').innerHTML = `
            <b>STATISTICHE</b><br>
            -------------------<br>
            Totale: ${total}<br>
            Corrette: ${correct}<br>
            Precisione: ${total > 0 ? ((correct / total) * 100).toFixed(1) : 0}%<br>
            Tempo Medio: ${avgTime}s
        `;
    },

    renderChart(data) {
        const ctx = document.getElementById('mainChart').getContext('2d');
        if (this.chart) this.chart.destroy();

        // Prepariamo i dati per il grafico temporale (ultimi 20 tentativi)
        const recent = data.slice(-20);
        const labels = recent.map((_, i) => i + 1);
        const times = recent.map(d => d.time);
        const colors = recent.map(d => d.correct ? '#2ecc71' : '#e74c3c');

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Tempo di risposta (s)',
                    data: times,
                    borderColor: '#3b8ed0',
                    pointBackgroundColor: colors,
                    tension: 0.1,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, grid: { color: '#444' } },
                    x: { grid: { color: '#444' } }
                },
                plugins: {
                    legend: { labels: { color: '#fff' } }
                }
            }
        });
    },

    switchTab(tabType, element) {
        // 1. Cambia stile bottoni
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        element.classList.add('active');

        // 2. Carica i dati
        const allData = JSON.parse(localStorage.getItem("doomsday_stats_v2") || "[]");

        // 3. Renderizza il grafico richiesto
        if (tabType === 'temp') {
            const filtered = allData.filter(d => d.mode === this.filterMode && d.difficulty === this.filterDiff);
            this.renderTimeChart(filtered);
        } else if (tabType === 'dist') {
            const filtered = allData.filter(d => d.mode === "Giorno Preciso" && d.difficulty === this.filterDiff);
            this.renderMentalDistance(filtered);
        } else if (tabType === 'perf') {
            this.renderDoomsdayPerformance(allData);
        }
    },

    refresh() {
        const allData = JSON.parse(localStorage.getItem("doomsday_stats_v2") || "[]");

        // 1. Filtro Modalità e Difficoltà
        let data = allData.filter(d => d.mode === this.filterMode && d.difficulty === this.filterDiff);

        // 2. Filtro Temporale (Logica View Opt)
        const view = document.getElementById('view-opt').value;
        data = this.filterByTime(data, view);

        if (data.length === 0) {
            document.getElementById('stats-summary').innerHTML = "Nessun dato per questo periodo.";
            if (this.chart) this.chart.destroy();
            return;
        }

        // 3. Calcolo Metriche (Sidebar)
        this.updateSidebar(data);

        // 4. Rendering Grafico (Andamento Temporale)
        this.renderTimeChart(data);
    },

    filterByTime(data, view) {
        const anchor = new Date(this.anchorDate);
        anchor.setHours(0, 0, 0, 0);

        return data.filter(d => {
            const dt = new Date(d.timestamp);
            dt.setHours(0, 0, 0, 0);

            if (view === "Sempre") return true;
            if (view === "Giorno") return dt.getTime() === anchor.getTime();
            if (view === "Settimana") {
                const sevenDaysAgo = new Date(anchor);
                sevenDaysAgo.setDate(anchor.getDate() - 6);
                return dt >= sevenDaysAgo && dt <= anchor;
            }
            if (view === "Mese") {
                return dt.getMonth() === anchor.getMonth() && dt.getFullYear() === anchor.getFullYear();
            }
            return false;
        });
    },

    updateSidebar(data) {
        const correctOnes = data.filter(d => d.correct);
        const winrate = ((correctOnes.length / data.length) * 100).toFixed(0);

        const times = correctOnes.map(d => parseFloat(d.time));
        const best = times.length > 0 ? Math.min(...times).toFixed(1) : "--";
        const avg = times.length > 0 ? (times.reduce((a, b) => a + b, 0) / times.length).toFixed(1) : "--";

        let html = `
            <div style="color: var(--accent-blue); font-weight: bold; margin-bottom: 10px;">
                VISTA: ${document.getElementById('view-opt').value}
            </div>
            <div class="stats-grid">
                <span>RECORD:</span> <b>${best}s</b><br>
                <span>MEDIA:</span>  <b>${avg}s</b><br>
                <span>WINRATE:</span> <b>${winrate}%</b>
            </div>
            <hr style="border: 0; border-top: 1px solid #444; margin: 15px 0;">
        `;

        // Trend Recente (Semplificato rispetto a Python per brevità)
        const today = new Date().toLocaleDateString();
        const todayData = data.filter(d => new Date(d.timestamp).toLocaleDateString() === today && d.correct);
        const todayAvg = todayData.length > 0 ? (todayData.reduce((a, b) => a + b.time, 0) / todayData.length).toFixed(1) : "--";

        html += `
            <div style="font-size: 0.85em; color: var(--text-secondary);">
                PERFORMANCE OGGI: ${todayAvg}s<br>
                SESSIONI: ${data.length}
            </div>
        `;

        document.getElementById('stats-summary').innerHTML = html;
    },

    renderTimeChart(data) {
        const ctx = document.getElementById('mainChart').getContext('2d');
        if (this.chart) this.chart.destroy();

        // 1. Preparazione Dati
        const windowSize = 5;
        let totalCorrect = 0;
        let totalAttempts = 0;

        const labels = data.map(d => new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

        // Calcolo Winrate Cumulativo (Asse Destro)
        const winrateData = data.map(d => {
            totalAttempts++;
            if (d.correct) totalCorrect++;
            return (totalCorrect / totalAttempts) * 100;
        });

        // Calcolo Media Mobile (SMA 5)
        const correctTimes = data.filter(d => d.correct).map(d => d.time);
        const smaData = data.map((d, i) => {
            const currentCorrects = data.slice(0, i + 1).filter(x => x.correct);
            if (currentCorrects.length < windowSize) return null;
            const window = currentCorrects.slice(-windowSize);
            return window.reduce((a, b) => a + b.time, 0) / windowSize;
        });

        this.chart = new Chart(ctx, {
            data: {
                labels: labels,
                datasets: [
                    {
                        type: 'line',
                        label: 'Tempo (s)',
                        data: data.map(d => d.correct ? d.time : null),
                        borderColor: '#3b8ed0',
                        pointBackgroundColor: data.map(d => d.correct ? '#2ecc71' : '#e74c3c'),
                        spanGaps: true,
                        yAxisID: 'y'
                    },
                    {
                        type: 'line',
                        label: 'Trend (SMA 5)',
                        data: smaData,
                        borderColor: '#3498db',
                        borderDash: [5, 5],
                        pointRadius: 0,
                        fill: false,
                        yAxisID: 'y'
                    },
                    {
                        type: 'line',
                        label: 'Winrate %',
                        data: winrateData,
                        borderColor: 'rgba(46, 204, 113, 0.4)',
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        pointRadius: 0,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    tooltip: {
                        backgroundColor: '#2b2b2b',
                        titleColor: '#3b8ed0',
                        callbacks: {
                            label: (context) => {
                                let label = context.dataset.label || '';
                                if (label) label += ': ';
                                if (context.parsed.y !== null) label += context.parsed.y.toFixed(2);
                                return label;
                            }
                        }
                    },
                    legend: { labels: { color: '#fff', boxWidth: 12, font: { size: 10 } } }
                },
                scales: {
                    y: {
                        type: 'linear', display: true, position: 'left',
                        grid: { color: '#333' }, ticks: { color: '#888' }
                    },
                    y1: {
                        type: 'linear', display: true, position: 'right',
                        min: 0, max: 110,
                        grid: { drawOnChartArea: false }, ticks: { color: '#2ecc71' }
                    },
                    x: { ticks: { color: '#888', font: { size: 9 } } }
                }
            }
        });
    },

    renderMentalDistance(data) {
        const canvas = document.getElementById('mainChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (this.chart) this.chart.destroy();

        // 1. Raggruppamento dati per distanza (come in Python)
        const statsPerDist = {};

        data.forEach(d => {
            // Filtriamo: solo Giorno Preciso e dati con target_date valida
            if (d.mode !== "Giorno Preciso" || !d.target_date) return;

            try {
                const tDt = new Date(d.target_date);
                const y = tDt.getFullYear();
                const m = tDt.getMonth() + 1; // Gennaio è 0 in JS
                const dDay = tDt.getDate();

                // Calcolo ancora (stessa logica del quiz)
                const anchors = [0, isLeap(y) ? 4 : 3, isLeap(y) ? 29 : 28, 14, 4, 9, 6, 11, 8, 5, 10, 7, 12];
                const anchor = anchors[m];
                const dist = Math.abs(dDay - anchor);

                if (!statsPerDist[dist]) {
                    statsPerDist[dist] = { times: [], corrects: 0, total: 0 };
                }

                statsPerDist[dist].total++;
                if (d.correct) {
                    statsPerDist[dist].corrects++;
                    statsPerDist[dist].times.push(parseFloat(d.time));
                }
            } catch (e) { console.error("Errore parsing data:", e); }
        });

        // 2. Preparazione dati per Chart.js
        const sortedDistances = Object.keys(statsPerDist).sort((a, b) => a - b);
        const avgTimes = sortedDistances.map(dist => {
            const s = statsPerDist[dist];
            return s.times.length > 0 ? (s.times.reduce((a, b) => a + b, 0) / s.times.length) : 0;
        });
        const winrates = sortedDistances.map(dist => {
            const s = statsPerDist[dist];
            return (s.corrects / s.total) * 100;
        });

        // 3. Creazione Grafico Doppio Asse
        this.chart = new Chart(ctx, {
            data: {
                labels: sortedDistances.map(d => d + " gg"),
                datasets: [
                    {
                        type: 'bar',
                        label: 'Tempo Medio (s)',
                        data: avgTimes,
                        backgroundColor: 'rgba(52, 152, 219, 0.3)',
                        borderColor: '#3498db',
                        borderWidth: 1,
                        yAxisID: 'y'
                    },
                    {
                        type: 'line',
                        label: 'Winrate %',
                        data: winrates,
                        borderColor: '#e74c3c',
                        borderDash: [5, 5],
                        pointBackgroundColor: '#e74c3c',
                        yAxisID: 'y1',
                        tension: 0.2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: { display: true, text: 'ANALISI DIFFICOLTÀ MENTALE', color: '#fff', font: { size: 16 } },
                    tooltip: {
                        callbacks: {
                            footer: (items) => {
                                const dist = sortedDistances[items[0].dataIndex];
                                return `Campioni: ${statsPerDist[dist].total}`;
                            }
                        }
                    },
                    legend: { labels: { color: '#fff' } }
                },
                scales: {
                    y: {
                        type: 'linear', display: true, position: 'left',
                        title: { display: true, text: 'Secondi', color: '#3498db' },
                        grid: { color: '#333' }, ticks: { color: '#3498db' }
                    },
                    y1: {
                        type: 'linear', display: true, position: 'right',
                        min: 0, max: 105,
                        title: { display: true, text: 'Winrate %', color: '#e74c3c' },
                        grid: { drawOnChartArea: false }, ticks: { color: '#e74c3c' }
                    },
                    x: { ticks: { color: '#fff' }, grid: { display: false } }
                }
            }
        });
    },

    renderDoomsdayPerformance(allData) {
        const ctx = document.getElementById('mainChart').getContext('2d');
        if (this.chart) this.chart.destroy();

        const perfPerDay = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };

        allData.forEach(d => {
            // Verifica che il record sia valido e corretto
            if (d.mode === "Solo Doomsday" && d.correct && d.target_date) {
                const anno = parseInt(d.target_date);
                // Assicurati che game.calculateDoomsdayLogic esista e funzioni
                const result = game.calculateDoomsdayLogic(anno);
                const ddVal = result.val;

                // Ora .push non fallirà più perché ddVal sarà sempre tra 0 e 6
                if (perfPerDay[ddVal] !== undefined) {
                    perfPerDay[ddVal].push(parseFloat(d.time));
                }
            }
        });

        const labels = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];
        const avgTimes = labels.map((_, i) => {
            const times = perfPerDay[i];
            return times.length > 0 ? (times.reduce((a, b) => a + b, 0) / times.length) : 0;
        });

        this.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Velocità (s)',
                    data: avgTimes,
                    backgroundColor: 'rgba(155, 89, 182, 0.7)',
                    borderRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: { display: true, text: 'VELOCITÀ MEDIA PER GIORNO DOOMSDAY', color: '#fff' },
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true, ticks: { color: '#fff' } },
                    x: { ticks: { color: '#fff' } }
                }
            }
        });
    }
};

// Funzione helper per il calcolo doomsday (uguale a Python)
function calculateDoomsdayOdd11(y) {
    const anchor = [2, 0, 5, 3][Math.floor(y / 100) % 4];
    let t = y % 100;
    let v = t;
    let steps = [`Anno XX${String(t).padStart(2, '0')}`];

    if (v % 2 !== 0) { v += 11; steps.push(`Dispari +11 = ${v}`); }
    v = Math.floor(v / 2); steps.push(`Diviso 2 = ${v}`);
    if (v % 2 !== 0) { v += 11; steps.push(`Dispari +11 = ${v}`); }

    let rem = v % 7;
    let diff = (7 - rem) % 7;
    let final = (diff + anchor) % 7;
    return { final, steps };
}
