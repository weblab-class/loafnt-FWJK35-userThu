import help from "./helpers";

let blockSize = 32;
let components = {};
let unlockUpdate = () => {};
const setUnlockUpdate = (func) => {
  unlockUpdate = func;
};
export default setUnlockUpdate;

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
import assetsMap from "../public/assets/asset-map";
import { addCoords, subtractCoords, roundCoord, coordDist } from "../game-logic/helpers";

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
  let rendered_position = addCoords(sprite.rendered_position, canvasCenter);
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
    (rendered_position.x - asset.blockSize / 2 + (asset.blockSize * (1 - sprite.scale)) / 2) *
      blockSize,
    (rendered_position.y - asset.blockSize / 2 + (asset.blockSize * (1 - sprite.scale)) / 2) *
      blockSize,
    sprite.scale * asset.blockSize * blockSize,
    sprite.scale * asset.blockSize * blockSize
  );
};

const drawPlayer = (player, ctx) => {
  player.animation = 0;
  player.scale = 1;
  drawSprite(player, assetsMap.avatars[player.avatar_id], ctx);
  if (player.incombat) {
    //draw health and stamina bars
    drawFillableBar(
      {
        max: player.stats.maxhealth,
        current: player.stats.health,
        color: "#a83433",
        border: 1.5,
        size: {
          width: 1.5,
          height: 0.25,
        },
        rendered_position: addCoords(player.position, {
          x: 0,
          y: -1.2,
        }),
      },
      ctx
    );
    drawFillableBar(
      {
        max: player.stats.maxstamina,
        current: player.stats.stamina,
        color: "#c8a861",
        border: 1.5,
        size: {
          width: 1.5,
          height: 0.25,
        },
        rendered_position: addCoords(player.position, {
          x: 0,
          y: -0.8,
        }),
      },
      ctx
    );
    console.log(player.stats);
    if (player.stats.shielded) {
      console.log("shelf");
      drawSprite(player, assetsMap.UI.bubble, ctx);
    }
  }
};

const drawBossIndicator = (player, ctx) => {
  if (player.bossLoc) {
    // Calculate scalar
    const screenDiagonal = help.getMagnitude({x: screenBlockWidth-3, y: screenBlockHeight-3}) / 2;
    const distance = help.getMagnitude(help.subtractCoords(player.bossLoc, player.position));
    if (distance > screenBlockHeight/2) {
      let indicatorPos = help.scaleCoord(help.getNormalized(help.subtractCoords(player.bossLoc, player.position)), screenDiagonal);
      // clamp
      indicatorPos.x = Math.min(screenBlockWidth / 2 - 1.5, Math.max(-screenBlockWidth / 2 + 1.5, indicatorPos.x));
      indicatorPos.y = Math.min(screenBlockHeight / 2 - 1.5, Math.max(-screenBlockHeight / 2 + 1.5, indicatorPos.y));

      const sprite = {
        rendered_position: indicatorPos,
        animation: 0,
        scale: 0.2
      }
      const asset = assetsMap.enemies["boss"];
      drawSprite(sprite, asset, ctx);
    }
  }
}

