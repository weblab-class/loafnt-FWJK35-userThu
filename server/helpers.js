const addCoords = (a, b) => {
  return { x: a.x + b.x, y: a.y + b.y };
};

const subtractCoords = (a, b) => {
  return { x: a.x - b.x, y: a.y - b.y };
};

const scaleCoord = (coord, sf) => {
  return { x: coord.x * sf, y: coord.y * sf };
};

const getChunkFromPos = (pos) => {
  return Math.floor((pos + chunkSize) / (chunkSize * 2));
};

const getChunkCenter = (chunk) => {
  return { x: chunkSize * 2 * chunk.x, y: chunkSize * 2 * chunk.y };
};

const getChunkRelativePos = (pos, chunk) => {
  return Game.subtractCoords(pos, Game.getChunkCenter(chunk));
};
