/*
    Attributes:
    players (object): Track the players in a maze
    mapSize (object): Height and width of the maze in chunks
    exits (object): Location of the maze exits
*/
class InvisibleMaze {
    seed;
    players; // unnecessary
    mapSize;
    chunks;
    exits;
    getMazeFromChunk;

    /*
        Parameters: 
        packet (object): {
            players (object): Players who have entered the maze
            mapSize (Object - {height: val, width: val}): Maze height and width, determined by challenge difficulty 
            init_chunk (Object - {x: val, y: val}): The location on the original map where the room was found
            getMazeFromChunk (Object): Generate a maze chunk given a game seed and chunk (absolute) coordinate
        }
    */
    constructor(packet) {
        this.mapSize = packet.mapSize;
        this.getMazeFromChunk = packet.getMazeFromChunk.func;
        this.seed = packet.getMazeFromChunk.seed;
        this.players = ["dummy"];
        this.initialize_chunks(packet.init_chunk);
    }

    /*
        Given the location on the original map where the room was found, generate the same chunks
        while having the number of exits equal to the number of players.

        Parameters:
        init_chunk (Object): {x: val, y: val}. The location on the original map where the room was found
    */
    initialize_chunks(init_chunk) {
        let chunks = [];
        // Generate every chunk in the invisible maze
        for (let row = init_chunk.y + Math.floor(this.mapSize.height/2); row <= init_chunk.y - Math.floor(this.mapSize.height/2); row++) {
            let rowOfChunks = []
            for (let col = init_chunk.x - Math.floor(this.mapSize.width/2); col <= init_chunk.x + Math.floor(this.mapSize.width/2); col++) {
                const newChunk = this.getMazeFromChunk({x: row, y: col}, this.seed);
                rowOfChunks.push(newChunk);
            }
            chunks.push(rowOfChunks);
        }
        const numberOfExits = this.players.length;
        let totalExits = this.mapSize.height * 2 + this.mapSize.width * 2 // Perimeter of map
        // Randomly close the maze's initial exits so it matches the number of players
        let closedExits = {};
        while (totalExits !== numberOfExits) {
            // Get random chunk along map's perimeter
            const horizontalOrVertical = Math.floor(Math.random() * 2);
            let chunkX;
            let chunkY;
            if (horizontalOrVertical === 1) { // horizontal
                chunkY = Math.floor(Math.random() * 2) === 1 ? this.mapSize.height - 1 : 0; // Either top or bottom side
                chunkX = Math.floor(Math.random() * this.mapSize.width); // Anywhere along the top/bottom side
            } else { // vertical
                chunkX = Math.floor(Math.random() * 2) === 1 ? this.mapSize.width - 1: 0; // Either left or right side
                chunkY = Math.floor(Math.random() * this.mapSize.height); // Anywhere along the left/right side
            }
            const closedExit = this.close_exit(chunks[chunkY][chunkX], {x: chunkX, y: chunkY}, closedExits[`x${chunkX}y${chunkY}`]);
            if (closedExits[`x${chunkX}y${chunkY}`] === undefined) {
                closedExits[`x${chunkX}y${chunkY}`] = [];
            }
            closedExits[`x${chunkX}y${chunkY}`].push(closedExit);
            totalExits--;
        }
        this.chunks = chunks;
    }

    /*
        Given the chunk and its location, close off one exit. If it has exits on multiple sides,
        it chooses one randomly.

        Parameters:
        chunk (2D Array): Maze chunk, each cell in the 2D array is a 1 or 0, indicating if a block
        exists there.
        coord (Object): {x: val, y: val}. Position of the chunk in the [this.chunks] 2D array

        Return:
        (Object - {row: val, col: val}): The position of the closed exit in the chunk.
    */
    close_exit(chunk, coord, alreadyClosed) {
        if (alreadyClosed === undefined) {
            alreadyClosed = [];
        }
        // Calculate number of exits
        // Possible Optimization: If all possible exits have already been sealed, skip
        let numberOfExits = [];
        let side;
        if (coord.x === 0 && !alreadyClosed.includes("left")) { // Chunk exists at the left side
            numberOfExits.push({x: 0, y: null}); // Adding an object representing the location of the exit in the chunk
        }
        if (coord.x === this.mapSize.width - 1 && !alreadyClosed.includes("right")) { // right side
            numberOfExits.push({x: chunk.length - 1, y: null});
        }
        if (coord.y === 0 && !alreadyClosed.includes("top")) { // top side
            numberOfExits.push({x: null, y: 0});
        }
        if (coord.y === this.mapSize.height - 1 && !alreadyClosed.includes("bottom")) { // bottom side
            numberOfExits.push({x: null, y: chunk.length - 1});
        }
        // Close off random exit
        let exitToClose = numberOfExits[Math.floor(Math.random() * (numberOfExits.length))];
        if (exitToClose.x !== null) {
            for (let col = 0; col < chunk.length; col++) {
                if (chunk[exitToClose.x][col] === 0) {
                    chunk[exitToClose.x][col] = 1;
                    return exitToClose.x === 0 ? "left" : "right";
                }
            }
        } else if (exitToClose.y !== null) {
            for (let row = 0; row < chunk.length; row++) {
                if (chunk[row][exitToClose.y] === 0) {
                    chunk[row][exitToClose.y] = 1;
                    return exitToClose.y === 0 ? "top" : "bottom";
                }
            }
        }
    }

    /*
        Find the location of the exits in the maze.
    */
    initExits() {

    }
}

module.exports = {
    InvisibleMaze
}