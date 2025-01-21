import React, { useContext } from "react";
import { GoogleLogin, googleLogout } from "@react-oauth/google";

import "../../utilities.css";
import "./LobbyControls.css";
import { UserContext } from "../App";
import { get, post } from "../../utilities";

const CreateLobby = () => {
  const { userId, handleLogin, handleLogout } = useContext(UserContext);

  const createLobby = () => {};

  return (
    <>
      <button
        className="create-lobby"
        onClick={() => {
          post("/api/newlobby").then((lobby) => {
            console.log(window.location.href + "lobby/" + lobby.code);
            console.log(lobby.code);
            window.location.replace(window.location.href + "lobby/" + lobby.code);
          });
        }}
      >
        Create Lobby
      </button>
    </>
  );
};

const JoinLobby = (props) => {
  const { userId, handleLogin, handleLogout } = useContext(UserContext);
  return (
    <>
      <button className="create-lobby" onClick={props.joinlobby}>
        Join Lobby
      </button>
    </>
  );
};

export { CreateLobby, JoinLobby };
