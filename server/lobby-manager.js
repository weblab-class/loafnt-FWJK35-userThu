const User = require("./models/user");
const common = require("./common");
require("dotenv").config();

const getRandomCode = (len) => {
  alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  code = "";
  for (let c = 0; c < len; c++) {
    code = code + alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }
  return code;
};

const saveGame = (gameID, host) => {
  returnPromise = new Promise((resolve, reject) => {
    User.find({ googleid: host.googleid }).then((foundUsers) => {
      let foundUser = foundUsers[0];
      let foundGame;
      if (foundUser.gamefiles === undefined || foundUser.gamefiles.length === 0) {
        foundGame = JSON.stringify(common.gameMap[gameID]);
        foundUser.gamefiles = [foundGame, "", "", "", ""];
      } else {
        // for (let fileIdx = 0; fileIdx < foundUser.gamefiles.length; fileIdx++) {
        //   if (foundUser.gamefiles[fileIdx] === "") {
        //     foundGame = JSON.stringify(common.gameMap[gameID]);
        //     foundUser.gamefiles[fileIdx] = foundGame;
        //     break;
        //   }
        // }
        //always save to first slot for now
        foundGame = JSON.stringify(common.gameMap[gameID]);
        foundUser.gamefiles[0] = foundGame;
      }

      foundUser.save().then((result) => {
        resolve({ seed: gameID, host: host });
      });
    });
  });
  return returnPromise;
};

class Lobby {
  code;
  players;
  playersObj;
  leader;
  started;

  constructor(lobbiesList, leader) {
    let mycode = getRandomCode(5);
    while (lobbiesList.has(mycode)) {
      mycode = getRandomCode(5);
    }
    this.code = mycode;
    this.players = new Map();
    this.playersObj = Object.fromEntries(this.players);
    this.leader = leader;
    this.started = false;
  }

  removePlayer(player) {
    this.players.delete(player.googleid);
    this.playersObj = Object.fromEntries(this.players);
    if (this.players.size === 0) {
      //
      deleteLobby(this.code);
    }
  }

  deactivatePlayer(player) {
    if (this.started) {
      if (common.gameMap[this.code] === undefined) {
        console.log("no such game");
      }
      common.gameMap[this.code].setInactive(player._id);
    }
  }

  addPlayer(newPlayer) {
    this.players.set(newPlayer.googleid, newPlayer);
    allPlayers.set(newPlayer.googleid, this.code);
    this.playersObj = Object.fromEntries(this.players);
  }
}

let lobbies = new Map(); // Change to objects
let allPlayers = new Map();

const createNewLobby = (leader) => {
  thislobby = new Lobby(lobbies, leader);
  lobbies.set(thislobby.code, thislobby);
  return thislobby;
};

const findLobbyByCode = (code) => {
  return lobbies.get(code);
};

const findLobbyOfPlayer = (googleid) => {
  return findLobbyByCode(allPlayers.get(googleid));
};

// lobby has leader property with googleid of the host
const deleteLobby = (code) => {
  allPlayers.forEach((player, lobbycode) => {
    if (lobbycode === code) {
      allPlayers.delete(player);
    }
  });
  const lobby = lobbies.get(code);
  if (lobby) {
    saveGame(lobby.code, lobby.leader).then((result) => {
      console.log(
        `Game [${result.seed}] has been saved successfully to player [${result.host.name}]`
      );
      lobbies.delete(code);
    });
  }
};

module.exports = {
  Lobby,
  lobbies,
  findLobbyByCode,
  findLobbyOfPlayer,
  createNewLobby,
  deleteLobby,
};
