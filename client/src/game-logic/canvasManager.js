import assetlist from "../public/assets/asset-list";

const blockSize = 32;
const spriteSize = 32;
const tileSize = 64;

let spriteX = 0;
let spriteY = 0;

// The size of the screen in terms of the game's blocks
const screenBlockWidth = 17;
const screenBlockHeight = 17;

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
    branchtiles: {
      id: "branchtiles",
      size: 32,
      src: assetlist.branchtilemap,
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
//   const offset = 8;
//   const x = player.relative_position.x + offset;
//   const y = player.relative_position.y + offset;
  ctx.drawImage(
    assetsMap.avatars[player.avatar_id].imgObj,
    spriteX * blockSize,
    spriteY * blockSize,
    spriteSize,
    spriteSize,
    // Center of the screen
    8 * blockSize,      // x * blockSize
    8 * blockSize,      // y * blockSize
    spriteSize,
    spriteSize
  );
};

const drawBranchTile = (tile, ctx) => {
  const tilemapx = tile.id % 4;
  const tilemapy = Math.floor(tile.id / 4);
  ctx.drawImage(
    assetsMap.terrain.branchtiles.imgObj,
    tilemapx * tileSize,
    tilemapy * tileSize,
    tileSize,
    tileSize,
    tile.x * blockSize,
    tile.y * blockSize,
    blockSize,
    blockSize
  );
};

const drawBranchTiles = (map, ctx) => {
  for (let row = 0; row < map.length; row++) {
    for (let col = 0; col < map.length; col++) {
      if (map[row][col] === 1) {
        //assign a tile id based on neighbors
        let tileidx = 0;
        if (col - 1 >= 0 && map[row][col - 1] === 1) {
          tileidx += 3;
        }
        if (col + 1 < map.length && map[row][col + 1] === 1) {
          tileidx += 1;
        }
        if (tileidx === 4) {
          tileidx -= 2;
        }

        let tileidy = 0;
        if (row - 1 >= 0 && map[row - 1][col] === 1) {
          tileidy += 3;
        }
        if (row + 1 < map.length && map[row + 1][col] === 1) {
          tileidy += 1;
        }
        if (tileidy === 4) {
          tileidy -= 2;
        }

        const thisTile = {
            x: col,
            y: row,
            id: tileidy * 4 + tileidx,
        };
        
        drawBranchTile(thisTile, ctx);
      }
    }
  }
};

