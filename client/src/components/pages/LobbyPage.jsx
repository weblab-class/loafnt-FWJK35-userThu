import React, { useContext, useState } from "react";
import { GoogleLogin, googleLogout } from "@react-oauth/google";

import "../../utilities.css";
import "./LobbyPage.css";
import { UserContext } from "../App";

import { useParams } from "react-router-dom";

const LobbyPage = () => {
  const { userId, handleLogin, handleLogout } = useContext(UserContext);

  let props = useParams();

  return (
    <>
      <div className="lobby-page-background">{props.lobbycode}</div>
    </>
  );
};

export default LobbyPage;
