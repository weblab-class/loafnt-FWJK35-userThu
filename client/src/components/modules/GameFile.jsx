import React from "react";

const GameFile = (props) => {
    return (
        <>
        <div className="gamefile" onClick={() => {
            props.handleClick(props.slotKey);
        }}>
            <img className="gamefile-img"/>
            <div className="gamefile-content">
                {
                    props.gameName === undefined || props.gameName === ""?
                    (<><h1>New Game</h1></>) : 
                    (<><h1>{props.gameName}</h1></>)
                }
            </div>
            
            
        </div>
        </>
    );
}

export {GameFile};