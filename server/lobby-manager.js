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
  constructor(lobbiesList, leader) {
    let mycode = getRandomCode(5);
    while (lobbiesList.has(mycode)) {
      mycode = getRandomCode(5);
    }
    this.code = mycode;
    this.players = new Map();
    this.playersObj = Object.fromEntries(this.players);
    this.leader = leader;
  }

  removePlayer(player) {
    console.log("removed", player);
    this.players.delete(player.googleid);
    this.playersObj = Object.fromEntries(this.players);
    if (this.players.size === 0) {
      deleteLobby(this.code);
    }
  }

  addPlayer(newPlayer) {
    lobbies.forEach((lobby, code) => {
      if (lobby.players.has(newPlayer.googleid)) {
        lobby.removePlayer(newPlayer);
      }
    });
    this.players.set(newPlayer.googleid, newPlayer);
    allPlayers.set(newPlayer.googleid, this.code);
    this.playersObj = Object.fromEntries(this.players);
  }
}

let lobbies = new Map();
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

const deleteLobby = (code) => {
  allPlayers.forEach((player, lobbycode) => {
    if (lobbycode === code) {
      allPlayers.delete(player);
    }
  });
  lobbies.delete(code);
};

const getLobbies = () => {
  return lobbies;
};

module.exports = {
  Lobby,
  getLobbies,
  findLobbyByCode,
  findLobbyOfPlayer,
  createNewLobby,
  deleteLobby,
};
