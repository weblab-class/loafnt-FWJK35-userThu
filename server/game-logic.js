const seedrandom = require("seedrandom");
const help = require("./helpers");
const lobbyManager = require("./lobby-manager");

const screenBorder = {
  width: 17,
  height: 17,
};

const chunkSize = 8;
const playerSize = 0.5;
const cameraBoxSize = { width: 2, height: 2 };

help.setChunkSize(chunkSize);

const gameMap = {};

const dummyPlayer1 = {
  position: { x: 0, y: 0 },
  chunk: { x: 0, y: 0 },
  avatar_id: "witch_cat",
  sprite_sheet: null,
};

/*
Game Class - Attributes:
seed (String): The GameID is used as the world seed
players (Map): {
    user_id: {
        data: {
            avatar_id: "",
            position: { x: 0, y: 0 },
            relative_position: { x: 0, y: 0 },
            chunk: { x: 0, y: 0 },
            rendered_chunks: [],        -- 3x3 2D array
        user: {},
    }
}
playersObj (Object): Object form of the players
*/
class Game {
  seed;
  players;
  chunkBlockSize;
  playersObj;
  interval;
  killer;
  arenas;

  constructor(seed, lobby) {
    this.chunkBlockSize = chunkSize * 2 + 1;
    this.seed = seed;
    this.players = {};
    if (lobby) {
      Array.from(lobby.players.values()).forEach((user) => {
        this.spawnPlayer(user);
      });
    }
    this.arenas = {};
  }

  /*
    Populates a player's data field, and spawns them in the world
  */
  spawnPlayer(user) {
    this.players[user._id] = {
      data: {
        avatar_id: "witch_cat",
        animation: "still", // unnecessary
        position: { x: 0, y: 0 },
        rendered_position: { x: 0, y: 0 },
        camera_center: { x: 0, y: 0 },
        chunk_center: { x: 0, y: 0 },
        chunk: { x: 0, y: 0 },
        speed: 5,
        rendered_chunks: [
          [
            this.getMazeFromChunk({ x: -1, y: -1 }),
            this.getMazeFromChunk({ x: 0, y: -1 }),
            this.getMazeFromChunk({ x: 1, y: -1 }),
          ],
          [
            this.getMazeFromChunk({ x: -1, y: 0 }),
            this.getMazeFromChunk({ x: 0, y: 0 }),
            this.getMazeFromChunk({ x: 1, y: 0 }),
          ],
          [
            this.getMazeFromChunk({ x: -1, y: 1 }),
            this.getMazeFromChunk({ x: 0, y: 1 }),
            this.getMazeFromChunk({ x: 1, y: 1 }),
          ],
        ],
      },
      user: user,
    };
  }

  removePlayer(userid) {
    delete this.players[userid];
    if (Object.keys(this.players).length === 0) {
      this.killSelf();
    }
  }

  killSelf() {
    lobbyManager.deleteLobby(this.seed);
    clearInterval(this.interval);
    this.killer();
  }

  /*
    Params:
    id: Player ID
    pos: Absolute world position

    Returns:
    The cell at the absolute world position based on what is currently
    rendered for the player.
  */
  getPlayerMapData(id, pos) {
    const playerData = this.players[id].data;
    const posInRange = (pos, playerPos) => {
      const distFromPlayerChunk = help.subtractCoords(pos, help.getChunkCenter(playerData.chunk));
      return (
        Math.abs(distFromPlayerChunk.x) <= chunkSize * 3 &&
        Math.abs(distFromPlayerChunk.y) <= chunkSize * 3
      );
    };
    if (posInRange(pos, playerData.position)) {
      const relChunk = {
        x: help.getChunkFromPos(pos.x) - playerData.chunk.x,
        y: help.getChunkFromPos(pos.y) - playerData.chunk.y,
      };
      const chunkRel = help.addCoords(
        help.getChunkRelativePos(pos, help.addCoords(playerData.chunk, relChunk)),
        { x: chunkSize, y: chunkSize }
      );
      return playerData.rendered_chunks[relChunk.y + 1][relChunk.x + 1][chunkRel.y][chunkRel.x];
    } else {
      return 0;
    }
  }

  isInCombat(id) {
    return (
      Object.hasOwn(this.arenas, JSON.stringify(this.players[id].data.chunk)) &&
      Object.hasOwn(this.arenas[JSON.stringify(this.players[id].data.chunk)].players, id)
    );
  }

