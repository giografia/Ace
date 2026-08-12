"use strict";

const points = ["0", "15", "30", "40"];

// Navigation
const screens = document.querySelectorAll(".screen");
const btnNewMatchEl = document.getElementById("btnNewMatch");
const btnSetupBackEl = document.getElementById("btnSetupBack");
const btnHistoryEl = document.getElementById("btnHistory");
const btnHistoryBackEl = document.getElementById("btnHistoryBack");
const btnEmptyNewMatchEl = document.getElementById("btnEmptyNewMatch");
const btnNewEl = document.getElementById("btnNew");

// Home screen
const statLineEl = document.getElementById("stat-line");

// Setup screen
const teamAInputEl = document.getElementById("teamA");
const teamBInputEl = document.getElementById("teamB");
const setsValueEl = document.getElementById("setsValue");
const gamesValueEl = document.getElementById("gamesValue");
const setsPlusEl = document.getElementById("setsPlus");
const setsMinusEl = document.getElementById("setsMinus");
const gamesPlusEl = document.getElementById("gamesPlus");
const gamesMinusEl = document.getElementById("gamesMinus");
const btnStartMatchEl = document.getElementById("btnStartMatch");

// Live scoreboard screen
const liveStatusEl = document.getElementById("live-status");
const winMessageEl = document.getElementById("winMessage");
const btnUndoEl = document.getElementById("btnUndo");

const playerEls = {
  A: {
    zone: document.getElementById("zoneA"),
    nameEl: document.getElementById("nameA"),
    pointEl: document.getElementById("pointA"),
    dot1: document.querySelector(".pointA1"),
    dot2: document.querySelector(".pointA2"),
  },
  B: {
    zone: document.getElementById("zoneB"),
    nameEl: document.getElementById("nameB"),
    pointEl: document.getElementById("pointB"),
    dot1: document.querySelector(".pointB1"),
    dot2: document.querySelector(".pointB2"),
  },
};

// History screen
const historyListEl = document.getElementById("history-list");
const historyEmptyEl = document.getElementById("historyEmpty");
const btnClearHistoryEl = document.getElementById("btnClearHistory");

/* STATE */
const matchConfig = {
  setsPerMatch: 2,
  gamesPerSet: 6,
  teamNames: { A: "Team A", B: "Team B" },
};

const matchState = {
  scoreIdx: { A: 0, B: 0 },
  advantage: null, // extra point needed after reaching 40
  games: { A: 0, B: 0 },
  sets: { A: 0, B: 0 },
  matchOver: false,
  setScores: [],
  history: [],
  pendingResetTimeout: null,
};

/* SWITCHING SCREENS */
const switchScreens = function (screenId) {
  screens.forEach((screen) => screen.classList.remove("active"));
  document.getElementById(screenId).classList.add("active");

  if (screenId === "homeScreen") {
    updateStatLine(getMatches().length);
  }
};

/* SETUP SCREEN */
const bindStepper = function (
  valueEl,
  plusEl,
  minusEl,
  getValue,
  setValue,
  min = 1,
) {
  const refresh = () => {
    valueEl.textContent = getValue();
  };
  plusEl.addEventListener("click", () => {
    setValue(getValue() + 1);
    refresh();
  });
  minusEl.addEventListener("click", () => {
    if (getValue() > min) setValue(getValue() - 1);
    refresh();
  });
};

const startMatch = function (e) {
  e.preventDefault();
  const teamA = teamAInputEl.value.trim();
  const teamB = teamBInputEl.value.trim();

  if (
    !teamA ||
    !teamB ||
    !matchConfig.setsPerMatch ||
    !matchConfig.gamesPerSet
  ) {
    alert("Please fill every form");
    return;
  }

  matchConfig.teamNames.A = teamA;
  matchConfig.teamNames.B = teamB;
  playerEls.A.nameEl.textContent = teamA;
  playerEls.B.nameEl.textContent = teamB;

  resetMatch();
  switchScreens("liveScreen");
};

/* SCORING LOGIC */
const updateDisplay = function () {
  const deuce = matchState.scoreIdx.A === 3 && matchState.scoreIdx.B === 3;

  ["A", "B"].forEach((team) => {
    playerEls[team].pointEl.textContent = points[matchState.scoreIdx[team]];
    playerEls[team].dot2.classList.toggle("visible", deuce);
    playerEls[team].dot1.classList.toggle(
      "filled",
      matchState.advantage === team,
    );
  });
};

