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

/*
  asset: {
    id: "asset",
    imageSize: { width: 32, height: 32 },
    spriteSize: 32,
    blockSize: 1,
    src: assetlist.goob,
    imgObj: null,
  }
*/
let assetsMap = {
    avatars: {
        witch_cat: {
            id: "witch_cat",
            imageSize: { width: 32, height: 32 },
            spriteSize: 32,
            blockSize: 1,
            src: assetlist.goob,
            imgObj: null,
        },
    },
    enemies: {
        boss: {
            id: "boss",
            spriteSize: 128,
            imageSize: { width: 128, height: 128 },
            blockSize: 8,
            src: assetlist.boss,
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
            imageSize: { width: 256, height: 256 },
            spriteSize: 64,
            blockSize: 1,
            src: assetlist.branchtilemap,
            imgObj: null,
        },
        pathtiles: {
            id: "pathtiles",
            imageSize: { width: 256, height: 256 },
            spriteSize: 64,
            blockSize: 1,
            src: assetlist.pathtilemap,
            imgObj: null,
        },
    },
    UI: {
        fullheart: {
            id: "fullheart",
            imageSize: {width: 32, height: 32},
            spriteSize: 32,
            blockSize: 1,
            src: assetlist.fullheart,
            imgObj: null,
        },
        halfheart: {
            id: "halfheart",
            imageSize: {width: 32, height: 32},
            spriteSize: 32,
            blockSize: 1,
            src: assetlist.halfheart,
            imgObj: null,
        },
        inventoryslot: {
            id: "inventoryslot",
            imageSize: {width: 32, height: 32},
            spriteSize: 32,
            blockSize: 1,
            src: assetlist.inventoryslot,
            imgObj: null,
        },
        selectedslot: {
            id: "selectedslot",
            imageSize: {width: 32, height: 32},
            spriteSize: 32,
            blockSize: 1,
            src: assetlist.selectedslot,
            imgObj: null,
        },
    },
    items: {
        lantern: {
            id: "lantern",
            imageSize: {width: 32, height: 32},
            spriteSize: 32,
            blockSize: 1,
            src: assetlist.lantern,
            imgObj: null,
        },
    }
};

/*
Params:
sprite: {
  rendered_position: {x: value, y: value}         -- Block Coordinates relative to Screen, not entire map with (0,0) being center
  animation: value                                -- The integer value of the current animation frame
  scale: value                                    -- A float for how much to scale the sprite size
 }
asset: {
  imageSize: {width: value, height: value}        -- The size of the source sprite image
  spriteSize: value                               -- The size of one frame of the sprite in the source image
  imgObj: reference                               -- The loaded image object
  blockSize: value                                -- The size of the sprite in blocks
}
ctx: context                                     -- Game Canvas context

NOTE: all sprites are assumed to be square lmao
*/
const drawSprite = (sprite, asset, ctx) => {
  //translate rendered position so it is relative to top left
  sprite.rendered_position = help.addCoords(sprite.rendered_position, canvasCenter);
  //get position in source image of current animation
  const spriteX = sprite.animation % (asset.imageSize.width / asset.spriteSize);
  const spriteY = Math.floor(sprite.animation / (asset.imageSize.width / asset.spriteSize));
  ctx.drawImage(
    asset.imgObj,
    spriteX * asset.spriteSize,
    spriteY * asset.spriteSize,
    asset.spriteSize,
    asset.spriteSize,
    //center of sprite is rendered at position instead of top left
    (sprite.rendered_position.x -
      asset.blockSize / 2 +
      (asset.blockSize * (1 - sprite.scale)) / 2) *
      blockSize,
    (sprite.rendered_position.y -
      asset.blockSize / 2 +
      (asset.blockSize * (1 - sprite.scale)) / 2) *
      blockSize,
    sprite.scale * asset.blockSize * blockSize,
    sprite.scale * asset.blockSize * blockSize
  );
  
};

const drawPlayer = (player, ctx) => {
    const itemRenderedPosition = player.rendered_position;
    player.animation = 0;
    player.scale = 1;
    drawSprite(player, assetsMap.avatars[player.avatar_id], ctx);
    // Draw the player's item
    const itemData = player.inventory.inventory[0][player.inventory.selected];
    if (itemData !== null) {
        const itemAsset = assetsMap.items[itemData.itemID];
        const itemSprite = {
            rendered_position: {x: itemRenderedPosition.x-.5, y: itemRenderedPosition.y},
            animation: 0,
            scale: 1
        }
        drawSprite(itemSprite, itemAsset, ctx);
    }
};
  
  const drawEnemy = (enemy, ctx) => {
    enemy.rendered_position = Object.assign({}, enemy.position);
    enemy.animation = 0;
    enemy.scale = 1;
    drawSprite(enemy, assetsMap.enemies[enemy.type], ctx);
  };

