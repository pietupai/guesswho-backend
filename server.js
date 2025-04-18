const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res) => res.send('Guess Who Backend is running!'));
app.post('/create-room', (req, res) => {
    const roomCode = generateRoomCode();
    res.json({ roomCode });
});

function generateRoomCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let roomCode = '';
    for (let i = 0; i < 6; i++) {
        roomCode += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return roomCode;
}

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
