import React, { useContext, useEffect, useState } from "react";
import { GoogleLogin, googleLogout } from "@react-oauth/google";

import "../../utilities.css";
import "./LobbyPage.css";
import { UserContext } from "../App";

import SinglePlayer from "../modules/SinglePlayer";

import { useParams } from "react-router-dom";
import { get, post } from "../../utilities";
import { StartGame } from "../modules/LobbyControls";
import { socket } from "../../client-socket";

const LobbyPage = () => {
  const { user, handleLogin, handleLogout } = useContext(UserContext);

  let props = useParams();

  const [myLobby, setMyLobby] = useState(null);
  const [lobbyPlayers, setLobbyPlayers] = useState([]);

  useEffect(() => {
    post("/api/joinlobby", { lobbycode: props.lobbycode }).then((lobby) => {
      console.log(lobby);
      if (lobby.started) {
        window.location.assign(window.location.protocol + "//" + window.location.host + "/game");
      }
      setMyLobby(lobby);
      setLobbyPlayers(new Map(Object.entries(lobby.playersObj)));
    });
    const addNewPlayer = (newuser) => {
      setLobbyPlayers((prevLobbyPlayers) => {
        const newLobbyPlayers = new Map(prevLobbyPlayers);
        newLobbyPlayers.set(newuser.googleid, newuser);
        return newLobbyPlayers;
      });
    };
    const launchGame = () => {
      window.location.assign(window.location.protocol + "//" + window.location.host + "/game");
    };
    socket.on("joinedlobby", addNewPlayer);
    socket.on("launchgame", launchGame);
    return () => {
      socket.off("joinedlobby", addNewPlayer);
      socket.off("launchgame", launchGame);
    };
  }, []);

  return (
    <>
      <div className="lobby-page-background">
        <div>
          Have friends join this lobby with the code <span>{props.lobbycode}</span>
        </div>
        <div>
          {myLobby ? (
            Array.from(lobbyPlayers.values()).map((player) => (
              <div key={player.name}>{player.name}</div>
            ))
          ) : (
            <div>Lobby not found!</div>
          )}
        </div>
        {myLobby && user && myLobby.leader.user.googleid === user.googleid ? (
          <StartGame lobbycode={props.lobbycode} />
        ) : (
          <></>
        )}
      </div>
    </>
  );
};

export default LobbyPage;
