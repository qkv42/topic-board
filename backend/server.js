import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

const DATA_FILE = path.join(__dirname, 'data', 'board.json');
const DATA_DIR = path.dirname(DATA_FILE);

// Vytvoření adresáře pro data, pokud neexistuje
fs.mkdir(DATA_DIR, { recursive: true }).catch(console.error);

// In-memory storage (pro rychlost)
let boardData = {
    notes: [],
    lastUpdated: Date.now()
};

// Načtení dat z souboru při startu
async function loadData() {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf-8');
        boardData = JSON.parse(data);
        console.log('✅ Data načtena z disku');
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log('📝 Nový board, vytvářím soubor...');
            await saveData();
        } else {
            console.error('❌ Chyba při načítání dat:', error);
        }
    }
}

// Uložení dat do souboru
async function saveData() {
    try {
        boardData.lastUpdated = Date.now();
        await fs.writeFile(DATA_FILE, JSON.stringify(boardData, null, 2));
    } catch (error) {
        console.error('❌ Chyba při ukládání dat:', error);
    }
}

// API endpoint pro získání aktuálního stavu boardu
app.get('/api/board', (req, res) => {
    res.json(boardData.notes);
});

// Socket.io real-time komunikace
io.on('connection', (socket) => {
    console.log(`👤 Uživatel připojen: ${socket.id}`);

    // Poslání aktuálního stavu novému uživateli
    socket.emit('board:initial', boardData.notes);

    // Poslání informace o připojení všem ostatním
    socket.broadcast.emit('user:joined', { userId: socket.id });

    // Přijetí změny boardu
    socket.on('board:update', async (data) => {
        const { notes, userId } = data;

        // Aktualizace dat
        boardData.notes = notes;

        // Uložení do souboru (asynchronně)
        saveData();

        // Odeslání změny všem ostatním klientům (kromě odesílatele)
        socket.broadcast.emit('board:updated', {
            notes,
            updatedBy: userId || socket.id,
            timestamp: Date.now()
        });
    });

    // Přijetí informace o pohybu poznámky (pro live preview)
    socket.on('note:dragging', (data) => {
        socket.broadcast.emit('note:dragging', {
            ...data,
            userId: socket.id
        });
    });

    // Přijetí informace o ukončení pohybu
    socket.on('note:dragend', (data) => {
        socket.broadcast.emit('note:dragend', {
            ...data,
            userId: socket.id
        });
    });

    // Odpojení uživatele
    socket.on('disconnect', () => {
        console.log(`👋 Uživatel odpojen: ${socket.id}`);
        socket.broadcast.emit('user:left', { userId: socket.id });
    });
});

const PORT = process.env.PORT || 3001;

// Načtení dat a spuštění serveru
loadData().then(() => {
    httpServer.listen(PORT, () => {
        console.log(`🚀 Server běží na http://localhost:${PORT}`);
        console.log(`📡 Socket.io připraven pro real-time komunikaci`);
    });
});

