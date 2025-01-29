const seedrandom = require("seedrandom");
const help = require("./helpers");
const lobbyManager = require("./lobby-manager");
const Arena = require("./arena");
const common = require("./common");

const screenBorder = {
  width: 17,
  height: 17,
};
let gameMap = common.gameMap;

const fps = 60;

const chunkSize = 8;
const playerSize = 0.5;
const cameraBoxSize = { width: 2, height: 2 };

help.setChunkSize(chunkSize);

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
  explored;
  interval;
  killer;
  arenas;
  holes;
  currLobby;

  constructor(seed, lobby, jsonObj = null) {
    if (jsonObj === null) {
      this.chunkBlockSize = chunkSize * 2 + 1;
      this.seed = seed;
      this.players = {};
      this.arenas = {};
      this.explored = {};
      this.holes = { won: 0, bossesbeat: 0, generated: {} };
      this.explored[JSON.stringify({ x: 0, y: 0 })] = Array(Math.ceil(chunkSize ** 2 / 32)).fill(0);
      this.setTileExplored({ x: -1, y: -1 }, { x: 0, y: 0 });
      this.setTileExplored({ x: 1, y: -1 }, { x: 0, y: 0 });
      this.setTileExplored({ x: -1, y: 1 }, { x: 0, y: 0 });
      this.setTileExplored({ x: 1, y: 1 }, { x: 0, y: 0 });
      if (lobby) {
        Array.from(lobby.players.values()).forEach((user) => {
          this.spawnPlayer(user);
        });
        this.currLobby = lobby.code;
      }
    } else {
      this.convertJSONtoGame(lobby, jsonObj);
    }
  }

  /*
    Convert a JSON object from a loaded game file into a Game object
  */
  convertJSONtoGame(lobby, jsonObj) {
    this.seed = jsonObj.seed;
    this.players = jsonObj.players;
    this.chunkBlockSize = jsonObj.chunkBlockSize;
    this.explored = jsonObj.explored;
    this.arenas = jsonObj.arenas;
    this.holes = jsonObj.holes;
    if (lobby) {
      Array.from(lobby.players.values()).forEach((user) => {
        this.players[user._id].active = true;
      });
      this.currLobby = lobby.code;
    }
  }

  /*
    Populates a player's data field, and spawns them in the world.

    Parameters:
    user (): The user to spawn.
  */
  spawnPlayer(user) {
    if (!this.players.userid) {
      this.players[user._id] = {
        data: {
          avatar_id: "witch_cat", // Sprite ID to be rendered
          animation: "still", // Animation player is undergoing
          position: { x: 0, y: 0 }, // Absolute position
          rendered_position: { x: 0, y: 0 }, // Where the player is rendered on the user's screen
          camera_center: { x: 0, y: 0 },
          chunk_center: { x: 0, y: 0 },
          chunk: { x: 0, y: 0 },
          mode: { type: "normal", packet: null },
          speed: 5,
          components: {
            unlocked: {
              weapons: {
                singlebullet: true,
                spraybullet: true,
                launchbomb: true,
              },
              chargeups: {
                timebased: true,
                movebased: true,
                stillbased: true,
              },
              utilities: {
                dash: true,
                heal: true,
                shield: true,
              },
            },
            equipped: {
              weapons: "singlebullet",
              chargeups: "timebased",
              utilities: "dash",
            },
          },
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
          stats: {
            maxhealth: 100.0,
            maxstamina: 100.0,
            sprintspeed: 8,
            combatdamage: 1.0,
            armor: 100,
            xp: 0,
            level: 1,
            xpneeded: 64,
          },
          bossLoc: undefined,
        },
        user: user,
        active: true,
      };
    } else {
      console.log("active", user.name);
      this.players[user._id].active = true;
    }
  }

  removePlayer(userid) {
    delete this.players[this.userid];
    if (Object.keys(this.players).length === 0) {
      this.killSelf();
    }
  }

  setInactive(userid) {
    if (this.players[userid]) {
      this.players[userid].active = false;
    }
    // Assume it is an empty lobby
    let emptyLobby = true;
    Object.values(this.players).forEach((player) => {
      if (player.active) {
        emptyLobby = false;
      }
    });
    if (emptyLobby) {
      lobbyManager.deleteLobby(this.currLobby);
    }
  }

  killSelf() {
    lobbyManager.deleteLobby(this.currLobby);
  }

  /*
    Update the player's data to reflect selected item.
  */
  // selectItem(userid, itemIdx) {
  //   if (this.players[userid]) {
  //     this.players[userid].data.inventory.selected = itemIdx - 1;
  //   }
  // }

  setComponent(userid, type, name) {
    if (this.players[userid]) {
      let comps = this.players[userid].data.components;
      if (comps.unlocked[type][name]) {
        comps.equipped[type] = name;
      }
    }
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
      const relChunk = help.subtractCoords(help.getChunkFromPos(pos), playerData.chunk);
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
      this.arenas[JSON.stringify(this.players[id].data.chunk)].hasPlayer(id)
    );
  }

  getTileExplored(pos) {
    const chunk = help.getChunkFromPos(pos);
    const latticePoint = help.getLatticePoint(pos, chunk);
    const bitIndex = latticePoint.x + latticePoint.y * chunkSize;
    if (Object.hasOwn(this.explored, JSON.stringify(chunk))) {
      return 1 & (this.explored[JSON.stringify(chunk)][Math.floor(bitIndex / 32)] >> bitIndex % 32);
    }
    return 0;
  }

  setTileExplored(pos, chunk) {
    const latticePoint = help.getLatticePoint(pos, chunk);
    const bitIndex = latticePoint.x + latticePoint.y * chunkSize;
    this.explored[JSON.stringify(chunk)][Math.floor(bitIndex / 32)] |= 1 << bitIndex % 32;
  }

  /*
    Given a player's ID and their intended direction, handle the logic to move them.

    Parameters:
    id (): The player's ID
    dir (Object): Represents the player's change in position through X and Y components.
  */
  movePlayer(id, dir) {
    if (!this.players[id]) {
      return;
    }
    if (this.isInCombat(id)) {
      this.arenas[JSON.stringify(this.players[id].data.chunk)].movePlayer(id, dir);
      return;
    }

    this.getPlayerDirFromBoss();

    let playerPos = this.players[id].data.position;
    let playerChunk = this.players[id].data.chunk;

    const posInChunk = (pos, chunk) => {
      const compressedRight = (pos + chunkSize) / (chunkSize * 2);
      const compressedLeft = (pos - chunkSize) / (chunkSize * 2);
      return chunk <= compressedRight && chunk >= compressedLeft;
    };

    const newPosXY = help.addCoords(
      playerPos,
      help.scaleCoord(dir, this.players[id].data.speed / fps)
    );
    const newPosX = help.addCoords(
      playerPos,
      help.scaleCoord({ x: dir.x, y: 0 }, this.players[id].data.speed / fps)
    );

    const newPosY = help.addCoords(
      playerPos,
      help.scaleCoord({ x: 0, y: dir.y }, this.players[id].data.speed / fps)
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
      playerChunk.x = help.getChunkFromPos(playerPos).x;
    }

    if (!posInChunk(playerPos.y, playerChunk.y)) {
      playerChunk.y = help.getChunkFromPos(playerPos).y;
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

    //set explored tiles
    if (!this.explored[JSON.stringify(playerChunk)]) {
      this.explored[JSON.stringify(playerChunk)] = Array(Math.ceil(chunkSize ** 2 / 32)).fill(0);
    }

    if (!this.getTileExplored(playerPos)) {
      this.players[id].data.stats.xp += 1;
    }

    this.setTileExplored(playerPos, playerChunk);
    //level up
    while (this.players[id].data.stats.xp >= this.players[id].data.stats.xpneeded) {
      this.players[id].data.stats.xp -= this.players[id].data.stats.xpneeded;
      this.players[id].data.stats.level += 1;

      this.players[id].data.stats.maxhealth *= 1.1;
      this.players[id].data.stats.maxstamina *= 1.1;
      this.players[id].data.stats.sprintspeed *= 1.1;
      this.players[id].data.stats.combatdamage *= 1.1;
      this.players[id].data.stats.armor *= 1.1;

      this.players[id].data.stats.xpneeded *= 1.1;
    }

    //put explored tiles in rendered chunk
    for (let chunkydiff = -1; chunkydiff < 2; chunkydiff++) {
      for (let chunkxdiff = -1; chunkxdiff < 2; chunkxdiff++) {
        for (let y = 0; y < chunkSize; y++) {
          for (let x = 0; x < chunkSize; x++) {
            const isExplored =
              this.getTileExplored(
                help.addCoords(
                  help.getChunkCenter(
                    help.addCoords(playerChunk, { x: chunkxdiff, y: chunkydiff })
                  ),
                  { x: x * 2 - chunkSize + 1, y: y * 2 - chunkSize + 1 }
                )
              ) * 2;

            if (
              this.players[id].data.rendered_chunks[chunkydiff + 1][chunkxdiff + 1][y * 2 + 1][
                x * 2 + 1
              ] === 0
            ) {
              this.players[id].data.rendered_chunks[chunkydiff + 1][chunkxdiff + 1][y * 2 + 1][
                x * 2 + 1
              ] = isExplored;
            }
          }
        }
      }
    }

    //set camera
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

    this.players[id].data.rendered_position = newRenderedPos;
    this.players[id].data.chunk_center = help.getChunkCenter(this.players[id].data.chunk);
  }

  attack(id) {
    if (!this.players[id]) {
      return;
    }
    if (this.isInCombat(id)) {
      this.arenas[JSON.stringify(this.players[id].data.chunk)].attack(id);
      return;
    } else {
      if (this.getPlayerMapData(id, help.roundCoord(this.players[id].data.position)) === 3) {
        if (!this.holes.generated[JSON.stringify(this.players[id].data.chunk)]) {
          //generate boss hole
          const enemytype = ["rat", "slime"][Math.floor(Math.random() * 2)];
          const newhole = {
            boss: false,
            enemytype: enemytype,
            difficulty: help.getMagnitude(this.players[id].data.chunk) / 5,
            cleared: false,
            onclear: undefined,
            location: help.roundCoord(this.players[id].data.position),
          };
          if (this.holes.won === 2) {
            newhole.boss = true;
            newhole.difficulty = 1 + (this.holes.bossesbeat * 1) / 3;
          }
          this.holes.generated[JSON.stringify(this.players[id].data.chunk)] = newhole;
        }

        this.beginCombat(id);
      }
    }
  }

  useUtility(id) {
    if (!this.players[id]) {
      return;
    }
    if (this.isInCombat(id)) {
      this.arenas[JSON.stringify(this.players[id].data.chunk)].useUtility(id);
      return;
    }
  }

  /*
    Generates a maze chunk based on the game's seed and the chunk's absolute coordinates.

    Params:
    chunk (Object): {x: val, y: val}

    Returns:
    maze (2D Array): 17x17 array, with each cell being a 0 or 1, indicating if a maze wall
    exists.
  */
  getMazeFromChunk(chunk, seed = this.seed) {
    const chunkSeed = seed + chunk.x + "|" + chunk.y;
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
    } else {
      //generate non-cleared holes
      if (
        !this.holes.generated[JSON.stringify(chunk)] ||
        !this.holes.generated[JSON.stringify(chunk)].cleared
      ) {
        const holeSeed = seedrandom(this.seed + chunk.x + "|" + chunk.y);
        const holex = Math.floor(holeSeed() * chunkSize);
        const holey = Math.floor(holeSeed() * chunkSize);
        mz([holex * 2 + 1, holey * 2 + 1], 3);
      }
    }
    return maze;
  }

  beginCombat(playerid) {
    const arenaId = JSON.stringify(this.players[playerid].data.chunk);
    if (!this.arenas[arenaId]) {
      const onClear = () => {
        this.holes.generated[arenaId].cleared = true;
        // Defeated a boss
        if (this.holes.generated[arenaId].boss) {
          this.holes.bossesbeat += 1;
          this.holes.won = 0;
        } else {
          this.holes.won += 1;
        }
      };
      this.holes.generated[arenaId].onclear = onClear;
      this.arenas[arenaId] = new Arena.Arena(fps, this.holes.generated[arenaId]);
      this.arenas[arenaId].killer = () => {
        delete this.arenas[arenaId];
      };
    }
    this.arenas[arenaId].addPlayer(this.players[playerid], () => {
      this.players[playerid].data.position = { x: 0, y: 0 };
      this.players[playerid].data.camera_center = { x: 0, y: 0 };
      this.players[playerid].data.rendered_position = { x: 0, y: 0 };
    });
  }

  leaveCombat(playerid) {
    const arenaId = JSON.stringify(this.players[playerid].data.chunk);
    if (this.arenas[arenaId]) {
      this.arenas[arenaId].removePlayer(playerid);
    }
  }

  getPlayerDirFromBoss() {
    let bossLoc;
    for (const hole of Object.values(this.holes.generated)) {
      if (hole.boss && !hole.cleared) {
        bossLoc = hole.location
        break;
      }
    };
    
    for (const id of Object.keys(this.players)) {
      this.players[id].data.bossLoc = bossLoc;
    }
  }
}

module.exports = {
  Game,
  fps,
};
