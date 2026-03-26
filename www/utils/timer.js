let interval = null;
let time = 0;

export function startTimer(onTick) {
  stopTimer(); // evita doppioni

  interval = setInterval(() => {
    time++;
    if (onTick) onTick(time);
  }, 1000);
}

export function stopTimer() {
  if (interval) {
    clearInterval(interval);
    interval = null;
  }
}

export function resetTimer() {
  stopTimer();
  time = 0;
}

export function getTime() {
  return time;
}