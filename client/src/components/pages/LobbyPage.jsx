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
    socket.on("joinedlobby", addNewPlayer);
    return () => {
      socket.off("joinedlobby", addNewPlayer);
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
        {myLobby && user && myLobby.leader.googleid === user.googleid ? (
          <StartGame lobbycode={props.lobbycode} />
        ) : (
          <></>
        )}
      </div>
    </>
  );
};

export default LobbyPage;
