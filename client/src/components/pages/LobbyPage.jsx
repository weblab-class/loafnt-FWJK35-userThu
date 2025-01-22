import React, { useContext, useEffect, useState } from "react";
import { GoogleLogin, googleLogout } from "@react-oauth/google";

import "../../utilities.css";
import "./LobbyPage.css";
import { UserContext } from "../App";

import SinglePlayer from "../modules/SinglePlayer";

import { useParams } from "react-router-dom";
import { get, post } from "../../utilities";
import { StartGame } from "../modules/LobbyControls";

const LobbyPage = () => {
  const { user, handleLogin, handleLogout } = useContext(UserContext);

  let props = useParams();

  const [myLobby, setMyLobby] = useState(null);

  useEffect(() => {
    post("/api/joinlobby", { lobbycode: props.lobbycode }).then((lobby) => {
      setMyLobby(lobby);
    });
  }, []);

  return (
    <>
      <div className="lobby-page-background">
        <div>
          Have friends join this lobby with the code <span>{props.lobbycode}</span>
        </div>
        <div>
          {myLobby ? (
            Object.values(myLobby.playersObj).map((player) => {
              return <div key={player.name}>{player.name}</div>;
            })
          ) : (
            <div>Lobby not found!</div>
          )}
        </div>
        {myLobby && user && myLobby.leader.googleid === user.googleid ? <StartGame /> : <></>}
      </div>
    </>
  );
};

export default LobbyPage;
