# 🔥 Nastavení Firebase

Tento návod vám pomůže nastavit Firebase pro Topic Board aplikaci.

## 📥 Krok 1: Vytvoření Firebase projektu

1. Jděte na [Firebase Console](https://console.firebase.google.com/)
2. Klikněte na **"Add project"** nebo **"Vytvořit projekt"**
3. Zadejte název projektu: `topic-board` (nebo jiný název)
4. Klikněte **"Continue"**
5. (Volitelné) Vypněte Google Analytics, pokud ho nechcete
6. Klikněte **"Create project"**

## 🗄️ Krok 2: Nastavení Firestore Database

1. V Firebase Console klikněte na **"Firestore Database"** v levém menu
2. Klikněte na **"Create database"**
3. Vyberte **"Start in test mode"** (pro testování)
4. Vyberte lokaci (např. `europe-west` nebo `us-central`)
5. Klikněte **"Enable"**

⚠️ **Poznámka:** Test mode umožní přístup všem po dobu 30 dní. Pro produkci byste měli nastavit security rules.

## 🔑 Krok 3: Získání Firebase konfigurace

1. V Firebase Console klikněte na ikonu **ozubeného kola** → **"Project settings"**
2. Scrollujte dolů na **"Your apps"**
3. Klikněte na ikonu **Web** (`</>`)
4. Zadejte název aplikace: `Topic Board`
5. Klikněte **"Register app"**
6. Zkopírujte konfigurační objekt (bude obsahovat `apiKey`, `authDomain`, atd.)

## ⚙️ Krok 4: Nastavení .env souboru

Vytvořte nebo upravte soubor `.env` v kořenovém adresáři projektu:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

Nahraďte hodnoty hodnotami z Firebase konfigurace.

## 🔒 Krok 5: Nastavení Firestore Security Rules

1. V Firebase Console → **Firestore Database** → **Rules**
2. Nahraďte pravidla tímto (pro testování):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Povolit čtení a zápis pro kolekci notes
    match /notes/{document=**} {
      allow read, write: if true;
    }
  }
}
```

3. Klikněte **"Publish"**

⚠️ **Poznámka:** Tato pravidla povolují všem čtení i zápis. Pro produkci byste měli nastavit správnou autorizaci!

## 🚀 Krok 6: Instalace závislostí

```bash
npm install
```

## 📦 Krok 7: Spuštění aplikace

```bash
npm run dev
```

Otevřete `http://localhost:5173` v prohlížeči.

## 🌐 Nasazení na Firebase Hosting

1. Nainstalujte Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Přihlaste se:
   ```bash
   firebase login
   ```

3. Inicializujte Firebase v projektu:
   ```bash
   firebase init hosting
   ```
   - Vyberte existující projekt
   - Public directory: `dist`
   - Single-page app: `Yes`
   - Overwrite index.html: `No`

4. Build aplikace:
   ```bash
   npm run build
   ```

5. Deploy:
   ```bash
   firebase deploy --only hosting
   ```

Aplikace bude dostupná na: `https://your-project-id.web.app`

## ✅ Ověření, že to funguje

1. Otevřete aplikaci v prohlížeči
2. Přidejte poznámku
3. V Firebase Console → Firestore Database byste měli vidět nový dokument v kolekci `notes`

## 🔒 Bezpečnost (pro produkci)

Pro produkci byste měli upravit Firestore Security Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /notes/{noteId} {
      // Povolit čtení všem
      allow read: if true;
      
      // Povolit zápis přihlášeným uživatelům
      allow create, update, delete: if request.auth != null;
    }
  }
}
```

## ❓ Troubleshooting

**Problém: Chyba "Firebase: Error (auth/configuration-not-found)"**
- Zkontrolujte, zda jsou všechny hodnoty v `.env` správně nastavené
- Ujistěte se, že `VITE_` prefix je před každou proměnnou

**Problém: Chyba "Missing or insufficient permissions"**
- Zkontrolujte Firestore Security Rules
- Ujistěte se, že pravidla jsou publikovaná

**Problém: Data se neukládají**
- Otevřete Firebase Console → Firestore Database
- Zkontrolujte, zda existuje kolekce `notes`
- Zkontrolujte browser console pro chyby

## 📚 Další zdroje

- [Firebase dokumentace](https://firebase.google.com/docs)
- [Firestore dokumentace](https://firebase.google.com/docs/firestore)
- [Firebase Hosting](https://firebase.google.com/docs/hosting)

