# TradeQuip – Daily Activity Logger

Field activity logging for onsite employees and subcontractors.  
Face ID · Auto GPS Geofencing · Camera · Voice Notes · Admin Dashboard

---

## Live App

Once deployed your app will be live at:
```
https://YOUR-USERNAME.github.io/tradequip-logger/
```

---

## How to Deploy (Step by Step)

### Step 1 — Create a GitHub account
Go to **https://github.com** and sign up if you don't have one.

### Step 2 — Create a new repository
1. Click the **+** button (top right) → **New repository**
2. Repository name: `tradequip-logger`
3. Set to **Public** *(required for free GitHub Pages)*
4. **Do NOT** tick "Add a README" — leave it empty
5. Click **Create repository**

### Step 3 — Upload your files
On the empty repo page:
1. Click **uploading an existing file** (link in the middle of the page)
2. Drag and drop ALL of these files/folders:
   - `index.html`
   - `README.md`
   - `.gitignore`
   - `.env.example`
   - The entire `.github` folder (contains `workflows/deploy.yml`)
   - The entire `server` folder (contains `reminderService.js`)
3. Scroll down, write commit message: `Initial upload`
4. Click **Commit changes**

### Step 4 — Enable GitHub Pages
1. Go to your repo → **Settings** tab (top menu)
2. Left sidebar → **Pages**
3. Under **Source** select: **GitHub Actions**
4. Click **Save**

### Step 5 — Watch it deploy
1. Click the **Actions** tab in your repo
2. You'll see a workflow called "Deploy TradeQuip to GitHub Pages" running
3. Wait ~60 seconds for the orange dot to turn green ✅
4. Your app is now live at `https://YOUR-USERNAME.github.io/tradequip-logger/`

---

## Important — GPS requires HTTPS

GPS geofencing **only works on HTTPS** — not on `file://` opened locally.  
GitHub Pages serves over HTTPS automatically, so once deployed it works perfectly.

To test GPS locally before deploying, run this in your project folder:
```bash
npx serve .
```
Then open `http://localhost:3000` — Chrome will prompt for location access.

---

## Features

| Feature | Detail |
|---|---|
| 🔐 Face ID / PIN | Biometric auth prevents buddy punching |
| 📍 Auto Geofencing | GPS tracks silently — clock-in unlocks on arrival |
| 🚗 Auto Clock-Out | Fires automatically when worker leaves site boundary |
| 📷 Live Camera | Take photos and record video without leaving the app |
| 🎙️ Voice Notes | Speech-to-text note dictation |
| 🛡️ Admin Dashboard | Full data view, GPS audit trail, buddy punch alerts |
| 👤 People | Add/edit employees and subcontractors |
| 🏢 Clients & Sites | Add clients with sites, GPS coords, and fence radius |
| 🧩 Modules | Toggle every feature on/off |
| 📨 Reminders | Twilio SMS + email for workers who haven't submitted |
| ⬇️ Export CSV | Download all logs instantly |

---

## Geofence Radius

Default is **15 metres** (~16 yards).  
You can set it as tight as **5 metres** per site in **Clients & Sites → Edit**.

---

## Project Structure

```
tradequip-logger/
├── index.html              ← Full app (single file, no build needed)
├── .github/
│   └── workflows/
│       └── deploy.yml      ← Auto-deploys to GitHub Pages on push
├── server/
│   └── reminderService.js  ← Twilio + email cron job (needs a server)
├── .env.example            ← Copy to .env and fill in secrets
├── .gitignore
└── README.md
```

---

## Twilio Reminders (Optional)

The SMS reminder service runs separately on a server.  
See `server/reminderService.js` — host it on Railway, Render, or any Node host.  
Set environment variables from `.env.example` — never commit your `.env` file.

