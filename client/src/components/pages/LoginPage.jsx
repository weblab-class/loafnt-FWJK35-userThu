import React, { useContext, useState } from "react";
import { GoogleLogin, googleLogout } from "@react-oauth/google";

import "../../utilities.css";
import "./LoginPage.css";
import { UserContext } from "../App";

import { CreateLobby, JoinLobby } from "../modules/LobbyControls";
import LobbyInput from "../modules/LobbyInput";

const LoginPage = () => {
  const { userId, handleLogin, handleLogout } = useContext(UserContext);

  const [joiningLobby, setJoiningLobby] = useState(false);

  const attemptJoinLobby = (lobbycode) => {
    console.log("joining " + lobbycode);
  };

  return (
    <>
      <div className="login-page-background">
        {userId ? (
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
        <div className="login-button">
          {userId ? (
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
  );
};

export default LoginPage;
