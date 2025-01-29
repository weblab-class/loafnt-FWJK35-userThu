import React from "react";

const GameFile = (props) => {
    return (
        <>
        <div onClick={() => {
            props.handleClick(props.slotKey);
        }}>
            {
                props.gameName === undefined || props.gameName === ""?
                (<><h1>New Game</h1></>) : 
                (<><h1>{props.gameName}</h1></>)
            }
            
        </div>
        </>
    );
}

export {GameFile};