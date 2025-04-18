const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser'); // Lisätään body-parser

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'https://pietupai.github.io',
        methods: ['GET', 'POST'],
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

    if (gameRooms[roomCode]) {
        gameRooms[roomCode].players.push(playerName);
        console.log(`${playerName} joined room: ${roomCode}`);
        res.json({ success: true });

        io.to(roomCode).emit('playerJoined', gameRooms[roomCode].players);
    } else {
        console.log(`Room not found: ${roomCode}`);
        res.status(404).json({ success: false, message: 'Room not found.' });
    }
});

// Aloita peli
app.post('/start-game', (req, res) => {
    const { roomCode } = req.body;

    if (gameRooms[roomCode]) {
        console.log(`Game started in room: ${roomCode}`);
        res.json({ success: true });

        io.to(roomCode).emit('gameStarted', { message: 'Game has started!' });
    } else {
        console.log(`Room not found: ${roomCode}`);
        res.status(404).json({ success: false, message: 'Room not found.' });
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
            console.log(`Room not found: ${roomCode}`);
        }
    });

    socket.on('sendMessage', (data) => {
        const { roomCode, senderName, message } = data;

        if (gameRooms[roomCode]) {
            gameRooms[roomCode].messages.push({ senderName, message });
            console.log(`Message from ${senderName} in room ${roomCode}: ${message}`);

            io.to(roomCode).emit('newMessage', { senderName, message });
        } else {
            console.log(`Room not found: ${roomCode}`);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
