# Full Stack Setup Guide

## Backend + Frontend Integration

### Quick Start (Both Services)

**Terminal 1 - Backend:**
```powershell
cd C:\Users\hemanth\Desktop\email-assignment\backend
node src/index.js
```

**Terminal 2 - Frontend:**
```powershell
cd C:\Users\hemanth\Desktop\email-assignment\mailbox-main
npm run dev
```

Then open: **http://localhost:5173** (Vite dev server)

---

## What Changed

### Backend (`backend/`)
- Already serving API at `http://localhost:8000`
- Endpoints: `/api/prompts`, `/api/emails`, `/api/ingest`, `/api/chat/:id`, `/api/drafts`
- Auto-seeds database on startup

### Frontend (`mailbox-main/`)
- **Vite proxy** configured to forward `/api/*` requests to `localhost:8000`
- React app loads emails and prompts from backend on startup
- All LLM operations now go through backend API
- Prompts auto-save to backend when changed

---

## Integration Flow

1. **Frontend starts** → `http://localhost:5173`
2. **Loads data** → `GET /api/emails` and `GET /api/prompts` (proxied to backend)
3. **User clicks "AI Process Inbox"** → `POST /api/ingest` → Backend processes emails with Gemini
4. **User chats** → `POST /api/chat/:emailId` → Backend sends context to Gemini
5. **User generates draft** → `POST /api/drafts` → Backend creates reply
6. **User edits prompts** → `PUT /api/prompts/:name` → Saved to database

---

## Testing the Connection

### 1. Start Backend
```powershell
cd backend
node src/index.js
```
Expected output:
```
🌱 Default prompts seeded.
📨 Mock emails seeded.
🚀 Backend running at http://localhost:8000
```

### 2. Verify Backend
```powershell
Invoke-RestMethod -Uri 'http://localhost:8000/health'
```
Should return: `{ "status": "OK" }`

### 3. Start Frontend
```powershell
cd ..\mailbox-main
npm run dev
```
Expected output:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  press h + enter to show help
```

### 4. Open Browser
Navigate to: `http://localhost:5173`

You should see:
- Emails loaded from backend
- "AI Process Inbox" button functional
- Chat and draft generation working

---

## Troubleshooting

### Frontend shows "Loading..." forever
- **Check:** Is backend running on port 8000?
- **Fix:** Start backend first, then refresh frontend

### "Failed to process inbox" error
- **Check:** Is `GEMINI_API_KEY` set in `backend/.env`?
- **Fix:** Add your API key and restart backend

### Proxy errors in browser console
- **Check:** Vite dev server running? Backend on port 8000?
- **Fix:** Ensure both servers are running and ports match

### Changes to prompts not persisting
- **Check:** Backend database initialized? (`npx prisma db push`)
- **Fix:** Run `npx prisma db push` in backend folder

---

## Architecture

```
┌─────────────────────────────────────┐
│  Browser: http://localhost:5173     │
│  (React + Vite)                     │
└──────────────┬──────────────────────┘
               │
               │ Proxy: /api/* → localhost:8000
               ▼
┌─────────────────────────────────────┐
│  Backend: http://localhost:8000     │
│  (Express + Prisma + SQLite)        │
└──────────────┬──────────────────────┘
               │
               │ LLM calls
               ▼
┌─────────────────────────────────────┐
│  Google Gemini API                  │
└─────────────────────────────────────┘
```

---

## Environment Variables

### Backend `.env`
```
DATABASE_URL="file:./dev.db"
GEMINI_API_KEY="your-key-here"
PORT=8000
```

### Frontend (no .env needed)
Vite proxy automatically forwards to `localhost:8000`

---

## Development Workflow

1. **Edit backend code** → auto-restart with `nodemon src/index.js`
2. **Edit frontend code** → Vite hot-reloads automatically
3. **Edit prompts in UI** → saved to database instantly
4. **Process emails** → calls backend → backend calls Gemini → results stored in DB

---

## Production Notes

For production deployment:
1. Build frontend: `cd mailbox-main && npm run build`
2. Serve built files from backend: Copy `dist/` to `backend/public/`
3. Update backend to serve static files from `public/`
4. Set proper CORS and environment variables

---

## Port Reference

| Service | Port | URL |
|---------|------|-----|
| Backend API | 8000 | http://localhost:8000 |
| Frontend Dev | 5173 | http://localhost:5173 |
| Prisma Studio | 5555 | http://localhost:5555 |

---

## Quick Commands

```powershell
# Backend
cd backend
npm install                    # Install deps
npx prisma generate            # Generate client
npx prisma db push             # Create database
node src/index.js              # Start server

# Frontend
cd mailbox-main
npm install                    # Install deps
npm run dev                    # Start dev server
npm run build                  # Build for production

# Testing
cd backend
.\run_endpoints.ps1            # Test all endpoints
```

---

## Next Steps

- Frontend now fully integrated with backend
- All data persists in SQLite database
- Prompts are editable and saved automatically
- LLM processing happens server-side (secure)
- Ready for production build and deployment
