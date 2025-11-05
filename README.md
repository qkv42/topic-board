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
- ✅ **Firebase backend** - cloud databáze a real-time synchronizace
- ✅ **Firestore** - NoSQL cloud databáze
- ✅ Identifikace uživatelů (jméno)
- ✅ Status připojení (připojeno/odpojeno)
- ✅ Moderní a responzivní design

## 📦 Instalace a Spuštění

### Předpoklady
- Node.js (v18 nebo vyšší)
- npm nebo yarn
- Firebase účet (zdarma) - [firebase.google.com](https://firebase.google.com/)

### 1. Nastavení Firebase

**Důležité:** Nejprve musíte nastavit Firebase projekt! Podrobný návod najdete v [FIREBASE_SETUP.md](./FIREBASE_SETUP.md).

Zkráceně:
1. Vytvořte projekt na [Firebase Console](https://console.firebase.google.com/)
2. Vytvořte Firestore Database (test mode)
3. Získejte Firebase konfiguraci (Project Settings → Your apps → Web app)

### 2. Konfigurace

Vytvořte soubor `.env` v kořenovém adresáři projektu:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### 3. Instalace závislostí

```bash
npm install
```

### 4. Spuštění aplikace

```bash
npm run dev
```

Aplikace poběží na `http://localhost:5173`

### 5. Otevření aplikace

Otevřete `http://localhost:5173` v prohlížeči. Při prvním spuštění budete vyzváni k zadání jména.

### Spolupráce více uživatelů

1. **Všechno už běží v cloudu!** ✅
2. Otevřete aplikaci v **více prohlížečích/oknech** (nebo na různých zařízeních)
3. Zadejte různá jména v každém okně
4. Všechny změny se synchronizují v reálném čase automaticky!

**Pro nasazení na web:** Viz [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) - sekce "Nasazení na Firebase Hosting"

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
- **Firebase SDK** - Komunikace s Firestore a real-time listeners
- **CSS3** - Styling

### Backend
- **Firebase** - Google cloud platform
- **Firestore** - NoSQL cloud databáze
- **Real-time Listeners** - Automatická synchronizace změn
- **Firebase Hosting** - Hosting frontendu (volitelné)

## 🔧 Konfigurace

### Environment Variables

**Frontend** (`.env`):
```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

## 📁 Struktura projektu

```
topic-board/
├── src/                    # Frontend React aplikace
│   ├── config/
│   │   └── firebase.ts     # Firebase konfigurace
│   ├── services/
│   │   └── firebase.ts     # Firebase service
│   └── ...
├── package.json            # Frontend dependencies
├── FIREBASE_SETUP.md       # Návod na nastavení Firebase
└── README.md
```

## 🔮 Možná budoucí vylepšení

- [ ] ✅ Ukládání na server (Firebase) - **Hotovo!**
- [ ] ✅ Real-time synchronizace - **Hotovo!**
- [ ] ✅ Spolupráce více uživatelů - **Hotovo!**
- [ ] ✅ Cloud databáze (Firestore) - **Hotovo!**
- [ ] Více boardů (sdílení konkrétních boardů)
- [ ] Uživatelské účty a autentizace (Firebase Authentication to podporuje!)
- [ ] Kategorie/tagy pro notes
- [ ] Vyhledávání notes
- [ ] Export/import boards
- [ ] Zobrazení aktivních uživatelů
- [ ] Historie změn

## 📚 Dokumentace

- [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) - Podrobný návod na nastavení Firebase
- [HOW_IT_WORKS.md](./HOW_IT_WORKS.md) - Technický popis fungování aplikace

