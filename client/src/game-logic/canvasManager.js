import assetlist from "../public/assets/asset-list";
import help from "./helpers";

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
  ctx.drawImage(
    assetsMap.avatars[player.avatar_id].imgObj,
    spriteX * blockSize,
    spriteY * blockSize,
    spriteSize,
    spriteSize,
    player.rendered_position.x * blockSize,
    player.rendered_position.y * blockSize,
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
    (tile.x + (1 - tile.size) / 2) * blockSize,
    (tile.y + (1 - tile.size) / 2) * blockSize,
    blockSize * tile.size,
    blockSize * tile.size
  );
};

const drawBranchTiles = (canvasState, offset, ctx) => {
  const map = canvasState.map;
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

        const tileCoord = help.addCoords(
          canvasState.myplayerdata.camera_center,
          help.subtractCoords(help.addCoords({ x: col, y: row }, offset), {
            x: (canvasState.chunkblocksize + 1) / 2,
            y: (canvasState.chunkblocksize + 1) / 2,
          })
        );

        const getSize = (dist, minDist, maxDist) => {
          if (dist < minDist) {
            return 1;
          }
          if (dist > maxDist) {
            return 0;
          }
          return 1 - (dist - minDist) / (maxDist - minDist);
        };

        let tileDist = help.coordDist(tileCoord, canvasState.myplayerdata.position);

        let maxSize = getSize(tileDist, 5, 8);

        Object.values(canvasState.otherplayers).forEach((player) => {
          tileDist = help.coordDist(tileCoord, player.data.position);
          const thisSize = getSize(tileDist, 3, 5);
          if (thisSize > maxSize) {
            maxSize = thisSize;
          }
        });

        const thisTile = {
          x: col + offset.x - 1,
          y: row + offset.y - 1,
          id: tileidy * 4 + tileidx,
          size: maxSize,
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
  const combinedChunks = [];
  for (let chunkRow = 0; chunkRow < 3; chunkRow++) {
    for (let thisRow = 0; thisRow < chunkBlockSize; thisRow++) {
      const currentRow = [];
      for (let chunkCol = 0; chunkCol < 3; chunkCol++) {
        for (let thisCol = 0; thisCol < chunkBlockSize; thisCol++) {
          currentRow.push(playerObj.rendered_chunks[chunkRow][chunkCol][thisRow][thisCol]);
        }
        if (chunkCol < 2) {
          currentRow.pop();
        }
      }
      combinedChunks.push(currentRow);
    }
    if (chunkRow < 2) {
      combinedChunks.pop();
    }
  }

  const relCoords = help.roundCoord(
    help.subtractCoords(playerObj.camera_center, playerObj.chunk_center)
  );

  const mapToRender = [];
  for (let row = 0; row < chunkBlockSize * 3 - 2; row++) {
    if (
      row - relCoords.y >= chunkBlockSize - 2 &&
      row - relCoords.y <= (chunkBlockSize - 1) * 2 + 1
    ) {
      const currentRow = [];
      for (let col = 0; col < chunkBlockSize * 3 - 2; col++) {
        if (
          col - relCoords.x >= chunkBlockSize - 2 &&
          col - relCoords.x <= (chunkBlockSize - 1) * 2 + 1
        ) {
          currentRow.push(combinedChunks[row][col]);
        }
      }
      mapToRender.push(currentRow);
    }
  }

  return mapToRender;
};

// gamePacket:
// {
//   game: gameObj
// }
const convertGameToCanvasState = (gamePacket) => {
  let incombat = false;
  let myplayerdata;
  let players;
  let map;
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
    map = getMapToRender(myplayerdata, gamePacket.game.chunkBlockSize);
  } else {
    myplayerdata = players[gamePacket.recipientid];
    myplayerdata.rendered_position = { x: myplayerdata.pos.x - 8, y: myplayerdata.pos.y - 8 };
  }

  return {
    // players: {
    //  user._id: {data: playerObj, user: userObj}
    // }
    incombat: incombat,
    myplayerdata: myplayerdata,
    otherplayers: players,
    chunkblocksize: gamePacket.game.chunkBlockSize,
    map: map,
  };
};

const loadAsset = (asset) => {
  return new Promise((resolve, reject) => {
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
        help.coordDist(canvasState.myplayerdata.position, player.data.position) <
        canvasState.chunkblocksize
      ) {
        player.data.rendered_position = help.addCoords(
          canvasState.myplayerdata.rendered_position,
          help.subtractCoords(player.data.position, canvasState.myplayerdata.position)
        );
        drawPlayer(player.data, context);
      }
    });
    //drawTrees(canvasState.myplayerdata, context);
    const playerPos = canvasState.myplayerdata.camera_center;
    drawBranchTiles(
      canvasState,
      help.subtractCoords(help.roundCoord(playerPos), playerPos),
      context
    );
  } else {
    Object.values(canvasState.otherplayers).forEach((player, id) => {
      drawPlayer(player, context);
    });
  }
  //   getMapToRender(canvasState.myplayerdata, canvasState.chunkblocksize);
};
