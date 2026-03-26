const DAYS = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];
const isLeap = (y) => (y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0));

const game = {
    running: false,
    gameStarted: false,
    mode: 'Giorno Preciso',
    difficulty: 'facile',
    startTime: 0,
    currentDate: null,

    setMode(val) {
        this.mode = val;
        document.querySelectorAll('[id^="mode-"]').forEach(b => b.classList.remove('active'));
        // Usa document.getElementById invece di event.target per sicurezza su mobile
        const id = val === 'Giorno Preciso' ? 'mode-gp' : 'mode-sd';
        document.getElementById(id).classList.add('active');
        document.getElementById('prep-question').innerText = val === 'Solo Doomsday' ? "PRONTO?\n(Solo Anno)" : "PRONTO?\n(Giorno Preciso)";
    },

    setDiff(val) {
        this.difficulty = val;
        document.querySelectorAll('[id^="diff-"]').forEach(b => b.classList.remove('active'));
        event.target.classList.add('active');
    },

    start() {
        this.gameStarted = true;
        document.getElementById('home-screen').classList.add('hidden');
        document.getElementById('quiz-screen').classList.remove('hidden');
        document.getElementById('stats-screen').classList.add('hidden');
        this.nextQuestion();
    },

    nextQuestion() {
        this.running = true;

        // Logica Difficoltà
        let y;
        if (this.difficulty === 'facile') y = Math.floor(Math.random() * (2099 - 2000 + 1)) + 2000;
        else if (this.difficulty === 'medio') y = Math.floor(Math.random() * (2199 - 1700 + 1)) + 1700;
        else y = Math.floor(Math.random() * (2500 - 1 + 1)) + 1;

        const m = Math.floor(Math.random() * 12) + 1;
        const daysInMonth = new Date(y, m, 0).getDate();
        const d = Math.floor(Math.random() * daysInMonth) + 1;

        this.currentDate = { d, m, y };

        // Logica Modalità Visualizzazione
        document.getElementById('question').innerText = (this.mode === 'Giorno Preciso') ?
            `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}` : `Anno: ${y}`;

        document.getElementById('steps-doomsday').innerText = "";
        document.getElementById('steps-day').innerText = "";
        document.getElementById('result').innerText = "";
        document.getElementById('btn-next').classList.add('hidden');

        this.startTime = performance.now();
        this.updateClock();
    },

    updateClock() {
        if (!this.running) return;
        const elapsed = (performance.now() - this.startTime) / 1000;
        document.getElementById('timer').innerText = elapsed.toFixed(1) + "s";
        requestAnimationFrame(() => this.updateClock());
    },

    calculateDoomsdayLogic(y) {
        const century = Math.floor(y / 100);
        const anchorCentury = [2, 0, 5, 3][century % 4]; // Formula ciclica corretta per secoli

        let t = y % 100;
        let steps = [`Secolo: ${century}00 -> Ancora: ${DAYS[anchorCentury]}`];

        if (t % 2 !== 0) { t += 11; steps.push(`Dispari: +11 = ${t}`); }
        t = t / 2; steps.push(`Diviso 2: ${t}`);
        if (t % 2 !== 0) { t += 11; steps.push(`Dispari: +11 = ${t}`); }

        let diff = (7 - (t % 7)) % 7;
        steps.push(`Mod 7 e diff: ${diff}`);
        const finalDD = (anchorCentury + diff) % 7;
        steps.push(`Doomsday Anno: ${DAYS[finalDD]}`);

        return { val: finalDD, steps };
    },

    check(guess) {
        if (!this.running) return;
        this.running = false;

        const { d, m, y } = this.currentDate;
        const { val: ddVal, steps: ddSteps } = this.calculateDoomsdayLogic(y);
        const realDay = new Date(y, m - 1, d).getDay();

        // Risposta attesa cambia in base alla modalità
        const ans = (this.mode === 'Solo Doomsday') ? ddVal : realDay;

        const anchors = [0, isLeap(y) ? 4 : 3, isLeap(y) ? 29 : 28, 14, 4, 9, 6, 11, 8, 5, 10, 7, 12];
        const mAnchor = anchors[m];
        const dist = d - mAnchor;
        const distMod = ((dist % 7) + 7) % 7;

        document.getElementById('steps-doomsday').innerText = ddSteps.join('\n');

        if (this.mode === 'Giorno Preciso') {
            document.getElementById('steps-day').innerText =
                `Mese: ${m}\nAncora: il ${mAnchor} è ${DAYS[ddVal]}\n` +
                `Distanza: ${dist} gg (${distMod} mod 7)\n` +
                `Risultato: ${DAYS[realDay]}`;
        }

        const elapsed = (performance.now() - this.startTime) / 1000;
        const isCorrect = (guess === ans);
        const resEl = document.getElementById('result');

        const targetDateObj = new Date(this.currentDate.y, this.currentDate.m - 1, this.currentDate.d);
        this.saveData(this.mode, this.difficulty, elapsed.toFixed(2), isCorrect, targetDateObj);
        resEl.innerText = isCorrect ? "CORRETTO ✅" : `ERRORE ❌ (Era ${DAYS[ans]})`;
        resEl.style.color = isCorrect ? "var(--accent-green)" : "var(--accent-red)";

        document.getElementById('btn-next').classList.remove('hidden');
    },

    saveData(m, d, t, c, td) {
        // 1. Recupera i dati esistenti dal localStorage (se vuoto, crea array [])
        let stats = JSON.parse(localStorage.getItem("doomsday_stats_v2") || "[]");

        // 2. Formatta il timestamp corrente (YYYY-MM-DD HH:MM:SS)
        const ora = new Date();
        const timestampStr = ora.toISOString().replace('T', ' ').split('.')[0];

        // 3. Formatta la target_date come facevi in Python
        // Se Giorno Preciso: "YYYY-MM-DD", se Solo Doomsday: "YYYY"
        let targetVal;
        if (m === "Solo Doomsday") {
            targetVal = td.getFullYear().toString();
        } else {
            // Formato ISO: YYYY-MM-DD
            const month = String(td.getMonth() + 1).padStart(2, '0');
            const day = String(td.getDate()).padStart(2, '0');
            targetVal = `${td.getFullYear()}-${month}-${day}`;
        }

        // 4. Crea l'oggetto record (stesse chiavi del dizionario Python)
        const newRecord = {
            "timestamp": timestampStr,
            "mode": m,
            "difficulty": d,
            "time": parseFloat(t), // Assicuriamoci che sia un numero (es: 4.2)
            "correct": c,          // boolean (true/false)
            "target_date": targetVal
        };

        // 5. Aggiungi il nuovo record all'array e salva tutto
        stats.push(newRecord);
        localStorage.setItem("doomsday_stats_v2", JSON.stringify(stats));

        console.log("✅ Partita salvata nel localStorage:", newRecord);
    }


};

document.addEventListener('DOMContentLoaded', () => {
    // Impedisce lo zoom al doppio tocco sui pulsanti
    const buttons = document.querySelectorAll('button');
    buttons.forEach(btn => {
        btn.addEventListener('touchstart', (e) => {
            // Opzionale: aggiunge un feedback visivo immediato
        }, { passive: true });
    });
});