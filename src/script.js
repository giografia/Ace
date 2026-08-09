"use strict";

const points = [15, 30, 40];

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