const drawBranchTile = (tile, ctx) => {
  tile.animation = tile.id;
  tile.rendered_position = help.subtractCoords({ x: tile.x + 0.5, y: tile.y + 0.5 }, canvasCenter);
  tile.scale = tile.size;
  drawSprite(tile, assetsMap.terrain.branchtiles, ctx);
};

const drawPathTile = (tile, ctx) => {
  tile.animation = tile.id;
  tile.rendered_position = help.subtractCoords({ x: tile.x + 0.5, y: tile.y + 0.5 }, canvasCenter);
  tile.scale = tile.size;
  drawSprite(tile, assetsMap.terrain.pathtiles, ctx);
};

const drawTiles = (canvasState, offset, ctx) => {
  const map = canvasState.map;
  for (let row = 0; row < map.length; row++) {
    for (let col = 0; col < map[row].length; col++) {
      const tileType = map[row][col];
      //assign a tile id based on neighbors of same type

      let tileidx = 0;
      if (col - 1 >= 0 && map[row][col - 1] === tileType) {
        tileidx += 3;
      }
      if (col + 1 < map[0].length && map[row][col + 1] === tileType) {
        tileidx += 1;
      }
      if (tileidx === 4) {
        tileidx -= 2;
      }

      let tileidy = 0;
      if (row - 1 >= 0 && map[row - 1][col] === tileType) {
        tileidy += 3;
      }
      if (row + 1 < map.length && map[row + 1][col] === tileType) {
        tileidy += 1;
      }
      if (tileidy === 4) {
        tileidy -= 2;
      }
      const tileid = tileidy * 4 + tileidx;

      const tileCoord = help.addCoords(
        canvasState.myplayerdata.camera_center,
        help.subtractCoords(help.addCoords({ x: col, y: row }, offset), {
          x: (map[0].length - 1) / 2,
          y: (map.length - 1) / 2,
        })
      );

      if (tileType === 1) {
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
      } else if (tileType === 2) {
        let thisTileSize = 1;
        const borderFadeStart = 3;
        const borderFadeDist = 2;
        if (
          Math.abs(tileCoord.x - canvasState.myplayerdata.camera_center.x) >
          screenBlockWidth / 2 - borderFadeStart
        ) {
          thisTileSize = Math.max(
            0,
            (screenBlockWidth / 2 -
              borderFadeStart +
              borderFadeDist -
              Math.abs(tileCoord.x - canvasState.myplayerdata.camera_center.x)) /
              borderFadeDist
          );
        }
        if (
          Math.abs(tileCoord.y - canvasState.myplayerdata.camera_center.y) >
          screenBlockHeight / 2 - borderFadeStart
        ) {
          thisTileSize = Math.min(
            Math.max(
              0,
              (screenBlockHeight / 2 -
                borderFadeStart +
                borderFadeDist -
                Math.abs(tileCoord.y - canvasState.myplayerdata.camera_center.y)) /
                borderFadeDist
            ),
            thisTileSize
          );
        }

        const thisTile = {
          x: col - (map[0].length - screenBlockWidth) / 2 + offset.x,
          y: row - (map.length - screenBlockHeight) / 2 + offset.y,
          id: tileidy * 4 + tileidx,
          size: thisTileSize,
        };
        drawPathTile(thisTile, ctx);
      }
    }
  }
};

/*
    Given the player's information, render the following UI features onto
    the provided canvas context: health, inventory, gear
*/
const drawUI = (playerObj, ctx) => {
    // Render the player's hearts
    for (let heartIdx = 0; heartIdx < playerObj.health.length; heartIdx++) {
        const heartVal = playerObj.health[heartIdx];
        const padding = blockSize/4;
        const heartSize = blockSize * 3/4 // Size of rendered heart
        let heartImgSize;   // Size of the actual image
        let heartImg;
        if (heartVal === 1) {
            heartImg = assetsMap.UI["fullheart"].imgObj;
            heartImgSize = assetsMap.UI["fullheart"].imageSize.width;
        } else if (heartVal === 0.5) {
            heartImg = assetsMap.UI["halfheart"].imgObj;
            heartImgSize = assetsMap.UI["halfheart"].imageSize.width;
        }
        ctx.drawImage(
            heartImg,
            0, 0,
            heartImgSize, heartImgSize,
            heartIdx * (heartSize + padding) + padding, // 
            padding,
            heartSize, heartSize
        );
    }
    // Render the first line of the player's inventory
    const inventoryRow = playerObj.inventory.inventory[0];
    // Length of the rendered row in pixels
    const rowLength = inventoryRow.length * blockSize;
    // The leftmost coordinate of the row
    const rowX = ((window.innerWidth / 2) - rowLength/2);
    // The topmost coordinate of the row
    const rowY = window.innerHeight - (blockSize * 5/4);
    for (let itemIdx = 0; itemIdx < inventoryRow.length; itemIdx++) {
        // Render the inventory slot 
        const inventoryslotImg = playerObj.inventory.selected === itemIdx ? assetsMap.UI["selectedslot"] : assetsMap.UI["inventoryslot"];
        ctx.drawImage(
            inventoryslotImg.imgObj,
            0, 0,
            inventoryslotImg.imageSize.width, inventoryslotImg.imageSize.width,
            rowX + (itemIdx * blockSize),
            rowY,
            blockSize, blockSize
        );
        if (inventoryRow[itemIdx] !== null) {
            // Render the item
            const item = inventoryRow[itemIdx];
            if (assetsMap.items[item.itemID] !== undefined) {
                const itemImg = assetsMap.items[item.itemID];
                ctx.drawImage(
                    itemImg.imgObj,
                    0, 0,
                    itemImg.imageSize.width, itemImg.imageSize.width,
                    rowX + (blockSize * itemIdx),
                    rowY,
                    blockSize, blockSize
                )
            }
        }
    }
}

