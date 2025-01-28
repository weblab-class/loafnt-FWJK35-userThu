const seedrandom = require("seedrandom");
const help = require("./helpers");
const lobbyManager = require("./lobby-manager");

const screenBorder = {
  width: 17,
  height: 17,
};

const fps = 60;

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
  explored;
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
    this.explored = {};
  }

  /*
    Populates a player's data field, and spawns them in the world
  */
  spawnPlayer(user) {
    if (!this.players.userid) {
      this.players[user._id] = {
        data: {
          avatar_id: "witch_cat",
          animation: "still", // unnecessary
          position: { x: 0, y: 0 },
          rendered_position: { x: 0, y: 0 },
          camera_center: { x: 0, y: 0 },
          chunk_center: { x: 0, y: 0 },
          chunk: { x: 0, y: 0 },
          speed: 10,
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
        active: true,
      };
    } else {
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

    this.setTileExplored(playerPos, playerChunk);

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
            this.players[id].data.rendered_chunks[chunkydiff + 1][chunkxdiff + 1][y * 2 + 1][
              x * 2 + 1
            ] = isExplored;
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
  time;
  idcount;

  killer;

  constructor() {
    this.players = {};
    this.terrain = {};
    this.enemies = {};
    this.projectiles = {};
    this.size = { width: 17, height: 17 };
    this.time = 0;
    this.idcount = 0;
    this.spawnEnemy();
  }

  /*
    Entity Object: {
      class: String                                                 -- Class, either "projectile", "enemy", "terrain", or "player"
      id: value                                                     -- Id of entity
      position: {x: value, y: value}                                -- Position of center of entity
      hitboxes: [
        {
          ownerid: value                                            -- Id of hitbox owner
          shape: String                                             -- Shape of hitbox, either "circle" or "line"
          radius: value                                             -- Radius if circle
          center: {x: value, y: value}                              -- Center if circle
          start: {x: value, y: value}                               -- Start if line
          end: {x: value, y: value}                                 -- End if line
          onCollision: function(collisionPoint, collisionEntity)    -- Function to handle collision with this hitbox
        }
      ]
    }
  */

  getEntity(entityid) {
    if (this.projectiles[entityid]) {
      return this.projectiles[entityid];
    }
    if (this.enemies[entityid]) {
      return this.enemies[entityid];
    }
    if (this.terrain[entityid]) {
      return this.terrain[entityid];
    }
    if (this.players[entityid]) {
      return this.enemies[entityid];
    }
    return undefined;
  }

  addPlayer(userid) {
    this.idcount++;
    this.players[this.idcount] = {
      id: this.idcount,
      userid: userid,
      class: "player",
      position: { x: 0.0, y: 0.0 },
      rendered_position: { x: 0.0, y: 0.0 },
      health: 100.0,
      maxhealth: 100.0,
      hitboxes: [
        {
          shape: "circle",
          radius: 0.5,
          center: { x: 0, y: 0 },
          onCollision: (collisionPoint, collisionEntity) => {
            console.log("collided player", collisionPoint);
          },
        },
      ],
      avatar_id: "witch_cat",
      speed: 7,
    };
  }

  removePlayer(userid) {
    delete this.players[this.getIdOfUser(userid)];
    if (Object.keys(this.players).length == 0) {
      this.killer();
    }
  }

  hasPlayer(userid) {
    let exists = false;
    Object.values(this.players).forEach((player) => {
      if (player.userid === userid) {
        exists = true;
      }
    });

    return exists;
  }

  killSelf() {
    this.killer();
  }

  getIdOfUser(userid) {
    let id = 0;
    Object.values(this.players).forEach((player) => {
      if (player.userid === userid) {
        id = player.id;
      }
    });
    return id;
  }

  movePlayer(userid, inputDir) {
    const id = this.getIdOfUser(userid);
    this.players[id].position = help.addCoords(
      this.players[id].position,
      help.scaleCoord(inputDir, this.players[id].speed)
    );
    //confine player to arena
    if (this.players[id].position.x < -this.size.width / 2) {
      this.players[id].position.x = -this.size.width / 2;
    }
    if (this.players[id].position.x > this.size.width / 2) {
      this.players[id].position.x = this.size.width / 2;
    }
    if (this.players[id].position.y < -this.size.height / 2) {
      this.players[id].position.y = -this.size.height / 2;
    }
    if (this.players[id].position.y > this.size.height / 2) {
      this.players[id].position.y = this.size.height / 2;
    }
    this.players[id].rendered_position = this.players[id].position;
  }

  checkCollisions(hitboxes) {
    //I love perplexity
    const closestPointOnLine = (point, line) => {
      const { start, end } = line;
      const dx = end.x - start.x;
      const dy = end.y - start.y;

      // Calculate the parameter t for the projection
      const t = ((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy);

      // Clamp t to [0, 1] to ensure the point is on the line segment
      const clampedT = Math.max(0, Math.min(1, t));

      // Calculate the closest point
      return {
        x: start.x + clampedT * dx,
        y: start.y + clampedT * dy,
      };
    };
    //Perplexity devs are actually wonderful people
    function findMidpointBetweenCircles(circle1, circle2) {
      // Calculate the distance between centers
      const dx = circle2.center.x - circle1.center.x;
      const dy = circle2.center.y - circle1.center.y;
      const centerDistance = Math.sqrt(dx * dx + dy * dy);

      // Calculate the unit vector from circle1 to circle2
      const unitX = dx / centerDistance;
      const unitY = dy / centerDistance;

      // Get points on the edges of each circle closest to each other
      const point1 = {
        x: circle1.center.x + unitX * circle1.radius,
        y: circle1.center.y + unitY * circle1.radius,
      };

      const point2 = {
        x: circle2.center.x - unitX * circle2.radius,
        y: circle2.center.y - unitY * circle2.radius,
      };

      // Return the midpoint between these two points
      return {
        x: (point1.x + point2.x) / 2,
        y: (point1.y + point2.y) / 2,
      };
    }

    for (let h = 0; h < hitboxes.length; h++) {
      for (let b = h + 1; b < hitboxes.length; b++) {
        const hit = hitboxes[h];
        const box = hitboxes[b];

        let collisionPoint;
        let collided = false;
        if (hit.shape === "line" && box.shape === "line") {
          //do nothing, fix later lmfao
        }
        if (hit.shape === "line" && box.shape === "circle") {
          collisionPoint = closestPointOnLine(box.center, hit);
          if (help.getMagnitude(help.subtractCoords(collisionPoint, box.center)) <= box.radius) {
            collided = true;
          }
        }
        if (hit.shape === "circle" && box.shape === "line") {
          collisionPoint = closestPointOnLine(hit.center, box);
          if (help.getMagnitude(help.subtractCoords(collisionPoint, hit.center)) <= hit.radius) {
            collided = true;
          }
        }
        if (hit.shape === "circle" && box.shape === "circle") {
          collisionPoint = findMidpointBetweenCircles(hit, box);
          if (help.getMagnitude(help.subtractCoords(collisionPoint, hit.center)) <= hit.radius) {
            collided = true;
          }
        }

        if (collided) {
          hit.onCollision(collisionPoint, this.getEntity(box.ownerid));
          box.onCollision(collisionPoint, this.getEntity(hit.ownerid));
        }
      }
    }
  }

  tickArena() {
    this.time += 1;
    //move all projectiles
    Object.values(this.projectiles).forEach((proj) => {
      proj.position = help.addCoords(proj.position, help.scaleCoord(proj.velocity, 1 / fps));
    });

    let hitboxes = [];
    //assign hitboxes for all enemies, players, projectiles, and terrain
    const assignHitboxes = (list) => {
      Object.values(list).forEach((entity) => {
        if (entity.hitboxes) {
          entity.hitboxes.forEach((hb) => {
            if (hb.shape === "circle") {
              hitboxes.push({
                ownerid: entity.id,
                shape: hb.shape,
                center: help.addCoords(entity.position, hb.center),
                radius: hb.radius,
                onCollision: hb.onCollision,
              });
            }
            if (hb.shape === "line") {
              hitboxes.push({
                ownerid: entity.id,
                shape: hb.shape,
                start: help.addCoords(entity.position, hb.start),
                end: help.addCoords(entity.position, hb.end),
                onCollision: hb.onCollision,
              });
            }
          });
        }
      });
    };

    assignHitboxes(this.enemies);
    assignHitboxes(this.players);
    assignHitboxes(this.projectiles);
    assignHitboxes(this.terrain);

    this.checkCollisions(hitboxes);

    //begin all enemy attacks
    Object.values(this.enemies).forEach((enemy) => {
      if (this.time >= enemy.nextattack.time) {
        this.performAttack(enemy.id, enemy.nextattack.type);
        enemy.nextattack = { time: this.time + 2 * fps, type: "shoot1" };
      }
    });
  }

  /*
    Creates a new enemy at the center
    {
      id: this.idcount,
      position: { x: 0, y: 0 },
      radius: 2,
      maxhealth: 100.0,
      health: 100.0,
      type: "boss",
    }
  */
  spawnEnemy() {
    this.idcount++;
    this.enemies[this.idcount] = {
      id: this.idcount,
      class: "enemy",
      position: { x: 0, y: 0 },
      radius: 2,
      maxhealth: 100.0,
      health: 100.0,
      type: "boss",
      hitboxes: [
        {
          shape: "circle",
          radius: 2,
          center: { x: 0, y: 0 },
          onCollision: (collisionPoint, collisionEntity) => {
            console.log("collided enemy", collisionPoint);
          },
        },
      ],
      nextattack: { time: this.time + 0.5 * fps, type: "shoot1" },
    };
  }

  spawnProjectile(position, velocity, source, damage, type, radius, lifetime) {
    this.idcount++;
    this.projectiles[this.idcount] = {
      id: this.idcount,
      class: "projectile",
      position: position,
      velocity: velocity,
      source: source,
      damage: damage,
      type: type,
      lifetime: lifetime,
      hitboxes: [
        {
          shape: "circle",
          radius: 0.25,
          center: { x: 0, y: 0 },
          onCollision: (collisionPoint, collisionEntity) => {
            console.log("collided proj", collisionPoint);
          },
        },
      ],
    };
  }

  performAttack(enemyid, attackname) {
    const thisEnemy = this.enemies[enemyid];
    const attacks = {
      shoot1: () => {
        Object.values(this.players).forEach((player) => {
          this.spawnProjectile(
            thisEnemy.position,
            help.scaleCoord(
              help.getNormalized(help.subtractCoords(player.position, thisEnemy.position)),
              4
            ),
            thisEnemy.id,
            10.0,
            "bullet",
            0.25
          );
        });
      },
    };
    attacks[attackname]();
  }
}

module.exports = {
  gameMap,
  Game,
  fps,
};
