const blockSize = 64;
const spriteSize = 64;

let spriteX = 0;
let spriteY = 0;

// Path is relative to 'dist' folder
let assetsMap = {
    avatars: {witch_cat: "../src/public/assets/calicoKitty_walk.png"}
}

// const dummyPlayer1 = {
//     position: {x: 0, y: 0},
//     avatar_id: 'witch_cat'
// };

// const dummyCanvasState = {
//     players: [dummyPlayer1]
// };

// Params:
// playerState: {
//  position: {x: value, y: value}                  -- Block Coordinates relative to Screen, not entire map
//  character: id
// }
// ctx: context                                     -- Game Canvas context
const drawPlayer = (player, ctx) => {
    const x = player.position.x;
    const y = player.position.y;
    ctx.drawImage(player.sprite_sheet,
        spriteX * blockSize, spriteY * blockSize, spriteSize, spriteSize,
        x * blockSize, y * blockSize, spriteSize, spriteSize);
};

const convertGameToCanvasState = (game) => {
    return {
        // players: [list of player Objects]
        players: Object.values(game.players)
    }
};

const loadAsset = (asset) => {
    return new Promise((resolve, reject) => {
        const assetImage = new Image(asset.size, asset.size);
        assetImage.src = assetsMap[asset.id];
        assetImage.onload(resolve);
        assetImage.onerror(reject);
    });
}

const loadAssets = async (canvasState) => {
    // load players
    const loadedImages = await Promises.all(canvasState.players.map(loadAsset))
    
    canvasState.players.forEach((player) => {
        const playerSprite = new Image(64, 64);
        playerSprite.src = characters[player.avatar_id];
        playerSprite.onload = () => {
            player.sprite_sheet = playerSprite;
        };
        
    });
}
// create promise move on

// create promises (loading image)
// Promise.all(those promises) to 

// Params
// canvasState: {
//  players: []                                     -- List of active players the game should render (Later on perform checks to see if a player is in screen, compare absolute positions to player positions)
// }
export const drawCanvas = (game, canvasRef) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    // Purposefully give dimensions so Canvas does not upscale inner images
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const canvasState = convertGameToCanvasState(game);
    loadAssets(canvasState);

    canvasState.players.forEach((player) => {
        drawPlayer(player, context)
    })
};