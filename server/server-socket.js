const Game = require("./game-logic");
const LobbyManager = require("./lobby-manager");
const common = require("./common");

let io;

const userToSocketMap = {}; // maps user ID to socket object
const socketToUserMap = {}; // maps socket ID to user object

const activePlayers = {};

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
  Object.values(common.gameMap[gameId].players).forEach((player) => {
    if (player.active) {
      //delete server-stored information
      let gameObj = Object.assign({}, common.gameMap[gameId]);
      delete gameObj.explored;
      let gamePacket = { game: gameObj, recipientid: player.user._id };
      const socket = getSocketFromUserID(player.user._id);
      if (socket) {
        socket.emit("update", { json: JSON.stringify(gamePacket) });
      }
    }
  });
};

const startGame = (gameId) => {
  // Update the lobby associated with the game
  const lobby = LobbyManager.findLobbyByCode(gameId);

  // emit "launchgame" event, players in lobby redirected to /game page
  if (lobby) {
    lobby.players.forEach((player) => {
      const socket = getSocketFromUserID(player._id);
      if (socket) {
        getSocketFromUserID(player._id).emit("launchgame");
      }
    });

    // Fetch the game at the host's specified game slot
    let loadedGame;
    LobbyManager.loadGame(lobby.leader).then((result) => {
      loadedGame = result.game;
      // // If it is an empty save file, create a new game
      if (!loadedGame) {
        common.gameMap[gameId] = new Game.Game(gameId, LobbyManager.findLobbyByCode(gameId));
      } else {
        common.gameMap[gameId] = new Game.Game(
          null,
          LobbyManager.findLobbyByCode(gameId),
          loadedGame
        );
      }
      // Add a killer function for when the game calls killSelf()
      common.gameMap[gameId].killer = () => {
        delete common.gameMap[gameId];
      };

      runGame(gameId);
    });
  }
};

// Called when server socket receives a request
const runGame = (gameId) => {
  const lobby = LobbyManager.findLobbyByCode(gameId);
  lobby.started = true;
  const game = common.gameMap[gameId];

  game.interval = setInterval(() => {
    //tick each arena
    Object.values(game.arenas).forEach((arena) => {
      arena.tickArena();
    });
    sendGameState(gameId);
  }, 1000 / Game.fps);
};

const activatePlayer = (userID, gameID) => {
  activePlayers[userID] = gameID;
};

module.exports = {
  init: (http) => {
    io = require("socket.io")(http);

    io.on("connection", (socket) => {
      console.log(`socket has connected ${socket.id}`);
      socket.on("disconnect", (reason) => {
        const user = getUserFromSocketID(socket.id);
        // this is called when a socket dismounts even from lobby page
        if (user !== undefined && user._id in activePlayers) {
          const gameSeed = activePlayers[user._id];
          if (gameSeed in common.gameMap) {
            common.gameMap[gameSeed].setInactive(user._id);
          }
        }

        removeUser(user, socket);
      });
      // Server receives request from client to run game
      socket.on("rungame", (gameId) => {
        // If there are no active games with the same gameID, create new one
        if (common.gameMap[gameId] === undefined) {
          startGame(gameId);
        }
      });

      socket.on("move", (input) => {
        if (common.gameMap[input.gameID]) {
          common.gameMap[input.gameID].movePlayer(input.user_id, input.dir);
        }
      });

      socket.on("entercombat", (input) => {
        if (common.gameMap[input.gameID]) {
          if (!common.gameMap[input.gameID].isInCombat(input.user_id)) {
            common.gameMap[input.gameID].beginCombat(input.user_id);
          } else {
            common.gameMap[input.gameID].leaveCombat(input.user_id);
          }
        }
      });

      socket.on("attack", (input) => {
        if (common.gameMap[input.gameID]) {
          common.gameMap[input.gameID].attack(input.user_id);
        }
      });
      socket.on("utility", (input) => {
        if (common.gameMap[input.gameID]) {
          common.gameMap[input.gameID].useUtility(input.user_id);
        }
      });
      socket.on("component", (input) => {
        if (common.gameMap[input.gameID]) {
          common.gameMap[input.gameID].setComponent(input.user_id, input.type, input.name);
        }
      });
    });
  },

  addUser: addUser,
  removeUser: removeUser,
  activatePlayer: activatePlayer,
  getSocketFromUserID: getSocketFromUserID,
  getUserFromSocketID: getUserFromSocketID,
  getSocketFromSocketID: getSocketFromSocketID,
  getIo: () => io,
};