const updateStatus = function () {
  liveStatusEl.textContent = `Set ${matchState.sets.A}-${matchState.sets.B} · Game ${matchState.games.A}-${matchState.games.B}`;
};

const showWinMessage = function (text, team) {
  winMessageEl.textContent = text;
  winMessageEl.classList.add("visible");
  playerEls[team].zone.classList.add("zoneWinner");
};

const updateUndoState = function () {
  btnUndoEl.disabled = matchState.history.length === 0;
};

const pushHistorySnapshot = function () {
  matchState.history.push({
    scoreIdx: { ...matchState.scoreIdx },
    advantage: matchState.advantage,
    games: { ...matchState.games },
    sets: { ...matchState.sets },
    matchOver: matchState.matchOver,
    setScores: matchState.setScores.slice(),
  });
  updateUndoState();
};

const scorePoint = function (team) {
  if (matchState.matchOver) return;

  pushHistorySnapshot();

  const atDeuce = matchState.scoreIdx.A === 3 && matchState.scoreIdx.B === 3;

  if (atDeuce || matchState.advantage) {
    if (matchState.advantage === team) {
      return winGame(team, true); // scored the advantage point -> wins game
    } else if (matchState.advantage) {
      matchState.advantage = null;
      updateDisplay();
    } else {
      matchState.advantage = team;
      updateDisplay();
    }
    return;
  }

  if (matchState.scoreIdx[team] === 3) {
    return winGame(team, false);
  }
  matchState.scoreIdx[team]++;
  updateDisplay();
};

const winGame = function (team, wasAdPoint) {
  const name = matchConfig.teamNames[team];

  playerEls[team].dot1.classList.add("filled");
  if (wasAdPoint) {
    playerEls[team].dot2.classList.add("visible", "filled");
  }

  matchState.games[team]++;

  let message = `${name} wins the game!`;

  if (matchState.games[team] >= matchConfig.gamesPerSet) {
    matchState.setScores.push(`${matchState.games.A}-${matchState.games.B}`);
    matchState.sets[team]++;
    matchState.games.A = 0;
    matchState.games.B = 0;
    message = `${name} wins the set!`;

    if (matchState.sets[team] >= matchConfig.setsPerMatch) {
      message = `${name} wins the match!`;
      matchState.matchOver = true;
      saveMatchToHistory();
    }
  }

  updateStatus();
  showWinMessage(message, team);

  if (!matchState.matchOver) {
    matchState.pendingResetTimeout = setTimeout(() => {
      matchState.pendingResetTimeout = null;
      resetGame();
    }, 1500);
  }
};

const resetGame = function () {
  matchState.scoreIdx.A = 0;
  matchState.scoreIdx.B = 0;
  matchState.advantage = null;

  [
    playerEls.A.dot1,
    playerEls.A.dot2,
    playerEls.B.dot1,
    playerEls.B.dot2,
  ].forEach((el) => el.classList.remove("filled", "visible"));
  playerEls.A.zone.classList.remove("zoneWinner");
  playerEls.B.zone.classList.remove("zoneWinner");
  winMessageEl.classList.remove("visible");

  updateDisplay();
};

const resetMatch = function () {
  if (matchState.pendingResetTimeout) {
    clearTimeout(matchState.pendingResetTimeout);
    matchState.pendingResetTimeout = null;
  }
  matchState.games.A = 0;
  matchState.games.B = 0;
  matchState.sets.A = 0;
  matchState.sets.B = 0;
  matchState.matchOver = false;
  matchState.history = [];
  matchState.setScores = [];

  resetGame();
  updateStatus();
  updateUndoState();
};

const undoPoint = function () {
  if (matchState.history.length === 0) return;

  if (matchState.pendingResetTimeout) {
    clearTimeout(matchState.pendingResetTimeout);
    matchState.pendingResetTimeout = null;
  }

  const prev = matchState.history.pop();
  matchState.scoreIdx = prev.scoreIdx;
  matchState.advantage = prev.advantage;
  matchState.games = prev.games;
  matchState.sets = prev.sets;
  matchState.matchOver = prev.matchOver;
  matchState.setScores = prev.setScores;

  //clear leftovers
  playerEls.A.dot2.classList.remove("filled");
  playerEls.B.dot2.classList.remove("filled");
  playerEls.A.zone.classList.remove("zoneWinner");
  playerEls.B.zone.classList.remove("zoneWinner");
  winMessageEl.classList.remove("visible");

  updateDisplay();
  updateStatus();
  updateUndoState();
};

