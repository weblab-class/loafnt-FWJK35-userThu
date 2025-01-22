const blockSize = 64;
const spriteSize = 64;

let spriteX = 0;
let spriteY = 0;

// Path is relative to 'dist' folder
let assetsMap = {
    avatars: {
        witch_cat: {id: "witch_cat", size: 64, src: "../src/public/assets/calicoKitty_walk.png", imgObj: null},
    },
    terrain: {
        tree: {id: "tree", size: 64, src: "../src/public/assets/tree.png", imgObj: null}
    }
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
    ctx.drawImage(assetsMap.avatars[player.avatar_id].imgObj,
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
    return new Promise((resolve) => {
        const assetImage = new Image(asset.size, asset.size);
        assetImage.src = asset.src;
        assetImage.onload = () => resolve({id: asset.id, imgObj: assetImage});
    });
}

const loadAssets = async () => {
    // load players
    const loadedPlayers = await Promise.all(Object.values(assetsMap.avatars).map(loadAsset));
    loadedPlayers.forEach((asset) => {
        assetsMap.avatars[asset.id].imgObj = asset.imgObj;
    });
    // load terrain
    
}

// Call when game is started
loadAssets();

// Params
// canvasState: {
//  players: []                                     -- List of active players the game should render (Later on perform checks to see if a player is in screen, compare absolute positions to player positions)
// }
export const drawCanvas = (game, canvasRef) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    // Purposefully give dimensions so Canvas does not upscale inner images
    canvas.width = 1280;
    canvas.height = 704;

    const canvasState = convertGameToCanvasState(game);
    
    canvasState.players.forEach((player) => {
        drawPlayer(player, context)
    })
};