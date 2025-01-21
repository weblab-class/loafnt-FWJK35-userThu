import React, { useContext } from "react";
import { GoogleLogin, googleLogout } from "@react-oauth/google";

import "../../utilities.css";
import "./LoginPage.css";
import { UserContext } from "../App";
import { get, post } from "../../utilities";

const LoginPage = () => {
  const { userId, handleLogin, handleLogout } = useContext(UserContext);
  return (
    <>
      {userId ? (
        <button
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
    </>
  );
};

export default LoginPage;
