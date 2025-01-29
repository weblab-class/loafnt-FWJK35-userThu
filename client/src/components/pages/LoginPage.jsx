import React, { useContext, useState } from "react";
import { GoogleLogin, googleLogout } from "@react-oauth/google";

import "../../utilities.css";
import "./LoginPage.css";
import { UserContext } from "../App";
import { post } from "../../utilities";

import { CreateLobby, JoinLobby } from "../modules/LobbyControls";
import LobbyInput from "../modules/LobbyInput";
import GameFiles from "../modules/GameFiles";

const LoginPage = () => {
  const { user, handleLogin, handleLogout } = useContext(UserContext);

  const [joiningLobby, setJoiningLobby] = useState(false);
  const [lobbyID, setLobbyID] = useState("");

  const attemptJoinLobby = (lobbycode) => {
    post("/api/joinlobby", { lobbycode: lobbycode }).then((lobby) => {
      window.location.assign(
        window.location.protocol + "//" + window.location.host + "/lobby/" + lobby.code
      );
    });
  };

  const handleNewLobby = (lobbycode) => {
    setLobbyID(lobbycode);
  }

  return (
    <>
      <div className="login-page-background">
        <div className="top-container">
          <div className="log-div">
            <img className="log-image" />
          </div>

          { lobbyID !== "" ? 
          (
            <>
              <GameFiles lobbyID={lobbyID}/>
            </>
          ) : 
          (
            <>
              <div className="small-container">
                <h1 className="title">Evergreen Escape</h1>

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
                          <CreateLobby handleNewLobby={handleNewLobby}/>
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
            </>
          )}

        </div>
      </div>
    </>
  );
};

export default LoginPage;
