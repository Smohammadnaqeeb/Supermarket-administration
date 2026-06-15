# Stage 1: Build the React frontend SPA
FROM node:20-alpine AS frontend-builder

WORKDIR /frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ .
RUN npm run build

# Stage 2: Setup the Python Flask backend API and package the static assets
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend app source code
COPY backend/ .

# Copy compiled static frontend assets from stage 1 into the backend static folder
COPY --from=frontend-builder /frontend/dist ./static

EXPOSE 5000

ENV PORT=5000
ENV FLASK_DEBUG=False

CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]
