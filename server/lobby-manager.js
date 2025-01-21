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
  constructor(lobbiesList, leader) {
    const mycode = getRandomCode(5);
    while (lobbiesList.map((lobby) => lobby.code).includes(mycode)) {
      mycode = getRandomCode(5);
    }
    this.code = mycode;
    this.players = [leader];
  }
}

lobbies = [];

const createNewLobby = (leader) => {
  thislobby = new Lobby(lobbies, leader);
  lobbies.concat(thislobby);
  return thislobby;
};

module.exports = {
  Lobby,
  createNewLobby,
};
