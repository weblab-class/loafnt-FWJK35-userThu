import assetlist from "./asset-list";
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
      src: assetlist.goob,
      imgObj: null,
    },
  },
  enemies: {
    boss: {
      id: "boss",
      spriteSize: 64,
      imageSize: { width: 192, height: 192 },
      blockSize: 4,
      src: assetlist.boss,
      imgObj: null,
    },
  },
  projectiles: {
    bullet: {
      id: "bullet",
      spriteSize: 16,
      imageSize: { width: 16, height: 16 },
      blockSize: 1,
      src: assetlist.bullet,
      imgObj: null,
    },
  },
  terrain: {
    tree: {
      id: "tree",
      size: 32,
      src: assetlist.tree,
      imgObj: null,
    },
    branchtiles: {
      id: "branchtiles",
      imageSize: { width: 256, height: 256 },
      spriteSize: 64,
      blockSize: 1,
      src: assetlist.branchtilemap,
      imgObj: null,
    },
    pathtiles: {
      id: "pathtiles",
      imageSize: { width: 256, height: 256 },
      spriteSize: 64,
      blockSize: 1,
      src: assetlist.pathtilemap,
      imgObj: null,
    },
  },
  UI: {
    fullheart: {
      id: "fullheart",
      imageSize: { width: 32, height: 32 },
      spriteSize: 32,
      blockSize: 1,
      src: assetlist.fullheart,
      imgObj: null,
    },
    halfheart: {
      id: "halfheart",
      imageSize: { width: 32, height: 32 },
      spriteSize: 32,
      blockSize: 1,
      src: assetlist.halfheart,
      imgObj: null,
    },
    inventoryslot: {
      id: "inventoryslot",
      imageSize: { width: 32, height: 32 },
      spriteSize: 32,
      blockSize: 1,
      src: assetlist.inventoryslot,
      imgObj: null,
    },
    selectedslot: {
      id: "selectedslot",
      imageSize: { width: 32, height: 32 },
      spriteSize: 32,
      blockSize: 1,
      src: assetlist.selectedslot,
      imgObj: null,
    },
    target: {
      id: "target",
      imageSize: { width: 192, height: 64 },
      spriteSize: 64,
      blockSize: 4,
      src: assetlist.target,
      imgObj: null,
    },
  },
  components: {
    weapons: {
      singlebullet: {
        id: "singlebullet",
        imageSize: { width: 24, height: 24 },
        spriteSize: 24,
        blockSize: 1.5,
        src: assetlist.goob,
        imgObj: null,
      },
      spraybullet: {
        id: "spraybullet",
        imageSize: { width: 24, height: 24 },
        spriteSize: 24,
        blockSize: 1.5,
        src: assetlist.goob,
        imgObj: null,
      },
    },
    chargeups: {
      timebased: {
        id: "timebased",
        imageSize: { width: 24, height: 24 },
        spriteSize: 24,
        blockSize: 1.5,
        src: assetlist.goob,
        imgObj: null,
      },
    },
    utilities: {
      dash: {
        id: "dash",
        imageSize: { width: 24, height: 24 },
        spriteSize: 24,
        blockSize: 1.5,
        src: assetlist.goob,
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
      src: assetlist.lantern,
      imgObj: null,
    },
  },
};

export default assetsMap;