/*
    Given the player's information, render their inventory and player loadout onto
    the provided canvas context. (This is the expanded inventory screen).
*/
const drawInventoryScreen = (playerObj, ctx) => {

}

const drawSelectedItem = (playerObj, ctx) => {
    
}

const drawArena = (canvasState, ctx) => {
  //render all enemies
  Object.values(canvasState.arena.enemies).forEach((enemy) => {
    drawEnemy(enemy, ctx);
  });

  //render all players
  Object.values(canvasState.players).forEach((player) => {
    drawPlayer(player, ctx);
  });

  //draw borders
  ctx.fillStyle = "#000000";
  //left border
  ctx.fillRect(
    0,
    0,
    ((screenBlockWidth - canvasState.arena.size.width) / 2) * blockSize,
    screenBlockHeight * blockSize
  );
  //top border
  ctx.fillRect(
    0,
    0,
    screenBlockWidth * blockSize,
    ((screenBlockHeight - canvasState.arena.size.height) / 2) * blockSize
  );
  //right border
  ctx.fillRect(
    screenBlockWidth * blockSize,
    screenBlockHeight * blockSize,
    -((screenBlockWidth - canvasState.arena.size.width) / 2) * blockSize,
    -screenBlockHeight * blockSize
  );
  //bottom border
  ctx.fillRect(
    screenBlockWidth * blockSize,
    screenBlockHeight * blockSize,
    -screenBlockWidth * blockSize,
    -((screenBlockHeight - canvasState.arena.size.height) / 2) * blockSize
  );
};

const drawMaze = (canvasState, ctx) => {
  const playerPos = canvasState.myplayerdata.camera_center;
  drawTiles(canvasState, help.subtractCoords(help.roundCoord(playerPos), playerPos), ctx);

  Object.values(canvasState.otherplayers).forEach((player) => {
    if (
      help.coordDist(canvasState.myplayerdata.position, player.data.position) <
      canvasState.chunkblocksize * 2
    ) {
      player.data.rendered_position = help.addCoords(
        canvasState.myplayerdata.rendered_position,
        help.subtractCoords(player.data.position, canvasState.myplayerdata.position)
      );
      drawPlayer(player.data, ctx);
    }
  });
  drawPlayer(canvasState.myplayerdata, ctx);
  drawUI(canvasState.myplayerdata, ctx);
};

