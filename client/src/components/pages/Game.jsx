import Canvas from "../modules/Canvas";
import {runGame} from "../../client-socket";
import {useState} from "react";

const Game = () => {
    const [gameID, setGameID] = useState("TEST")
    return (
        <div>
            <Canvas gameID={gameID}/>
            <button type="button" onClick={() => {
                runGame(gameID)
            }}>Start Game</button>
        </div>
    )
};

export default Game;