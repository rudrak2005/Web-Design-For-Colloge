# BitCampus Frontend (Vercel Deployment Guide)

This directory contains the client-side user interface (HTML, CSS, Vanilla JS) for BitCampus.

## Deployment on Vercel

### Method 1: Set Root Directory to `frontend` (Recommended)
1. Go to [Vercel Dashboard](https://vercel.com/) and click **Add New...** -> **Project**.
2. Select your GitHub repository (`rudrak2005/Web-Design-For-Colloge`).
3. Under **Configure Project**:
   - In **Root Directory**, click **Edit** and select or type `frontend`.
   - **Framework Preset**: Leave as `Other` (Static).
   - **Build Command**: Leave empty.
   - **Output Directory**: Leave empty (serves root of `frontend`).
4. Click **Deploy**.

### How API Calls Work
- `frontend/vercel.json` contains rewrites that forward all `/api/*` and `/health` requests to your Render backend service:
  ```json
  {
    "rewrites": [
      {
        "source": "/api/:path*",
        "destination": "https://web-design-for-colloge.onrender.com/api/:path*"
      },
      {
        "source": "/health",
        "destination": "https://web-design-for-colloge.onrender.com/health"
      }
    ]
  }
  ```
  *(If your Render URL changes, simply update the `destination` in `frontend/vercel.json` and push to GitHub).*

## Local Development
You can preview the frontend locally:
```bash
# Using simple static server
cd frontend
npx serve . -l 5000
```
Open `http://localhost:5000` in your browser. It will automatically connect to your local backend at `http://localhost:3000`.
