import tree from "./tree.png";
import fullheart from "./fullheart.png";
import halfheart from "./halfheart.png";

import inventoryslot from "./inventoryslot.png";
import selectedslot from "./selectedslot.png";

import lantern from "./lantern.png";

import target from "./target.png";

import componentframe from "./icon/frame.png";

// environment
import branchtilemap from "./environment/branch_tilemap.png";
import pathtilemap from "./environment/path_tilemap.png";
import hole from "./environment/hole.png";

// sprites
import goob from "./sprites/goob2.png";
import boss from "./sprites/badguy.png";
import ratking from "./sprites/ratking.png";
import slimeking from "./sprites/slimeking.png";
import mushroom from "./sprites/mushroom.png";
import slime from "./sprites/slime.png";
import rat from "./sprites/rat.png";

// attacks
import invisible from "./invisible.png";

import bullet from "./attacks/bullet.png";
import smallbullet from "./attacks/small_bullet.png";
import bomb from "./attacks/bomb.png";
import acornbullet from "./attacks/acorn_bullet.png";
import acornbomb from "./attacks/acorn_bomb.png";
import slimebullet from "./attacks/slimebullet.png";
import slimebomb from "./attacks/slimebomb.png";

import healparticle from "./heal_particles.png";

// icons
import singlebullet from "./icon/single_bullet.png";
import spraybullet from "./icon/spray_bullet.png";
import launchbomb from "./icon/bomb_icon.png";

import timebased from "./icon/clock.png";
import movebased from "./icon/run.png";
import stillbased from "./icon/stand.png";

import dash from "./icon/dash.png";
import heal from "./icon/heal.png";
import shield from "./icon/shield.png";

import bubble from "./shield.png";

