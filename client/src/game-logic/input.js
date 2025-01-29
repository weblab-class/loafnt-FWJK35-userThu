import {
  enterCombat,
  move,
  attack,
  utility,
  component,
} from "../client-socket";

const pressedKeys = new Map();
const singlePresses = new Set(["c", "i", " ", "shift", "e"]);
let openComponentSelect;

const sendInput = (gameID, userID, deltaT) => {
  let xcomp = 0;
  let ycomp = 0;
  if (pressedKeys.get("arrowup") || pressedKeys.get("w")) {
    ycomp -= 1;
  }
  if (pressedKeys.get("arrowdown") || pressedKeys.get("s")) {
    ycomp += 1;
  }
  if (pressedKeys.get("arrowleft") || pressedKeys.get("a")) {
    xcomp -= 1;
  }
  if (pressedKeys.get("arrowright") || pressedKeys.get("d")) {
    xcomp += 1;
  }
  if (Math.abs(xcomp) + Math.abs(ycomp) === 2) {
    xcomp *= Math.SQRT1_2;
    ycomp *= Math.SQRT1_2;
  }

  // if (pressedKeys.get("c")) {
  //   enterCombat(gameID, userID);
  // }

  if (pressedKeys.get(" ")) {
    attack(gameID, userID);
  }

  if (pressedKeys.get("shift")) {
    utility(gameID, userID);
  }

  if (pressedKeys.get("e")) {
    if (openComponentSelect) {
      openComponentSelect();
    }
  }


  move(gameID, userID, { x: xcomp, y: ycomp });

  singlePresses.forEach((key) => {
    pressedKeys.set(key.toLowerCase(), false);
  });
};

const selectComponent = (gameID, userID, type, name) => {
  component(gameID, userID, type, name);
};

const setPressedKey = (e) => {
  if (e.type === "keydown" && !e.repeat) {
    pressedKeys.set(e.key.toLowerCase(), true);
  }
  if (e.type === "keyup") {
    pressedKeys.set(e.key.toLowerCase(), false);
  }
};

const setOpenComponentSelect = (openFunc) => {
  openComponentSelect = openFunc;
};

export { sendInput, setPressedKey, selectComponent, pressedKeys, setOpenComponentSelect };
export default selectComponent;
