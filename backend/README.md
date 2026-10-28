# BitCampus Backend API (Render Deployment Guide)

This directory contains the Node.js/Express backend API for the BitCampus portal.

## Deployment on Render

### Method 1: Web Service (Dashboard)
1. Go to [Render Dashboard](https://dashboard.render.com/) and click **New +** -> **Web Service**.
2. Connect your GitHub repository (`rudrak2005/Web-Design-For-Colloge`).
3. Set the following configuration:
   - **Name**: `bitcampus-api` (or your preferred name)
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Add the following **Environment Variables**:
   - `PORT`: `3000`
   - `NODE_ENV`: `production`
   - `SUPABASE_URL`: Your Supabase Project URL (`https://your-project.supabase.co`)
   - `SUPABASE_PUBLISHABLE_KEY`: Your Supabase Anon/Public Key
   - `SUPABASE_SECRET_KEY`: Your Supabase Service Role Secret Key
   - `DATABASE_URL`: Your Supabase PostgreSQL **Session pooler** connection string (IPv4 compatible)
   - `JWT_SECRET`: A secure random secret string
   - `MASTER_CODE`: `BITCAMPUS_MASTER_2026`
   - `FRONTEND_ORIGINS`: `*` (or your Vercel frontend URL, e.g. `https://your-app.vercel.app`)
5. Click **Deploy Web Service**.

### Method 2: Blueprint (`render.yaml`)
- Render can automatically deploy using the included `backend/render.yaml` or the root `render.yaml` with `rootDir: backend`.

## Local Development
```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Start development server with hot-reload
npm run dev

# Run API test
npm run test:api
```
Server runs at `http://localhost:3000`.
Health check available at `http://localhost:3000/health`.
