const Arena = require("./arena");
const help = require("./helpers");

const useWeapon = (arena, playerid) => {
  const thisPlayer = arena.players[playerid];
  const attacks = {
    singlebullet: () => {
      const bulletId = arena.spawnProjectile({
        position: thisPlayer.position,
        velocity: help.scaleCoord(
          help.getNormalized(
            help.subtractCoords(arena.getEntity(thisPlayer.targetid).position, thisPlayer.position)
          ),
          4
        ),
        source: thisPlayer.id,
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
              if (collisionEntity.class === "enemy" || collisionEntity.class === "terrain") {
                if (arena.projectiles[bulletId].dieOnCollision) {
                  arena.projectiles[bulletId].onDeath();
                }
                arena.deleteProjectile(bulletId);
              }
            },
          },
        ],
      });
    },
  };
  console.log;
  attacks[arena.getEntity(playerid).build.weapon]();
};

const useUtility = (arena, playerid) => {};

module.exports = {
  useWeapon,
};