/* HISTORY AND LOCAL STORAGE */
const getMatches = function () {
  try {
    return JSON.parse(localStorage.getItem("aceMatches")) || [];
  } catch {
    return [];
  }
};

const saveMatchToHistory = function () {
  const matches = getMatches();
  matches.unshift({
    teamA: matchConfig.teamNames.A,
    teamB: matchConfig.teamNames.B,
    setsA: matchState.sets.A,
    setsB: matchState.sets.B,
    sets: matchState.setScores.slice(),
    date: new Date().toISOString(),
  });
  localStorage.setItem("aceMatches", JSON.stringify(matches));
};

const formatMatchDate = function (isoString) {
  return new Date(isoString).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};

const updateStatLine = function (count) {
  if (!statLineEl) return;
  statLineEl.textContent =
    count === 0
      ? "No matches yet"
      : `${count} match${count === 1 ? "" : "es"} played`;
};

const buildHistoryCard = function (match) {
  const li = document.createElement("li");
  li.className = "historyCard";

  const info = document.createElement("div");

  const names = document.createElement("p");
  names.className = "historyNames";
  const aWon = match.setsA > match.setsB;

  const nameASpan = document.createElement("span");
  nameASpan.textContent = match.teamA;
  if (aWon) nameASpan.classList.add("winnerName");

  const nameBSpan = document.createElement("span");
  nameBSpan.textContent = match.teamB;
  if (!aWon) nameBSpan.classList.add("winnerName");

  names.append(nameASpan, " vs ", nameBSpan);

  const meta = document.createElement("p");
  meta.className = "historyMeta";
  meta.textContent = formatMatchDate(match.date);

  info.append(names, meta);

  if (match.sets && match.sets.length) {
    const chips = document.createElement("div");
    chips.className = "setChips";
    match.sets.forEach((setScore) => {
      const chip = document.createElement("span");
      chip.className = "setChip";
      chip.textContent = setScore;
      chips.appendChild(chip);
    });
    info.appendChild(chips);
  }

  const score = document.createElement("span");
  score.className = "historyScore";
  score.textContent = `${match.setsA}-${match.setsB}`;

  li.append(info, score);
  return li;
};

const renderHistory = function () {
  const matches = getMatches();

  historyListEl
    .querySelectorAll(".historyCard")
    .forEach((card) => card.remove());

  updateStatLine(matches.length);
  btnClearHistoryEl.disabled = matches.length === 0;

  if (matches.length === 0) {
    historyEmptyEl.style.display = "";
    return;
  }

  historyEmptyEl.style.display = "none";
  matches.forEach((match) => {
    historyListEl.appendChild(buildHistoryCard(match));
  });
};

const clearHistory = function () {
  const confirmed = confirm("Clear all match history? This can't be undone.");
  if (!confirmed) return;
  localStorage.removeItem("aceMatches");
  renderHistory();
};

/* EVENT LISTENERS AND INITIALIZATION */

btnNewMatchEl.addEventListener("click", () => switchScreens("setupScreen"));
btnSetupBackEl.addEventListener("click", () => switchScreens("homeScreen"));
btnNewEl.addEventListener("click", () => switchScreens("setupScreen"));

btnHistoryEl.addEventListener("click", () => {
  renderHistory();
  switchScreens("historyScreen");
});
btnHistoryBackEl.addEventListener("click", () => switchScreens("homeScreen"));
btnEmptyNewMatchEl.addEventListener("click", () =>
  switchScreens("setupScreen"),
);

bindStepper(
  setsValueEl,
  setsPlusEl,
  setsMinusEl,
  () => matchConfig.setsPerMatch,
  (v) => (matchConfig.setsPerMatch = v),
);
bindStepper(
  gamesValueEl,
  gamesPlusEl,
  gamesMinusEl,
  () => matchConfig.gamesPerSet,
  (v) => (matchConfig.gamesPerSet = v),
);

btnStartMatchEl.addEventListener("click", startMatch);

playerEls.A.zone.addEventListener("click", () => scorePoint("A"));
playerEls.B.zone.addEventListener("click", () => scorePoint("B"));
btnUndoEl.addEventListener("click", undoPoint);

btnClearHistoryEl.addEventListener("click", clearHistory);

updateUndoState();
updateStatLine(getMatches().length);
