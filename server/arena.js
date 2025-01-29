const help = require("./helpers");
const Component = require("./components");

class Arena {
  players;
  terrain;
  enemies;
  projectiles;
  size;
  time;
  fps;
  idcount;
  gendata;
  onclear;

  killer;

  constructor(fps, gendata) {
    this.fps = fps;
    this.players = {};
    this.terrain = {};
    this.enemies = {};
    this.projectiles = {};
    this.size = { width: 17, height: 17 };
    this.time = 0;
    this.idcount = 0;
    console.log(gendata);
    this.gendata = gendata;
    this.onclear = gendata.onclear;
    if (gendata.boss) {
      const bossid = this.spawnEnemy({
        position: { x: 0, y: 0 },
        velocity: { x: 0, y: 0 },
        maxhealth: 100 * gendata.difficulty,
        difficulty: gendata.difficulty,
        type: gendata.enemytype + "king",
        animations:
          gendata.enemytype === "rat"
            ? {
                idle: { frames: [0, 1, 2], speed: 0.25, repeat: true },
                attack1: { frames: [3, 4, 5], speed: 0.25, repeat: false },
                attack2: { frames: [6, 7, 8], speed: 0.25, repeat: false },
                attack3: { frames: [9, 10, 11], speed: 0.25, repeat: false },
              }
            : {
                idle: { frames: [0, 1], speed: 0.375, repeat: true },
                attack1: { frames: [2, 3], speed: 0.375, repeat: false },
                attack2: { frames: [4, 5], speed: 0.375, repeat: false },
                attack3: { frames: [6, 7], speed: 0.375, repeat: false },
              },
        animation: { seq: "idle", frame: 0, nextframe: 0 },

        hitboxes: [
          {
            shape: "circle",
            radius: 1.5,
            center: { x: 0, y: 0 },
            ownerid: 0,
            onCollision: (collisionPoint, collisionEntity) => {
              if (collisionEntity.class === "projectile") {
                //take damage if player bullet
                if (
                  this.getEntity(collisionEntity.source) &&
                  this.getEntity(collisionEntity.source).class === "player"
                ) {
                  if (!collisionEntity.collided[bossid]) {
                    this.enemies[bossid].health -= collisionEntity.damage;

                    collisionEntity.collided[bossid] = true;
                  }
                }
              }
            },
          },
        ],
        possibleattacks: [
          { name: "shoot1per", duration: 1 },
          { name: "shootring", duration: 2 },
        ],
        nextattack: { time: this.time + 2 * this.fps, type: "shootring" },
      });
    } else {
      //generate minions
      for (let m = 0; m < gendata.difficulty * 2 + 1; m++) {
        const spawnPos = help.scaleCoord(
          help.getVectorFromAngle(-Math.PI / 4 - (Math.PI / 2) * (m / gendata.difficulty / 2)),
          this.size.width / 2 - 3
        );
        const minionid = this.spawnEnemy({
          position: spawnPos,
          velocity: { x: 0, y: 0 },
          maxhealth: 20 * gendata.difficulty,
          difficulty: gendata.difficulty,
          type: gendata.enemytype,
          animations: {
            idle: { frames: [0, 1], speed: 0.25, repeat: true },
            attack1: { frames: [2, 3], speed: 0.25, repeat: false },
          },
          animation: { seq: "idle", frame: 0, nextframe: 0 },

          hitboxes: [
            {
              shape: "circle",
              radius: 0.8,
              center: { x: 0, y: 0 },
              ownerid: 0,
              onCollision: (collisionPoint, collisionEntity) => {
                if (collisionEntity.class === "projectile") {
                  //take damage if player bullet
                  if (
                    this.getEntity(collisionEntity.source) &&
                    this.getEntity(collisionEntity.source).class === "player"
                  ) {
                    if (!collisionEntity.collided[minionid]) {
                      this.enemies[minionid].health -= collisionEntity.damage;

                      collisionEntity.collided[minionid] = true;
                    }
                  }
                }
                if (collisionEntity.class === "enemy") {
                  this.enemies[minionid].velocity = help.addCoords(
                    this.enemies[minionid].velocity,
                    help.scaleCoord(
                      help.getNormalized(
                        help.subtractCoords(this.enemies[minionid].position, collisionPoint)
                      ),
                      1
                    )
                  );
                }
              },
            },
          ],
          possibleattacks: [
            { name: "dashat", duration: 1 },
            { name: "shootnearest", duration: 1.3 },
          ],
          nextattack: { time: this.time + 1 * this.fps, type: "dashat" },
        });
      }
    }
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
      return this.players[entityid];
    }
    return undefined;
  }

  addPlayer(player, onDeath) {
    const playerId = this.spawnPlayer({
      userid: player.user._id,
      position: { x: -2.0, y: -2.0 },
      velocity: { x: 0.0, y: 0.0 },
      acceleration: 80,
      deceleration: 20,
      stats: {
        health: player.data.stats.maxhealth,
        maxhealth: player.data.stats.maxhealth,
        stamina: player.data.stats.maxstamina,
        maxstamina: player.data.stats.maxstamina,
        damagemodifier: player.data.stats.combatdamage,
        armor: player.data.stats.armor,
      },
      hitboxes: [
        {
          shape: "circle",
          radius: 0.5,
          center: { x: 0, y: 0 },
          onCollision: (collisionPoint, collisionEntity) => {
            const thisPlayer = this.players[playerId];
            const armorRed = 100 / thisPlayer.stats.armor;
            if (collisionEntity.class === "projectile") {
              if (
                this.getEntity(collisionEntity.source) &&
                this.getEntity(collisionEntity.source).class === "enemy"
              ) {
                if (!collisionEntity.collided[playerId]) {
                  thisPlayer.stats.health -= collisionEntity.damage * armorRed;
                  //bounce player away from bullet
                  thisPlayer.velocity = help.addCoords(
                    thisPlayer.velocity,
                    help.scaleCoord(
                      help.getNormalized(help.subtractCoords(thisPlayer.position, collisionPoint)),
                      20
                    )
                  );

                  collisionEntity.collided[playerId] = true;
                }
              }
            }
            if (collisionEntity.class === "enemy") {
              thisPlayer.stats.health -= collisionEntity.difficulty * 5 * armorRed;
              thisPlayer.velocity = help.addCoords(
                thisPlayer.velocity,
                help.scaleCoord(
                  help.getNormalized(help.subtractCoords(thisPlayer.position, collisionPoint)),
                  5
                )
              );
            }
          },
        },
      ],
      avatar_id: player.data.avatar_id,
      speed: 7,
      build: {
        weapon: player.data.components.equipped.weapons,
        chargeup: player.data.components.equipped.chargeups,
        utility: player.data.components.equipped.utilities,
      },
      onDeath: onDeath,
    });
  }

  spawnPlayer(player) {
    this.idcount++;
    const playerId = this.idcount;
    this.players[playerId] = {
      id: playerId,
      userid: player.userid,
      class: "player",
      position: player.position,
      velocity: player.velocity,
      acceleration: player.acceleration,
      deceleration: player.deceleration,
      inputdir: { x: 0.0, y: 0.0 },
      rendered_position: { x: 0.0, y: 0.0 },
      stats: player.stats,
      hitboxes: player.hitboxes,
      avatar_id: player.avatar_id,
      speed: player.speed,
      build: player.build,
      onDeath: player.onDeath,
      targetid: 0,
    };
    Object.values(this.players[playerId].hitboxes).forEach((hitbox) => {
      hitbox.ownerid = playerId;
    });
    return playerId;
  }

  killPlayer(playerid) {
    this.players[playerid].onDeath();
    this.removePlayer(this.players[playerid].userid);
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

  movePlayer(userid, inputdir) {
    const id = this.getIdOfUser(userid);
    this.players[id].inputdir = inputdir;
  }

  attack(userid) {
    const id = this.getIdOfUser(userid);
    Component.useWeapon(this, id);
  }

  useUtility(userid) {
    const id = this.getIdOfUser(userid);
    Component.useUtility(this, id);
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
          const boxEntity = Object.assign({}, this.getEntity(box.ownerid));
          const hitEntity = Object.assign({}, this.getEntity(hit.ownerid));

          hit.onCollision(collisionPoint, boxEntity);
          box.onCollision(collisionPoint, hitEntity);
        }
      }
    }
  }

  tickArena() {
    this.time += 1;
    //move all projectiles
    Object.values(this.projectiles).forEach((proj) => {
      proj.position = help.addCoords(proj.position, help.scaleCoord(proj.velocity, 1 / this.fps));
    });

    //move all players
    Object.values(this.players).forEach((player) => {
      //accelerate in direction of input

      if (help.getMagnitude(player.inputdir) > 0) {
        //accelerate in direction
        if (help.getMagnitude(player.velocity) < player.speed) {
          player.velocity = help.addCoords(
            player.velocity,
            help.scaleCoord(player.inputdir, player.acceleration / this.fps)
          );
        }
        //redirect velocity
        else {
          player.velocity = help.scaleCoord(
            help.getNormalized(help.addCoords(player.velocity, player.inputdir)),
            help.getMagnitude(player.velocity)
          );
        }

        //if going too fast, decelerate
        if (help.getMagnitude(player.velocity) > player.speed) {
          player.velocity = help.scaleCoord(
            help.getNormalized(player.velocity),
            Math.max(
              help.getMagnitude(player.velocity) - player.deceleration / this.fps,
              player.speed
            )
          );
        }
      } else {
        if (help.getMagnitude(player.velocity) > (player.deceleration * 2) / this.fps) {
          player.velocity = help.scaleCoord(
            help.getNormalized(player.velocity),
            help.getMagnitude(player.velocity) - player.acceleration / this.fps
          );
        } else {
          player.velocity = { x: 0, y: 0 };
        }
      }

      //move player by velocity
      player.position = help.addCoords(
        player.position,
        help.scaleCoord(player.velocity, 1 / this.fps)
      );
      //confine player to arena

      if (player.position.x < -this.size.width / 2) {
        player.position.x = -this.size.width / 2;
        player.velocity.x = 0;
      }
      if (player.position.x > this.size.width / 2) {
        player.position.x = this.size.width / 2;
        player.velocity.x = 0;
      }
      if (player.position.y < -this.size.height / 2) {
        player.position.y = -this.size.height / 2;
        player.velocity.y = 0;
      }
      if (player.position.y > this.size.height / 2) {
        player.position.y = this.size.height / 2;
        player.velocity.y = 0;
      }

      //target nearest enemy
      let nearestDist = this.size.width * 2;
      player.targetid = 0;

      Object.values(this.enemies).forEach((enemy) => {
        const thisEnemyDist = help.getMagnitude(
          help.subtractCoords(player.position, enemy.position)
        );
        if (thisEnemyDist < nearestDist) {
          player.targetid = enemy.id;
          nearestDist = thisEnemyDist;
        }
      });

      player.rendered_position = player.position;
    });

    //move enemies
    Object.values(this.enemies).forEach((enemy) => {
      //move enemy by velocity
      enemy.position = help.addCoords(
        enemy.position,
        help.scaleCoord(enemy.velocity, 1 / this.fps)
      );
      //slow enemy
      enemy.velocity = help.scaleCoord(
        help.getNormalized(enemy.velocity),
        help.getMagnitude(enemy.velocity) - 40 / this.fps
      );

      //confine enemy to arena

      if (enemy.position.x < -this.size.width / 2) {
        enemy.position.x = -this.size.width / 2;
        enemy.velocity.x = 0;
      }
      if (enemy.position.x > this.size.width / 2) {
        enemy.position.x = this.size.width / 2;
        enemy.velocity.x = 0;
      }
      if (enemy.position.y < -this.size.height / 2) {
        enemy.position.y = -this.size.height / 2;
        enemy.velocity.y = 0;
      }
      if (enemy.position.y > this.size.height / 2) {
        enemy.position.y = this.size.height / 2;
        enemy.velocity.y = 0;
      }
    });

    //recharge player staminas
    Object.values(this.players).forEach((player) => {
      if (player.build.chargeup === "timebased") {
        player.stats.stamina += (player.stats.maxstamina * 0.01) / this.fps;
      }
      const playerSpeed = help.getMagnitude(player.velocity);
      if (player.build.chargeup === "movebased") {
        //charge if moving
        if (playerSpeed > 1) {
          player.stats.stamina +=
            (player.stats.maxstamina * 0.05 * (playerSpeed / player.speed)) / this.fps;
        } else {
          player.stats.stamina -= (player.stats.maxstamina * 0.2) / this.fps;
        }
      }
      if (player.build.chargeup === "stillbased") {
        if (playerSpeed < 1) {
          player.stats.stamina += (player.stats.maxstamina * 0.3) / this.fps;
        } else {
          player.stats.stamina -= (player.stats.maxstamina * 0.3) / this.fps;
        }
      }
      //clamp between 0 and max
      player.stats.stamina = Math.max(0, Math.min(player.stats.stamina, player.stats.maxstamina));
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
        //get new random attack
        const attackInd = Math.floor(enemy.possibleattacks.length * Math.random());
        const attack = enemy.possibleattacks[attackInd];
        enemy.nextattack = { time: this.time + attack.duration * this.fps, type: attack.name };
      }
    });

    //update all animations
    Object.values(this.enemies).forEach((enemy) => {
      if (this.time >= enemy.animation.nextframe) {
        enemy.animation.frame += 1;

        //loop or end animation
        if (enemy.animation.frame >= enemy.animations[enemy.animation.seq].frames.length) {
          enemy.animation.frame = 0;
          //set to idle animation if doesnt repeat
          if (!enemy.animations[enemy.animation.seq].repeat) {
            enemy.animation.seq = "idle";
          }
        }
        enemy.animation.nextframe =
          this.time + enemy.animations[enemy.animation.seq].speed * this.fps;
      }
    });
    Object.values(this.projectiles).forEach((proj) => {
      if (proj.animation) {
        if (this.time >= proj.animation.nextframe) {
          proj.animation.frame += 1;

          //loop or end animation
          if (proj.animation.frame >= proj.animations[proj.animation.seq].frames.length) {
            proj.animation.frame = 0;
            //set to idle animation if doesnt repeat
            if (!proj.animations[proj.animation.seq].repeat) {
              proj.animation.seq = "idle";
            }
          }
          proj.animation.nextframe =
            this.time + proj.animations[proj.animation.seq].speed * this.fps;
        }
      }
    });

    //kill all expired projectiles
    Object.values(this.projectiles).forEach((projectile) => {
      if (this.time > projectile.deathtime) {
        this.deleteProjectile(projectile.id);
      }
    });

    //kill dead enemies
    Object.values(this.enemies).forEach((enemy) => {
      if (enemy.health <= 0) {
        this.deleteEnemy(enemy.id);
      }
    });

    //kill dead players
    Object.values(this.players).forEach((player) => {
      if (player.stats.health <= 0) {
        this.killPlayer(player.id);
      }
    });

    //win condition if all enemies dead
    if (Object.values(this.enemies).length === 0) {
      this.onclear();
      //remove all players
      Object.values(this.players).forEach((player) => {
        this.removePlayer(player.userid);
      });
    }
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
  spawnEnemy(enemy) {
    this.idcount++;
    const enemyId = this.idcount;
    this.enemies[enemyId] = {
      id: enemyId,
      class: "enemy",
      position: enemy.position,
      velocity: enemy.velocity,
      maxhealth: enemy.maxhealth,
      difficulty: enemy.difficulty,
      health: enemy.maxhealth,
      type: enemy.type,
      animations: enemy.animations,
      animation: enemy.animation,
      hitboxes: enemy.hitboxes,
      possibleattacks: enemy.possibleattacks,
      nextattack: enemy.nextattack,
    };
    Object.values(this.enemies[enemyId].hitboxes).forEach((hitbox) => {
      hitbox.ownerid = enemyId;
    });
    return enemyId;
  }

  /*
    Projectile: {
        position: {x: value, y: value},
        velocity: {x: value, y: value},
        source: value (id),
        damage: value,
        type: String,
        lifetime: value,
        onDeath: function,
        hitboxes: [
        {
          shape: "circle",
          radius: radius,
          center: { x: 0, y: 0 },
          ownerid: bulletId,
          onCollision: (collisionPoint, collisionEntity) => {},
        },
      ],
    }
  */

  spawnProjectile(projectile) {
    this.idcount++;
    const bulletId = this.idcount;
    this.projectiles[bulletId] = {
      id: bulletId,
      class: "projectile",
      position: projectile.position,
      velocity: projectile.velocity,
      source: projectile.source,
      damage: projectile.damage,
      type: projectile.type,
      deathtime: this.time + projectile.lifetime * this.fps,
      onDeath: projectile.onDeath,
      dieOnCollision: projectile.dieOnCollision,
      hitboxes: projectile.hitboxes,
      collided: {},
    };
    if (projectile.animation) {
      this.projectiles[bulletId].animations = projectile.animations;
      this.projectiles[bulletId].animation = projectile.animation;
    }
    //assign this bullet to its owner
    Object.values(this.projectiles[bulletId].hitboxes).forEach((hitbox) => {
      hitbox.ownerid = bulletId;
    });
    return bulletId;
  }

  deleteProjectile(bulletId) {
    if (this.projectiles[bulletId]) {
      this.projectiles[bulletId].onDeath(bulletId);
      delete this.projectiles[bulletId];
    }
  }

  deleteEnemy(enemyId) {
    if (this.enemies[enemyId]) {
      delete this.enemies[enemyId];
    }
  }

  performAttack(enemyid, attackname) {
    const thisEnemy = this.enemies[enemyid];
    const attacks = {
      shoot1per: () => {
        thisEnemy.animation = {
          seq: "attack1",
          frame: 0,
          nextframe: this.time + thisEnemy.animations["attack1"].speed * this.fps,
        };
        //shoot a bullet at each player
        Object.values(this.players).forEach((player) => {
          const bulletId = this.spawnProjectile({
            position: thisEnemy.position,
            velocity: help.scaleCoord(
              help.getNormalized(help.subtractCoords(player.position, thisEnemy.position)),
              8
            ),
            source: thisEnemy.id,
            damage: thisEnemy.difficulty * 20,
            type: thisEnemy.type.startsWith("rat") ? "acornbullet" : "slimebullet",
            lifetime: 5,
            onDeath: (myid) => {},
            dieOnCollision: true,
            hitboxes: [
              {
                shape: "circle",
                radius: 0.4,
                center: { x: 0, y: 0 },
                onCollision: (collisionPoint, collisionEntity) => {
                  if (collisionEntity.class === "player" || collisionEntity.class === "terrain") {
                    if (this.projectiles[bulletId].dieOnCollision) {
                      this.projectiles[bulletId].onDeath();
                    }
                    this.deleteProjectile(bulletId);
                  }
                },
              },
            ],
          });
        });
      },
      //shoot a ring of bullets
      shootring: () => {
        thisEnemy.animation = {
          seq: "attack2",
          frame: 0,
          nextframe: this.time + thisEnemy.animations["attack2"].speed * this.fps,
        };
        //shoot a bullet at each player
        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
          const bulletId = this.spawnProjectile({
            position: thisEnemy.position,
            velocity: help.scaleCoord(help.getVectorFromAngle(angle), 4),
            source: thisEnemy.id,
            damage: thisEnemy.difficulty * 10,
            type: thisEnemy.type.startsWith("rat") ? "acornbullet" : "slimebullet",
            lifetime: 5,
            onDeath: () => {},
            dieOnCollision: true,
            hitboxes: [
              {
                shape: "circle",
                radius: 0.4,
                center: { x: 0, y: 0 },
                onCollision: (collisionPoint, collisionEntity) => {
                  if (collisionEntity.class === "player" || collisionEntity.class === "terrain") {
                    this.deleteProjectile(bulletId);
                  }
                },
              },
            ],
          });
        }
      },
      dashat: () => {
        let nearestPlayer;
        let dist = this.size.width * 3;
        Object.values(this.players).forEach((player) => {
          const thisDist = help.getMagnitude(
            help.subtractCoords(player.position, thisEnemy.position)
          );
          if (thisDist < dist) {
            dist = thisDist;
            nearestPlayer = player;
          }
        });
        if (nearestPlayer) {
          thisEnemy.animation = {
            seq: "attack1",
            frame: 0,
            nextframe: this.time + thisEnemy.animations["attack1"].speed * this.fps,
          };
          thisEnemy.velocity = help.addCoords(
            thisEnemy.velocity,
            help.scaleCoord(
              help.getNormalized(help.subtractCoords(nearestPlayer.position, thisEnemy.position)),
              20
            )
          );
        }
      },
      shootnearest: () => {
        let nearestPlayer;
        let dist = this.size.width * 3;
        Object.values(this.players).forEach((player) => {
          const thisDist = help.getMagnitude(
            help.subtractCoords(player.position, thisEnemy.position)
          );
          if (thisDist < dist) {
            dist = thisDist;
            nearestPlayer = player;
          }
        });
        if (nearestPlayer) {
          thisEnemy.animation = {
            seq: "attack1",
            frame: 0,
            nextframe: this.time + thisEnemy.animations["attack1"].speed * this.fps,
          };
          const bulletId = this.spawnProjectile({
            position: thisEnemy.position,
            velocity: help.scaleCoord(
              help.getNormalized(help.subtractCoords(nearestPlayer.position, thisEnemy.position)),
              8
            ),
            source: thisEnemy.id,
            damage: thisEnemy.difficulty * 5,
            type: thisEnemy.type.startsWith("rat") ? "acornbullet" : "slimebullet",
            lifetime: 5,
            onDeath: (myid) => {},
            dieOnCollision: true,
            hitboxes: [
              {
                shape: "circle",
                radius: 0.4,
                center: { x: 0, y: 0 },
                onCollision: (collisionPoint, collisionEntity) => {
                  if (collisionEntity.class === "player" || collisionEntity.class === "terrain") {
                    if (this.projectiles[bulletId].dieOnCollision) {
                      this.projectiles[bulletId].onDeath();
                    }
                    this.deleteProjectile(bulletId);
                  }
                },
              },
            ],
          });
        }
      },
    };
    attacks[attackname]();
  }
}

module.exports = {
  Arena,
};
