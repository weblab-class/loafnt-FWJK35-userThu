import { useRef, useEffect } from "react";
import { drawCanvas } from "../../game-logic/canvasManager";
import { socket } from "../../client-socket";
import "./styling/Canvas.css";

const Canvas = (props) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    // Receives game object 60 times / sec
    socket.on("update", (gamePacket) => {
      processGame(gamePacket);
    });
    return () => {
      socket.off("update");
    };
  }, []);

  const processGame = (gamePacket) => {
    console.log("drawCanvas");
    drawCanvas(gamePacket, canvasRef);
  };

  return (
    <div className="canvasContainer">
      <canvas ref={canvasRef} className="canvas"></canvas>
    </div>
  );
};

export default Canvas;