import defaultweapon from "./icon/generic_weapon.png";
import defaultchargeup from "./icon/generic_charging.png";
import defaultutility from "./icon/generic_utility.png";

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
let assetsMap = {
  avatars: {
    witch_cat: {
      id: "witch_cat",
      imageSize: { width: 32, height: 32 },
      spriteSize: 32,
      blockSize: 1,
      src: goob,
      imgObj: null,
    },
  },
  enemies: {
    boss: {
      id: "boss",
      spriteSize: 64,
      imageSize: { width: 192, height: 192 },
      blockSize: 4,
      src: boss,
      imgObj: null,
    },
    ratking: {
      id: "ratking",
      spriteSize: 64,
      imageSize: { width: 192, height: 256 },
      blockSize: 4,
      src: ratking,
      imgObj: null,
    },
    slimeking: {
      id: "slimeking",
      spriteSize: 64,
      imageSize: { width: 128, height: 256 },
      blockSize: 4,
      src: slimeking,
      imgObj: null,
    },
    mushroom: {
      id: "mushroom",
      spriteSize: 32,
      imageSize: { width: 96, height: 32 },
      blockSize: 2,
      src: mushroom,
      imgObj: null,
    },
    slime: {
      id: "slime",
      spriteSize: 32,
      imageSize: { width: 64, height: 64 },
      blockSize: 2,
      src: slime,
      imgObj: null,
    },
    rat: {
      id: "rat",
      spriteSize: 32,
      imageSize: { width: 64, height: 64 },
      blockSize: 2,
      src: rat,
      imgObj: null,
    },
  },
  projectiles: {
    invisible: {
      id: "invisible",
      spriteSize: 1,
      imageSize: { width: 1, height: 1 },
      blockSize: 0,
      src: invisible,
      imgObj: null,
    },
    smallbullet: {
      id: "smallbullet",
      spriteSize: 8,
      imageSize: { width: 8, height: 8 },
      blockSize: 0.5,
      src: smallbullet,
      imgObj: null,
    },
    bullet: {
      id: "bullet",
      spriteSize: 16,
      imageSize: { width: 16, height: 16 },
      blockSize: 1,
      src: bullet,
      imgObj: null,
    },
    bomb: {
      id: "bomb",
      spriteSize: 32,
      imageSize: { width: 96, height: 64 },
      blockSize: 2,
      src: bomb,
      imgObj: null,
    },
    acornbullet: {
      id: "acornbullet",
      spriteSize: 16,
      imageSize: { width: 16, height: 16 },
      blockSize: 1,
      src: acornbullet,
      imgObj: null,
    },
    acornbomb: {
      id: "acornbomb",
      spriteSize: 32,
      imageSize: { width: 96, height: 64 },
      blockSize: 2,
      src: acornbomb,
      imgObj: null,
    },
    slimebullet: {
      id: "slimebullet",
      spriteSize: 16,
      imageSize: { width: 16, height: 16 },
      blockSize: 1,
      src: slimebullet,
      imgObj: null,
    },
    slimebomb: {
      id: "slimebomb",
      spriteSize: 32,
      imageSize: { width: 96, height: 64 },
      blockSize: 2,
      src: slimebomb,
      imgObj: null,
    },
    healparticle: {
      id: "healparticle",
      imageSize: { width: 48, height: 16 },
      spriteSize: 16,
      blockSize: 1,
      src: healparticle,
      imgObj: null,
    },
  },
  terrain: {
    tree: {
      id: "tree",
      size: 32,
      src: tree,
      imgObj: null,
    },
    branchtiles: {
      id: "branchtiles",
      imageSize: { width: 256, height: 256 },
      spriteSize: 64,
      blockSize: 1,
      src: branchtilemap,
      imgObj: null,
    },
    pathtiles: {
      id: "pathtiles",
      imageSize: { width: 256, height: 256 },
      spriteSize: 64,
      blockSize: 1,
      src: pathtilemap,
      imgObj: null,
    },
    hole: {
      id: "hole",
      imageSize: { width: 16, height: 16 },
      spriteSize: 16,
      blockSize: 1,
      src: hole,
      imgObj: null,
    },
  },
  UI: {
    fullheart: {
      id: "fullheart",
      imageSize: { width: 32, height: 32 },
      spriteSize: 32,
      blockSize: 1,
      src: fullheart,
      imgObj: null,
    },
    halfheart: {
      id: "halfheart",
      imageSize: { width: 32, height: 32 },
      spriteSize: 32,
      blockSize: 1,
      src: halfheart,
      imgObj: null,
    },
    inventoryslot: {
      id: "inventoryslot",
      imageSize: { width: 32, height: 32 },
      spriteSize: 32,
      blockSize: 1,
      src: inventoryslot,
      imgObj: null,
    },
    selectedslot: {
      id: "selectedslot",
      imageSize: { width: 32, height: 32 },
      spriteSize: 32,
      blockSize: 1,
      src: selectedslot,
      imgObj: null,
    },
    target: {
      id: "target",
      imageSize: { width: 192, height: 64 },
      spriteSize: 64,
      blockSize: 4,
      src: target,
      imgObj: null,
    },
    componentframe: {
      id: "componentframe",
      imageSize: { width: 72, height: 24 },
      spriteSize: 24,
      blockSize: 1.5,
      src: componentframe,
      imgObj: null,
    },
    bubble: {
      id: "bubble",
      imageSize: { width: 16, height: 16 },
      spriteSize: 16,
      blockSize: 1,
      src: bubble,
      imgObj: null,
    },
  },
  components: {
    weapons: {
      default: {
        id: "default",
        imageSize: { width: 24, height: 24 },
        spriteSize: 24,
        blockSize: 1.5,
        src: defaultweapon,
        imgObj: null,
      },
      singlebullet: {
        id: "singlebullet",
        imageSize: { width: 24, height: 24 },
        spriteSize: 24,
        blockSize: 1.5,
        src: singlebullet,
        imgObj: null,
      },
      spraybullet: {
        id: "spraybullet",
        imageSize: { width: 24, height: 24 },
        spriteSize: 24,
        blockSize: 1.5,
        src: spraybullet,
        imgObj: null,
      },
      launchbomb: {
        id: "launchbomb",
        imageSize: { width: 24, height: 24 },
        spriteSize: 24,
        blockSize: 1.5,
        src: launchbomb,
        imgObj: null,
      },
    },
    chargeups: {
      default: {
        id: "default",
        imageSize: { width: 24, height: 24 },
        spriteSize: 24,
        blockSize: 1.5,
        src: defaultchargeup,
        imgObj: null,
      },
      timebased: {
        id: "timebased",
        imageSize: { width: 24, height: 24 },
        spriteSize: 24,
        blockSize: 1.5,
        src: timebased,
        imgObj: null,
      },
      movebased: {
        id: "movebased",
        imageSize: { width: 24, height: 24 },
        spriteSize: 24,
        blockSize: 1.5,
        src: movebased,
        imgObj: null,
      },
      stillbased: {
        id: "stillbased",
        imageSize: { width: 24, height: 24 },
        spriteSize: 24,
        blockSize: 1.5,
        src: stillbased,
        imgObj: null,
      },
    },
    utilities: {
      default: {
        id: "default",
        imageSize: { width: 24, height: 24 },
        spriteSize: 24,
        blockSize: 1.5,
        src: defaultutility,
        imgObj: null,
      },
      dash: {
        id: "dash",
        imageSize: { width: 24, height: 24 },
        spriteSize: 24,
        blockSize: 1.5,
        src: dash,
        imgObj: null,
      },
      heal: {
        id: "heal",
        imageSize: { width: 24, height: 24 },
        spriteSize: 24,
        blockSize: 1.5,
        src: heal,
        imgObj: null,
      },
      shield: {
        id: "shield",
        imageSize: { width: 24, height: 24 },
        spriteSize: 24,
        blockSize: 1.5,
        src: shield,
        imgObj: null,
      },
    },
  },
  items: {
    lantern: {
      id: "lantern",
      imageSize: { width: 32, height: 32 },
      spriteSize: 32,
      blockSize: 1,
      src: lantern,
      imgObj: null,
    },
  },
};

export default assetsMap;
