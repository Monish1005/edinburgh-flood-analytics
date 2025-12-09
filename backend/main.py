from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import json
import os

app = FastAPI(title="Flood Risk Analysis API")

# Allow CORS (Frontend will be on different port in dev)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Constants
DATA_DIR = "web_data"
STATIC_DIR = "static"
STATS_FILE = os.path.join(DATA_DIR, "stats.json")

# Serve Data Files (GeoJSONs)
if os.path.exists(DATA_DIR):
    app.mount("/data", StaticFiles(directory=DATA_DIR), name="data")

# Serve Frontend Static Assets (JS/CSS)
if os.path.exists(STATIC_DIR):
    # Mount assets folder if Vite builds to assets/
    # Typically Vite builds to dist/assets. We copied dist/ to static/ in Dockerfile.
    # So static/assets exists.
    app.mount("/assets", StaticFiles(directory=os.path.join(STATIC_DIR, "assets")), name="assets")

@app.get("/stats")
def get_stats():
    """Return the pre-calculated statistics."""
    if os.path.exists(STATS_FILE):
        with open(STATS_FILE, "r") as f:
            return json.load(f)
    return {"error": "Stats file not found"}

# Catch-all for SPA (React Router)
# This must be the last defined route
@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    # If API call missed above, return 404? 
    # Or just serve index.html?
    # Better to serve index.html only for non-API routes.
    if full_path.startswith("api") or full_path.startswith("data"):
         return {"error": "Not Found"}
    
    if os.path.exists(os.path.join(STATIC_DIR, "index.html")):
        from fastapi.responses import FileResponse
        return FileResponse(os.path.join(STATIC_DIR, "index.html"))
    return {"message": "Frontend not found. Run existing setup for dev."}

if __name__ == "__main__":
    import uvicorn
    # Run with reloader in dev mode
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
