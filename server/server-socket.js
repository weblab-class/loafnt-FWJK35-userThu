const Game = require("./game-logic");

let io;

const userToSocketMap = {}; // maps user ID to socket object
const socketToUserMap = {}; // maps socket ID to user object
const gameMap = {};

const getAllConnectedUsers = () => Object.values(socketToUserMap);
const getSocketFromUserID = (userid) => userToSocketMap[userid];
const getUserFromSocketID = (socketid) => socketToUserMap[socketid];
const getSocketFromSocketID = (socketid) => io.sockets.sockets.get(socketid);

const addUser = (user, socket) => {
  const oldSocket = userToSocketMap[user._id];
  if (oldSocket && oldSocket.id !== socket.id) {
    // there was an old tab open for this user, force it to disconnect
    // FIXME: is this the behavior you want?
    oldSocket.disconnect();
    delete socketToUserMap[oldSocket.id];
  }

  userToSocketMap[user._id] = socket;
  socketToUserMap[socket.id] = user;
};

const removeUser = (user, socket) => {
  if (user) delete userToSocketMap[user._id];
  delete socketToUserMap[socket.id];
};

// Emits Game object to client sockets listening for that specific game
const sendGameState = (gameId) => {
  io.emit(`update/${gameId}`, gameMap[gameId]);
};

// Called when server socket receives a request
const runGame = (gameId) => {
  console.log(
    gameMap[gameId]
      .getMazeFromChunk({ x: 0, y: 0 })
      .map((row) => {
        return row.join(" ");
      })
      .join("\n")
  );

  setInterval(() => {
    sendGameState(gameId);
  }, 1000 / 60);
};

module.exports = {
  init: (http) => {
    io = require("socket.io")(http);

    io.on("connection", (socket) => {
      console.log(`socket has connected ${socket.id}`);
      socket.on("disconnect", (reason) => {
        const user = getUserFromSocketID(socket.id);
        removeUser(user, socket);
      });
      // Server receives request from client to run game
      socket.on("rungame", (gameId) => {
        console.log(gameId + " server");
        if (gameMap[gameId] === undefined) gameMap[gameId] = new Game.Game(gameId);
        runGame(gameId);
      });
    });
  },

  addUser: addUser,
  removeUser: removeUser,

  getSocketFromUserID: getSocketFromUserID,
  getUserFromSocketID: getUserFromSocketID,
  getSocketFromSocketID: getSocketFromSocketID,
  getIo: () => io,
};
