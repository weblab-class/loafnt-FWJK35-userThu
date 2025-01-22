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
    const mycode = getRandomCode(5);
    while (lobbiesList.map((lobby) => lobby.code).includes(mycode)) {
      mycode = getRandomCode(5);
    }
    this.code = mycode;
    this.players = new Map([[leader.googleid, leader]]);
    this.playersObj = Object.fromEntries(this.players);
    this.leader = leader;
  }

  removePlayer(player) {
    this.players.delete(player.googleid);
  }

  addPlayer(newPlayer) {
    this.players.set(newPlayer.googleid, newPlayer);
    lobbies.forEach((lobby) => {
      if (lobby.players.has(newPlayer.googleid)) {
        lobby.removePlayer(newPlayer);
      }
    });
    allPlayers.set(newPlayer.googleid, this.code);
  }
}

let lobbies = [];
let allPlayers = new Map();

const createNewLobby = (leader) => {
  thislobby = new Lobby(lobbies, leader);
  lobbies = [...lobbies, thislobby];
  allPlayers.set(leader.googleid, thislobby.code);
  return thislobby;
};

const findLobbyByCode = (code) => {
  let output;
  lobbies.forEach((testLobby) => {
    if (testLobby.code === code) {
      output = testLobby;
    }
  });
  return output;
};

const getLobbies = () => {
  return lobbies;
};

module.exports = {
  Lobby,
  getLobbies,
  findLobbyByCode,
  createNewLobby,
};
