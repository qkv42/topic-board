# Topic Board Backend

Backend server pro real-time spolupráci na sticky notes.

## Instalace

```bash
npm install
```

## Spuštění

### Vývojový režim (s auto-reload)
```bash
npm run dev
```

### Produkční režim
```bash
npm start
```

Server běží na portu 3001 (nebo PORT z environment variable).

## Konfigurace

### Environment Variables

- `PORT` - Port, na kterém server poběží (default: 3001)
- `FRONTEND_URL` - URL frontendu pro CORS (default: http://localhost:5173)

Příklad `.env` souboru:
```
PORT=3001
FRONTEND_URL=http://localhost:5173
```

## Data

Data se ukládají do `backend/data/board.json`. Tento soubor se automaticky vytvoří při prvním spuštění.

## API

### GET /api/board
Vrací aktuální stav boardu (pole notes).

## Socket.io Events

### Server poslouchá:
- `board:update` - Aktualizace boardu od klienta
- `note:dragging` - Informace o pohybu poznámky
- `note:dragend` - Informace o ukončení pohybu

### Server odesílá:
- `board:initial` - Inicializace boardu pro nového klienta
- `board:updated` - Aktualizace boardu od jiného klienta
- `note:dragging` - Informace o pohybu poznámky od jiného klienta
- `note:dragend` - Informace o ukončení pohybu od jiného klienta
- `user:joined` - Informace o připojení uživatele
- `user:left` - Informace o odpojení uživatele