/*
    Return the terrain within the player's screen that needs to
    be rendered.

    Params:
    playerObj (object): An object with the player information
    chunkBlockSize (int): The chunk's width/length in terms of game blocks (i.e 17)
*/
const getMapToRender = (playerObj, chunkBlockSize) => {
    const relCoords = playerObj.relative_position;      // May have bugs from decimal places

    // Get the relevant chunks
    const currChunk = playerObj.rendered_chunks[1][1];
    // Get the number of columns and rows outside the current chunk that needs to be rendered
    const outsideChunkRight = (screenBlockWidth - 1)/2 - ((chunkBlockSize-1) - relCoords.x);
    const outsideChunkLeft = (screenBlockWidth - 1)/2 - relCoords.x;
    const outsideChunkUp = (screenBlockHeight - 1)/2 - relCoords.y;
    const outsideChunkDown = (screenBlockHeight - 1)/2 - ((chunkBlockSize-1) - relCoords.y);
    // Start loading mapToRender with objects in player's screen
    let mapToRender = [];
    const currChunkRenderableBorders = {
        top: relCoords.y - (screenBlockHeight-1)/2 >= 0 ? relCoords.y - (screenBlockHeight-1)/2 : 0,
        bottom: relCoords.y + (screenBlockHeight-1)/2 < chunkBlockSize ? relCoords.y + (screenBlockHeight-1)/2 : chunkBlockSize-1,
        left: relCoords.x - (screenBlockWidth-1)/2 >= 0 ? relCoords.x - (screenBlockHeight-1)/2 : 0,
        right: relCoords.x + (screenBlockWidth-1)/2 < chunkBlockSize ? relCoords.x + (screenBlockHeight-1)/2 : chunkBlockSize-1
    }
    for (let row = currChunkRenderableBorders.top; row <= currChunkRenderableBorders.bottom; row++) {
        let currRow = []
        for (let col = currChunkRenderableBorders.left; col <= currChunkRenderableBorders.right; col++) {
            currRow.push(currChunk[row][col]);
        }
        mapToRender.push(currRow);
    }
    console.log(currChunkRenderableBorders);
    // Check if player's screen displays chunks outside of current one
    let placeholderRow = 0;
    if (outsideChunkRight > 0) {
        const rightChunk = playerObj.rendered_chunks[1][2];
        for (let row = currChunkRenderableBorders.top; row <= currChunkRenderableBorders.bottom; row++) {
            for (let col = 0; col < outsideChunkRight; col++) {
                mapToRender[placeholderRow].push(rightChunk[row][col]);
            }
            placeholderRow++;
        }
        placeholderRow = 0;
    }
    if (outsideChunkLeft > 0) {
        const leftChunk = playerObj.rendered_chunks[1][0];
        for (let row = currChunkRenderableBorders.top; row <= currChunkRenderableBorders.bottom; row++) {
            for (let col = chunkBlockSize-1; col >= chunkBlockSize-outsideChunkLeft; col--) {
                mapToRender[placeholderRow].unshift(leftChunk[row][col]);
            }
            placeholderRow++;
        }
        placeholderRow = 0;
    }
    if (outsideChunkUp > 0) {
        const upChunk = playerObj.rendered_chunks[0][1];
        for (let row = chunkBlockSize-1; row>=chunkBlockSize-outsideChunkUp; row--) {
            let currRow = []
            for (let col = currChunkRenderableBorders.left; col <= currChunkRenderableBorders.right; col++) {
                currRow.push(upChunk[row][col]);
            }
            mapToRender.unshift(currRow);
        }
    }
    if (outsideChunkDown > 0) {
        const downChunk = playerObj.rendered_chunks[2][1];
        for (let row = 0; row < outsideChunkDown; row++) {
            let currRow = []
            for (let col = currChunkRenderableBorders.left; col <= currChunkRenderableBorders.right; col++) {
                currRow.push(downChunk[row][col]);
            }
            mapToRender.push(currRow);
        }
    }
    // Account for the diagonal chunks
    if (outsideChunkLeft > 0 && outsideChunkUp > 0) {
        const topLeftChunk = playerObj.rendered_chunks[0][0];
        for (let row = chunkBlockSize-outsideChunkUp; row<chunkBlockSize; row++) {
            for (let col = chunkBlockSize-1; col >= chunkBlockSize-outsideChunkLeft; col--) {
                mapToRender[placeholderRow].unshift(topLeftChunk[row][col]);
            }
            placeholderRow++;
        }
        placeholderRow = 0;
    }
    if (outsideChunkRight > 0 && outsideChunkUp > 0) {
        const topRightChunk = playerObj.rendered_chunks[2][0];
        for (let row = chunkBlockSize-outsideChunkUp; row<chunkBlockSize; row++) {
            for (let col = 0; col < outsideChunkRight; col++) {
                mapToRender[placeholderRow].push(topRightChunk[row][col]);
            }
            placeholderRow++;
        }
    }
    if (outsideChunkLeft > 0 && outsideChunkDown > 0) {
        const bottomLeftChunk = playerObj.rendered_chunks[0][2];
        placeholderRow = screenBlockHeight - outsideChunkDown;
        for (let row = 0; row < outsideChunkDown; row++) {
            for (let col = chunkBlockSize-1; col >= chunkBlockSize-outsideChunkLeft; col--) {
                mapToRender[placeholderRow].unshift(bottomLeftChunk[row][col]);
            }
            placeholderRow++;
        }
    }
    if (outsideChunkRight > 0 && outsideChunkDown > 0) {
        const bottomRightChunk = playerObj.rendered_chunks[2][2];
        placeholderRow = screenBlockHeight - outsideChunkDown;
        for (let row = 0; row < outsideChunkDown; row++) {
            for (let col = 0; col < outsideChunkRight; col++) {
                mapToRender[placeholderRow].push(bottomRightChunk[row][col]);
            }
            placeholderRow++;
        }
    }

    return mapToRender;
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
  //console.log(gamePacket);
  let incombat = false;
  let myplayerdata;
  let players;
  Object.values(gamePacket.game.arenas).forEach((arena) => {
    if (Object.hasOwn(arena.players, gamePacket.recipientid)) {
      incombat = true;
      players = arena.players;
    }
  });

  if (!incombat) {
    players = gamePacket.game.players;
    myplayerdata = players[gamePacket.recipientid].data;
    delete players[gamePacket.recipientid];
  }

  return {
    // players: {
    //  user._id: {data: playerObj, user: userObj}
    // }
    myplayerdata: myplayerdata,
    otherplayers: players,
    chunkblocksize: gamePacket.game.chunkBlockSize
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

export const drawCanvas = (gamePacket, canvasRef) => {
  const canvas = canvasRef.current;
  if (!canvas) return;
  const context = canvas.getContext("2d");
  // Purposefully give dimensions so Canvas does not upscale inner images
  canvas.width = 544;
  canvas.height = 544;

  const canvasState = convertGameToCanvasState(Object.assign({}, JSON.parse(gamePacket.json)));

  // Object.values(canvasState.players).forEach((playerObj) => {
  //     drawPlayer(playerObj.data, context);
  // });
  if (!canvasState.incombat) {
    drawPlayer(canvasState.myplayerdata, context);
    Object.values(canvasState.otherplayers).forEach((player) => {
      if (
        canvasState.myplayerdata.chunk.x == player.data.chunk.x &&
        canvasState.myplayerdata.chunk.y == player.data.chunk.y
      ) {
        drawPlayer(player.data, context);
      }
    });
    //drawTrees(canvasState.myplayerdata, context);
    const mapToRender = getMapToRender(canvasState.myplayerdata, canvasState.chunkblocksize);
    drawBranchTiles(mapToRender, context);
  } else {
    canvasState.otherplayers.forEach((player, id) => {
      drawPlayer(player, context);
    });
  }
//   getMapToRender(canvasState.myplayerdata, canvasState.chunkblocksize);
};
