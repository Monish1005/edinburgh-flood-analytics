# Stage 1: Build Frontend
FROM node:18-alpine as frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# Stage 2: Serve with Backend
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies if needed (e.g., for GDAL/Geopandas if simple install fails)
# For simple GeoJSON serving, we might not need heavy GDAL if we pre-processed.
# But if backend uses geopandas, we need libraries.
# Let's assume standard install works or use a compacter image. 
# Pre-processing is done LOCALLY. Backend just serves JSON. 
# So we only need fastapi uvicorn.

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy Backend Code
COPY backend/ .
# Copy Pre-processed Data (Must run preprocessing locally first or in CI)
COPY web_data/ ./web_data/

# Copy Built Frontend Assets from Stage 1
COPY --from=frontend-build /app/frontend/dist ./static

# Expose port
EXPOSE 8000

# Run Command
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
