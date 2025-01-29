import Canvas from "../modules/Canvas";
import ComponentSelector from "../modules/ComponentSelector";
import { UserContext } from "../App";
import { useState, useEffect, useContext, useCallback } from "react";
import { sendInput, setPressedKey, setOpenComponentSelect } from "../../game-logic/input";
import { get, post } from "../../utilities";
import "./Game.css";
import setUnlockUpdate from "../../game-logic/canvasManager";

const Game = () => {
  const [gameID, setGameID] = useState("");
  const { user, handleLogin, handleLogout } = useContext(UserContext);
  const [showComponents, setShowComponents] = useState(false);
  const [unlocked, setUnlocked] = useState({});

  useEffect(() => {
    get("/api/mylobbycode", { gameID: gameID }).then((result) => {
      setGameID(result.code);
      console.log(`Game set ${result.code}`);
    });
    setUnlockUpdate((unlocks) => {
      setUnlocked(unlocks);
    });
  }, []);

  useEffect(() => {
    setOpenComponentSelect(() => {
      setShowComponents(!showComponents);
    });
  }, [showComponents]);

  useEffect(() => {
    if (gameID !== "") {
      post("/api/activateplayer", { gameID: gameID }).then((result) => {
        console.log(`User [${result.user}] is active on Game [${result.gameID}]`);
      });
    }
  }, [gameID]);

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
      {showComponents ? (
        <ComponentSelector gameID={gameID} userID={user?._id} unlocked={unlocked} />
      ) : (
        <></>
      )}
    </div>
  );
};

export default Game;
