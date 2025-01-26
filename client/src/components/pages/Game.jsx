import Canvas from "../modules/Canvas";
import { UserContext } from "../App";
import { useState, useEffect, useContext, useCallback } from "react";
import { sendInput, setPressedKey } from "../../game-logic/input";
import { get } from "../../utilities";
import "./Game.css";

const Game = () => {
  const [gameID, setGameID] = useState("");
  const { user, handleLogin, handleLogout } = useContext(UserContext);

  useEffect(() => {
    get("/api/mylobbycode").then((result) => {
      setGameID(result.code);
    });
  }, []);

  useEffect(() => {
    const processInput = (e) => {
      setPressedKey(e);
    };

    window.addEventListener("keydown", processInput);
    window.addEventListener("keyup", processInput);
    let sendInputInterval = setInterval(
      sendInput,
      1000 / 60,
      gameID,
      user?._id,
      Math.floor(1000 / 60) / 1000
    );

    return () => {
      window.removeEventListener("keydown", processInput);
      window.removeEventListener("keyup", processInput);
      clearInterval(sendInputInterval);
    };
  }, [gameID, user]);

  return (
    <div className="overall">
      <Canvas gameID={gameID} />
    </div>
  );
};

export default Game;
