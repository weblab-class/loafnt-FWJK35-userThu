import Canvas from "../modules/Canvas";
import {runGame} from "../../client-socket";
import {useState, useEffect} from "react";
import { handleInput } from "../../../../server/input";
import "./Game.css";

const Game = () => {
    const [gameID, setGameID] = useState("");
    const { user, handleLogin, handleLogout } = useContext(UserContext);

    const processInput = (e) => {
        console.log("processInput");
        handleInput(e, gameID, user._id);
    };

    useEffect(() => {
        get("/api/mylobbycode").then((lobbycode) => {
            setGameID(lobbycode);
        });
    }, []);

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