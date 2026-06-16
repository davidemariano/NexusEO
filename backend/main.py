from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import openeo_jobs
import logging
import sys

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("backend.log", mode="a")
    ]
)
logger = logging.getLogger(__name__)
logger.info("Starting up the Backend API...")

app = FastAPI(title="Terrascope openEO Dashboard API", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For development, allow all. Change in production.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(openeo_jobs.router, prefix="/api/jobs", tags=["Jobs"])

@app.get("/")
def read_root():
    return {"message": "Welcome to Terrascope openEO Dashboard API"}
