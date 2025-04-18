const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Pelihuoneiden tallennus muistiin
const gameRooms = {};

// Lokitus: Palvelimen käynnistys
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

let latestRoomCode = ''; // Muuttuja viimeisimmälle huonekoodille

// Huoneen luonti
app.post('/create-room', (req, res) => {
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    gameRooms[roomCode] = { players: [] };
    latestRoomCode = roomCode; // Tallennetaan viimeisin huonekoodi
    console.log(`Room created: ${roomCode}`);
    res.json({ success: true, roomCode });
});

// Viimeisimmän huonekoodin palauttaminen
app.get('/latest-room', (req, res) => {
    if (latestRoomCode) {
        res.json({ success: true, roomCode: latestRoomCode });
    } else {
        res.json({ success: false, message: 'No active room available.' });
    }
});

// Lokitus: Pelaajan liittyminen
app.post('/join-room', (req, res) => {
    const { roomCode, playerName } = req.body;
    console.log(`Join request - Room: ${roomCode}, Player: ${playerName}`); // Loggaa pyyntö

    if (gameRooms[roomCode]) {
        gameRooms[roomCode].players.push(playerName);
        console.log(`Player ${playerName} added to room ${roomCode}`); // Loggaa pelaajan lisäys
        res.json({ success: true });
    } else {
        console.log(`Room not found: ${roomCode}`); // Lokitus, jos huonetta ei löydy
        res.status(404).json({ success: false, message: 'Room not found' });
    }
});

// Lokitus: Pelaajalistan hakeminen
app.get('/room/:roomCode', (req, res) => {
    const roomCode = req.params.roomCode;
    console.log(`Fetching players for room: ${roomCode}`); // Loggaa hakupyyntö

    if (gameRooms[roomCode]) {
        res.json({ success: true, players: gameRooms[roomCode].players });
    } else {
        console.log(`Room not found: ${roomCode}`); // Lokitus, jos huonetta ei löydy
        res.status(404).json({ success: false, message: 'Room not found' });
    }
});
