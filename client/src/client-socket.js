import socketIOClient from "socket.io-client";
import { post } from "./utilities";
const endpoint = window.location.hostname + ":" + window.location.port;
const socket = socketIOClient(endpoint);
socket.on("connect", () => {
  post("/api/initsocket", { socketid: socket.id });
});

const runGame = (gameID) => {
  socket.emit("rungame", gameID);
};

const move = (gameID, user_id, dir) => {
  socket.emit("move", { gameID: gameID, user_id: user_id, dir: dir });
};

const enterCombat = (gameID, user_id) => {
  socket.emit("entercombat", { gameID: gameID, user_id: user_id });
};

const enterInvisibleMaze = (gameID, userID) => {
  socket.emit("enter-invisiblemaze", { gameID: gameID, userID: userID });
};

const inventorySelect = (gameID, userID, slotIdx) => {
  socket.emit("inventoryselect", { gameID: gameID, userID: userID, slotIdx: slotIdx });
};

const attack = (gameID, user_id) => {
  socket.emit("attack", { gameID: gameID, user_id: user_id });
};

const utility = (gameID, user_id) => {
  socket.emit("utility", { gameID: gameID, user_id: user_id });
};

const component = (gameID, user_id, type, name) => {
  socket.emit("component", { gameID: gameID, user_id: user_id, type: type, name: name });
};

export {
  socket,
  runGame,
  move,
  enterCombat,
  enterInvisibleMaze,
  inventorySelect,
  attack,
  utility,
  component,
};
