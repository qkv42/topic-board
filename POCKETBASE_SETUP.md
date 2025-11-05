# 🔧 Nastavení PocketBase

Tento návod vám pomůže nastavit PocketBase pro Topic Board aplikaci.

## 📥 Instalace PocketBase

### Krok 1: Stažení PocketBase

1. Jděte na [pocketbase.io](https://pocketbase.io/docs/)
2. Stáhněte verzi pro váš operační systém:
   - **Windows**: `pocketbase_X.X.X_windows_amd64.zip`
   - **macOS**: `pocketbase_X.X.X_darwin_amd64.zip` (Intel) nebo `pocketbase_X.X.X_darwin_arm64.zip` (Apple Silicon)
   - **Linux**: `pocketbase_X.X.X_linux_amd64.zip`

3. Rozbalte ZIP soubor

### Krok 2: Spuštění PocketBase

**macOS/Linux:**
```bash
chmod +x pocketbase
./pocketbase serve
```

**⚠️ macOS bezpečnostní varování:**

Pokud macOS zobrazí varování "pocketbase could not be opened because Apple cannot verify...", postupujte takto:

1. **Klikněte na "Done"** v dialogu (ne "Move to Bin")
2. Otevřete **Systémová nastavení** → **Soukromí a zabezpečení**
3. Najděte zprávu o PocketBase a klikněte na **"Přesto otevřít"** nebo **"Open Anyway"**
4. Nebo použijte v terminálu:
   ```bash
   xattr -d com.apple.quarantine pocketbase
   chmod +x pocketbase
   ./pocketbase serve
   ```

**Windows:**
```bash
pocketbase.exe serve
```

PocketBase poběží na `http://127.0.0.1:8090`

## 🗄️ Nastavení databáze

### Krok 1: Otevření Admin Dashboard

1. Otevřete `http://127.0.0.1:8090/_/` v prohlížeči
2. Při prvním spuštění vytvořte admin účet:
   - Email
   - Heslo

### Krok 2: Vytvoření kolekce "notes"

1. V admin dashboardu klikněte na **"New Collection"**
2. Jméno kolekce: `notes`
3. Klikněte na **"Create"**

### Krok 3: Přidání polí do kolekce

Přidejte následující pole (klikněte na **"Add new field"**):

| Jméno pole | Typ | Nastavení |
|------------|-----|-----------|
| `text` | Text | Required: false |
| `color` | Text | Required: false, Default: `#FFE5B4` |
| `x` | Number | Required: false, Default: `0` |
| `y` | Number | Required: false, Default: `0` |
| `comments` | JSON | Required: false |

**Nastavení přístupu:**
- V sekci **"View rule"**: `@request.auth.id != "" || @request.auth.id = ""` (nebo prostě `true` pro testování)
- V sekci **"Create rule"**: `true`
- V sekci **"Update rule"**: `true`
- V sekci **"Delete rule"**: `true`

> **Poznámka:** Pro produkci byste měli nastavit správnou autorizaci!

### Krok 4: Uložení kolekce

Klikněte na **"Save"** v pravém horním rohu.

## 🔌 Konfigurace aplikace

### Environment Variable

Vytvořte soubor `.env` v kořenovém adresáři projektu:

```env
VITE_POCKETBASE_URL=http://127.0.0.1:8090
```

Nebo pokud běží PocketBase na jiném počítači/síti:

```env
VITE_POCKETBASE_URL=http://192.168.1.100:8090
```

## 🚀 Spuštění aplikace

1. **Spusťte PocketBase** (pokud ještě neběží):
   ```bash
   ./pocketbase serve
   ```

2. **Spusťte frontend**:
   ```bash
   npm install  # pokud ještě nejsou nainstalované závislosti
   npm run dev
   ```

3. **Otevřete aplikaci** v prohlížeči: `http://localhost:5173`

## 🌐 Spolupráce více uživatelů

### Lokálně (stejná WiFi)

1. Zjistěte IP adresu počítače s PocketBase:
   - **macOS/Linux**: `ifconfig` nebo `ip addr`
   - **Windows**: `ipconfig`
   - Hledejte něco jako `192.168.1.100`

2. Spusťte PocketBase s externím přístupem:
   ```bash
   ./pocketbase serve --http=0.0.0.0:8090
   ```

3. Na ostatních počítačích nastavte `.env`:
   ```env
   VITE_POCKETBASE_URL=http://192.168.1.100:8090
   ```

4. Všichni uživatelé otevřou aplikaci a budou vidět stejný board!

### Cloud nasazení

Pro nasazení na cloud (Railway, Render, atd.):

1. Nahrajte `pocketbase` soubor na server
2. Spusťte: `./pocketbase serve`
3. Nastavte `VITE_POCKETBASE_URL` na URL vašeho serveru

## 📁 Umístění dat

PocketBase ukládá data do:
- **SQLite databáze**: `./pb_data/data.db`
- **Soubory**: `./pb_data/storage/`

**Zálohování:** Zkopírujte složku `pb_data` pro zálohu všech dat.

## 🔒 Bezpečnost

⚠️ **Důležité pro produkci:**
- Změňte admin heslo
- Nastavte správné View/Create/Update/Delete rules
- Použijte HTTPS (prostřednictvím reverse proxy jako Nginx)
- Zvažte autentizaci uživatelů

## ❓ Troubleshooting

**Problém: Nelze se připojit k PocketBase**
- Zkontrolujte, zda PocketBase běží (`http://127.0.0.1:8090`)
- Zkontrolujte `VITE_POCKETBASE_URL` v `.env`
- Zkontrolujte firewall (port 8090)

**Problém: CORS chyby**
- V PocketBase admin dashboardu: Settings → API rules
- Nastavte CORS rules podle potřeby

**Problém: Data se nesynchronizují**
- Zkontrolujte, zda je kolekce `notes` vytvořena
- Zkontrolujte View/Create/Update/Delete rules
- Otevřete browser console pro detaily chyb

## 📚 Další zdroje

- [PocketBase dokumentace](https://pocketbase.io/docs/)
- [PocketBase GitHub](https://github.com/pocketbase/pocketbase)
