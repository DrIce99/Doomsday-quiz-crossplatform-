import { navigate } from "../main.js";
import { loadStats } from "../services/storageService.js";
import {
    filterData,
    computeStats,
    groupByDay,
    buildChartData
} from "../services/statsService.js";
const Chart = window.Chart;

export function renderStats(container) {
    container.innerHTML = `
        <div class="stats">
            <button id="back">⬅ Torna</button>

            <h2>Statistiche</h2>

            <div id="summary"></div>

            <canvas id="chart"></canvas>
        </div>
    `;

    document.getElementById("back").onclick = () => navigate("home");

    const allData = loadStats();

    if (allData.length === 0) {
        document.getElementById("summary").textContent = "Nessun dato";
        return;
    }

    const filtered = filterData(allData, "Giorno Preciso", "facile");

    const stats = computeStats(filtered);

    document.getElementById("summary").innerHTML = `
        <p>Winrate: ${stats.winrate.toFixed(1)}%</p>
        <p>Best: ${stats.best?.toFixed(2) ?? "--"}s</p>
        <p>Media: ${stats.avg?.toFixed(2) ?? "--"}s</p>
    `;

    const groups = groupByDay(filtered);
    const { labels, times, winrates } = buildChartData(groups);

    const ctx = document.getElementById("chart");

    new Chart(ctx, {
        type: "line",
        data: {
            labels,
            datasets: [
                {
                    label: "Tempo",
                    data: times,
                    borderWidth: 2
                },
                {
                    label: "Winrate %",
                    data: winrates,
                    borderDash: [5,5]
                }
            ]
        }
    });
}