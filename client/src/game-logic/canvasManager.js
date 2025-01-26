import assetlist from "../public/assets/asset-list";
import help from "./helpers";

let blockSize = 32;
let playerSize = 32;

let spriteSize = 32;
let tileSize = 64;

let spriteX = 0;
let spriteY = 0;

// The size of the screen in terms of the game's blocks
const screenMinBlocks = 17;
let screenBlockWidth = 17;
let screenBlockHeight = 17;
let canvasCenter = { x: 0, y: 0 };

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

// Params:
// player: {
//  rendered_position: {x: value, y: value}         -- Block Coordinates relative to Screen, not entire map with (0,0) being center
//  avatar_id: id
// }
// ctx: context                                     -- Game Canvas context
const drawPlayer = (player, ctx) => {
  player.rendered_position = help.addCoords(player.rendered_position, canvasCenter);
  ctx.drawImage(
    assetsMap.avatars[player.avatar_id].imgObj,
    spriteX * spriteSize,
    spriteY * spriteSize,
    spriteSize,
    spriteSize,
    player.rendered_position.x * blockSize - playerSize / 2, //center of player is rendered at position, not top left of player
    player.rendered_position.y * blockSize - playerSize / 2,
    blockSize,
    blockSize
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
    for (let col = 0; col < map[row].length; col++) {
      if (map[row][col] === 1) {
        //assign a tile id based on neighbors
        let tileidx = 0;
        if (col - 1 >= 0 && map[row][col - 1] === 1) {
          tileidx += 3;
        }
        if (col + 1 < map[0].length && map[row][col + 1] === 1) {
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
            x: (map[0].length - 1) / 2,
            y: (map.length - 1) / 2,
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
          x: col - (map[0].length - screenBlockWidth) / 2 + offset.x,
          y: row - (map.length - screenBlockHeight) / 2 + offset.y,
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
  for (let chunkRow = 0; chunkRow < playerObj.rendered_chunks.length; chunkRow++) {
    for (let thisRow = 0; thisRow < playerObj.rendered_chunks[0][0].length; thisRow++) {
      const currentRow = [];
      for (let chunkCol = 0; chunkCol < playerObj.rendered_chunks.length; chunkCol++) {
        for (let thisCol = 0; thisCol < playerObj.rendered_chunks[0][0].length; thisCol++) {
          currentRow.push(playerObj.rendered_chunks[chunkRow][chunkCol][thisRow][thisCol]);
        }
        if (chunkCol < playerObj.rendered_chunks.length - 1) {
          currentRow.pop();
        }
      }
      combinedChunks.push(currentRow);
    }
    if (chunkRow < playerObj.rendered_chunks.length - 1) {
      combinedChunks.pop();
    }
  }

  const relCoords = help.roundCoord(
    help.subtractCoords(playerObj.camera_center, playerObj.chunk_center)
  );

  const mapToRender = [];

  const mapSize = {
    width: (Math.floor((screenBlockWidth - 1) / 2) + 1) * 2 + 1,
    height: (Math.floor((screenBlockHeight - 1) / 2) + 1) * 2 + 1,
  };

  for (let row = 0; row < combinedChunks.length; row++) {
    if (
      row - relCoords.y >= (combinedChunks.length - 1) / 2 - (screenBlockHeight + 1) / 2 &&
      row - relCoords.y <= (combinedChunks.length - 1) / 2 + (screenBlockHeight + 1) / 2
    ) {
      const currentRow = [];
      for (let col = 0; col < combinedChunks.length; col++) {
        if (
          col - relCoords.x >= (combinedChunks.length - 1) / 2 - (screenBlockWidth + 1) / 2 &&
          col - relCoords.x <= (combinedChunks.length - 1) / 2 + (screenBlockWidth + 1) / 2
        ) {
          currentRow.push(combinedChunks[row][col]);
        }
      }

      if (currentRow.length < mapSize.width) {
        if (relCoords.x > 0) {
          while (currentRow.length < mapSize.width) {
            currentRow.push(0);
          }
        } else {
          while (currentRow.length < mapSize.width) {
            currentRow.unshift(0);
          }
        }
      }

      mapToRender.push(currentRow);
    }
  }

  if (mapToRender.length < mapSize.height) {
    if (relCoords.y > 0) {
      while (mapToRender.length < mapSize.height) {
        mapToRender.push(Array(mapSize.width).fill(0));
      }
    } else {
      while (mapToRender.length < mapSize.height) {
        mapToRender.unshift(Array(mapSize.width).fill(0));
      }
    }
  }
  if (mapToRender[0].length != mapSize.width) {
  }
  return mapToRender;
};

/*
    Return the canvas state given a game packet, including
    player information and combat state

    Params:
    gamePacket (object): The game packet object that was received from the socket
*/
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

  //player is exploring maze
  if (!incombat) {
    players = gamePacket.game.players;
    myplayerdata = players[gamePacket.recipientid].data;
    delete players[gamePacket.recipientid];
    map = getMapToRender(myplayerdata, gamePacket.game.chunkBlockSize);
    return {
      incombat: incombat,
      myplayerdata: myplayerdata,
      otherplayers: players,
      chunkblocksize: gamePacket.game.chunkBlockSize,
      map: map,
    };
  }
  //player is in arena combat
  else {
    myplayerdata = players[gamePacket.recipientid];
    return {
      incombat: true,
      players: players,
      myplayerdata: myplayerdata,
    };
  }
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

/*
    Renders the game canvas based on game state info

    Params:
    gamePacket (object): The game packet object that was received from the socket
    canvasRed (Reference): The reference to the current canvas
    dimensions {
      width: width of game canvas
      height: height of game canvas
    }
*/
export const drawCanvas = (gamePacket, canvasRef, dimensions) => {
  const canvas = canvasRef.current;
  if (!canvas) return;
  const context = canvas.getContext("2d");
  // Purposefully give dimensions so Canvas does not upscale inner images
  canvas.width = dimensions.width;
  canvas.height = dimensions.height;

  if (dimensions.width > dimensions.height) {
    screenBlockWidth = (screenMinBlocks * dimensions.width) / dimensions.height;
    screenBlockHeight = screenMinBlocks;
    blockSize = dimensions.height / screenMinBlocks;
  } else {
    screenBlockHeight = (screenMinBlocks * dimensions.height) / dimensions.width;
    screenBlockWidth = screenMinBlocks;
    blockSize = dimensions.width / screenMinBlocks;
  }

  canvasCenter = { x: screenBlockWidth / 2, y: screenBlockHeight / 2 };

  const canvasState = convertGameToCanvasState(Object.assign({}, JSON.parse(gamePacket.json)));

  //if player exploring maze, render maze
  if (!canvasState.incombat) {
    Object.values(canvasState.otherplayers).forEach((player) => {
      if (
        help.coordDist(canvasState.myplayerdata.position, player.data.position) <
        canvasState.chunkblocksize * 2
      ) {
        player.data.rendered_position = help.addCoords(
          canvasState.myplayerdata.rendered_position,
          help.subtractCoords(player.data.position, canvasState.myplayerdata.position)
        );
        drawPlayer(player.data, context);
      }
    });
    drawPlayer(canvasState.myplayerdata, context);

    const playerPos = canvasState.myplayerdata.camera_center;
    drawBranchTiles(
      canvasState,
      help.subtractCoords(help.roundCoord(playerPos), playerPos),
      context
    );
  }
  //if player in combat, render that arena
  else {
    Object.values(canvasState.players).forEach((player, id) => {
      drawPlayer(player, context);
    });
  }
};