  movePlayer(id, dir) {
    if (!Object.hasOwn(this.players, id)) {
      return;
    }
    if (this.isInCombat(id)) {
      this.arenas[JSON.stringify(this.players[id].data.chunk)].movePlayer(id, dir);
      return;
    }

    let playerPos = this.players[id].data.position;
    let playerChunk = this.players[id].data.chunk;

    const posInChunk = (pos, chunk) => {
      const compressedRight = (pos + chunkSize) / (chunkSize * 2);
      const compressedLeft = (pos - chunkSize) / (chunkSize * 2);
      return chunk <= compressedRight && chunk >= compressedLeft;
    };

    const newPosXY = help.addCoords(playerPos, help.scaleCoord(dir, this.players[id].data.speed));
    const newPosX = help.addCoords(
      playerPos,
      help.scaleCoord({ x: dir.x, y: 0 }, this.players[id].data.speed)
    );

    const newPosY = help.addCoords(
      playerPos,
      help.scaleCoord({ x: 0, y: dir.y }, this.players[id].data.speed)
    );

    const checkNoCollisions = (newPos) => {
      let valid = true;
      const corners = [
        { x: playerSize / 2, y: playerSize / 2 },
        { x: playerSize / 2, y: -playerSize / 2 },
        { x: -playerSize / 2, y: playerSize / 2 },
        { x: -playerSize / 2, y: -playerSize / 2 },
      ];
      corners.forEach((cn) => {
        if (this.getPlayerMapData(id, help.roundCoord(help.addCoords(newPos, cn))) == 1) {
          valid = false;
        }
      });
      return valid;
    };

    if (checkNoCollisions(newPosXY)) {
      this.players[id].data.position = newPosXY;
      playerPos = newPosXY;
    } else if (checkNoCollisions(newPosX)) {
      this.players[id].data.position = newPosX;
      playerPos = newPosX;
    } else if (checkNoCollisions(newPosY)) {
      this.players[id].data.position = newPosY;
      playerPos = newPosY;
    }

    // change player's current chunk coord if they moved between chunks
    const oldChunk = Object.assign({}, playerChunk);

    if (!posInChunk(playerPos.x, playerChunk.x)) {
      playerChunk.x = help.getChunkFromPos(playerPos.x);
    }

    if (!posInChunk(playerPos.y, playerChunk.y)) {
      playerChunk.y = help.getChunkFromPos(playerPos.y);
    }

    // re-generate surrounding maze
    if (oldChunk !== playerChunk) {
      let newRenderedChunks = [];
      for (let ydiff = -1; ydiff < 2; ydiff++) {
        let newChunkRow = [];
        for (let xdiff = -1; xdiff < 2; xdiff++) {
          newChunkRow.push(
            this.getMazeFromChunk(help.addCoords(playerChunk, { x: xdiff, y: ydiff }))
          );
        }
        newRenderedChunks.push(newChunkRow);
      }
      this.players[id].data.rendered_chunks = newRenderedChunks;
    }

    const newRenderedPos = help.subtractCoords(playerPos, this.players[id].data.camera_center);
    if (newRenderedPos.x < -cameraBoxSize.width) {
      newRenderedPos.x = -cameraBoxSize.width;
      this.players[id].data.camera_center.x = playerPos.x + cameraBoxSize.width;
    }
    if (newRenderedPos.x > cameraBoxSize.width) {
      newRenderedPos.x = cameraBoxSize.width;
      this.players[id].data.camera_center.x = playerPos.x - cameraBoxSize.width;
    }

    if (newRenderedPos.y < -cameraBoxSize.width) {
      newRenderedPos.y = -cameraBoxSize.width;
      this.players[id].data.camera_center.y = playerPos.y + cameraBoxSize.width;
    }
    if (newRenderedPos.y > cameraBoxSize.height) {
      newRenderedPos.y = cameraBoxSize.height;
      this.players[id].data.camera_center.y = playerPos.y - cameraBoxSize.height;
    }

    this.players[id].data.rendered_position = help.addCoords(
      { x: chunkSize, y: chunkSize },
      newRenderedPos
    );
    this.players[id].data.chunk_center = help.getChunkCenter(this.players[id].data.chunk);
  }

  /*
    Generates a maze chunk based on the game's seed and the chunk's absolute coordinates.

    Params:
    chunk (Object): {x: val, y: val}

    Returns:
    maze (2D Array): 17x17 array, with each cell being a 0 or 1, indicating if a maze wall
    exists.
  */
  getMazeFromChunk(chunk) {
    const chunkSeed = this.seed + chunk.x + "|" + chunk.y;
    const chunkRandom = seedrandom(chunkSeed);

    //assign empty maze
    let maze = [];
    for (let row = 0; row < chunkSize * 2 + 1; row++) {
      let thisrow = [];
      for (let col = 0; col < chunkSize * 2 + 1; col++) {
        if (row % 2 == 1 && col % 2 == 1) {
          thisrow.push(0);
        } else {
          thisrow.push(1);
        }
      }
      maze.push(thisrow);
    }

    //initialize maze generation variables
    let visited = new Set();
    let path = [];
    let current = [1, 1];
    visited.add(JSON.stringify(current));

    const dirs = [
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0],
    ];

    //define helper methods
    const wall = (a, d) => {
      return [a[0] + d[0], a[1] + d[1]];
    };

    const step = (a, d) => {
      return [a[0] + d[0] * 2, a[1] + d[1] * 2];
    };

