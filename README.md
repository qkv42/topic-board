# 📌 Topic Board - Aplikace pro Sticky Notes

Webová aplikace pro správu barevných sticky notes s možností komentování, manipulace a **real-time spolupráce** mezi více uživateli.

## 🚀 Funkce

- ✅ Přidávání barevných sticky notes
- ✅ Přetahování notes po obrazovce (drag & drop)
- ✅ Změna barvy notes
- ✅ Komentování notes
- ✅ Editace textu notes
- ✅ **Real-time synchronizace** - změny vidí všichni uživatelé okamžitě
- ✅ **Spolupráce více uživatelů** - více lidí může pracovat současně
- ✅ **PocketBase backend** - moderní backend s databází a real-time subscriptions
- ✅ SQLite databáze - strukturované ukládání dat
- ✅ Identifikace uživatelů (jméno)
- ✅ Status připojení (připojeno/odpojeno)
- ✅ Moderní a responzivní design

## 📦 Instalace a Spuštění

### Předpoklady
- Node.js (v18 nebo vyšší)
- npm nebo yarn
- PocketBase (viz [POCKETBASE_SETUP.md](./POCKETBASE_SETUP.md))

### 1. Instalace PocketBase

**Důležité:** Nejprve musíte nastavit PocketBase! Podrobný návod najdete v [POCKETBASE_SETUP.md](./POCKETBASE_SETUP.md).

Zkráceně:
1. Stáhněte PocketBase z [pocketbase.io](https://pocketbase.io/docs/)
2. Spusťte: `./pocketbase serve`
3. Vytvořte kolekci `notes` v admin dashboardu (`http://127.0.0.1:8090/_/`)

### 2. Instalace závislostí frontendu

```bash
npm install
```

### 3. Konfigurace

Vytvořte soubor `.env` v kořenovém adresáři:

```env
VITE_POCKETBASE_URL=http://127.0.0.1:8090
```

### 4. Spuštění aplikace

**Terminál 1 - PocketBase:**
```bash
./pocketbase serve
```

**Terminál 2 - Frontend:**
```bash
npm run dev
```

Frontend poběží na `http://localhost:5173`

### 5. Otevření aplikace

Otevřete `http://localhost:5173` v prohlížeči. Při prvním spuštění budete vyzváni k zadání jména.

### Spolupráce více uživatelů

1. Spusťte PocketBase server (pokud ještě neběží)
2. Pro spolupráci přes síť: Spusťte PocketBase s `--http=0.0.0.0:8090` a nastavte `VITE_POCKETBASE_URL` na IP adresu serveru
3. Otevřete aplikaci v **více prohlížečích/oknech** (nebo na různých zařízeních)
4. Zadejte různá jména v každém okně
5. Všechny změny se synchronizují v reálném čase!

## 🛠️ Build pro produkci

```bash
npm run build
```

Výsledek bude v adresáři `dist/`.

## 📝 Použití

- **Přidat poznámku**: Klikněte na tlačítko "+ Přidat poznámku" v hlavičce
- **Přesunout poznámku**: Klikněte a táhněte poznámku po obrazovce
- **Editovat text**: Klikněte na text poznámky
- **Změnit barvu**: Klikněte na ikonu 🎨 v pravém horním rohu poznámky
- **Přidat komentář**: Klikněte na ikonu 💬 a zadejte komentář
- **Smazat poznámku**: Klikněte na × v pravém horním rohu poznámky

## 🏗️ Technologie

### Frontend
- **React 18** - UI framework
- **TypeScript** - Typování
- **Vite** - Build tool a dev server
- **PocketBase SDK** - Komunikace s backendem a real-time subscriptions
- **CSS3** - Styling

### Backend
- **PocketBase** - Open-source backend s databází
- **SQLite** - Embedded databáze pro ukládání dat
- **Real-time Subscriptions** - WebSocket komunikace pro synchronizaci
- **REST API** - Automaticky generované API

## 🔧 Konfigurace

### Environment Variables

**Frontend** (`.env`):
```env
VITE_POCKETBASE_URL=http://127.0.0.1:8090
```

Pro spolupráci přes síť použijte IP adresu:
```env
VITE_POCKETBASE_URL=http://192.168.1.100:8090
```

## 📁 Struktura projektu

```
topic-board/
├── src/                    # Frontend React aplikace
│   ├── services/
│   │   └── pocketbase.ts   # PocketBase service
│   └── ...
├── package.json            # Frontend dependencies
├── POCKETBASE_SETUP.md     # Návod na nastavení PocketBase
└── README.md
```

**Poznámka:** PocketBase je samostatný spustitelný soubor, který spouštíte zvlášť.

## 🔮 Možná budoucí vylepšení

- [ ] ✅ Ukládání na server (PocketBase) - **Hotovo!**
- [ ] ✅ Real-time synchronizace - **Hotovo!**
- [ ] ✅ Spolupráce více uživatelů - **Hotovo!**
- [ ] ✅ SQLite databáze - **Hotovo!**
- [ ] Více boardů (sdílení konkrétních boardů)
- [ ] Uživatelské účty a autentizace (PocketBase to podporuje!)
- [ ] Kategorie/tagy pro notes
- [ ] Vyhledávání notes
- [ ] Export/import boards
- [ ] Zobrazení aktivních uživatelů
- [ ] Historie změn

## 📚 Dokumentace

- [POCKETBASE_SETUP.md](./POCKETBASE_SETUP.md) - Podrobný návod na nastavení PocketBase
- [HOW_IT_WORKS.md](./HOW_IT_WORKS.md) - Technický popis fungování aplikace

