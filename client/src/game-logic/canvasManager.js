import witchCatImage from "../public/assets/goob.png";
import treeImage from "../public/assets/tree.png";
import assetlist from "../public/assets/asset-list";

const blockSize = 32;
const spriteSize = 32;

let spriteX = 0;
let spriteY = 0;

// Path is relative to 'dist' folder
let assetsMap = {
  avatars: {
    witch_cat: {
      id: "witch_cat",
      size: 32,
      src: assetlist.goob,
      imgObj: null,
    },
  },
  terrain: {
    tree: {
      id: "tree",
      size: 32,
      src: assetlist.tree,
      imgObj: null,
    },
  },
};

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
  const offset = 8; // hardcode
  const x = player.relative_position.x + offset;
  const y = player.relative_position.y + offset;
  ctx.drawImage(
    assetsMap.avatars[player.avatar_id].imgObj,
    spriteX * blockSize,
    spriteY * blockSize,
    spriteSize,
    spriteSize,
    x * blockSize,
    y * blockSize,
    spriteSize,
    spriteSize
  );
};

const drawTrees = (playerObj, ctx) => {
  // Chunk to render
  const chunk = playerObj.rendered_chunks[1][1];
  // console.log(chunk)
  for (let row = 0; row < chunk.length; row++) {
    for (let col = 0; col < chunk.length; col++) {
      if (chunk[row][col] === 1) {
        // ctx.drawImage(assetsMap.terrain.tree.imgObj, row * blockSize, col * blockSize);
        ctx.fillRect(col * blockSize, row * blockSize, 32, 32);
      }
    }
  }
};

// gamePacket:
// {
//   game: gameObj
// }
const convertGameToCanvasState = (gamePacket) => {
  const players = new Map(Object.entries(gamePacket.game.playersObj));
  const myplayerdata = players.get(gamePacket.recipientid).data;
  players.delete(gamePacket.recipientid);
  return {
    // players: {
    //  user._id: {data: playerObj, user: userObj}
    // }
    myplayerdata: myplayerdata,
    otherplayers: players,
  };
};

const loadAsset = (asset) => {
  return new Promise((resolve, reject) => {
    console.log("loading", asset.id);

    const assetImage = new Image(asset.size, asset.size);
    assetImage.src = asset.src;
    assetImage.onload = () => resolve({ id: asset.id, imgObj: assetImage });
    assetImage.onerror = (e) => {
      reject(new Error(`Image does not exist. URL: ${asset.src}`));
    };
  });
};

const loadAssets = async () => {
  // load players
  const loadedPlayers = await Promise.all(Object.values(assetsMap.avatars).map(loadAsset));
  loadedPlayers.forEach((asset) => {
    assetsMap.avatars[asset.id].imgObj = asset.imgObj;
  });
  // load terrain
  const loadedTerrain = await Promise.all(Object.values(assetsMap.terrain).map(loadAsset));
  loadedTerrain.forEach((asset) => {
    assetsMap.terrain[asset.id].imgObj = asset.imgObj;
  });
};

// Call when game is started
loadAssets();

// Params
// canvasState: {
//  players: []                                     -- List of active players the game should render (Later on perform checks to see if a player is in screen, compare absolute positions to player positions)
// }
export const drawCanvas = (gamePacket, canvasRef) => {
  const canvas = canvasRef.current;
  if (!canvas) return;
  const context = canvas.getContext("2d");
  // Purposefully give dimensions so Canvas does not upscale inner images
  canvas.width = 544;
  canvas.height = 544;

  const canvasState = convertGameToCanvasState(gamePacket);

  // Object.values(canvasState.players).forEach((playerObj) => {
  //     drawPlayer(playerObj.data, context);
  // });
  drawPlayer(canvasState.myplayerdata, context);
  Array.from(canvasState.otherplayers.values()).forEach((player) => {
    if (
      canvasState.myplayerdata.chunk.x == player.data.chunk.x &&
      canvasState.myplayerdata.chunk.y == player.data.chunk.y
    ) {
      drawPlayer(player.data, context);
    }
  });
  drawTrees(canvasState.myplayerdata, context);
};
