import openeo
import os
import time
import logging

logger = logging.getLogger(__name__)

class OpenEOClient:
    def __init__(self, backend_url="openeo.vito.be"):
        self.backend_url = backend_url
        self.connection = None

    def connect(self):
        if not self.connection:
            logger.info(f"Avvio connessione verso i server Terrascope ({self.backend_url})...")
            # authenticate_oidc() will cache the token locally if it was authenticated before
            self.connection = openeo.connect(self.backend_url).authenticate_oidc()
            logger.info("Autenticazione OIDC completata e connessione stabilita.")
        return self.connection
        return self.connection

    def get_jobs(self):
        conn = self.connect()
        return conn.list_jobs()

    def get_job(self, job_id: str):
        conn = self.connect()
        return conn.job(job_id)

    def get_job_diagnostics(self, job_id: str):
        conn = self.connect()
        job = conn.job(job_id)
        
        metadata = job.describe_job()
        status = metadata.get("status")
        title = metadata.get("title", "Senza Titolo")
        error_details = metadata.get("error", {}) if status == "error" else None
        
        logs = job.logs()
        filtered_logs = []
        if logs:
            for entry in logs:
                level = entry.get("level", "info").lower()
                if level in ["error", "critical", "warning"]:
                    filtered_logs.append({
                        "level": level,
                        "message": entry.get("message", ""),
                        "id": entry.get("id", "")
                    })
                    
        return {
            "id": job_id,
            "title": title,
            "status": status,
            "error_details": error_details,
            "anomalies": filtered_logs
        }

    def delete_job(self, job_id: str):
        conn = self.connect()
        try:
            conn.job(job_id).delete()
            return {"status": "success", "message": f"Job {job_id} deleted."}
        except Exception as e:
            raise Exception(f"Failed to delete job {job_id}: {str(e)}")

    def restart_job(self, job_id: str):
        conn = self.connect()
        job = conn.job(job_id)
        metadata = job.describe_job()
        status = metadata.get("status", "unknown").lower()
        
        if status in ["created", "queued", "running"]:
            raise Exception("Il job è già in coda o in esecuzione.")
        elif status == "finished":
            raise Exception("Il job è già completato con successo. Riavviarlo sovrascriverebbe i risultati esistenti.")
            
        try:
            job.start()
            return {"status": "success", "message": f"Job {job_id} riavviato con successo."}
        except Exception as e:
            raise Exception(f"Failed to restart job {job_id}: {str(e)}")

    def delete_jobs_by_status(self, statuses: list[str]):
        conn = self.connect()
        all_jobs = conn.list_jobs()
        jobs_to_delete = [j for j in all_jobs if j.get("status") in statuses]
        
        deleted_count = 0
        errors = []
        for job_info in jobs_to_delete:
            job_id = job_info["id"]
            try:
                conn.job(job_id).delete()
                deleted_count += 1
            except Exception as e:
                errors.append({"job_id": job_id, "error": str(e)})
                
        return {
            "status": "success",
            "deleted_count": deleted_count,
            "errors": errors
        }

    def download_job(self, job_id: str, download_dir: str = "../dependencies/terrascope_downloads"):
        conn = self.connect()
        os.makedirs(download_dir, exist_ok=True)
        job = conn.job(job_id)
        
        # We need a title for the folder, let's fetch job metadata
        # list_jobs() gives metadata, but job.describe_job() gives detailed metadata
        job_metadata = job.describe_job()
        job_title = job_metadata.get("title", f"Untitled_Job_{job_id}")
        
        job_dir = os.path.join(download_dir, job_title)
        if os.path.exists(job_dir):
             return {"status": "skipped", "message": f"Directory {job_dir} already exists."}
             
        os.makedirs(job_dir)
        try:
            job.get_results().download_files(job_dir)
            return {"status": "success", "message": f"Downloaded to {job_dir}"}
        except Exception as e:
            if os.path.exists(job_dir) and not os.listdir(job_dir):
                os.rmdir(job_dir)
            raise Exception(f"Failed to download job {job_id}: {str(e)}")

    def download_finished_jobs(self, download_dir: str = "../dependencies/terrascope_downloads"):
        conn = self.connect()
        all_jobs = conn.list_jobs()
        finished_jobs = [j for j in all_jobs if j.get("status") == "finished"]
        
        results = []
        for job_info in finished_jobs:
            job_id = job_info["id"]
            try:
                res = self.download_job(job_id, download_dir)
                results.append({"job_id": job_id, "result": res})
            except Exception as e:
                results.append({"job_id": job_id, "error": str(e)})
        
        return {"status": "success", "processed": len(finished_jobs), "details": results}

    def request_gridded_jobs(self, bbox: dict, grid: dict, seasons: list, collection="SENTINEL2_L2A", job_options: dict = None, mgrs_tile: str = None):
        logger.info(f"Avviata request_gridded_jobs con bbox: {bbox}, grid: {grid}, seasons: {seasons}, mgrs_tile: {mgrs_tile}")
        logger.info(f"Opzioni Job Spark passate: {job_options}")
        conn = self.connect()
        
        west_tot = bbox["west"]
        south_tot = bbox["south"]
        east_tot = bbox["east"]
        north_tot = bbox["north"]
        
        cols = grid["cols"]
        rows = grid["rows"]
        
        lon_step = (east_tot - west_tot) / cols
        lat_step = (north_tot - south_tot) / rows
        
        chunks = []
        for i in range(cols):
            for j in range(rows):
                chunk_west = west_tot + i * lon_step
                chunk_east = chunk_west + lon_step
                chunk_south = south_tot + j * lat_step
                chunk_north = chunk_south + lat_step
                
                chunks.append({
                    "west": round(chunk_west, 6),
                    "south": round(chunk_south, 6),
                    "east": round(chunk_east, 6),
                    "north": round(chunk_north, 6)
                })

        launched_jobs = []
        errors = []

        for season in seasons:
            season_name = season["name"]
            time_range = season["time_range"] # e.g. "2024-04-01/2024-06-30"
            start_date, end_date = time_range.split("/")
            year = start_date.split("-")[0]
            
            for idx, extent in enumerate(chunks):
                chunk_id = f"C{idx+1:02d}"
                logger.info(f"Processando chunk {chunk_id} per la stagione '{season_name}'. Extent: {extent}")
                try:
                    cube = conn.load_collection(
                        collection,
                        spatial_extent=extent,
                        temporal_extent=[start_date, end_date],
                        bands=["B04", "B08", "B11"]
                    )
                    
                    b04 = cube.band("B04")
                    b08 = cube.band("B08")
                    b11 = cube.band("B11")

                    ndvi_cube = (b08 - b04) / (b08 + b04)
                    ndmi_cube = (b08 - b11) / (b08 + b11)

                    ndvi_median = ndvi_cube.reduce_dimension(dimension="t", reducer="median")
                    ndmi_median = ndmi_cube.reduce_dimension(dimension="t", reducer="median")

                    if mgrs_tile:
                        job_title_ndvi = f"NDVI_{year}_{season_name}_{chunk_id}_{mgrs_tile}"
                        job_title_ndmi = f"NDMI_{year}_{season_name}_{chunk_id}_{mgrs_tile}"
                    else:
                        job_title_ndvi = f"NDVI_{year}_{season_name}_{chunk_id}"
                        job_title_ndmi = f"NDMI_{year}_{season_name}_{chunk_id}"

                    logger.info(f"Creazione e avvio del job per {job_title_ndvi}...")
                    job_ndvi = ndvi_median.create_job(title=job_title_ndvi, out_format="GTiff", job_options=job_options)
                    job_ndvi.start()
                    logger.info(f"Job {job_title_ndvi} avviato con ID: {job_ndvi.job_id}")
                    
                    logger.info(f"Creazione e avvio del job per {job_title_ndmi}...")
                    job_ndmi = ndmi_median.create_job(title=job_title_ndmi, out_format="GTiff", job_options=job_options)
                    job_ndmi.start()
                    logger.info(f"Job {job_title_ndmi} avviato con ID: {job_ndmi.job_id}")
                    
                    launched_jobs.append({"title": job_title_ndvi, "job_id": job_ndvi.job_id})
                    launched_jobs.append({"title": job_title_ndmi, "job_id": job_ndmi.job_id})
                    
                    time.sleep(3) # Throttle
                except Exception as e:
                    logger.error(f"Errore durante la sottomissione dei job per il chunk {chunk_id} - {season_name}: {str(e)}")
                    errors.append({"chunk_id": chunk_id, "season": season_name, "error": str(e)})

        logger.info(f"Completato l'invio batch. Lanciati {len(launched_jobs)} jobs. Errori: {len(errors)}")
        return {
            "launched_jobs": launched_jobs,
            "errors": errors
        }

openeo_client_instance = OpenEOClient()
