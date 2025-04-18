const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');

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

// Body-parser HTTP POST-pyyntöjen käsittelyyn
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const gameRooms = {}; // Pelihuoneiden tallennus

// Luo huone
app.post('/create-room', (req, res) => {
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const { hostName } = req.body;

    if (!hostName) {
        return res.status(400).json({ success: false, message: 'Host name is required.' });
    }

    gameRooms[roomCode] = { hostName, players: [hostName], messages: [] }; // Add Host to players list
    console.log(`Room created: ${roomCode} with Host: ${hostName}`);
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

        io.to(roomCode).emit('playerJoined', gameRooms[roomCode].players); // Lähetä pelaajalista huoneeseen
        console.log(`Emitting playerJoined event for room ${roomCode} with players:`, gameRooms[roomCode].players);

    } else {
        console.log(`Room not found: ${roomCode}`);
        res.status(404).json({ success: false, message: 'Room not found.' });
    }
});

// Aloita peli
app.post('/start-game', (req, res) => {
    const { roomCode } = req.body;
    if (!roomCode) {
        return res.status(400).json({ success: false, message: 'Room code is required.' });
    }

    if (gameRooms[roomCode]) {
        console.log(`Game started in room: ${roomCode}`);
        res.json({ success: true });

        io.to(roomCode).emit('gameStarted', { message: 'Game has started!' });
    } else {
        console.log(`Room not found: ${roomCode}`);
        res.status(404).json({ success: false, message: 'Room not found.' });
    }
});

// Haetaan viimeisin huone
app.get('/latest-room', (req, res) => {
    console.log('Latest-room called'); // Lokitetaan kutsu reitin alussa
    const latestRoomCode = Object.keys(gameRooms).pop(); // Haetaan viimeisin huonekoodi
    if (latestRoomCode) {
        console.log(`Latest room code fetched: ${latestRoomCode}`); // Lokitetaan huonekoodi
        res.json({ success: true, roomCode: latestRoomCode });
    } else {
        console.log('No active room found'); // Lokitetaan virhetilanne
        res.status(404).json({ success: false, message: 'No active room found.' });
    }
});

app.get('/room-players/:roomCode', (req, res) => {
    console.log('Room-players called');
    const { roomCode } = req.params;
    if (gameRooms[roomCode]) {
        res.json({ success: true, players: gameRooms[roomCode].players });
    } else {
        res.status(404).json({ success: false, message: 'Room not found.' });
    }
});

// WebSocket-yhteys
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

    socket.on('chatMessage', ({ roomCode, senderName, message }) => {
        if (gameRooms[roomCode]) {
            console.log(`Message received in room ${roomCode}: ${message}`);
            io.to(roomCode).emit('chatMessage', { senderName, message }); // Broadcast to room
        } else {
            console.error(`Room not found for message: ${roomCode}`);
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

// Käynnistetään palvelin
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
