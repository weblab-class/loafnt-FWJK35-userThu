import React, { useContext } from "react";
import { GoogleLogin, googleLogout } from "@react-oauth/google";

import "../../utilities.css";
import "./LobbyControls.css";
import { UserContext } from "../App";
import { get, post } from "../../utilities";
import { socket } from "../../client-socket";

const CreateLobby = () => {
  const createLobby = () => {
    post("/api/newlobby").then((lobby) => {
      window.location.replace(window.location.href + "lobby/" + lobby.code);
    });
  };

  return (
    <>
      <button
        className="create-lobby"
        onClick={() => {
          createLobby();
        }}
      >
        Create Lobby
      </button>
    </>
  );
};

const JoinLobby = (props) => {
  return (
    <>
      <button className="create-lobby" onClick={props.joinlobby}>
        Join Lobby
      </button>
    </>
  );
};

const StartGame = (props) => {
  return (
    <>
      <button
        className="start-game"
        onClick={() => {
          socket.runGame(props.lobbycode);
        }}
      >
        Start Game
      </button>
    </>
  );
};

export { CreateLobby, JoinLobby, StartGame };
