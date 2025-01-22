import React, { useState, useEffect } from "react";

import "../../utilities.css";
import "./SinglePlayer.css";

const SinglePlayer = (props) => {
  return (
    <>
      <div>{props.playername}</div>
    </>
  );
};

export default SinglePlayer;
