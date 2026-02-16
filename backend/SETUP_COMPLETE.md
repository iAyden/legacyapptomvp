# Backend Setup Complete

## Files Created

### Database & Models
- ✅ `db.js` - MongoDB connection using Mongoose
- ✅ `models/User.js` - User model with passwordHash and bcrypt methods
- ✅ `models/Project.js` - Project model (name, description)
- ✅ `models/Task.js` - Task model matching all legacy fields
- ✅ `models/Comment.js` - Comment model for task comments
- ✅ `models/History.js` - History model for activity tracking
- ✅ `models/Notification.js` - Notification model for user notifications

### Authentication
- ✅ `routes/auth.js` - Auth routes (login, register, me)
- ✅ `middleware/auth.js` - JWT authentication middleware

### Server
- ✅ `server.js` - Express server with MongoDB connection and auth routes
- ✅ `package.json` - Dependencies (mongoose, bcrypt, jsonwebtoken, etc.)
- ✅ `.env` - Environment variables configured

### Scripts
- ✅ `scripts/initData.js` - Initialize default users and projects

## Installation & Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Variables

The `.env` file is already configured with:
- MongoDB URI (Atlas connection)
- JWT Secret
- Port (4000)
- CORS Origin (http://localhost:5173)

### 3. Initialize Default Data

Run this once to create default users and projects matching the legacy app:

```bash
npm run init-data
```

This creates:
- Users: admin/admin, user1/user1, user2/user2
- Projects: Proyecto Demo, Proyecto Alpha, Proyecto Beta

### 4. Start the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
  ```json
  { "username": "test", "password": "test123" }
  ```
  Returns: `{ token, user: { id, username } }`

- `POST /api/auth/login` - Login (matches legacy behavior)
  ```json
  { "username": "admin", "password": "admin" }
  ```
  Returns: `{ token, user: { id, username } }`

- `GET /api/auth/me` - Get current user (requires auth token)
  Headers: `Authorization: Bearer <token>`
  Returns: `{ user: { id, username } }`

### Health Check
- `GET /api/health` - Server health check
  Returns: `{ ok: true }`

## Testing

### Test Health Endpoint
```bash
curl http://localhost:4000/api/health
```

### Test Login
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'
```

### Test Protected Route (with token)
```bash
curl http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer <your-token>"
```

## Model Schemas

### User
- `username` (String, required, unique)
- `passwordHash` (String, required)
- `createdAt`, `updatedAt` (auto)

### Project
- `name` (String, required)
- `description` (String, default: '')
- `createdAt`, `updatedAt` (auto)

### Task
- `title` (String, required)
- `description` (String, default: '')
- `status` (Enum: Pendiente, En Progreso, Completada, Bloqueada, Cancelada)
- `priority` (Enum: Baja, Media, Alta, Crítica)
- `projectId` (ObjectId ref Project, nullable)
- `assignedTo` (ObjectId ref User, nullable)
- `dueDate` (String, YYYY-MM-DD format)
- `estimatedHours` (Number, default: 0)
- `actualHours` (Number, default: 0)
- `createdBy` (ObjectId ref User, required)
- `createdAt`, `updatedAt` (auto)

### Comment
- `taskId` (ObjectId ref Task, required)
- `userId` (ObjectId ref User, required)
- `commentText` (String, required)
- `createdAt` (auto)

### History
- `taskId` (ObjectId ref Task, required)
- `userId` (ObjectId ref User, required)
- `action` (Enum: CREATED, STATUS_CHANGED, TITLE_CHANGED, DELETED)
- `oldValue` (String, default: '')
- `newValue` (String, default: '')
- `timestamp` (Date, auto)

### Notification
- `userId` (ObjectId ref User, required)
- `message` (String, required)
- `type` (Enum: task_assigned, task_updated)
- `read` (Boolean, default: false)
- `createdAt` (auto)

## Next Steps

1. ✅ MongoDB connection - DONE
2. ✅ Mongoose models - DONE
3. ✅ Authentication - DONE
4. ⏳ Implement route handlers for:
   - Users (GET /api/users)
   - Projects (CRUD)
   - Tasks (CRUD + stats)
   - Comments (GET by task, POST)
   - History (GET by task, GET all)
   - Notifications (GET, PUT read)
   - Search (GET /api/tasks/search)
   - Reports (GET /api/reports/*)
   - Export (GET /api/export/tasks/csv)

## Notes

- Passwords are hashed using bcrypt (10 rounds)
- JWT tokens expire in 7 days
- MongoDB ObjectIds are used instead of numeric IDs (convert in API responses)
- Null values for projectId/assignedTo represent "no project"/"unassigned" (equivalent to 0 in legacy)
- All models use Mongoose timestamps where appropriate
