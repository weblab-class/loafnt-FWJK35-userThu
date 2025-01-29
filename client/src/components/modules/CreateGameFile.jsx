import React, { useState } from "react";

const CreateGameFile = (props) => {
    const [value, setValue] = useState("");

    const handleChange = (e) => {
        setValue(e.target.value);
    }

    const handleInput = (e) => {
        if (e.repeat) return;
        if (e.key === "Enter") {
            if (value !== "") {
                props.onSubmit(value);
            } 
        }
    }

    const handleDoneClick = () => {
        if (value !== "") {
            props.onSubmit(value);
        } 
    }

    return (
        <>
            <input
                type="text"
                value={value}
                placeholder="Enter Game Name"
                onChange={handleChange}
                onKeyDown={handleInput}
            />
            {/* <button onClick={handleBackClick}>Back</button> */}
            <button onClick={handleDoneClick}>Done</button>
        </>
    );
}

export {CreateGameFile}