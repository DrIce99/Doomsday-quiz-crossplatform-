import { renderHome } from "./screens/home.js";
import { renderQuiz } from "./screens/quiz.js";
import { renderStats } from "./screens/stats.js";
import { renderSettings } from "./screens/settings.js";

const app = document.getElementById("app");

export function navigate(page) {
    app.innerHTML = "";

    switch(page) {
        case "home":
            renderHome(app);
            break;
        case "quiz":
            renderQuiz(app);
            break;
        case "stats":
            renderStats(app);
            break;
        case "settings":
            renderSettings(app);
            break;
    }
}

// start
navigate("home");