    const mz = (coord, newval) => {
      maze[coord[1]][coord[0]] = newval;
    };

    const inRange = (coord) => {
      return (
        coord[0] >= 0 && coord[0] <= chunkSize * 2 && coord[1] >= 0 && coord[1] <= chunkSize * 2
      );
    };

    const isFree = (coord) => {
      let free = false;
      dirs.forEach((d) => {
        if (!visited.has(JSON.stringify(step(coord, d))) && inRange(step(coord, d))) {
          free = true;
        }
      });
      return free;
    };

    //code to carve one square from maze path
    const mazeStep = () => {
      while (!isFree(current)) {
        current = path.pop();
      }
      let moveOptions = [];
      dirs.forEach((d) => {
        let next = step(current, d);
        if (!visited.has(JSON.stringify(next)) && inRange(next)) {
          moveOptions.push(d);
        }
      });
      const travelDir = moveOptions[Math.floor(chunkRandom() * moveOptions.length)];

      const nextSpace = step(current, travelDir);
      mz(wall(current, travelDir), 0);
      path.push(current);
      visited.add(JSON.stringify(nextSpace));
      current = nextSpace;
    };

    //carve path to all squares
    while (visited.size < chunkSize * chunkSize) {
      mazeStep();
    }

    //cut connection holes in chunk borders
    const rightSeed = this.seed + chunk.x + "|" + chunk.y + "r";
    const rightRandom = seedrandom(rightSeed);
    const rightCon = Math.floor(rightRandom() * chunkSize) * 2 + 1;

    const botSeed = this.seed + chunk.x + "|" + chunk.y + "b";
    const botRandom = seedrandom(botSeed);
    const botCon = Math.floor(botRandom() * chunkSize) * 2 + 1;

    const leftSeed = this.seed + (chunk.x - 1) + "|" + chunk.y + "r";
    const leftRandom = seedrandom(leftSeed);
    const leftCon = Math.floor(leftRandom() * chunkSize) * 2 + 1;

    const topSeed = this.seed + chunk.x + "|" + (chunk.y - 1) + "b";
    const topRandom = seedrandom(topSeed);
    const topCon = Math.floor(topRandom() * chunkSize) * 2 + 1;

    mz([0, leftCon], 0);
    mz([chunkSize * 2, rightCon], 0);
    mz([topCon, 0], 0);
    mz([botCon, chunkSize * 2], 0);

    //hardcode empty spawn
    if (chunk.x === 0 && chunk.y === 0) {
      mz([chunkSize, chunkSize], 0);
      mz([chunkSize + 1, chunkSize], 0);
      mz([chunkSize, chunkSize + 1], 0);
      mz([chunkSize - 1, chunkSize], 0);
      mz([chunkSize, chunkSize - 1], 0);
    }

    return maze;
  }

  beginCombat(playerid) {
    const arenaId = JSON.stringify(this.players[playerid].data.chunk);
    if (!this.arenas[arenaId]) {
      this.arenas[arenaId] = new Arena();
      this.arenas[arenaId].killer = () => {
        delete this.arenas[arenaId];
      };
    }
    this.arenas[arenaId].addPlayer(playerid);
  }

  leaveCombat(playerid) {
    const arenaId = JSON.stringify(this.players[playerid].data.chunk);
    if (this.arenas[arenaId]) {
      this.arenas[arenaId].removePlayer(playerid);
    }
  }
}

class Arena {
  players;
  terrain;
  enemies;
  projectiles;
  size;
  killer;

  constructor() {
    this.players = {};
    this.terrain = {};
    this.enemies = {};
    this.projectiles = {};
    this.size = { width: 17, height: 17 };
  }

  addPlayer(userid) {
    this.players[userid] = {
      position: { x: 0.0, y: 0.0 },
      rendered_position: { x: 0.0, y: 0.0 },
      health: 100.0,
      avatar_id: "witch_cat",
      speed: 7,
    };
  }

  removePlayer(userid) {
    delete this.players[userid];
    if (Object.keys(this.players).length == 0) {
      this.killer();
    }
  }

  killSelf() {
    this.killer();
  }

  movePlayer(id, inputDir) {
    this.players[id].position = help.addCoords(
      this.players[id].position,
      help.scaleCoord(inputDir, this.players[id].speed)
    );
    //confine player to arena
    if (this.players[id].position.x < 0) {
      this.players[id].position.x = 0;
    }
    if (this.players[id].position.x > this.size.width) {
      this.players[id].position.x = this.size.width;
    }
    if (this.players[id].position.y < 0) {
      this.players[id].position.y = 0;
    }
    if (this.players[id].position.y > this.size.height) {
      this.players[id].position.y = this.size.height;
    }
    this.players[id].rendered_position = help.subtractCoords(this.players[id].position, {
      x: 0.5,
      y: 0.5,
    });
  }
}

module.exports = {
  gameMap,
  Game,
};
