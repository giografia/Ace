"use strict";

const points = ["0", "15", "30", "40"];

//loading each screen
const switchScreens = function (screenId) {
  document.querySelectorAll(".screen").forEach((screen) => {
    screen.classList.remove("active");
  });
  document.getElementById(screenId).classList.add("active");
};
document
  .getElementById("btnNewMatch")
  .addEventListener("click", () => switchScreens("setupScreen"));

document
  .getElementById("btnSetupBack")
  .addEventListener("click", () => switchScreens("homeScreen"));

let setsPerMatch = 2;
let gamesPerSet = 6;

const setsValueEl = document.getElementById("setsValue");
const gamesValueEl = document.getElementById("gamesValue");

document.getElementById("setsPlus").addEventListener("click", () => {
  setsPerMatch++;
  setsValueEl.textContent = setsPerMatch;
});
document.getElementById("setsMinus").addEventListener("click", () => {
  if (setsPerMatch > 1) setsPerMatch--;
  setsValueEl.textContent = setsPerMatch;
});
document.getElementById("gamesPlus").addEventListener("click", () => {
  gamesPerSet++;
  gamesValueEl.textContent = gamesPerSet;
});
document.getElementById("gamesMinus").addEventListener("click", () => {
  if (gamesPerSet > 1) gamesPerSet--;
  gamesValueEl.textContent = gamesPerSet;
});

let teamAName = "Team A";
let teamBName = "Team B";

document.getElementById("btnStartMatch").addEventListener("click", (e) => {
  e.preventDefault();
  const teamA = document.getElementById("teamA").value.trim();
  const teamB = document.getElementById("teamB").value.trim();

  const teamNameA = document.getElementById("nameA");
  const teamNameB = document.getElementById("nameB");

  if (teamA && teamB && setsPerMatch && gamesPerSet) {
    teamAName = teamA;
    teamBName = teamB;
    teamNameA.textContent = teamAName;
    teamNameB.textContent = teamBName;

    resetMatch();
    switchScreens("liveScreen");
  } else {
    alert("Please fill every form");
  }
});

//scoring + advantage system
let scoreAIdx = 0;
let scoreBIdx = 0;
let advantage = null; // "A" | "B" | null

let gamesA = 0;
let gamesB = 0;
let setsA = 0;
let setsB = 0;
let matchOver = false;

let history = [];
let pendingResetTimeout = null;

const pointAEl = document.getElementById("pointA");
const pointBEl = document.getElementById("pointB");
const pointA1 = document.querySelector(".pointA1");
const pointA2 = document.querySelector(".pointA2");
const pointB1 = document.querySelector(".pointB1");
const pointB2 = document.querySelector(".pointB2");

const zoneAEl = document.getElementById("zoneA");
const zoneBEl = document.getElementById("zoneB");
const liveStatusEl = document.getElementById("live-status");
const winMessageEl = document.getElementById("winMessage");

const updateDisplay = function () {
  const deuce = scoreAIdx === 3 && scoreBIdx === 3;

  pointAEl.textContent = points[scoreAIdx];
  pointBEl.textContent = points[scoreBIdx];

  pointA2.classList.toggle("visible", deuce);
  pointB2.classList.toggle("visible", deuce);

  pointA1.classList.toggle("filled", advantage === "A");
  pointB1.classList.toggle("filled", advantage === "B");
};

const updateStatus = function () {
  liveStatusEl.textContent = `Set ${setsA}-${setsB} · Game ${gamesA}-${gamesB}`;
};

const showWinMessage = function (text, zoneEl) {
  winMessageEl.textContent = text;
  winMessageEl.classList.add("visible");
  zoneEl.classList.add("zoneWinner");
};

const btnUndoEl = document.getElementById("btnUndo");

const updateUndoState = function () {
  btnUndoEl.disabled = history.length === 0;
};

