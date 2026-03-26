import { navigate } from "../main.js";
import { addGameResult } from "../services/storageService.js";
import { startTimer, stopTimer } from "./utils/timer.js";

let state = {
    mode: "Giorno Preciso",
    difficulty: "facile",
    running: false,
    startTime: 0,
    timerInterval: null,
    currDate: null
};

const days = ["Dom","Lun","Mar","Mer","Gio","Ven","Sab"];

function isLeap(y) {
    return y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0);
}

function calculateDoomsday(y) {
    const anchor = [2,0,5,3][Math.floor(y / 100) % 4];
    let t = y % 100;

    if (t % 2 !== 0) t += 11;
    t = Math.floor(t / 2);
    if (t % 2 !== 0) t += 11;

    const diff = (7 - (t % 7)) % 7;
    return (diff + anchor) % 7;
}

export function renderQuiz(container) {
    const display = document.createElement("div");
  
    container.innerHTML = "";
    container.appendChild(display);
  
    startTimer((t) => {
      if (!display) return; // safety
      display.textContent = t;
    });
  }

function setupButtons() {
    const container = document.getElementById("buttons");

    container.innerHTML = days.map((d, i) =>
        `<button class="day" data-val="${i}">${d}</button>`
    ).join("");

    document.querySelectorAll(".day").forEach(btn => {
        btn.onclick = () => checkAnswer(parseInt(btn.dataset.val));
    });
}

function setupStart(container) {
    const startBtn = document.createElement("button");
    startBtn.textContent = "START";
    startBtn.className = "start";

    startBtn.onclick = () => {
        startBtn.remove();
        newQuestion();
    };

    container.appendChild(startBtn);
}

function newQuestion() {
    document.getElementById("result").textContent = "";
    document.getElementById("next").style.display = "none";

    const y = randYear();
    const m = rand(1,12);

    const maxD = getMaxDay(m, y);
    const d = rand(1, maxD);

    state.currDate = { d, m, y };

    document.getElementById("question").textContent =
        state.mode === "Giorno Preciso"
            ? `${pad(d)}/${pad(m)}/${y}`
            : `Anno: ${y}`;

    startTimer();
}

function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randYear() {
    if (state.difficulty === "facile") return rand(2000,2099);
    if (state.difficulty === "medio") return rand(1700,2099);
    return rand(1,2500);
}

function getMaxDay(m, y) {
    if ([1,3,5,7,8,10,12].includes(m)) return 31;
    if (m === 2) return isLeap(y) ? 29 : 28;
    return 30;
}

function pad(n) {
    return String(n).padStart(2,"0");
}

function checkAnswer(guess) {
    if (!state.running) return;

    state.running = false;
    clearInterval(state.timerInterval);

    const { d, m, y } = state.currDate;

    const dd = calculateDoomsday(y);

    const realDate = new Date(y, m - 1, d);
    const realDay = realDate.getDay();

    const answer = state.mode === "Solo Doomsday"
        ? dd
        : realDay;

    const correct = guess === answer;

    showResult(correct, answer, d, m, y);

    saveResult(correct);
}

function showResult(correct, ans, d, m, y) {
    const res = document.getElementById("result");

    res.textContent =
        `${pad(d)}/${pad(m)}/${y} è ${days[ans]} → ${correct ? "✅" : "❌"}`;

    document.getElementById("next").style.display = "block";
    document.getElementById("next").onclick = newQuestion;
}

function saveResult(correct) {
    const time = (performance.now() - state.startTime) / 1000;

    addGameResult({
        timestamp: new Date().toISOString(),
        mode: state.mode,
        difficulty: state.difficulty,
        time,
        correct,
        target_date: `${state.currDate.y}-${pad(state.currDate.m)}-${pad(state.currDate.d)}`
    });
}