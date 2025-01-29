const Arena = require("./arena");
const help = require("./helpers");

const useWeapon = (arena, playerid) => {
  const thisPlayer = arena.players[playerid];
  const attacks = {
    singlebullet: () => {
      const cost = 20;
      if (thisPlayer.stamina >= cost) {
        const bulletId = arena.spawnProjectile({
          position: thisPlayer.position,
          velocity: help.scaleCoord(
            help.getNormalized(
              help.subtractCoords(
                arena.getEntity(thisPlayer.targetid).position,
                thisPlayer.position
              )
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
      }

      thisPlayer.stamina -= cost;
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
      if (help.getMagnitude(thisPlayer.inputdir) > 0 && thisPlayer.stamina >= cost) {
        thisPlayer.velocity = help.scaleCoord(thisPlayer.inputdir, thisPlayer.speed * 2);
        thisPlayer.stamina -= cost;
      }
    },
  };
  utilities[thisPlayer.build.utility]();
};

module.exports = {
  useWeapon,
  useUtility,
};
