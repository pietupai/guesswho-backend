const express = require('express');
const app = express();
const cors = require('cors');

app.use(cors());
app.use(express.json());

let gameRooms = {};

app.post('/create-room', (req, res) => {
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    gameRooms[roomCode] = { players: [] };
    res.json({ roomCode });
});

app.post('/join-room', (req, res) => {
    const { roomCode, playerName } = req.body;
    if (gameRooms[roomCode]) {
        gameRooms[roomCode].players.push(playerName);
        res.json({ success: true, players: gameRooms[roomCode].players });
    } else {
        res.status(404).json({ success: false, message: 'Room not found' });
    }
});

app.listen(10000, () => console.log('Server running on port 10000'));
