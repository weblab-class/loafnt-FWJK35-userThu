import React, { useState, useContext } from "react";
import {Link} from "react-router-dom";
import { GoogleLogin, googleLogout } from "@react-oauth/google";

import "../../utilities.css";
import "./LobbyControls.css";
import { UserContext, LobbyContext } from "../App";
import { get, post } from "../../utilities";
import { socket, runGame } from "../../client-socket";

const CreateLobby = (props) => {
  const createLobby = () => {
    post("/api/newlobby").then((lobby) => {
      // pass lobby
      console.log(lobby);
      // setLobbyID(lobby.code);
      // console.log(lobbyID);
      props.handleNewLobby(lobby.code);
      // window.location.assign(
      //   window.location.protocol + "//" + window.location.host + "/lobby/" + lobby.code
      //   window.location.protocol + "//" + window.location.host + "/selectgame"
      // );
    });
  };

  return (
    <>
      {/* add GameFilesPage */}
      <button
        className="create-lobby"
        onClick={() => {
          createLobby();
        }}>
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
          runGame(props.lobbycode);
        }}
      >
        Start Game
      </button>
    </>
  );
};

export { CreateLobby, JoinLobby, StartGame };
