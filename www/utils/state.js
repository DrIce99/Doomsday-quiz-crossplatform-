let state = {
    mode: "normal", // normal | doomsday
    questions: [],
    currentIndex: 0,
    score: 0
  };
  
  export function setMode(mode) {
    state.mode = mode;
  }
  
  export function getMode() {
    return state.mode;
  }
  
  export function setQuestions(qs) {
    state.questions = qs;
  }
  
  export function getQuestions() {
    return state.questions;
  }
  
  export function nextQuestion() {
    state.currentIndex++;
  }
  
  export function getCurrentQuestion() {
    return state.questions[state.currentIndex];
  }
  
  export function resetGame() {
    state.currentIndex = 0;
    state.score = 0;
  }