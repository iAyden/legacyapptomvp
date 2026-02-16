# Deployment Guide

Step-by-step to run the app in production: MongoDB Atlas, backend (Render or Railway), frontend (Vercel).

---

## 1) Create MongoDB Atlas cluster and user

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign in or create an account.
2. Create a new organization and project if prompted.
3. **Build a cluster:**
   - Click **Build a Database** → choose **M0 Free** (or paid tier).
   - Pick a cloud provider and region close to your backend.
   - Cluster name: e.g. `Cluster0` → **Create**.
4. **Create a database user:**
   - Security → **Database Access** → **Add New Database User**.
   - Authentication: **Password**; set a strong username and password (save them).
   - Database User Privileges: **Atlas admin** or **Read and write to any database**.
   - **Add User**.
5. **Network access:**
   - Security → **Network Access** → **Add IP Address**.
   - For cloud backends (Render/Railway): **Allow Access from Anywhere** (`0.0.0.0/0`) or add the provider’s IP ranges.
   - **Confirm**.
6. **Create the database (optional):** Databases → **Create** → database name e.g. `legacyapp`; collection names are created when the app writes.

---

## 2) Get MONGODB_URI

1. In Atlas, go to your cluster → **Connect** → **Drivers** (or **Connect your application**).
2. Copy the connection string, e.g.:
   ```text
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
3. Replace `<username>` and `<password>` with your database user. If the password has special characters, URL-encode them.
4. Add the database name before `?` if you use one:
   ```text
   mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/legacyapp?retryWrites=true&w=majority
   ```
5. This value is your **MONGODB_URI** for the backend.

---

## 3) Deploy backend to Render (or Railway)

### Render

1. Go to [Render](https://render.com) and sign in (e.g. GitHub).
2. **New** → **Web Service**.
3. Connect the repo that contains the app (e.g. `legacyapp-main`). Select the repo and branch.
4. **Root Directory:** set to `backend` (folder where `server.js` and `package.json` live).
5. **Runtime:** Node.
6. **Build Command:** `npm install`
7. **Start Command:** `npm start`
8. **Instance type:** Free (or paid).
9. **Advanced** → **Health Check Path (optional):** `/api/health`
10. Click **Create Web Service**. Wait for the first deploy.
11. Note the service URL, e.g. `https://your-app-name.onrender.com`.

### Railway (alternative)

1. Go to [Railway](https://railway.app) and sign in.
2. **New Project** → **Deploy from GitHub** → select repo.
3. Add the **backend** folder as the root (or set **Root Directory** to `backend` in settings).
4. Railway will detect Node and run `npm install` and `npm start` (ensure `package.json` has `"start": "node server.js"`).
5. **Settings** → **Generate Domain** to get the public URL.
6. Note the URL, e.g. `https://your-app-name.up.railway.app`.

---

## 4) Set backend env vars

In Render (or Railway), open the **Environment** / **Variables** section and add:

| Variable       | Value |
|----------------|--------|
| `MONGODB_URI`  | Your Atlas URI from step 2 (e.g. `mongodb+srv://...`) |
| `JWT_SECRET`   | A long random string (e.g. 32+ chars). Do not use the example from `.env.example`. |
| `CORS_ORIGIN`  | Your frontend URL from step 5 (e.g. `https://your-frontend.vercel.app`) — **no trailing slash** |
| `PORT`         | Leave unset on Render/Railway (they set it automatically), or set to the value they provide (e.g. `PORT=10000`). |

Redeploy the backend after saving env vars so they are applied.

---

## 5) Deploy frontend to Vercel

1. Go to [Vercel](https://vercel.com) and sign in (e.g. GitHub).
2. **Add New** → **Project** → import the same repo.
3. **Root Directory:** set to `frontend` (click **Edit** and choose the `frontend` folder).
4. **Framework Preset:** Vite (auto-detected).
5. **Build Command:** `npm run build`
6. **Output Directory:** `dist`
7. **Install Command:** `npm install`
8. Do **not** add env vars yet; add them in the next step so `VITE_API_URL` is set before the first build.
9. **Deploy**. After the first deploy, note the URL, e.g. `https://your-project.vercel.app`.

---

## 6) Set VITE_API_URL and redeploy frontend

1. In Vercel, open your project → **Settings** → **Environment Variables**.
2. Add:
   - **Name:** `VITE_API_URL`
   - **Value:** Your backend URL from step 3 (e.g. `https://your-app-name.onrender.com`) — **no trailing slash**
   - **Environment:** Production (and Preview if you want).
3. **Redeploy** the frontend (Deployments → … → Redeploy) so the build uses the new variable. Vite bakes `VITE_*` into the client at build time, so a redeploy is required after changing it.

---

## 7) Verify in production

1. **Login:** Open the Vercel frontend URL → Login (or Register). Use a user that exists in the DB (e.g. after running `npm run init-data` locally against the same MONGODB_URI, or register a new user).
2. **CRUD:** Create/edit/delete a task and a project; confirm they appear and persist after refresh.
3. **CSV download:** Reports → set optional filters → **Descargar CSV**. A `tasks.csv` file should download with the correct data.
4. **Backend health:** Open `https://your-backend-url/api/health` in a browser; response should be `{"ok":true}`.

---

## Required env vars summary

### Backend (Render / Railway)

| Variable       | Required | Description |
|----------------|----------|-------------|
| `MONGODB_URI` | Yes      | Atlas connection string (with DB name in path if desired). |
| `JWT_SECRET`  | Yes      | Secret for signing JWTs (long, random, keep private). |
| `CORS_ORIGIN` | Yes      | Frontend origin (e.g. `https://your-app.vercel.app`). |
| `PORT`        | No       | Provided by host; backend uses `process.env.PORT \|\| 4000`. |

### Frontend (Vercel)

| Variable        | Required | Description |
|-----------------|----------|-------------|
| `VITE_API_URL` | Yes      | Backend API URL (e.g. `https://your-backend.onrender.com`). Used at build time. |

---

## Troubleshooting

- **CORS errors in browser:** Ensure `CORS_ORIGIN` on the backend exactly matches the frontend URL (scheme + host, no trailing slash).
- **401 on API calls:** User not logged in or token expired; log in again. Ensure `JWT_SECRET` is the same for all backend instances.
- **CSV download fails:** Ensure the request includes the `Authorization: Bearer <token>` header (the app does this when logged in). Check backend logs for 4xx/5xx.
- **Blank page or wrong API URL:** Redeploy the frontend after setting or changing `VITE_API_URL` so the new value is embedded in the build.
