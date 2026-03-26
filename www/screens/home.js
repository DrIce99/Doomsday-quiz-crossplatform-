import { navigate } from "../main.js";

export function renderHome(container) {
    container.innerHTML = `
        <div class="home">
            <h1>🧠 Doomsday Trainer</h1>

            <div class="buttons">
                <button id="quiz">INIZIA ALLENAMENTO</button>
                <button id="stats" class="green">VISUALIZZA STATISTICHE</button>
            </div>

            <button id="settings" class="settings">⚙️ IMPOSTAZIONI</button>
        </div>
    `;

    document.getElementById("quiz").onclick = () => navigate("quiz");
    document.getElementById("stats").onclick = () => navigate("stats");
    document.getElementById("settings").onclick = () => navigate("settings");
}