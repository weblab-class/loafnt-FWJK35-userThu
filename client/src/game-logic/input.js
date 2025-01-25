import { enterCombat, move } from "../client-socket";

const pressedKeys = new Map();

const sendInput = (gameID, userID, deltaT) => {
  let xcomp = 0;
  let ycomp = 0;
  if (pressedKeys.get("ArrowUp") || pressedKeys.get("w")) {
    ycomp -= 1;
  }
  if (pressedKeys.get("ArrowDown") || pressedKeys.get("s")) {
    ycomp += 1;
  }
  if (pressedKeys.get("ArrowLeft") || pressedKeys.get("a")) {
    xcomp -= 1;
  }
  if (pressedKeys.get("ArrowRight") || pressedKeys.get("d")) {
    xcomp += 1;
  }
  if (Math.abs(xcomp) + Math.abs(ycomp) === 2) {
    xcomp *= Math.SQRT1_2;
    ycomp *= Math.SQRT1_2;
  }
  xcomp *= deltaT;
  ycomp *= deltaT;
  move(gameID, userID, { x: xcomp, y: ycomp });
  if (pressedKeys.get("c")) {
    enterCombat(gameID, userID);
  }
};

const setPressedKey = (e) => {
  if (e.type === "keydown" && !e.repeat) {
    pressedKeys.set(e.key, true);
  }
  if (e.type === "keyup") {
    pressedKeys.set(e.key, false);
  }
};

export { sendInput, setPressedKey };
