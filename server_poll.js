const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Pelihuoneiden tallennus muistiin
const gameRooms = {};
let latestRoomCode = ''; // Tallennetaan viimeisin luotu huonekoodi

// Palvelimen käynnistys
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Luo huone ja tallenna huonekoodi sekä hostin nimi
app.post('/create-room', (req, res) => {
    const { hostName } = req.body;
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    gameRooms[roomCode] = { players: [hostName], messages: [], status: 'waiting' }; // Host lisätään pelaajalistaan
    latestRoomCode = roomCode; // Päivitetään viimeisin huonekoodi
    console.log(`Room created: ${roomCode} by host: ${hostName}`);
    res.json({ success: true, roomCode });
});

// Palauta viimeisin huonekoodi
app.get('/latest-room', (req, res) => {
    if (latestRoomCode) {
        res.json({ success: true, roomCode: latestRoomCode });
    } else {
        res.status(404).json({ success: false, message: 'No active room available.' });
    }
});

// Liity huoneeseen pelaajana
app.post('/join-room', (req, res) => {
    const { roomCode, playerName } = req.body;

    if (gameRooms[roomCode]) {
        const players = gameRooms[roomCode].players;

        if (!players.includes(playerName)) { // Estetään duplikaatit
            players.push(playerName);
            console.log(`Player ${playerName} added to room ${roomCode}`);
            res.json({ success: true });
        } else {
            console.log(`Player ${playerName} already exists in room ${roomCode}`);
            res.status(400).json({ success: false, message: 'Player already joined.' });
        }
    } else {
        console.log(`Room not found: ${roomCode}`);
        res.status(404).json({ success: false, message: 'Room not found.' });
    }
});

// Pelaajalistan haku
app.get('/room/:roomCode', (req, res) => {
    const roomCode = req.params.roomCode;

    if (gameRooms[roomCode]) {
        res.json({ success: true, players: gameRooms[roomCode].players });
    } else {
        console.log(`Room not found: ${roomCode}`);
        res.status(404).json({ success: false, message: 'Room not found.' });
    }
});

// Käynnistä peli
app.post('/start-game', (req, res) => {
    const { roomCode } = req.body;

    if (gameRooms[roomCode]) {
        gameRooms[roomCode].status = 'started'; // Päivitetään pelin tila
        console.log(`Game started in room ${roomCode}`);
        res.json({ success: true });
    } else {
        console.log(`Room not found: ${roomCode}`);
        res.status(404).json({ success: false, message: 'Room not found.' });
    }
});

// Pelin tilan tarkistaminen
app.get('/game-status/:roomCode', (req, res) => {
    const roomCode = req.params.roomCode;

    if (gameRooms[roomCode]) {
        const status = gameRooms[roomCode].status || 'waiting';
        res.json({ status });
    } else {
        console.log(`Room not found: ${roomCode}`);
        res.status(404).json({ status: 'error', message: 'Room not found.' });
    }
});

// Viestin lähetys chatissa
app.post('/send-message', (req, res) => {
    const { roomCode, message, senderName } = req.body;

    if (gameRooms[roomCode]) {
        if (!gameRooms[roomCode].messages) {
            gameRooms[roomCode].messages = [];
        }
        gameRooms[roomCode].messages.push({ senderName, message }); // Tallennetaan nimi ja viesti
        console.log(`Message from ${senderName} in room ${roomCode}: ${message}`);
        res.json({ success: true });
    } else {
        console.log(`Room not found: ${roomCode}`);
        res.status(404).json({ success: false, message: 'Room not found.' });
    }
});

// Viestien haku chatissa
app.get('/get-messages/:roomCode', (req, res) => {
    const roomCode = req.params.roomCode;

    if (gameRooms[roomCode]) {
        const messages = gameRooms[roomCode].messages || [];
        res.json({ success: true, messages });
    } else {
        console.log(`Room not found: ${roomCode}`);
        res.status(404).json({ success: false, message: 'Room not found.' });
    }
});
