import React, { useContext } from "react";
import { GoogleLogin, googleLogout } from "@react-oauth/google";

import "../../utilities.css";
import "./LobbyControls.css";
import { UserContext } from "../App";
import { get, post } from "../../utilities";

const CreateLobby = () => {
  const { userId, handleLogin, handleLogout } = useContext(UserContext);

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
  const { userId, handleLogin, handleLogout } = useContext(UserContext);
};

export { CreateLobby, JoinLobby };
