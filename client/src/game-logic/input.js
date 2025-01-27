import { enterInvisibleMaze, enterCombat, move } from "../client-socket";

const pressedKeys = new Map();
const singlePresses = new Set(["c"]);

const sendInput = (gameID, userID, deltaT) => {
  let xcomp = 0;
  let ycomp = 0;
  if (pressedKeys.get("ArrowUp") || pressedKeys.get("w") || pressedKeys.get("W")) {
    ycomp -= 1;
  }
  if (pressedKeys.get("ArrowDown") || pressedKeys.get("s") || pressedKeys.get("S")) {
    ycomp += 1;
  }
  if (pressedKeys.get("ArrowLeft") || pressedKeys.get("a") || pressedKeys.get("A")) {
    xcomp -= 1;
  }
  if (pressedKeys.get("ArrowRight") || pressedKeys.get("d") || pressedKeys.get("D")) {
    xcomp += 1;
  }
  if (Math.abs(xcomp) + Math.abs(ycomp) === 2) {
    xcomp *= Math.SQRT1_2;
    ycomp *= Math.SQRT1_2;
  }
  xcomp *= deltaT;
  ycomp *= deltaT;

  if (pressedKeys.get("i")) {
    enterInvisibleMaze(gameID, userID);
  };

  if (pressedKeys.get("c")) {
    enterCombat(gameID, userID);
  }

  move(gameID, userID, { x: xcomp, y: ycomp });

  singlePresses.forEach((key) => {
    pressedKeys.set(key, false);
  });
  
  
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