//draws a fillable bar at a specified position
/*
Params:
bar: {
  max: value                                  -- The max value for this bar, if completely full
  current: value                              -- The current value for this bar
  color: String                               -- The hex code for the color of this bar
  border: value                               -- The thickness of this bar's border
  size: {length: value, width: value}         -- The size in blocks to draw this bar
  rendered_position: {x:value, y:value}       -- Block Coordinates relative to Screen, not entire map, with (0,0) being center
}
ctx: context                                  -- Game canvas context
*/
const drawFillableBar = (bar, ctx) => {
  bar.rendered_position = addCoords(bar.rendered_position, canvasCenter);

  ctx.lineWidth = bar.border * 2;
  ctx.strokeStyle = "#000000";
  ctx.strokeRect(
    (bar.rendered_position.x - bar.size.width / 2) * blockSize,
    (bar.rendered_position.y - bar.size.height / 2) * blockSize,
    bar.size.width * blockSize,
    bar.size.height * blockSize
  );
  ctx.lineWidth = bar.border * 1;
  ctx.strokeStyle = bar.color;
  ctx.strokeRect(
    (bar.rendered_position.x - bar.size.width / 2) * blockSize,
    (bar.rendered_position.y - bar.size.height / 2) * blockSize,
    bar.size.width * blockSize,
    bar.size.height * blockSize
  );
  ctx.fillStyle = bar.color;

  ctx.fillRect(
    (bar.rendered_position.x - bar.size.width / 2) * blockSize + bar.border * 2,
    (bar.rendered_position.y - bar.size.height / 2) * blockSize + bar.border * 2,
    ((bar.size.width * blockSize - bar.border * 4) * bar.current) / bar.max,
    bar.size.height * blockSize - bar.border * 4
  );
};

const drawEnemy = (enemy, ctx) => {
  enemy.rendered_position = Object.assign({}, enemy.position);

  enemy.animation = enemy.animations[enemy.animation.seq].frames[enemy.animation.frame];

  enemy.scale = 1;
  drawFillableBar(
    {
      max: enemy.maxhealth,
      current: enemy.health,
      color: "#ff0004",
      border: 2,
      size: {
        width: assetsMap.enemies[enemy.type].blockSize,
        height: assetsMap.enemies[enemy.type].blockSize / 8,
      },
      rendered_position: addCoords(enemy.rendered_position, {
        x: 0,
        y: (assetsMap.enemies[enemy.type].blockSize / 2) * -1.25,
      }),
    },
    ctx
  );
  drawSprite(enemy, assetsMap.enemies[enemy.type], ctx);
};

const drawProjectile = (proj, ctx) => {
  proj.rendered_position = proj.position;
  if (proj.animation) {
    proj.animation = proj.animations[proj.animation.seq].frames[proj.animation.frame];
  } else {
    proj.animation = 0;
  }
  proj.scale = 1;
  drawSprite(proj, assetsMap.projectiles[proj.type], ctx);
};

const drawBranchTile = (tile, ctx) => {
  tile.animation = tile.id;
  tile.rendered_position = subtractCoords({ x: tile.x + 0.5, y: tile.y + 0.5 }, canvasCenter);
  tile.scale = tile.size;
  drawSprite(tile, assetsMap.terrain.branchtiles, ctx);
};

const drawPathTile = (tile, ctx) => {
  tile.animation = tile.id;
  tile.rendered_position = subtractCoords({ x: tile.x + 0.5, y: tile.y + 0.5 }, canvasCenter);
  tile.scale = tile.size;
  drawSprite(tile, assetsMap.terrain.pathtiles, ctx);
};

