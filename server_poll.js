const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser'); // Käytetään body-parseria

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'https://pietupai.github.io',
        methods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type'],
    },
});

// CORS-asetukset Expressille
app.use(cors({
    origin: 'https://pietupai.github.io',
    methods: ['GET', 'POST'],
}));

// Käytetään body-parseria HTTP POST-pyyntöjen käsittelyyn
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const gameRooms = {}; // Pelihuoneiden tallennus

// Luo huone
app.post('/create-room', (req, res) => {
    const { hostName } = req.body;
    if (!hostName) {
        return res.status(400).json({ success: false, message: 'Host name is required.' });
    }

    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    gameRooms[roomCode] = {
        hostName,
        players: [hostName],
        messages: [],
    };

    console.log(`Room created: ${roomCode}`);
    res.json({ success: true, roomCode });
});

// Liity huoneeseen
app.post('/join-room', (req, res) => {
    const { roomCode, playerName } = req.body;
    if (!roomCode || !playerName) {
        return res.status(400).json({ success: false, message: 'Room code and player name are required.' });
    }

    if (gameRooms[roomCode]) {
        gameRooms[roomCode].players.push(playerName);
        console.log(`${playerName} joined room: ${roomCode}`);
        res.json({ success: true });

        io.to(roomCode).emit('playerJoined', gameRooms[roomCode].players); // Ilmoita kaikille pelaajista
    } else {
        console.log(`Room not found: ${roomCode}`);
        res.status(404).json({ success: false, message: 'Room not found.' });
    }
});

// Aloita peli
app.get('/latest-room', (req, res) => {
    console.log('Latest-room route called'); // Lokitus reitin alussa
    
    const latestRoomCode = Object.keys(gameRooms).pop(); // Haetaan viimeisin huonekoodi
    if (latestRoomCode) {
        console.log(`Latest room code fetched: ${latestRoomCode}`); // Lokitetaan huonekoodi
        res.json({ success: true, roomCode: latestRoomCode });
    } else {
        console.log('No active room found'); // Lokitetaan virhetilanne
        res.status(404).json({ success: false, message: 'No active room found.' });
    }
});

// Haetaan viimeisin huone
app.get('/latest-room', (req, res) => {
    const latestRoomCode = Object.keys(gameRooms).pop(); // Haetaan viimeisin huonekoodi
    if (latestRoomCode) {
        res.json({ success: true, roomCode: latestRoomCode });
    } else {
        res.status(404).json({ success: false, message: 'No active room found.' });
    }
});

// WebSocket yhteys
io.on('connection', (socket) => {
    console.log('User connected');

    socket.on('joinRoom', (roomCode) => {
        if (gameRooms[roomCode]) {
            socket.join(roomCode);
            console.log(`User joined room: ${roomCode}`);
        } else {
            console.error(`Room not found: ${roomCode}`);
            socket.emit('error', { message: 'Room not found.' });
        }
    });

    socket.on('sendMessage', (data) => {
        const { roomCode, senderName, message } = data;

        if (gameRooms[roomCode]) {
            gameRooms[roomCode].messages.push({ senderName, message });
            console.log(`Message from ${senderName} in room ${roomCode}: ${message}`);

            io.to(roomCode).emit('newMessage', { senderName, message });
        } else {
            console.error(`Room not found: ${roomCode}`);
            socket.emit('error', { message: 'Room not found.' });
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Virheenkäsittely reiteille
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found.' });
});

// Käynnistä palvelin
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
