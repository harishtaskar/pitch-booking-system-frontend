# Pitch Booking System — Frontend

Booking calendar UI for the Cricket Pitch Booking System.
React + Vite + TypeScript + TailwindCSS, with TanStack Query and a Socket.io client.

Backend repo: **pitch-booking-system-backend** (must be running for the app to work).

---

## Features

- Register / login / logout (JWT stored in `localStorage`), protected routes
- Pitch list
- **Booking calendar**: pick a pitch + date, see a slot grid coloured
  Available / Reserved / Booked
- Reserve → **live 2-minute countdown** → confirm flow
- **Real-time updates** — slots flip to Reserved/Booked/Available instantly as
  other users act, via Socket.io
- My Bookings page

---

## Prerequisites

- Node.js 18+
- The backend API running (default `http://localhost:4000`)

---

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
#   VITE_API_URL    -> backend HTTP URL
#   VITE_SOCKET_URL -> backend Socket.io URL (usually the same)

# 3. Run
npm run dev        # http://localhost:5173

# Production build
npm run build && npm run preview
```

> Make sure the backend's `CLIENT_ORIGIN` matches this app's URL
> (`http://localhost:5173` by default) or CORS / sockets will be blocked.

### Environment variables

| Var | Description |
|---|---|
| `VITE_API_URL` | Base URL of the backend REST API |
| `VITE_SOCKET_URL` | Base URL of the backend Socket.io server |

---

## How the booking flow works

1. Open a pitch → the app fetches `/slots?pitchId=&date=` and joins the
   Socket.io room `pitch:{id}:{date}`.
2. Click an **Available** slot → `POST /reserve-slot` places a 2-minute hold and
   a countdown starts.
3. Click **Confirm booking** before the timer ends → `POST /confirm-booking`.
4. If the countdown reaches zero, the hold is released (locally and via the
   server's `slot:released` event) and the slot returns to Available.

While viewing a pitch, incoming `slot:reserved` / `slot:booked` /
`slot:released` events update the grid live without a refresh.

---

## Project structure

```
src/
  lib/        api (axios + JWT interceptor), socket client, shared types
  context/    AuthContext (login/register/logout, token persistence)
  components/  Navbar, ProtectedRoute, SlotCard, CountdownTimer
  pages/      Login, Register, Pitches, Calendar, MyBookings
  App.tsx     routes
  main.tsx    providers (QueryClient, Auth, Router)
```
