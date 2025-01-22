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
      //user exists
      if (foundUsers.length > 0) {
        thisuser = foundUsers[0];
        res.send(thisuser);
      } else {
        const newUser = new User({
          name: req.user.name,
          googleid: req.user.googleid,
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
    const thislobby = lobbyManager.createNewLobby(req.user);
    res.send(thislobby);
  }
});

router.post("/joinlobby", (req, res) => {
  if (req.user) {
    let lobby = lobbyManager.findLobbyByCode(req.body.lobbycode);
    if (lobby) {
      lobby.addPlayer(req.user);

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

// anything else falls to this "not found" case
router.all("*", (req, res) => {
  console.log(`API route not found: ${req.method} ${req.url}`);
  res.status(404).send({ msg: "API route not found" });
});

module.exports = router;