/*
    Return the terrain within the player's screen that needs to
    be rendered.

    Params:
    playerObj (object): An object with the player information
    chunkBlockSize (int): The chunk's width/length in terms of game blocks (i.e 17)
    mode (String): Indicate which canvas to render
*/
const getMapToRender = (playerObj, chunkBlockSize) => {
    let rendered_chunks = playerObj.rendered_chunks;
    if (playerObj.mode.type === "invisible-maze") rendered_chunks = playerObj.mode.packet.chunks;
    // Create a single 2d array containing all blocks in the rendered area
  const combinedChunks = [];
  for (let chunkRow = 0; chunkRow < playerObj.rendered_chunks.length; chunkRow++) {
    for (let thisRow = 0; thisRow < playerObj.rendered_chunks[0][0].length; thisRow++) {
      const currentRow = [];
      for (let chunkCol = 0; chunkCol < playerObj.rendered_chunks.length; chunkCol++) {
        for (let thisCol = 0; thisCol < playerObj.rendered_chunks[0][0].length; thisCol++) {
          const thisCell = playerObj.rendered_chunks[chunkRow][chunkCol][thisRow][thisCol];
          currentRow.push(thisCell);
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

    // Get the player's relative coordinates 
    const relCoords = help.roundCoord(
        help.subtractCoords(playerObj.camera_center, playerObj.chunk_center)
    );

    const mapToRender = [];

  //size of the rendered map on player's screen in block coordinates
  const mapSize = {
    width: (Math.floor((screenBlockWidth - 1) / 2) + 1) * 2 + 1,
    height: (Math.floor((screenBlockHeight - 1) / 2) + 1) * 2 + 1,
  };

  // Select desired rows and columns from combined chunks to render
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

        //add empty rendered areas if current map isn't big enough
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

  //add empty rendered areas if current map isn't big enough
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

  //fill in connecting path tiles
  for (let y = 0; y < mapToRender.length; y++) {
    for (let x = 0; x < mapToRender[0].length; x++) {
      if (mapToRender[y][x] === 0) {
        let adjacentCount = 0;
        if (y - 1 >= 0 && mapToRender[y - 1][x] === 2) {
          adjacentCount += 1;
        }
        if (y + 1 < mapToRender.length && mapToRender[y + 1][x] === 2) {
          adjacentCount += 1;
        }
        if (x - 1 >= 0 && mapToRender[y][x - 1] === 2) {
          adjacentCount += 1;
        }
        if (x + 1 < mapToRender[0].length && mapToRender[y][x + 1] === 2) {
          adjacentCount += 1;
        }
        if (adjacentCount >= 2) {
          mapToRender[y][x] = 2;
        }
      }
    }
  }

  //return the 2d array containing all cells to render with int ids corresponding to type
  //0: empty
  //1: branch tile
  //2: path tile
  return mapToRender;
};

/*
    Return the canvas state given a game packet, including
    player information and combat state

    Params:
    gamePacket (Object): The game packet object that was received from the socket

    Returns:
    canvasState (Object):
*/
const convertGameToCanvasState = (gamePacket) => {
    let incombat = false;
    let myplayerdata;
    let players;
    let map;
    let myarena;

    // Scan through every arena in the game and check if it contains players
    Object.values(gamePacket.game.arenas).forEach((arena) => {
        if (Object.hasOwn(arena.players, gamePacket.recipientid)) {
        incombat = true;
        players = arena.players;
        myarena = arena;
        }
    });

    // Player is exploring maze
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
    // Player is in arena combat
    else {
        myplayerdata = players[gamePacket.recipientid];
        return {
            incombat: true,
            players: players,
            myplayerdata: myplayerdata,
            arena: myarena,
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
  //load enemies
  const loadedEnemies = await Promise.all(Object.values(assetsMap.enemies).map(loadAsset));
  loadedEnemies.forEach((asset) => {
    assetsMap.enemies[asset.id].imgObj = asset.imgObj;
  });

  // load terrain
  const loadedTerrain = await Promise.all(Object.values(assetsMap.terrain).map(loadAsset));
  loadedTerrain.forEach((asset) => {
    assetsMap.terrain[asset.id].imgObj = asset.imgObj;
  });
  // load UI
  const loadedUI = await Promise.all(Object.values(assetsMap.UI).map(loadAsset));
  loadedUI.forEach((asset) => {
    assetsMap.UI[asset.id].imgObj = asset.imgObj;

  });
  // load items
  const loadedItems = await Promise.all(Object.values(assetsMap.items).map(loadAsset));
  loadedItems.forEach((asset) => {
    assetsMap.items[asset.id].imgObj = asset.imgObj;
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
      width: width of game canvas/user's screen
      height: height of game canvas/user's screen
    }
*/
export const drawCanvas = (gamePacket, canvasRef, dimensions) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    // Purposefully give dimensions so Canvas does not upscale inner images
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    /*
        Calculate the dimensions of the screen in terms of game "blocks"
        blockSize: The number of pixels in a game "block", which is dependent on the
        user's screen.
    */
    if (dimensions.width > dimensions.height) {
        screenBlockWidth = (screenMinBlocks * dimensions.width) / dimensions.height; // Can also think of blockSize * dimensions.width
        screenBlockHeight = screenMinBlocks;
        blockSize = dimensions.height / screenMinBlocks;
    } else {
        screenBlockHeight = (screenMinBlocks * dimensions.height) / dimensions.width;
        screenBlockWidth = screenMinBlocks;
        blockSize = dimensions.width / screenMinBlocks;
    }
    // playerSize (in terms of pixels): The player is equal to the size of one block
    playerSize = blockSize * 1;

    canvasCenter = { x: screenBlockWidth / 2, y: screenBlockHeight / 2 };

  const canvasState = convertGameToCanvasState(Object.assign({}, JSON.parse(gamePacket.json)));

  //fill background with a color
  context.fillStyle = "#3E3038";
  context.fillRect(0, 0, canvas.width, canvas.height);

  //if player exploring maze, render maze
  if (!canvasState.incombat) {
    drawMaze(canvasState, context);
  }
  //if player in combat, render that arena
  else {
    drawArena(canvasState, context);
  }
};
