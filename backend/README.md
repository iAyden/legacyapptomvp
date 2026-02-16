# Backend - Task Manager API

Node.js + Express + MongoDB (Mongoose). See `SETUP_COMPLETE.md` for full API and setup details.

## Quick start

```bash
npm install
cp .env.example .env   # edit MONGODB_URI, JWT_SECRET
npm run init-data      # optional: seed default users & projects
npm run dev
```

## One-time migration from legacy localStorage

The script `scripts/migrateFromLocalStorageDump.js` imports a **JSON export of the legacy app’s localStorage** into MongoDB. It does **not** run automatically.

### 1. Export legacy data to JSON

In the legacy app (or browser console on the legacy page), export localStorage into one JSON object with these keys:

- `users` – array of `{ id, username, password }`
- `projects` – array of `{ id, name, description }`
- `tasks` – array of task objects (id, title, description, status, priority, projectId, assignedTo, dueDate, estimatedHours, actualHours, createdBy, createdAt, updatedAt)
- `comments` – array of `{ id, taskId, userId, commentText, createdAt }`
- `history` – array of `{ id, taskId, userId, action, oldValue, newValue, timestamp }`
- `notifications` – array of `{ id, userId, message, type, read, createdAt }`

Example (browser console on legacy app):

```js
const dump = {
  users: JSON.parse(localStorage.getItem('users') || '[]'),
  projects: JSON.parse(localStorage.getItem('projects') || '[]'),
  tasks: JSON.parse(localStorage.getItem('tasks') || '[]'),
  comments: JSON.parse(localStorage.getItem('comments') || '[]'),
  history: JSON.parse(localStorage.getItem('history') || '[]'),
  notifications: JSON.parse(localStorage.getItem('notifications') || '[]')
};
copy(JSON.stringify(dump));
// Then paste into a file, e.g. legacy-dump.json
```

Then save the pasted JSON to a file (e.g. `legacy-dump.json`) in the backend folder or pass its path to the script.

### 2. Run the migration

From the **backend** directory, with `MONGODB_URI` set in `.env`:

```bash
node scripts/migrateFromLocalStorageDump.js ./legacy-dump.json
```

Or with an absolute path:

```bash
node scripts/migrateFromLocalStorageDump.js /path/to/legacy-dump.json
```

### 3. What the script does

- Connects to MongoDB using `MONGODB_URI`.
- Inserts in order: **users** (passwords hashed with bcrypt) → **projects** → **tasks** → **comments** → **history** → **notifications**.
- Maps legacy numeric `id`s to MongoDB `_id`s and rewires references (e.g. task `projectId`, `assignedTo`, `createdBy`; comment `taskId`, `userId`).
- Tasks without a valid `createdBy` in the dump use the first migrated user.
- Comments/history/notifications that reference missing tasks or users are skipped.

### 4. Notes

- Run once on an empty (or dedicated) database; the script does not deduplicate by legacy id.
- Duplicate usernames will cause unique index errors; fix or de-duplicate users in the dump first.
