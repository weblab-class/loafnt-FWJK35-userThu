const Game = require("./game-logic");
const Utilities = require("../client/src/utilities");
require('dotenv').config();

const getRandomCode = (len) => {
  alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  code = "";
  for (let c = 0; c < len; c++) {
    code = code + alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }
  return code;
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
    if (this.players.size === 0) { // 
      deleteLobby(this.code);
    }
  }

  deactivatePlayer(player) {
    // deletes game
    if (this.started) {
      console.log(this.code);
      console.log(Game.gameMap);
      if (Game.gameMap[this.code] === undefined) {
        console.log("no such game");
      };
      Game.gameMap[this.code].setInactive(player._id);
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
  const url = new URL("/api/savegame", process.env.BASE_URL);
  Utilities.post(url, {host: lobby.leader, gameID: code}).then((result) => {
    console.log(`Game [${result.seed}] has been saved successfully to player [${result.host.name}]`);
  });
  lobbies.delete(code);
};

module.exports = {
  Lobby,
  lobbies,
  findLobbyByCode,
  findLobbyOfPlayer,
  createNewLobby,
  deleteLobby,
};