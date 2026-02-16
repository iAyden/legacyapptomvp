# Frontend - Task Manager

React + Vite + Tailwind. Responsive layout (topbar + collapsible sidebar + main content).

## Setup

```bash
cd frontend
npm install
```

## Env

Create `.env` (or use `.env.example`):

```
VITE_API_URL=http://localhost:4000
```

## Run

```bash
npm run dev
```

Open http://localhost:5173

## Build

```bash
npm run build
npm run preview
```

## Pages

- Login, Tasks, Projects, Comments, History, Notifications, Search, Reports.
- Token stored in `localStorage`; API base URL from `VITE_API_URL`.
