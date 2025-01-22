import {move} from "../client/src/client-socket"

export const handleInput = (e, gameID, userID) => {
  console.log("handleInput");
  if (e.key === "ArrowUp" || e.key === "w") {
    move(gameID, userID, "up");
  } else if (e.key === "ArrowDown" || e.key === "s") {
    move(gameID, userID, "down");
  } else if (e.key === "ArrowLeft" || e.key === "a") {
    move(gameID, userID, "left");
  } else if (e.key === "ArrowRight" || e.key === "d") {
    move(gameID, userID, "right");
  }
};
  