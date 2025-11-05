# 🔧 Jak to funguje - Technický popis

## 📋 Obsah
1. [Struktura aplikace](#struktura-aplikace)
2. [Komunikace mezi klienty](#komunikace-mezi-klienty)
3. [Co potřebují uživatelé](#co-potřebují-uživatelé)
4. [Jak spustit aplikaci](#jak-spustit-aplikaci)

---

## 🏗️ Struktura aplikace

Aplikace se skládá ze **dvou částí**:

### 1. **Frontend** (React aplikace)
- Co dělá: Zobrazuje UI (sticky notes) uživateli
- Kde běží: V prohlížeči (Chrome, Firefox, Safari, atd.)
- Port: `http://localhost:5173` (nebo jiný, který Vite zobrazí)

### 2. **Backend** (Node.js server)
- Co dělá: 
  - Ukládá data (notes) do souboru
  - Posílá změny mezi uživateli v reálném čase
  - Koordinuje spolupráci
- Kde běží: Na vašem počítači jako server
- Port: `http://localhost:3001`

---

## 💬 Komunikace mezi klienty

### Přes co komunikuje?

**WebSockets** (přes Socket.io) - to je speciální typ připojení, které umožňuje:
- ✅ **Obousměrnou komunikaci** - server může poslat data klientovi kdykoliv
- ✅ **Real-time** - změny se zobrazí okamžitě (bez obnovení stránky)
- ✅ **Trvalé připojení** - spojení zůstává otevřené (na rozdíl od HTTP požadavků)

### Jak to funguje?

```
┌─────────────┐         ┌─────────────┐
│  Uživatel 1 │         │  Uživatel 2 │
│  (Prohlížeč)│         │  (Prohlížeč)│
└──────┬──────┘         └──────┬──────┘
       │                       │
       │  WebSocket            │  WebSocket
       │  (Socket.io)          │  (Socket.io)
       │                       │
       └───────────┬───────────┘
                   │
            ┌──────▼──────┐
            │   Backend   │
            │   Server    │
            │ (localhost  │
            │   :3001)    │
            └─────────────┘
```

### Co se děje při změně?

**Příklad: Uživatel 1 přidá novou poznámku**

1. **Uživatel 1** klikne na "Přidat poznámku"
2. Frontend přidá poznámku lokálně (vidí ji hned)
3. Frontend pošle změnu na **Backend server** přes WebSocket
4. Backend server:
   - Uloží změnu do `backend/data/board.json`
   - Pošle změnu **všem ostatním připojeným klientům** (Uživatel 2, 3, ...)
5. **Uživatel 2** (a ostatní) dostanou změnu a poznámka se zobrazí v jejich prohlížeči

**Výsledek:** Všichni vidí změnu téměř okamžitě (obvykle < 100ms)!

---

## 👥 Co potřebují uživatelé?

### Pro lokální testování (na stejném počítači):

1. **Backend server běžící** - jeden backend pro všechny uživatele
2. **Přístup k backendu** - všichni musí mít přístup k `http://localhost:3001`
3. **Otevřít aplikaci v prohlížeči** - každý uživatel otevře `http://localhost:5173` v jiném okně/zařízení

### Pro spolupráci přes síť (na různých počítačích):

1. **Backend server běžící** na jednom počítači
2. **Znalost IP adresy** počítače s backendem (např. `192.168.1.100`)
3. **Uživatelé musí být na stejné síti** (stejná WiFi/LAN)
4. **Upravit URL** - uživatelé musí změnit `VITE_SOCKET_URL` na IP adresu serveru

**Příklad:**
- Počítač s backendem: `192.168.1.100`
- Ostatní uživatelé: Nastaví `VITE_SOCKET_URL=http://192.168.1.100:3001`
- Otevřou aplikaci: `http://192.168.1.100:5173` (nebo pokud je frontend na serveru)

### Pro spolupráci přes internet:

1. **Backend server nasazený** na veřejném serveru (např. Heroku, Railway, Render)
2. **Všichni uživatelé** mají přístup k internetu
3. **URL serveru** - všichni používají stejnou URL (např. `https://topic-board.herokuapp.com`)

---

## 🚀 Jak spustit aplikaci

### Možnost 1: Spustit oba servery najednou (doporučeno)

**Po instalaci `concurrently`:**
```bash
npm install  # nainstaluje i concurrently
npm run dev:all
```

Toto spustí **backend i frontend současně v jednom terminálu**.

### Možnost 2: Dva terminály (manuální kontrola)

**Terminál 1 - Backend:**
```bash
cd backend
npm install  # pouze při první instalaci
npm run dev
```

**Terminál 2 - Frontend:**
```bash
npm install  # pouze při první instalaci
npm run dev
```

### Po spuštění:

1. Otevřete `http://localhost:5173` v prohlížeči
2. Zadejte jméno
3. Otevřete další okno/prohlížeč pro druhého uživatele
4. Hotovo! 🎉

---

## 🔍 Technické detaily

### Socket.io Events

**Klient → Server:**
- `board:update` - Posílá celý board po změně
- `note:dragging` - Informace o pohybu poznámky (pro live preview)
- `note:dragend` - Ukončení pohybu poznámky

**Server → Klient:**
- `board:initial` - Pošle aktuální stav novému klientovi
- `board:updated` - Pošle aktualizaci všem ostatním klientům
- `user:joined` - Informace o připojení uživatele
- `user:left` - Informace o odpojení uživatele

### Ukládání dat

- Data se ukládají do `backend/data/board.json`
- Při každé změně se soubor aktualizuje
- Při restartu serveru se data načtou ze souboru
- **Poznámka:** Pro produkci by bylo lepší použít databázi (PostgreSQL, MongoDB)

### Bezpečnost

⚠️ **Aktuální verze je určena pro vývoj/testování:**
- Není autentizace
- Není autorizace (kdokoliv může cokoliv změnit)
- CORS je nastaven pro localhost

**Pro produkci je potřeba přidat:**
- Autentizaci uživatelů
- Autorizaci (kdo může co dělat)
- HTTPS
- Bezpečnostní middleware

---

## ❓ Často kladené otázky

**Q: Proč potřebuji dva servery?**
A: Frontend (React) běží ve vašem prohlížeči, ale potřebuje server, který sdílí data mezi uživateli. Backend server je ten "prostředník".

**Q: Můžou uživatelé spolupracovat, i když jsou na různých počítačích?**
A: Ano, pokud jsou na stejné síti a znají IP adresu počítače s backendem.

**Q: Proč se změny zobrazují okamžitě?**
A: WebSockets umožňují serveru poslat data klientovi kdykoliv, bez čekání na požadavek. To je rozdíl oproti klasickému HTTP.

**Q: Co se stane, když backend spadne?**
A: Uživatelé se odpojí a ztratí real-time synchronizaci. Data zůstanou v `board.json`, takže po restartu backendu se obnoví.

**Q: Kolik uživatelů může spolupracovat současně?**
A: Technicky neomezeně, ale záleží na výkonu serveru. Pro desítky uživatelů by to mělo být v pořádku.

