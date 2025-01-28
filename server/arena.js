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

  killer;

  constructor(fps) {
    this.fps = fps;
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
      return this.players[entityid];
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
      velocity: { x: 0.0, y: 0.0 },
      acceleration: 80,
      deceleration: 80,
      inputdir: { x: 0.0, y: 0.0 },
      rendered_position: { x: 0.0, y: 0.0 },
      health: 100.0,
      maxhealth: 100.0,
      stamina: 100.0,
      maxstamina: 100.0,
      hitboxes: [
        {
          shape: "circle",
          radius: 0.5,
          center: { x: 0, y: 0 },
          ownerid: this.idcount,
          onCollision: (collisionPoint, collisionEntity) => {},
        },
      ],
      avatar_id: "witch_cat",
      speed: 7,
      build: {
        weapon: "singlebullet",
        chargeup: "time",
        utility: "dash",
      },
      targetid: 0,
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
        player.velocity = help.addCoords(
          player.velocity,
          help.scaleCoord(player.inputdir, player.acceleration / this.fps)
        );
        // player.velocity = help.scaleCoord(
        //   help.getNormalized(help.addCoords(player.velocity, help.scaleCoord(player.inputdir, 1))),
        //   help.getMagnitude(player.velocity) + player.acceleration / this.fps
        // );
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
        if (help.getMagnitude(player.velocity) > player.deceleration / this.fps) {
          player.velocity = help.scaleCoord(
            help.getNormalized(player.velocity),
            help.getMagnitude(player.velocity) - player.deceleration / this.fps
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

    //kill all expired projectiles
    Object.values(this.projectiles).forEach((projectile) => {
      if (this.time > projectile.deathtime) {
        projectile.onDeath(projectile.id);
        this.deleteProjectile(projectile.id);
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
    const enemyId = this.idcount;
    this.enemies[enemyId] = {
      id: enemyId,
      class: "enemy",
      position: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
      radius: 2,
      maxhealth: 100.0,
      health: 100.0,
      type: "boss",

      animations: {
        idle: { frames: [0, 1, 2], speed: 0.25, repeat: true },
        spitting: { frames: [3, 4, 5], speed: 0.25, repeat: false },
      },
      animation: { seq: "idle", frame: 0, nextframe: 0 },

      hitboxes: [
        {
          shape: "circle",
          radius: 2,
          center: { x: 0, y: 0 },
          ownerid: enemyId,
          onCollision: (collisionPoint, collisionEntity) => {
            if (collisionEntity.class === "projectile") {
              //take damage if player bullet
              if (
                this.getEntity(collisionEntity.source) &&
                this.getEntity(collisionEntity.source).class === "player"
              ) {
                this.enemies[enemyId].health -= collisionEntity.damage; //TODO implemet like projectiles
              }
            }
          },
        },
      ],
      possibleattacks: [
        { name: "shoot1per", duration: 2 },
        { name: "shootring", duration: 2 },
      ],
      nextattack: { time: this.time + 1 * this.fps, type: "shoot1per" },
    };
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
    };
    //assign this bullet to its owner
    Object.values(this.projectiles[bulletId].hitboxes).forEach((hitbox) => {
      hitbox.ownerid = bulletId;
    });
    return bulletId;
  }

  deleteProjectile(bulletId) {
    if (this.projectiles[bulletId]) {
      this.projectiles[bulletId].onDeath();
      delete this.projectiles[bulletId];
    }
  }

  performAttack(enemyid, attackname) {
    const thisEnemy = this.enemies[enemyid];
    const attacks = {
      shoot1per: () => {
        thisEnemy.animation = {
          seq: "spitting",
          frame: 0,
          nextframe: this.time + thisEnemy.animations["spitting"].speed * this.fps,
        };
        //shoot a bullet at each player
        Object.values(this.players).forEach((player) => {
          const bulletId = this.spawnProjectile({
            position: thisEnemy.position,
            velocity: help.scaleCoord(
              help.getNormalized(help.subtractCoords(player.position, thisEnemy.position)),
              4
            ),
            source: thisEnemy.id,
            damage: 10,
            type: "bullet",
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
          seq: "spitting",
          frame: 0,
          nextframe: this.time + thisEnemy.animations["spitting"].speed * this.fps,
        };
        //shoot a bullet at each player
        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
          const bulletId = this.spawnProjectile({
            position: thisEnemy.position,
            velocity: help.scaleCoord(help.getVectorFromAngle(angle), 4),
            source: thisEnemy.id,
            damage: 10,
            type: "bullet",
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
    };
    attacks[attackname]();
  }
}

module.exports = {
  Arena,
};
