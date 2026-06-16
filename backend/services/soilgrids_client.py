import os
import requests
import logging

logger = logging.getLogger(__name__)

BASE_URL = "https://maps.isric.org/mapserv"
OUTPUT_DIR = "../dependencies/soilgrids_data"

def setup_directory():
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

def download_soilgrids_background(bbox: dict, properties: list, depths: list, stats: list):
    """
    Funzione eseguita in background per scaricare i TIF da SoilGrids WCS.
    """
    logger.info("Avvio del task di download SoilGrids in background...")
    setup_directory()
    
    min_lon = bbox.get('west')
    max_lon = bbox.get('east')
    min_lat = bbox.get('south')
    max_lat = bbox.get('north')

    for prop in properties:
        for depth in depths:
            for stat in stats:
                layer_id = f"{prop}_{depth}_{stat}"
                logger.info(f"Avvio download per: {layer_id}...")

                query_string = (
                    f"?map=/map/{prop}.map"
                    f"&SERVICE=WCS"
                    f"&VERSION=2.0.1"
                    f"&REQUEST=GetCoverage"
                    f"&COVERAGEID={layer_id}"
                    f"&FORMAT=image/tiff"
                    f"&SUBSET=Long({min_lon},{max_lon})"
                    f"&SUBSET=Lat({min_lat},{max_lat})"
                    f"&SUBSETTINGCRS=http://www.opengis.net/def/crs/EPSG/0/4326"
                    f"&OUTPUTCRS=http://www.opengis.net/def/crs/EPSG/0/4326"
                )

                url = BASE_URL + query_string
                
                try:
                    response = requests.get(url, stream=True)
                    response.raise_for_status()

                    if 'xml' in response.headers.get('Content-Type', '').lower():
                        logger.error(f"Errore dal server WCS per {layer_id}. Risposta XML: {response.text[:500]}")
                        continue

                    file_path = os.path.join(OUTPUT_DIR, f"{layer_id}.tif")
                    with open(file_path, 'wb') as f:
                        for chunk in response.iter_content(chunk_size=8192):
                            if chunk:
                                f.write(chunk)
                                
                    logger.info(f" > Salvato con successo: {file_path}")
                    
                except requests.exceptions.RequestException as e:
                    logger.error(f" Errore di rete/HTTP durante il download di {layer_id}: {e}")
                    logger.error(f" URL chiamato: {url}")
    
    logger.info("Download SoilGrids completato.")
