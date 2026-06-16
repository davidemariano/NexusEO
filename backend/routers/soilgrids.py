from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel
from typing import List
from services.soilgrids_client import download_soilgrids_background

router = APIRouter()

class BBox(BaseModel):
    west: float
    south: float
    east: float
    north: float

class SoilGridsRequestModel(BaseModel):
    bbox: BBox
    properties: List[str]
    depths: List[str]
    stats: List[str]

@router.post("/download")
def start_soilgrids_download(req: SoilGridsRequestModel, background_tasks: BackgroundTasks):
    if not req.properties or not req.depths or not req.stats:
        raise HTTPException(status_code=400, detail="Missing properties, depths or stats lists.")
    
    background_tasks.add_task(
        download_soilgrids_background,
        req.bbox.dict(),
        req.properties,
        req.depths,
        req.stats
    )
    
    return {"message": "Download SoilGrids avviato in background con successo. Controllare i log per il progresso."}
