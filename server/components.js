const Arena = require("./arena");
const help = require("./helpers");

const useWeapon = (arena, playerid) => {
  const thisPlayer = arena.players[playerid];
  const attacks = {
    singlebullet: () => {
      const cost = 20;
      if (thisPlayer.stats.stamina >= cost && thisPlayer.targetid !== 0) {
        const bulletId = arena.spawnProjectile({
          position: thisPlayer.position,
          velocity: help.scaleCoord(
            help.getNormalized(
              help.subtractCoords(
                arena.getEntity(thisPlayer.targetid).position,
                thisPlayer.position
              )
            ),
            8
          ),
          source: thisPlayer.id,
          damage: 10 * thisPlayer.stats.damagemodifier,
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
                if (collisionEntity.class === "enemy" || collisionEntity.class === "terrain") {
                  arena.projectiles[bulletId].onDeath();
                  arena.deleteProjectile(bulletId);
                }
              },
            },
          ],
        });
        thisPlayer.stats.stamina -= cost;
      }
    },
    spraybullet: () => {
      const cost = 20;
      if (thisPlayer.stats.stamina >= cost && thisPlayer.targetid !== 0) {
        for (let a = -2; a < 3; a++) {
          const bulletId = arena.spawnProjectile({
            position: thisPlayer.position,
            velocity: help.scaleCoord(
              help.getNormalized(
                help.addCoords(
                  help.subtractCoords(
                    arena.getEntity(thisPlayer.targetid).position,
                    thisPlayer.position
                  ),
                  help.scaleCoord({ x: Math.random() * 4 - 2, y: Math.random() * 4 - 2 }, 3)
                )
              ),
              4
            ),
            source: thisPlayer.id,
            damage: 5 * thisPlayer.stats.damagemodifier,
            type: "smallbullet",
            lifetime: 5,
            onDeath: (myid) => {},
            dieOnCollision: true,
            hitboxes: [
              {
                shape: "circle",
                radius: 0.2,
                center: { x: 0, y: 0 },
                onCollision: (collisionPoint, collisionEntity) => {
                  if (collisionEntity.class === "enemy" || collisionEntity.class === "terrain") {
                    arena.deleteProjectile(bulletId);
                  }
                },
              },
            ],
          });
        }
        thisPlayer.stats.stamina -= cost;
      }
    },
    launchbomb: () => {
      //TODO check this out
      const cost = 20;
      if (thisPlayer.stats.stamina >= cost && thisPlayer.targetid !== 0) {
        const bulletId = arena.spawnProjectile({
          position: thisPlayer.position,
          velocity: help.scaleCoord(
            help.getNormalized(
              help.subtractCoords(
                arena.getEntity(thisPlayer.targetid).position,
                thisPlayer.position
              )
            ),
            2
          ),
          source: thisPlayer.id,
          damage: 5 * thisPlayer.stats.damagemodifier,
          type: "bomb",
          lifetime: 2,
          onDeath: (myid) => {
            const explosionId = arena.spawnProjectile({
              position: arena.projectiles[myid].position,
              velocity: { x: 0, y: 0 },
              source: thisPlayer.id,
              damage: 10 * thisPlayer.stats.damagemodifier,
              type: "bomb",

              animations: {
                idle: { frames: [0], speed: 0.5, repeat: true },
                explode: { frames: [0, 1, 3, 4, 5], speed: 0.1, repeat: false },
              },
              animation: { seq: "explode", frame: 0, nextframe: 0 },

              lifetime: 0.5,
              onDeath: (myid) => {},
              dieOnCollision: true,
              hitboxes: [
                {
                  shape: "circle",
                  radius: 1,
                  center: { x: 0, y: 0 },
                  onCollision: (collisionPoint, collisionEntity) => {},
                },
              ],
            });
          },
          dieOnCollision: true,
          hitboxes: [
            {
              shape: "circle",
              radius: 1,
              center: { x: 0, y: 0 },
              onCollision: (collisionPoint, collisionEntity) => {
                if (collisionEntity.class === "enemy" || collisionEntity.class === "terrain") {
                  arena.deleteProjectile(bulletId);
                }
              },
            },
          ],
        });
        thisPlayer.stats.stamina -= cost;
      }
    },
  };
  console.log;
  attacks[thisPlayer.build.weapon]();
};

const useUtility = (arena, playerid) => {
  const thisPlayer = arena.players[playerid];
  const utilities = {
    dash: () => {
      const cost = 5;
      if (help.getMagnitude(thisPlayer.inputdir) > 0 && thisPlayer.stats.stamina >= cost) {
        thisPlayer.velocity = help.scaleCoord(thisPlayer.inputdir, thisPlayer.speed * 2);
        thisPlayer.stats.stamina -= cost;
      }
    },
    heal: () => {
      const cost = 40;
      if (help.getMagnitude(thisPlayer.inputdir) > 0 && thisPlayer.stats.stamina >= cost) {
        thisPlayer.stats.health += thisPlayer.stats.maxhealth * 0.2;
        thisPlayer.stats.health = Math.min(thisPlayer.stats.maxhealth, thisPlayer.stats.health);
        const healId = arena.spawnProjectile({
          position: thisPlayer.position,
          velocity: { x: 0, y: 0 },
          source: thisPlayer.id,
          damage: 0,
          type: "healparticle",
          lifetime: 1,
          onDeath: (myid) => {
            thisPlayer.stats.shielded = false;
          },
          animations: {
            idle: { frames: [0, 1, 2], speed: 0.15, repeat: true },
          },
          animation: { seq: "idle", frame: 0, nextframe: 0 },
          dieOnCollision: true,
          hitboxes: [],
        });
        thisPlayer.stats.stamina -= cost;
      }
    },
    shield: () => {
      const cost = 5;
      if (thisPlayer.stats.stamina >= cost && !thisPlayer.stats.shielded) {
        thisPlayer.stats.shielded = true;
        const shieldId = arena.spawnProjectile({
          position: thisPlayer.position,
          velocity: { x: 0, y: 0 },
          source: thisPlayer.id,
          damage: 0,
          type: "invisible",
          lifetime: 3,
          onDeath: (myid) => {
            thisPlayer.stats.shielded = false;
          },
          dieOnCollision: true,
          hitboxes: [],
        });
        thisPlayer.stats.stamina -= cost;
      }
    },
  };
  utilities[thisPlayer.build.utility]();
};

module.exports = {
  useWeapon,
  useUtility,
};
