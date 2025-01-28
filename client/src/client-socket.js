import socketIOClient from "socket.io-client";
import { post } from "./utilities";
const endpoint = window.location.hostname + ":" + window.location.port;
export const socket = socketIOClient(endpoint);
socket.on("connect", () => {
  post("/api/initsocket", { socketid: socket.id });
});

export const runGame = (gameID) => {
  socket.emit("rungame", gameID);
};

export const move = (gameID, user_id, dir) => {
  socket.emit("move", { gameID: gameID, user_id: user_id, dir: dir });
};

export const enterCombat = (gameID, user_id) => {
  socket.emit("entercombat", { gameID: gameID, user_id: user_id });
};

export const enterInvisibleMaze = (gameID, userID) => {
  socket.emit("enter-invisiblemaze", {gameID: gameID, userID: userID});
}

export const inventorySelect = (gameID, userID, slotIdx) => {
  socket.emit("inventoryselect", {gameID: gameID, userID: userID, slotIdx: slotIdx});
}