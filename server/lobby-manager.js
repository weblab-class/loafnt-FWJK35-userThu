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
  leader;
  constructor(lobbiesList, leader) {
    const mycode = getRandomCode(5);
    while (lobbiesList.map((lobby) => lobby.code).includes(mycode)) {
      mycode = getRandomCode(5);
    }
    this.code = mycode;
    this.players = [leader];
    this.leader = leader;
  }

  addPlayer(newPlayer) {
    let found = false;
    this.players.forEach((player) => {
      if (player.googleid === newPlayer.googleid) {
        found = true;
      }
    });
    if (!found) {
      this.players = [...this.players, newPlayer];
    }
    allPlayers.set(newPlayer, this.code);
  }
}

let lobbies = [];
let allPlayers = new Map();

const createNewLobby = (leader) => {
  thislobby = new Lobby(lobbies, leader);
  lobbies = [...lobbies, thislobby];
  allPlayers.set(leader, thislobby.code);
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
