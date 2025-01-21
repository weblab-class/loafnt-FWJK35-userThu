import {useRef, useEffect} from "react";
import { drawCanvas } from "../../game-logic/canvasManager";
import "./styling/Canvas.css";

const Canvas = () => {
    const canvasRef = useRef(null);

    useEffect(()=> {
        drawCanvas(null, canvasRef);
    }, []);

    return (
        <div className="canvasContainer">
            <canvas ref={canvasRef} className="canvas"></canvas>
        </div>
    );
};

export default Canvas;