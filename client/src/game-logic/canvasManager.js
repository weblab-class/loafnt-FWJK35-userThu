const blockSize = 64;
const spriteSize = 64;

let spriteX = 0;
let spriteY = 0;

// Path is relative to 'dist' folder
const characters = {
    witch_cat: "../src/public/assets/calicoKitty_walk.png"
};

const dummyPlayer1 = {
    position: {x: 0, y: 0},
    char_id: 'witch_cat'
};

const dummyCanvasState = {
    players: [dummyPlayer1]
};

// Params:
// playerState: {
//  position: {x: value, y: value}                  -- Block Coordinates relative to Screen, not entire map
//  character: id
// }
// ctx: context                                     -- Game Canvas context
const drawPlayer = (playerState, ctx) => {
    const playerSprite = new Image(64,64);
    const x = playerState.position.x;
    const y = playerState.position.y;
    playerSprite.onload = () => {
        ctx.drawImage(playerSprite,
            spriteX * blockSize, spriteY * blockSize, spriteSize, spriteSize,
            x * blockSize, y * blockSize, spriteSize, spriteSize);
    }
    playerSprite.src = characters[playerState.char_id];
}

// Params
// canvasState: {
//  players: []                                     -- List of active players the game should render (Later on perform checks to see if a player is in screen, compare absolute positions to player positions)
// }
export const drawCanvas = (canvasState, canvasRef) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    // Purposefully give dimensions so Canvas does not upscale inner images
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    dummyCanvasState.players.forEach((player) => {
        drawPlayer(player, context)
    })
};