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

We have structured the project to support two deployment models:
- **Option A (Recommended - Simpler & Cheaper)**: Serve both the React frontend and Flask backend inside a single unified service.
- **Option B (Decoupled)**: Deploy the frontend and backend as separate, standalone services.

---

### Option A (Recommended): Unified Single-Service Deployment

You will deploy **two services** in your Railway project: a MySQL Database and one Web Service.

#### Step 1: Spin up MySQL Database
1. Inside your Railway project, click **New** -> **Database** -> **Add MySQL**.
2. Copy its connection variables (`MYSQLHOST`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLPORT`, `MYSQLDATABASE`).

#### Step 2: Deploy Unified Application Service
1. Click **New** -> **GitHub Repo** -> select this repository.
2. Under **Settings**, leave the **Root Directory** empty (default root `/`).
3. Railway will read the root `railway.json` and build the root `Dockerfile` automatically (compiling the React frontend, copying the static assets into Flask, and starting the API server).
4. Under **Variables** (Environment variables), add:
   - `DB_HOST`: `${{MySQL.MYSQLHOST}}` (links automatically to your database)
   - `DB_USER`: `${{MySQL.MYSQLUSER}}`
   - `DB_PASSWORD`: `${{MySQL.MYSQLPASSWORD}}`
   - `DB_PORT`: `${{MySQL.MYSQLPORT}}`
   - `DB_DATABASE`: `${{MySQL.MYSQLDATABASE}}`
   - `SECRET_KEY`: `your_random_secret_key_here`
   - `PORT`: `5000`
5. Under **Settings**, click **Generate Domain** to get a public URL for your application!

---

### Option B: Decoupled Multi-Service Deployment

You will deploy **three services**: a MySQL Database, a Backend Web Service, and a Frontend Web Service.

#### Step 1: Spin up MySQL Database
1. Click **New** -> **Database** -> **Add MySQL**.

#### Step 2: Deploy Backend Service
1. Click **New** -> **GitHub Repo** -> select this repository.
2. Under **Settings**:
   - Rename the service to `backend`.
   - Set **Root Directory** to `backend`.
   - Railway will read `backend/railway.json` and build the python container.
3. Under **Variables**, add:
   - `DB_HOST`: `${{MySQL.MYSQLHOST}}`
   - `DB_USER`: `${{MySQL.MYSQLUSER}}`
   - `DB_PASSWORD`: `${{MySQL.MYSQLPASSWORD}}`
   - `DB_PORT`: `${{MySQL.MYSQLPORT}}`
   - `DB_DATABASE`: `${{MySQL.MYSQLDATABASE}}`
   - `SECRET_KEY`: `your_random_secret_key_here`
   - `PORT`: `5000`
4. Under **Settings**, generate a domain for the backend service (e.g. `your-backend.up.railway.app`).

#### Step 3: Deploy Frontend Service
1. Click **New** -> **GitHub Repo** -> select this repository.
2. Under **Settings**:
   - Rename the service to `frontend`.
   - Set **Root Directory** to `frontend`.
   - Railway will read `frontend/railway.json` and build the Nginx static serving container.
3. Generate a domain for your frontend service and enjoy!
