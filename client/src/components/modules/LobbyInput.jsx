import React, { useState, useEffect } from "react";

import "../../utilities.css";
import "./LobbyInput.css";

const LobbyInput = (props) => {
  const [value, setValue] = useState("");

  const handleChange = (event) => {
    setValue(event.target.value);
  };

  const handleInput = (event) => {
    if (event.repeat) return;
    if (event.key === "Enter") {
      props.onSubmit(value);
    }
  };

  return (
    <>
      <div>
        <input
          className="joinlobby-input"
          type="text"
          value={value}
          placeholder="Enter lobby code"
          onChange={handleChange}
          onKeyDown={handleInput}
        />
        <button className="joinlobby-button" onClick={()=>{props.onSubmit(value)}}>Done</button>
        <button className="joinlobby-button" onClick={props.cancel}>Cancel</button>
      </div>
    </>
  );
};

export default LobbyInput;
