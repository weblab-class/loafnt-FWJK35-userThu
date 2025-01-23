import Canvas from "../modules/Canvas";
import { runGame } from "../../client-socket";
import { UserContext } from "../App";
import { useState, useEffect, useContext, useCallback } from "react";
import { handleInput } from "../../../../server/input";
import "./Game.css";
import { get } from "../../utilities";

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
      handleInput(e, gameID, user?._id);
    };

    window.addEventListener("keydown", processInput);
    return () => {
      window.removeEventListener("keydown", processInput);
    };
  }, [gameID, user]);

  return (
    <div className="overall">
      <Canvas gameID={gameID} />
    </div>
  );
};

export default Game;
