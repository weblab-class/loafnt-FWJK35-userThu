const screenBorder = {
    width: 20,
    height: 11
}

export default class Game {
    constructor() {
        this.players = {};
        this.map = {trees: []};
    }

    spawnPlayer(user) {
        this.players[user.id] = {
            char_id: user.char,
            position: {x: 0, y: 0}
        };
    }

    movePlayer(id, dir) {
        if (this.players[id] === undefined) return;
    
        if (dir === "up" && this.players[id].position.y < screenBorder.height) {
            gameState.players[id].position.y += 1
        } else if (dir === "down" && this.players[id].position.y > 0) {
            gameState.players[id].position.y -= 1
        } else if (dir === "left" && this.players[id].position.x > 0) {
            gameState.players[id].position.x -= 1
        } else if (dir === "right" && this.players[id].position.x < screenBorder.width) {
            gameState.players[id].position.x += 1
        }
    }
}

// let gameState = {
//     players: {},
//     trees: {}
// };

// const spawnPlayer = (user) => {
//     gameState.players[user.id] = {
//         char_id: user.char,
//         position: {x: 0, y: 0}
//     };
// };

// const movePlayer = (id, dir) => {
//     if (gameState.players[id] === undefined) return;
    
//     if (dir === "up" && gameState.players[id].position.y < screenBorder.height) {
//         gameState.players[id].position.y += 1
//     } else if (dir === "down" && gameState.players[id].position.y > 0) {
//         gameState.players[id].position.y -= 1
//     } else if (dir === "left" && gameState.players[id].position.x > 0) {
//         gameState.players[id].position.x -= 1
//     } else if (dir === "right" && gameState.players[id].position.x < screenBorder.width) {
//         gameState.players[id].position.x += 1
//     }
// };