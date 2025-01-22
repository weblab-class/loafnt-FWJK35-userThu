import Canvas from "../modules/Canvas";
import {runGame} from "../../client-socket";
import {useState, useEffect} from "react";
import { handleInput } from "../../../../server/input";
import "./Game.css";

const Game = () => {
    const [gameID, setGameID] = useState("TEST");
    const [userID, setUserID] = useState("TEST_PLAYER");

    const processInput = (e) => {
        console.log("processInput");
        handleInput(e, gameID, userID);
    };

    useEffect(() => {
        window.addEventListener("keydown", processInput);
        return () => {
            window.removeEventListener("keydown", processInput);
        }
    }, []);

    return (
        <div className="overall">
            <Canvas gameID={gameID}/>
        </div>
    )
};

export default Game;