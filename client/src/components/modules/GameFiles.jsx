import React, { useEffect, useState } from "react";
import {get, post} from "../../utilities";
import {GameFile} from "./GameFile";
import { CreateGameFile } from "./CreateGameFile";

const GameFiles = (props) => {
    const [gameFiles, setGameFiles] = useState([]);
    const [slotKey, setSlotKey] = useState(-1);

    useEffect(() => {
        get("/api/gamefiles").then((gamefiles) => {
            setGameFiles(gamefiles);
        });
    }, []);

    const chooseFile = (slotKeyInp) => {
        // Empty game slot
        if (gameFiles[slotKeyInp] === "") {
            setSlotKey(slotKeyInp);
        } else {
            handleGameSelect(slotKeyInp);
        }
    };

    /*
        Called when user creates a new game
    */
    const handleGameSelect = (slotKeyInp) => {
        // Server updates lobby's host field to indicate which slot the game is loaded/saved to
        post("/api/gameslot", {lobbyID: props.lobbyID, slotKey: slotKeyInp}).then(() => {
            window.location.assign(
                window.location.protocol + "//" + window.location.host + "/lobby/" + props.lobbyID
            );
        })
    }

    const handleNewGameFile = (gameName) => {
        // POST request to update player's gamefiles to reflect new name
        post("/api/initgameslot", {slotKey: slotKey, gameName: gameName}).then((result) => {
            console.log(`Game slot initialized: ${result.gameFile}`)
            handleGameSelect(result.slotKey);
        });
    }

    // GameFile components
    let gameFileCompsOne = [];
    let gameFileCompsTwo = [];
    if (gameFiles.length > 0) {
        for (let key = 0; key < gameFiles.length; key++) {
            let gameName;
            if (gameFiles[key] === "" || gameFiles[key] === null) {
                gameName = "";
            } else {
                gameName = gameFiles[key].name
            }
            if (key < 2) {
                gameFileCompsOne.push((<GameFile key={key} slotKey={key} gameName={gameName} handleClick={chooseFile}/>));
            } else {
                gameFileCompsTwo.push((<GameFile key={key} slotKey={key} gameName={gameName} handleClick={chooseFile}/>));
            }
            
        }
    }

    return (
        <>
            {slotKey === -1 ?
            (<>
                <div className="gamefiles-container">
                    <div className="gamefile-list-one">{gameFileCompsOne}</div>
                    <div className="gamefile-list-two">{gameFileCompsTwo}</div>
                </div>
            </>) :
            (<><CreateGameFile onSubmit={handleNewGameFile}/></>)
            }
        </>
    );
}

export default GameFiles;