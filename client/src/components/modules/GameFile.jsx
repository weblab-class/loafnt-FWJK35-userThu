import React from "react";

const GameFile = (props) => {
    return (
        <>
        <div onClick={() => {
            props.handleClick(props.key);
        }}>
            {
                props.gameFile.name === undefined || props.gameFile === ""?
                (<><h1>New Game</h1></>) : 
                (<><h1>${props.gameFile.name}</h1></>)
            }
            
        </div>
        </>
    );
}

export {GameFile};