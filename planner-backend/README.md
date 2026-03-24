# Rucha's Planner — Setup Guide

## What you need (all free)
- Python 3.10+
- Node.js 18+
- A Google account
- A Firebase project
- An Anthropic API key

---

## Step 1 — Firebase Setup (10 mins)

1. Go to https://console.firebase.google.com → **Add project** → name it "My Planner"
2. **Enable Google Auth:**
   - Build → Authentication → Get started → Sign-in method → Google → Enable
   - Add your domain: `localhost` to Authorized domains
3. **Enable Firestore:**
   - Build → Firestore Database → Create database → Start in test mode
4. **Get Web App config:**
   - Project Settings (⚙️) → Your apps → Add app → Web
   - Copy the `firebaseConfig` object — you'll need it for `.env`
5. **Get Service Account (for backend):**
   - Project Settings → Service accounts → Generate new private key
   - Download the JSON file → save as `firebase-credentials.json` in `planner-backend/`
6. **Add yourself as OAuth test user:**
   - Google Cloud Console (console.cloud.google.com) → APIs & Services → Audience
   - Add your Gmail under Test Users

---

## Step 2 — Frontend Setup

```bash
cd planner-app
cp .env.example .env
# Fill in .env with your Firebase config values
npm install
npm run dev
```

Your app runs at http://localhost:5173

---

## Step 3 — Backend Setup

```bash
cd planner-backend
cp .env.example .env
# Fill in:
#   ANTHROPIC_API_KEY = your key from console.anthropic.com
#   FIREBASE_CREDENTIALS_PATH = ./firebase-credentials.json

pip install -r requirements.txt
uvicorn main:app --reload
```

Backend runs at http://localhost:8000

---

## Step 4 — First Sign-In

1. Open http://localhost:5173
2. Click **Continue with Google**
3. Sign in — this grants both app login AND Google Calendar access in one step
4. You're in! Your data saves automatically to Firebase.

---

## How it works day-to-day

- **AI Scheduler**: Go to AI Scheduler → click Generate. It reads your tasks, checks Mumbai weather + AQI, and pushes a schedule to Google Calendar automatically every morning.
- **Habits**: Tick off habits daily. Monthly calendar shows your streaks.
- **Vision Board**: Add/edit/delete goals per category. Progress tracked automatically.
- **Tasks**: All tasks persist to Firebase — no data loss on refresh.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "Access blocked" on Google sign-in | Add your Gmail as a test user in Google Cloud Console → APIs & Services → Audience |
| AI scheduler error | Make sure backend is running on port 8000 and ANTHROPIC_API_KEY is set |
| Calendar not loading | Sign out and sign back in — Google token may have expired |
| Data not saving | Check Firebase credentials path in backend .env |
