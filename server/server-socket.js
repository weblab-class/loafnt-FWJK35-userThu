const Game = require("./game-logic");
const LobbyManager = require("./lobby-manager");

let io;

const userToSocketMap = {}; // maps user ID to socket object
const socketToUserMap = {}; // maps socket ID to user object

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
  Object.values(Game.gameMap[gameId].players).forEach((player) => {
    if (player.active) {
      let gamePacket = { game: Game.gameMap[gameId], recipientid: player.user._id };
      const socket = getSocketFromUserID(player.user._id);
      if (socket) {
        socket.emit("update", { json: JSON.stringify(gamePacket) });
      }
    }
  });
};

// Called when server socket receives a request
const runGame = (gameId) => {
  Game.gameMap[gameId].killer = () => {
    delete Game.gameMap[gameId];
  };
  Object.values(Game.gameMap[gameId].players).forEach((player) => {
    Object.values(Game.gameMap).forEach((game) => {
      if (game.seed !== gameId) {
        game.removePlayer(player.user._id);
      }
    });
    const socket = getSocketFromUserID(player.user._id);
    if (socket) {
      getSocketFromUserID(player.user._id).emit("launchgame");
    }
  });

  Game.gameMap[gameId].interval = setInterval(() => {
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
        if (Game.gameMap[gameId] === undefined) {
          LobbyManager.findLobbyByCode(gameId).started = true;
          Game.gameMap[gameId] = new Game.Game(gameId, LobbyManager.findLobbyByCode(gameId));
          runGame(gameId);
        }
      });

      socket.on("move", (input) => {
        if (Game.gameMap[input.gameID]) {
          Game.gameMap[input.gameID].movePlayer(input.user_id, input.dir);
        }
      });

      socket.on("entercombat", (input) => {
        if (Game.gameMap[input.gameID]) {
          if (!Game.gameMap[input.gameID].isInCombat(input.user_id)) {
            Game.gameMap[input.gameID].beginCombat(input.user_id);
          } else {
            Game.gameMap[input.gameID].leaveCombat(input.user_id);
          }
        }
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
