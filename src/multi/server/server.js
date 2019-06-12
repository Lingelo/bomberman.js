const WebSocket = require('ws');
const COLOR = require('./color');
const DIRECTION = require('./direction');
const BONUS = require('./bonus-types');
const Character = require('./character');
const Wall = require('./wall');
const Bonus = require('./bonus');

const availableCharacters = [
    new Character(COLOR.WHITE, 1, 1, DIRECTION.DOWN),
    new Character(COLOR.BLUE, 13, 1, DIRECTION.DOWN),
    new Character(COLOR.BLACK, 1, 11, DIRECTION.DOWN),
    new Character(COLOR.RED, 13, 11, DIRECTION.DOWN)
];

let playersNb = 0;

const map = [
    [12, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 16],
    [11, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 9],
    [11, 2, 10, 2, 10, 2, 10, 2, 10, 2, 10, 2, 10, 2, 9],
    [11, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 9],
    [11, 2, 10, 2, 10, 2, 10, 2, 10, 2, 10, 2, 10, 2, 9],
    [11, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 9],
    [11, 2, 10, 2, 10, 2, 10, 2, 10, 2, 10, 2, 10, 2, 9],
    [11, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 9],
    [11, 2, 10, 2, 10, 2, 10, 2, 10, 2, 10, 2, 10, 2, 9],
    [11, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 9],
    [11, 2, 10, 2, 10, 2, 10, 2, 10, 2, 10, 2, 10, 2, 9],
    [11, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 9],
    [8, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 4]
];

let walls = [];
let gameInProgress = false;

const wss = new WebSocket.Server({port: 8080});

wss.on('connection', ws => {

    ws.on('message', message => {
        switch (JSON.parse(message).type) {
            case "BONUS": {
                wss.clients.forEach(function each(client) {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: "CONSUME_BONUS",
                            bonus: JSON.parse(message).bonus,
                            currentPlayerColor: JSON.parse(message).currentPlayerColor
                        }));
                    }
                });
                break;
            }
            case "READY": {
                wss.clients.forEach(function each(client) {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: "CHANGE_GAME_STATUS",
                            status: "READY"
                        }));
                    }
                });
                break;
            }
            case "LAUNCH": {
                wss.clients.forEach(function each(client) {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: "CHANGE_GAME_STATUS",
                            status: "IN_PROGRESS"
                        }));
                        gameInProgress = true;
                    }
                });

                walls = initWalls(map, getCharacters(playersNb));

                break;
            }
            case "INIT": {
                wss.clients.forEach(function each(client) {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: "INIT",
                            map: map,
                            walls: walls,
                            bonus: initBonus()
                        }));
                        gameInProgress = true;
                    }
                });
                break;
            }
            case "MOVE": {
                wss.clients.forEach(function each(client) {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: "MOVE",
                            currentPlayerColor: JSON.parse(message).currentPlayerColor,
                            direction: JSON.parse(message).direction
                        }));
                        gameInProgress = true;
                    }
                });
                break;
            }
            case "DROP_BOMB": {
                wss.clients.forEach(function each(client) {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: "DROP_BOMB",
                            currentPlayerColor: JSON.parse(message).currentPlayerColor,
                        }));
                        gameInProgress = true;
                    }
                });
                break;
            }
            case "VICTORY": {
                playersNb = 0;
                gameInProgress = false;
            }
        }

    });

    ws.on('close', message => {
        gameInProgress = false;
        playersNb = 0;
    });

    let addCharacterMessage = addCharacter();
    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(addCharacterMessage));
        }
    });

    if (addCharacterMessage.type !== "NO_CHARACTERS") {
        ws.send(JSON.stringify(addPlayerIndex()));
        playersNb++;
    }
});

console.log("Server bomberman.js démarré");

function addCharacter() {
    if (!gameInProgress && playersNb < availableCharacters.length - 1) {
        console.log("Joueur rajouté dans le lobby");
        return {
            type: "CHARACTERS_LIST",
            characters: getCharacters(playersNb),
        }
    } else {
        return {
            type: "NO_CHARACTERS"
        };
    }
}

function getCharacters(playerNb) {
    const result = [];
    for (let i = 0; i <= playerNb; i++) {
        result.push(availableCharacters[i]);
    }
    return result;
}

function addPlayerIndex() {
    return {
        type: "PLAYER_CHOSEN",
        currentPlayerColor: getCharacters(playersNb)[playersNb].color
    }
}

function initWalls(map, characters) {
    let walls = [];


    for (let x = 0, l = map[0].length; x < l; x++) {
        walls[x] = [];
        for (let y = 0, z = map.length; y < z; y++) {
            if (map[y][x] === 2) {
                if (Math.floor(Math.random() * 11) > 1) {
                    walls[x][y] = new Wall(x, y);
                }
            }
        }
    }

    characters.forEach(character => {
        if (walls[character.x] && walls[character.x][character.y]) {
            walls[character.x][character.y] = null;
        }
        if (walls[character.x - 1] && walls[character.x - 1][character.y]) {
            walls[character.x - 1][character.y] = null;
        }
        if (walls[character.x] && walls[character.x][character.y - 1]) {
            walls[character.x][character.y - 1] = null;
        }
        if (walls[character.x + 1] && walls[character.x + 1][character.y]) {
            walls[character.x + 1][character.y] = null;
        }
        if (walls[character.x] && walls[character.x][character.y + 1]) {
            walls[character.x][character.y + 1] = null;
        }
    });


    return walls;
}

function initBonus(walls) {
    const bonus = [];
    bonus.push(new Bonus(3, 3, BONUS.SPEED));
    bonus.push(new Bonus(4, 5, BONUS.BOMB));
    bonus.push(new Bonus(5, 5, BONUS.POWER));
    return bonus;
}
