import React, { useEffect, useState } from "react";
import {get} from "../../utilities";
import {GameFile} from "../modules/GameFile";
import { CreateGameFile } from "../modules/CreateGameFile";

const GameFilesPage = () => {
    const [gameFiles, setGameFiles] = useState([]);
    const [showCreateGameFile, setShowCreateGameFile] = useState(false);

    useEffect(() => {
        get("/api/gamefiles").then((gamefiles) => {
            setGameFiles(gamefiles);
        });
    }, []);

    const chooseFile = (key) => {
        // Save the key to the lobby
        // Empty game slot
        if (gameFiles[key] === "") {
            // Let player name new game file
            setShowCreateGameFile(true);
        }
        window.location.assign(
            window.location.protocol + "//" + window.location.host + "/lobby/" + lobby.code
        );
    };

    /*
        Called when user creates a new game
    */
    const handleNewGame = () => {

    }

    let gameFileComps = [];
    if (gameFiles.length > 0) {
        for (let key = 0; key < gameFiles.length; key++) {
            gameFileComps.push((<GameFile key={key} gameFile={gameFiles[key]} handleClick={chooseFile}/>));
        }

    }

    return (
        <>
        <div>
            {!showCreateGameFile ?
            (<>{gameFileComps}</>) :
            (<><CreateGameFile onSubmit={handleNewGame}/></>)
            }
        </div>
        </>
    );
}

export default GameFilesPage;