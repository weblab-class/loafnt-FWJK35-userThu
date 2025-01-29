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

const loadGame = (host) => {
  returnPromise = new Promise((resolve, reject) => {
    User.find({googleid: host.user.googleid}).then((foundUsers) => {
      if (foundUsers) {
        const foundUser = foundUsers[0];
        let foundGameFiles = foundUser.gamefiles;
        // By this point, the User will have named the file at the specified slot
        // so the gameFile looks like "{name: val, game: null}"
        const gameFile = JSON.parse(foundGameFiles[host.slotKey]);
        const gameJSON = (gameFile.game === null) ? undefined : gameFile.game;
        // Clear Arena
        resolve({game: gameJSON});
      } else {
        reject(`User with [googleid]: [${host.user.googleid}] not found.`);
      }
    });
  }); 
  return returnPromise;
}

const saveGame = (gameID, host) => {
  returnPromise = new Promise((resolve, reject) => {
    User.find({ googleid: host.user.googleid }).then((foundUsers) => {
      let foundUser = foundUsers[0];
      
      // gamefile: {name: val, game: null}
      const parsedGameFile = JSON.parse(foundUser.gamefiles[host.slotKey]);
      // MUST: Clear the interval which is needed to call JSON.stringify()
      const gameToSave = common.gameMap[gameID];
      clearInterval(gameToSave.interval);
      gameToSave.arenas = {};
      parsedGameFile.game = gameToSave;
      foundUser.gamefiles[host.slotKey] = JSON.stringify(parsedGameFile);

      foundUser.save().then((result) => {
        resolve({ seed: gameID, host: host });
      });
    });
  });
  return returnPromise;
};

/*
  Properties:
  leader: {
    slotKey: (int), 
    user: {
      _id: (String),
      name: (String),
      googleid: (String)
    }
  }
*/
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
  saveGame(lobby.code, lobby.leader).then((result) => {
    console.log(
      `Game [${result.seed}] has been saved successfully to player [${result.host.user.name}]`
    );
    lobbies.delete(code);
    common.gameMap[code].killer();
  });
};

module.exports = {
  Lobby,
  lobbies,
  loadGame,
  findLobbyByCode,
  findLobbyOfPlayer,
  createNewLobby,
  deleteLobby,
};
