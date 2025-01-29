/*
|--------------------------------------------------------------------------
| api.js -- server routes
|--------------------------------------------------------------------------
|
| This file defines the routes for your server.
|
*/

const express = require("express");

// import models so we can interact with the database
const User = require("./models/user");

// import authentication library
const auth = require("./auth");

// api endpoints: all these paths will be prefixed with "/api/"
const router = express.Router();

//initialize socket
const socketManager = require("./server-socket");
const lobbyManager = require("./lobby-manager");
const game = require("./game-logic");
const common = require("./common");

router.post("/login", auth.login);
router.post("/logout", auth.logout);
router.get("/whoami", (req, res) => {
  if (!req.user) {
    // not logged in
    return res.send({});
  }

  res.send(req.user);
});

router.post("/initsocket", (req, res) => {
  // do nothing if user not logged in
  if (req.user)
    socketManager.addUser(req.user, socketManager.getSocketFromSocketID(req.body.socketid));
  res.send({});
});

// |------------------------------|
// | write your API methods below!|
// |------------------------------|

router.post("/storeuser", (req, res) => {
  if (req.user) {
    User.find({ googleid: req.user.googleid }).then((foundUsers) => {
      // user already exists
      if (foundUsers.length > 0) {
        thisuser = foundUsers[0];
        res.send(thisuser);
      } else {
        const newUser = new User({
          name: req.user.name,
          googleid: req.user.googleid,
          gamefiles: ["", "", "", "", ""], // gamefile is "{fileName: "Epic Game", game: JSON.stringify(gameObj)}""
        });
        newUser.save().then((user) => {
          res.send(user);
        });
      }
    });
  }
});

router.post("/newlobby", (req, res) => {
  if (req.user) {
    const thislobby = lobbyManager.createNewLobby({ slotKey: undefined, user: req.user });
    res.send(thislobby);
  }
});

router.post("/joinlobby", (req, res) => {
  if (req.user) {
    let lobby = lobbyManager.findLobbyByCode(req.body.lobbycode);
    if (lobby) {
      //remove player from all other lobbies
      lobbyManager.lobbies.forEach((lobby, code) => {
        if (lobby.players.has(req.user.googleid)) {
          lobby.removePlayer(req.user);
          if (lobby.started) {
            common.gameMap[code].setInactive(req.user._id);
          }
        }
      });
      //add player to lobby if exists
      lobby.addPlayer(req.user);
      //tell other players they joined this lobby
      lobby.players.forEach((player) => {
        if (socketManager.getSocketFromUserID(player._id)) {
          socketManager.getSocketFromUserID(player._id).emit("joinedlobby", req.user);
        }
      });
      //spawn them if this game has already started
      if (lobby.started) {
        common.gameMap[req.body.lobbycode].spawnPlayer(req.user);
      }
      res.send(lobby);
    } else {
      res.status(500).send("Lobby Not Found");
    }
  }
});

router.get("/lobby", (req, res) => {
  const lobby = lobbyManager.findLobbyByCode(req.query.lobbycode);
  if (lobby) {
    res.send(lobby);
  } else {
    res.status(500).send("Lobby Not Found");
  }
});

router.get("/mylobbycode", (req, res) => {
  if (req.user) {
    const lobby = lobbyManager.findLobbyOfPlayer(req.user.googleid);
    if (lobby) {
      return res.send({ code: lobby.code });
    } else {
      return res.status(500).send("Player not in lobby");
    }
  }
  return res.status(500).send("Player not logged in");
});

router.post("/activateplayer", (req, res) => {
  if (req.user) {
    socketManager.activatePlayer(req.user._id, req.body.gameID);
    res.send({ user: req.user._id, gameID: req.body.gameID });
  }
});

// router.get("/gamefile", (req, res) => {
//   const host = req.body.host
//   User.find({googleid: host.user.googleid}).then((foundUsers) => {
//     if (foundUsers) {
//       const foundUser = foundUsers[0];
//       const foundGame = foundUser.gamefiles[host.slotKey];
//       const parsedGame = {name: foundGame.name, game: JSON.parse(foundGame.game)};
//       res.send(parsedGame);
//     }
//   })
// })

/*
  Request is made when a user is selecting a game file in GameFilesPage.jsx
*/
router.get("/gamefiles", (req, res) => {
  if (req.user) {
    User.find({ googleid: req.user.googleid }).then((foundUsers) => {
      const foundUser = foundUsers[0];
      if (foundUser) {
        /*
          A new player's gamefiles looks like: 
          ["", "", "", "", ""]
          
          A returning player's gamefiles looks like:
          ["{name: val, game: {...}}", ...]
        */

        const gameFiles = foundUser.gamefiles.map((gameFile) => {
          if (gameFile !== "") {
            return JSON.parse(gameFile);
          } else {
            return "";
          }
        });
        res.send(gameFiles);
      } else {
      }
    });
  }
});

/*
  req.body: {
    lobbyID: (String), 
    slotKey: (int)
  }
*/
router.post("/gameslot", (req, res) => {
  if (req.user) {
    const lobby = lobbyManager.findLobbyByCode(req.body.lobbyID);
    lobby.leader.slotKey = req.body.slotKey;
    res.send({ lobbyID: req.body.lobbyID, slotKey: req.body.slotKey });
  }
});

/*
  Request made when a user creates a new game in an empty slot.
*/
router.post("/initgameslot", (req, res) => {
  if (req.user) {
    User.find({ googleid: req.user.googleid }).then((foundUsers) => {
      const foundUser = foundUsers[0];
      // NOTE: The game field is not populated until the user dismounts from Game.jsx
      foundUser.gamefiles[req.body.slotKey] = `{"name": "${req.body.gameName}", "game": null}`;
      foundUser.save().then((result) => {
        res.send({ slotKey: req.body.slotKey, gameFile: result.gamefiles[req.body.slotKey] });
      });
    });
  }
});

// anything else falls to this "not found" case
router.all("*", (req, res) => {
  console.log(`API route not found: ${req.method} ${req.url}`);
  res.status(404).send({ msg: "API route not found" });
});

module.exports = router;
