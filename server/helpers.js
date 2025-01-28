let chunkSize;

const setChunkSize = (newSize) => {
  chunkSize = newSize;
};

const addCoords = (a, b) => {
  return { x: a.x + b.x, y: a.y + b.y };
};

const subtractCoords = (a, b) => {
  return { x: a.x - b.x, y: a.y - b.y };
};

const scaleCoord = (coord, sf) => {
  return { x: coord.x * sf, y: coord.y * sf };
};

const roundCoord = (coord) => {
  return { x: Math.round(coord.x), y: Math.round(coord.y) };
};

const getLatticePoint = (coord, chunk) => {
  const chunkRelative = getChunkRelativePos(coord, chunk);
  const latticePoint = {
    x: Math.floor(chunkRelative.x / 2 + chunkSize / 2),
    y: Math.floor(chunkRelative.y / 2 + chunkSize / 2),
  };
  return latticePoint;
};

const getMagnitude = (vector) => {
  return Math.sqrt(vector.x ** 2 + vector.y ** 2);
};

const getNormalized = (vector) => {
  return scaleCoord(vector, 1 / getMagnitude(vector));
};

const getVectorFromAngle = (angle) => {
  return { x: Math.cos(angle), y: Math.sin(angle) };
};

const getChunkFromPos = (pos) => {
  return {
    x: Math.floor((pos.x + chunkSize) / (chunkSize * 2)),
    y: Math.floor((pos.y + chunkSize) / (chunkSize * 2)),
  };
};

const getChunkCenter = (chunk) => {
  return { x: chunkSize * 2 * chunk.x, y: chunkSize * 2 * chunk.y };
};

const getChunkRelativePos = (pos, chunk) => {
  return subtractCoords(pos, getChunkCenter(chunk));
};

module.exports = {
  setChunkSize,
  addCoords,
  subtractCoords,
  scaleCoord,
  roundCoord,
  getLatticePoint,
  getMagnitude,
  getNormalized,
  getVectorFromAngle,
  getChunkFromPos,
  getChunkCenter,
  getChunkRelativePos,
};
