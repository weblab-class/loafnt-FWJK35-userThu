import { useRef, useEffect, useState } from "react";
import { drawCanvas } from "../../game-logic/canvasManager";
import { socket } from "../../client-socket";
import "./Canvas.css";

const Canvas = (props) => {
  const canvasRef = useRef(null);

  const [windowDimensions, setWindowDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    // Receives game object 60 times / sec
    socket.on("update", (gamePacket) => {
      processGame(gamePacket);
    });
    return () => {
      socket.off("update");
    };
  }, [windowDimensions]);

  useEffect(() => {
    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const processGame = (gamePacket) => {
    drawCanvas(gamePacket, canvasRef, windowDimensions);
  };

  return (
    <div className="canvasContainer">
      <canvas ref={canvasRef} className="canvas"></canvas>
    </div>
  );
};

export default Canvas;
