from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional, Dict
from services.openeo_client import openeo_client_instance

router = APIRouter()

class BBox(BaseModel):
    west: float
    south: float
    east: float
    north: float

class GridConfig(BaseModel):
    cols: int
    rows: int

class SeasonConfig(BaseModel):
    name: str
    time_range: str

class JobRequestModel(BaseModel):
    bbox: BBox
    grid: GridConfig
    seasons: List[SeasonConfig]
    collection: Optional[str] = "SENTINEL2_L2A"
    job_options: Optional[Dict[str, str]] = None
    mgrs_tile: Optional[str] = None

class BatchDeleteModel(BaseModel):
    statuses: List[str]

@router.get("/")
def list_jobs():
    try:
        return openeo_client_instance.get_jobs()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/grid")
def request_gridded_jobs(request: JobRequestModel):
    try:
        res = openeo_client_instance.request_gridded_jobs(
            bbox=request.bbox.model_dump(),
            grid=request.grid.model_dump(),
            seasons=[s.model_dump() for s in request.seasons],
            collection=request.collection,
            job_options=request.job_options,
            mgrs_tile=request.mgrs_tile
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/batch")
def delete_batch_jobs(request: BatchDeleteModel):
    try:
        res = openeo_client_instance.delete_jobs_by_status(request.statuses)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{job_id}/diagnostics")
def get_job_diagnostics(job_id: str):
    try:
        return openeo_client_instance.get_job_diagnostics(job_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{job_id}")
def delete_job(job_id: str):
    try:
        return openeo_client_instance.delete_job(job_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{job_id}/restart")
def restart_job(job_id: str):
    try:
        return openeo_client_instance.restart_job(job_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{job_id}/download")
def download_single_job(job_id: str):
    try:
        # Resolve path relative to backend folder
        import os
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        download_dir = os.path.join(base_dir, "dependencies", "terrascope_downloads")
        return openeo_client_instance.download_job(job_id, download_dir)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/download-all")
def download_all_finished_jobs():
    try:
        import os
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        download_dir = os.path.join(base_dir, "dependencies", "terrascope_downloads")
        return openeo_client_instance.download_finished_jobs(download_dir)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
