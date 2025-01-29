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
        <div className="lobby-code">
          <h1 id="lobby-code-text">game code: {props.lobbycode}</h1>
        </div>
        <div className="box-container">
          <div className="player-list-container">
            <h2 id="players-text">players</h2>
            <div className="player-list">
              {myLobby ? 
                (
                  Array.from(lobbyPlayers.values()).map((player) => (
                    <div id="player-name" key={player.name}>{player.name}</div>
                  ))
                ) : 
                (
                  <div id="lobby-error">Lobby not found!</div>
                )
              }
            </div>
            <div className="start-button">
              {myLobby && user && myLobby.leader.user.googleid === user.googleid ? 
                (<StartGame className="button" lobbycode={props.lobbycode} />) : (<></>)
              }
            </div>
            
          </div>
          {/* <div className="character-selection-container">
            <h2 id="char-select-text">character selection</h2>
          </div>
          <div className="character-display-container">
            <h2 id="char-display-text">Goob</h2>
          </div> */}
        </div>
      </div>
    </>
  );
};

export default LobbyPage;
