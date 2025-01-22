import {movePlayer} from "../game-logic.js"

export const handleInput = (e) => {
    if (e.key === "ArrowUp") {
      movePlayer("up");
    } else if (e.key === "ArrowDown") {
      movePlayer("down");
    } else if (e.key === "ArrowLeft") {
      movePlayer("left");
    } else if (e.key === "ArrowRight") {
      movePlayer("right");
    }
  };
  