const scorePoint = function (team) {
  if (matchOver) return;

  history.push({
    scoreAIdx,
    scoreBIdx,
    advantage,
    gamesA,
    gamesB,
    setsA,
    setsB,
    matchOver,
  });
  updateUndoState();

  const atDeuce = scoreAIdx === 3 && scoreBIdx === 3;

  if (atDeuce || advantage) {
    if (advantage === team) {
      return winGame(team, true);
    } else if (advantage) {
      advantage = null;
      updateDisplay();
    } else {
      advantage = team;
      updateDisplay();
    }
    return;
  }

  if (team === "A") {
    if (scoreAIdx === 3) {
      return winGame("A", false);
    }
    scoreAIdx++;
  } else {
    if (scoreBIdx === 3) {
      return winGame("B", false);
    }
    scoreBIdx++;
  }
  updateDisplay();
};

const winGame = function (team, wasAdPoint) {
  const name = team === "A" ? teamAName : teamBName;
  const zoneEl = team === "A" ? zoneAEl : zoneBEl;
  const box1 = team === "A" ? pointA1 : pointB1;

  box1.classList.add("filled");

  if (wasAdPoint) {
    const box2 = team === "A" ? pointA2 : pointB2;
    box2.classList.add("visible", "filled");
  }

  if (team === "A") gamesA++;
  else gamesB++;

  let message = `${name} wins the game!`;

  if ((team === "A" ? gamesA : gamesB) >= gamesPerSet) {
    if (team === "A") setsA++;
    else setsB++;
    gamesA = 0;
    gamesB = 0;
    message = `${name} wins the set!`;

    if ((team === "A" ? setsA : setsB) >= setsPerMatch) {
      message = `${name} wins the match!`;
      matchOver = true;
    }
  }

  updateStatus();
  showWinMessage(message, zoneEl);

  if (!matchOver) {
    pendingResetTimeout = setTimeout(() => {
      pendingResetTimeout = null;
      resetGame();
    }, 1500);
  }
};

const resetGame = function () {
  scoreAIdx = 0;
  scoreBIdx = 0;
  advantage = null;
  [pointA1, pointA2, pointB1, pointB2].forEach((el) => {
    el.classList.remove("filled", "visible");
  });
  zoneAEl.classList.remove("zoneWinner");
  zoneBEl.classList.remove("zoneWinner");
  winMessageEl.classList.remove("visible");
  updateDisplay();
};

const resetMatch = function () {
  if (pendingResetTimeout) {
    clearTimeout(pendingResetTimeout);
    pendingResetTimeout = null;
  }
  gamesA = 0;
  gamesB = 0;
  setsA = 0;
  setsB = 0;
  matchOver = false;
  history = [];
  resetGame();
  updateStatus();
  updateUndoState();
};

const undoPoint = function () {
  if (history.length === 0) return;

  if (pendingResetTimeout) {
    clearTimeout(pendingResetTimeout);
    pendingResetTimeout = null;
  }

  const prev = history.pop();
  scoreAIdx = prev.scoreAIdx;
  scoreBIdx = prev.scoreBIdx;
  advantage = prev.advantage;
  gamesA = prev.gamesA;
  gamesB = prev.gamesB;
  setsA = prev.setsA;
  setsB = prev.setsB;
  matchOver = prev.matchOver;

  pointA2.classList.remove("filled");
  pointB2.classList.remove("filled");
  zoneAEl.classList.remove("zoneWinner");
  zoneBEl.classList.remove("zoneWinner");
  winMessageEl.classList.remove("visible");

  updateDisplay();
  updateStatus();
  updateUndoState();
};

btnUndoEl.addEventListener("click", undoPoint);
updateUndoState();

document
  .getElementById("btnNew")
  .addEventListener("click", () => switchScreens("setupScreen"));

zoneAEl.addEventListener("click", () => scorePoint("A"));
zoneBEl.addEventListener("click", () => scorePoint("B"));