const drawHoleTile = (tile, ctx) => {
  tile.animation = 0;
  tile.rendered_position = subtractCoords({ x: tile.x + 0.5, y: tile.y + 0.5 }, canvasCenter);
  tile.scale = tile.size;
  drawSprite(tile, assetsMap.terrain.hole, ctx);
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

      const tileCoord = addCoords(
        canvasState.myplayerdata.camera_center,
        subtractCoords(addCoords({ x: col, y: row }, offset), {
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

        let tileDist = coordDist(tileCoord, canvasState.myplayerdata.position);

        let maxSize = getSize(tileDist, 5, 8);

        Object.values(canvasState.otherplayers).forEach((player) => {
          tileDist = coordDist(tileCoord, player.data.position);
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
      } else if (tileType === 3) {
        const getSize = (dist, minDist, maxDist) => {
          if (dist < minDist) {
            return 1;
          }
          if (dist > maxDist) {
            return 0;
          }
          return 1 - (dist - minDist) / (maxDist - minDist);
        };

        let tileDist = coordDist(tileCoord, canvasState.myplayerdata.position);

        let maxSize = getSize(tileDist, 5, 8);

        Object.values(canvasState.otherplayers).forEach((player) => {
          tileDist = coordDist(tileCoord, player.data.position);
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

        drawHoleTile(thisTile, ctx);
      }
    }
  }
};

const drawArena = (canvasState, ctx) => {
  //render all projectiles
  Object.values(canvasState.arena.projectiles).forEach((proj) => {
    drawProjectile(proj, ctx);
  });

  //render all enemies
  Object.values(canvasState.arena.enemies).forEach((enemy) => {
    drawEnemy(enemy, ctx);
  });

  //render all players
  Object.values(canvasState.players).forEach((player) => {
    player.incombat = true;
    drawPlayer(player, ctx);
  });

  //draw borders
  ctx.fillStyle = "#3E3038";
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

  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 5;
  ctx.strokeRect(
    ((screenBlockWidth - canvasState.arena.size.width) / 2) * blockSize,
    ((screenBlockHeight - canvasState.arena.size.height) / 2) * blockSize,
    canvasState.arena.size.width * blockSize,
    canvasState.arena.size.height * blockSize
  );

  //Arena UI
  //targeted enemy UI
  if (canvasState.myplayerdata.targetid != 0) {
    Object.values(canvasState.arena.enemies).forEach((enemy) => {
      if (enemy.id === canvasState.myplayerdata.targetid) {
        drawSprite(
          {
            rendered_position: enemy.position,
            animation: 0,
            scale: 1,
          },
          assetsMap.UI.target,
          ctx
        );
      }
    });
  }
  //component frame UI
  //render vertically
  if (screenBlockWidth > screenBlockHeight) {
    let anchor = { x: 2 - canvasCenter.x, y: canvasCenter.y - 6 };
    let sprite = {
      rendered_position: anchor,
      animation: 0,
      scale: 1,
    };
    drawSprite(sprite, assetsMap.UI.componentframe, ctx);
    sprite.rendered_position = Object.assign({}, anchor);
    drawSprite(sprite, assetsMap.components.weapons[canvasState.myplayerdata.build.weapon], ctx);

    sprite.animation = 1;
    sprite.rendered_position = addCoords(anchor, { x: 0, y: 2 });
    drawSprite(sprite, assetsMap.UI.componentframe, ctx);

    sprite.animation = 0;
    sprite.rendered_position = addCoords(anchor, { x: 0, y: 2 });
    drawSprite(
      sprite,
      assetsMap.components.chargeups[canvasState.myplayerdata.build.chargeup],
      ctx
    );

    sprite.animation = 2;
    sprite.rendered_position = addCoords(anchor, { x: 0, y: 4 });
    drawSprite(sprite, assetsMap.UI.componentframe, ctx);

    sprite.animation = 0;
    sprite.rendered_position = addCoords(anchor, { x: 0, y: 4 });
    drawSprite(sprite, assetsMap.components.utilities[canvasState.myplayerdata.build.utility], ctx);
  } else {
    let anchor = { x: 2 - canvasCenter.x, y: canvasCenter.y - 2 };
    let sprite = {
      rendered_position: anchor,
      animation: 0,
      scale: 1,
    };
    drawSprite(sprite, assetsMap.UI.componentframe, ctx);
    sprite.rendered_position = Object.assign({}, anchor);
    drawSprite(sprite, assetsMap.components.weapons[canvasState.myplayerdata.build.weapon], ctx);

    sprite.animation = 1;
    sprite.rendered_position = addCoords(anchor, { x: 2, y: 0 });
    drawSprite(sprite, assetsMap.UI.componentframe, ctx);

    sprite.animation = 0;
    sprite.rendered_position = addCoords(anchor, { x: 2, y: 0 });
    drawSprite(
      sprite,
      assetsMap.components.chargeups[canvasState.myplayerdata.build.chargeup],
      ctx
    );

    sprite.animation = 2;
    sprite.rendered_position = addCoords(anchor, { x: 4, y: 0 });
    drawSprite(sprite, assetsMap.UI.componentframe, ctx);

    sprite.animation = 0;
    sprite.rendered_position = addCoords(anchor, { x: 4, y: 0 });
    drawSprite(sprite, assetsMap.components.utilities[canvasState.myplayerdata.build.utility], ctx);
  }
};

const drawMaze = (canvasState, ctx) => {
  const playerPos = canvasState.myplayerdata.camera_center;
  drawTiles(canvasState, subtractCoords(roundCoord(playerPos), playerPos), ctx);

  Object.values(canvasState.otherplayers).forEach((player) => {
    if (
      coordDist(canvasState.myplayerdata.position, player.data.position) <
      canvasState.chunkblocksize * 2
    ) {
      player.data.rendered_position = addCoords(
        canvasState.myplayerdata.rendered_position,
        subtractCoords(player.data.position, canvasState.myplayerdata.position)
      );
      drawPlayer(player.data, ctx);
    }
  });
  drawPlayer(canvasState.myplayerdata, ctx);
  drawFillableBar(
    {
      max: canvasState.myplayerdata.stats.xpneeded,
      current: canvasState.myplayerdata.stats.xp,
      color: "#65545f",
      border: 2,
      size: {
        width: 4,
        height: 0.5,
      },
      rendered_position: { x: -canvasCenter.x + 4, y: -canvasCenter.y + 1 },
    },
    ctx
  );
  drawBossIndicator(canvasState.myplayerdata, ctx);
  //drawUI(canvasState.myplayerdata, ctx);
};

/*
    Return the terrain within the player's screen that needs to
    be rendered.

    Params:
    playerObj (object): An object with the player information
    chunkBlockSize (int): The chunk's width/length in terms of game blocks (i.e 17)
    mode (String): Indicate which canvas to render
*/
const getMapToRender = (playerObj) => {
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
  const relCoords = roundCoord(subtractCoords(playerObj.camera_center, playerObj.chunk_center));

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
  let nowcomponents = gamePacket.game.players[gamePacket.recipientid].data.components;
  if (nowcomponents !== components) {
    unlockUpdate(nowcomponents);
    components = nowcomponents;
  }

  Object.values(gamePacket.game.arenas).forEach((arena) => {
    Object.values(arena.players).forEach((player) => {
      if (player.userid === gamePacket.recipientid) {
        incombat = true;
        players = arena.players;
        myarena = arena;
      }
    });
  });

  // Player is exploring maze
  if (!incombat) {
    players = gamePacket.game.players;
    myplayerdata = players[gamePacket.recipientid].data;
    delete players[gamePacket.recipientid];
    map = getMapToRender(myplayerdata);

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
    Object.values(myarena.players).forEach((player) => {
      if (player.userid === gamePacket.recipientid) {
        myplayerdata = myarena.players[player.id];
      }
    });
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
  const loadedProjectiles = await Promise.all(Object.values(assetsMap.projectiles).map(loadAsset));
  loadedProjectiles.forEach((asset) => {
    assetsMap.projectiles[asset.id].imgObj = asset.imgObj;
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

  //load components
  let loadedComps = await Promise.all(Object.values(assetsMap.components.weapons).map(loadAsset));
  loadedComps.forEach((asset) => {
    assetsMap.components.weapons[asset.id].imgObj = asset.imgObj;
  });
  loadedComps = await Promise.all(Object.values(assetsMap.components.chargeups).map(loadAsset));
  loadedComps.forEach((asset) => {
    assetsMap.components.chargeups[asset.id].imgObj = asset.imgObj;
  });
  loadedComps = await Promise.all(Object.values(assetsMap.components.utilities).map(loadAsset));
  loadedComps.forEach((asset) => {
    assetsMap.components.utilities[asset.id].imgObj = asset.imgObj;
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
  // const playerSize = blockSize * 1;

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
