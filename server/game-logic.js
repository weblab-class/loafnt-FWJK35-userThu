const seedrandom = require("seedrandom");
const help = require("./helpers");

const screenBorder = {
  width: 17,
  height: 17,
};

const chunkSize = 8;

const dummyPlayer1 = {
  position: { x: 0, y: 0 },
  chunk: { x: 0, y: 0 },
  avatar_id: "witch_cat",
  sprite_sheet: null,
};

class Game {
  seed;
  players;
  playersObj; // Object form of players

  constructor(seed, lobby) {
    this.seed = seed;
    this.players = new Map();
    if (lobby) {
      Array.from(lobby.players.values()).forEach((user) => {
        this.players.set(user._id, { data: dummyPlayer1, user: user });
        this.spawnPlayer(user);
      });
    }
  }

  spawnPlayer(user) {
    this.players.get(user._id).data = {
      avatar_id: "witch_cat",
      position: { x: 0, y: 0 },
      relative_position: { x: 0, y: 0 },
      chunk: { x: 0, y: 0 },
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
    };

    this.movePlayer(user._id, "none");
  }

  getPlayerMapData(id, pos) {
    const playerData = this.players.get(id).data;
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
      return 1;
    }
  }

  movePlayer(id, dir) {
    if (!this.players.has(id)) {
      return;
    }

    let playerPos = this.players.get(id).data.position;
    let playerChunk = this.players.get(id).data.chunk;

    const posInChunk = (pos, chunk) => {
      const compressedRight = (pos + chunkSize) / (chunkSize * 2);
      const compressedLeft = (pos - chunkSize) / (chunkSize * 2);
      return chunk <= compressedRight && chunk >= compressedLeft;
    };

    let newPos = Object.assign({}, playerPos);

    if (dir === "up") {
      newPos.y -= 1;
    } else if (dir === "down") {
      newPos.y += 1;
    } else if (dir === "left") {
      newPos.x -= 1;
    } else if (dir === "right") {
      newPos.x += 1;
    }

    //move player if cell is free
    if (this.getPlayerMapData(id, newPos) == 0) {
      this.players.get(id).data.position = newPos;
      playerPos = newPos;
    }

    //change player's current chunk coord if they moved between chunks
    const oldChunk = Object.assign({}, playerChunk);

    if (!posInChunk(playerPos.x, playerChunk.x)) {
      playerChunk.x = help.getChunkFromPos(playerPos.x);
    }

    if (!posInChunk(playerPos.y, playerChunk.y)) {
      playerChunk.y = help.getChunkFromPos(playerPos.y);
    }

    //re-generate surrounding maze
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
      this.players.get(id).data.rendered_chunks = newRenderedChunks;
    }

    this.players.get(id).data.relative_position = help.getChunkRelativePos(playerPos, playerChunk);
  }

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

  getPlayers() {
    return this.players.values();
  }
}

const player_speed = 1;

class Arena {
  players;
  terrain;
  enemies;
  projectiles;
  constructor() {
    this.players = {};
    this.terrain = {};
    this.enemies = {};
    this.projectiles = {};
  }

  addPlayer(user) {
    this.players[user._id] = {
      pos: { x: 0.0, y: 0.0 },
      health: 100.0,
      avatar_id: "witch_cat",
    };
  }

  movePlayer(id, inputDir) {
    this.players[id].pos = help.addCoords(pos, inputDir);
  }
}

module.exports = {
  Game,
};
