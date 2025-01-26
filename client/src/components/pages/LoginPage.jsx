import React, { useContext, useState } from "react";
import { GoogleLogin, googleLogout } from "@react-oauth/google";

import "../../utilities.css";
import "./LoginPage.css";
import { UserContext } from "../App";
import { post } from "../../utilities";

import { CreateLobby, JoinLobby } from "../modules/LobbyControls";
import LobbyInput from "../modules/LobbyInput";

const LoginPage = () => {
  const { user, handleLogin, handleLogout } = useContext(UserContext);

  const [joiningLobby, setJoiningLobby] = useState(false);

  const attemptJoinLobby = (lobbycode) => {
    post("/api/joinlobby", { lobbycode: lobbycode }).then((lobby) => {
      window.location.assign(
        window.location.protocol + "//" + window.location.host + "/lobby/" + lobby.code
      );
    });
  };

  return (
    <>
      <div className="login-page-background">
        <div className="top-container">
          <div className="log-div">
            <img className="log-image"/>
          </div>
          <div className="small-container">
            <img className="title"/>
            <div className="lobby">
          {user ? (
            <div className="lobby-controls">
              {joiningLobby ? (
                <LobbyInput
                  cancel={() => {
                    setJoiningLobby(false);
                  }}
                  onSubmit={attemptJoinLobby}
                />
              ) : (
                <>
                  <CreateLobby />
                  <JoinLobby
                    joinlobby={() => {
                      setJoiningLobby(true);
                    }}
                  />
                </>
              )}
            </div>
          ) : (
            <></>
          )}
        </div>
            <div className="login-button">
              {user ? (
                <button
                  className="logout-button"
                  onClick={() => {
                    googleLogout();
                    handleLogout();
                  }}
                >
                  Logout
                </button>
              ) : (
                <GoogleLogin onSuccess={handleLogin} onError={(err) => console.log(err)} />
              )}
            </div>
            
          </div>
          
        </div>
      </div>
    </>
  );
};

export default LoginPage;
