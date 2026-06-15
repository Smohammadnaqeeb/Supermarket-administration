# Supermarket Billing and Inventory Management System

A decoupled modern web application with a stateless **Python Flask REST API** backend and a high-fidelity **Vite + React** single page application (SPA) frontend.

---

## Workspace Structure

- `backend/`: Python Flask REST API server, database pooling utility, schema seeding, and deployment scripts.
- `frontend/`: Vite React app using Lucide icons, ChartJS, and clean custom glassmorphic styling.

---

## Local Development Setup

### 1. Database Setup
Ensure you have a running MySQL server. Create a database called `supermarket_db` (or run the setup from the UI).

### 2. Backend Setup
1. Open a terminal inside the `backend/` folder.
2. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   .venv\Scripts\activate   # Windows
   source .venv/bin/activate # macOS/Linux
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy the `.env` configuration template or edit environment settings:
   - Configure variables: `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_PORT`, `DB_DATABASE`, and `SECRET_KEY`.
5. Run the API server:
   ```bash
   python app.py
   ```
   *The backend will run on `http://127.0.0.1:5000`.*

### 3. Frontend Setup
1. Open a terminal inside the `frontend/` folder.
2. Install npm packages:
   ```bash
   npm install
   ```
3. Run the Vite development server:
   ```bash
   npm run dev
   ```
   *The frontend will run on `http://localhost:3000` (which is configured to automatically proxy API requests `/api/*` to the Flask backend).*

---

## Railway Deployment Instructions

Railway supports deploying multiple services from a single GitHub repository (Monorepo setup). You will create **three services** in your Railway project:

### Service 1: MySQL Database
1. Inside your Railway project, click **New** -> **Database** -> **Add MySQL**.
2. Railway will spin up a MySQL service. Copy its connection variables (`MYSQLHOST`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLPORT`, `MYSQLDATABASE`).

### Service 2: Backend API (Python)
1. Click **New** -> **GitHub Repo** -> select this repository.
2. Go to the service **Settings**:
   - Rename the service to `backend`.
   - Under **Root Directory**, set it to `backend`.
   - Railway will automatically detect the `Dockerfile` inside `backend/` and compile the container.
3. Under **Variables** (Environment variables), add:
   - `DB_HOST`: `${{MySQL.MYSQLHOST}}` (referencing your MySQL service variable)
   - `DB_USER`: `${{MySQL.MYSQLUSER}}`
   - `DB_PASSWORD`: `${{MySQL.MYSQLPASSWORD}}`
   - `DB_PORT`: `${{MySQL.MYSQLPORT}}`
   - `DB_DATABASE`: `${{MySQL.MYSQLDATABASE}}`
   - `SECRET_KEY`: `your_random_secret_key_here`
   - `PORT`: `5000`

### Service 3: Frontend SPA (React)
1. Click **New** -> **GitHub Repo** -> select this repository.
2. Go to the service **Settings**:
   - Rename the service to `frontend`.
   - Under **Root Directory**, set it to `frontend`.
   - Railway will automatically detect the `Dockerfile` inside `frontend/` and build the container, serving it via Nginx.
3. Under **Variables**:
   - If deploying separately, configure your API endpoint environment variable in your production build, or let Vite build it. Since it's built statically, you can expose a public domain from the backend service and set `VITE_API_URL` to that domain in your frontend build.
4. Expose a public URL for the frontend service to access the system from your browser!
