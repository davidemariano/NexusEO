# NexusEO

**NexusEO** è un gateway unificato per l'accesso a dati geospaziali e ambientali. Centralizza l'estrazione di flussi eterogenei (cataloghi STAC, SoilGrids, OpenMeteo) in un singolo endpoint scalabile, ottimizzando i workflow per l'osservazione terrestre e l'analisi spaziale.

## Architettura del Sistema

Il sistema è composto da due moduli principali:
- **Backend**: Sviluppato in Python utilizzando **FastAPI**. Si occupa di interfacciarsi con il client ufficiale Python di openEO, gestendo l'autenticazione OIDC, la costruzione dei processi (Data Cubes) e le comunicazioni con i server di Terrascope.
- **Frontend**: Sviluppato in **Angular**. Offre un'interfaccia utente (UI) intuitiva e reattiva per configurare le richieste, monitorare lo stato dei task e scaricare i risultati.

## Funzionalità Principali

### 1. Conversione Automatica MGRS -> Bounding Box
Il sistema integra una logica automatica per trasformare un codice MGRS (es. `32TNR`) nelle rispettive coordinate geografiche di Bounding Box (West, South, East, North) nello standard WGS84 (EPSG:4326). Questo elimina la necessità di inserire manualmente le coordinate lat/lon per le zone di interesse.

### 2. Elaborazione a Griglia (Chunking)
Poiché l'elaborazione di vaste aree può superare i limiti di memoria dell'infrastruttura, la dashboard permette di impostare una suddivisione a griglia specificando il numero di **Colonne** e **Righe**. 
La Bounding Box selezionata verrà automaticamente divisa in sottonodi uguali, e per ognuno di essi verrà generato e inviato un Batch Job separato in parallelo.

### 3. Personalizzazione Avanzata dei Job e Nomenclatura Intelligente
- **Spark Options**: L'utente può regolare la memoria allocata (Executor Memory, Executor Memory Overhead, Python Memory) tramite appositi slider nella dashboard. I valori vengono inviati ai job openEO come `job_options`.
- **Naming Pattern Dinamico**: Ogni job viene salvato su Terrascope con una nomenclatura parlante basata su: `[MGRS]_NDVI_[ANNO]_[STAGIONE]_[SUFFIX]`.
  *Esempio:* `32TNR_NDVI_2024_Primavera_C01`.
  Il suffisso del chunk (es. `_C01`, `_C02`) viene generato e aggiunto automaticamente *solo* se la griglia selezionata è maggiore di 1x1.

### 4. Monitoraggio e Gestione dei Batch Job (Job Management)
La dashboard presenta una tabella interattiva dei **Jobs Recenti** (fino agli ultimi 50 job, per garantire alte prestazioni di caricamento del browser), dalla quale è possibile:
- **Visualizzare le info:** Ottenere dettagli tecnici e metadati sullo stato del job.
- **Scaricare i risultati:** Eseguire il download diretto dei file generati (es. in formato GTiff) sul proprio computer.
- **Riavviare i job:** Effettuare un restart con 1 click dei job andati in `error` o `canceled`.
- **Eliminazione singola e massiva:** Cancellare singoli job oppure utilizzare la funzione batch per svuotare automaticamente tutti i job non più necessari (completati o in errore).

### 5. Text Area per Appunti ("Nuova Richiesta Terrascope")
È presente un'area di testo dedicata ad accogliere appunti e note locali da parte dell'utente, molto utile quando si copiano/incollano MGRS multipli o parametri da controllare senza che essi interferiscano con la validazione del form.

### 6. Logging Completo
Il backend è configurato per produrre un logging estremamente granulare su file (`backend.log`) e terminale. Vengono tracciati gli endpoint chiamati, i payload inviati (incluso il conteggio e le coordinate dei chunk calcolati) e le risposte del server openEO.

---

## Struttura del Codice

- `backend/`
  - `main.py`: Punto di ingresso dell'applicazione FastAPI.
  - `routers/openeo_jobs.py`: Definizione degli endpoint REST per il Frontend.
  - `services/openeo_client.py`: Core logic per l'interazione con l'API di openEO (autenticazione, creazione processi NDVI_median, submit dei job).
- `frontend/`
  - Applicazione Angular divisa in componenti (`dashboard.component.ts`, `api.service.ts` per le chiamate HTTP, ecc.).
- `run_dashboard.sh`: Script di avvio simultaneo per Backend e Frontend.
- `italy_tiles.json`: Anagrafica per supportare i tile MGRS lato frontend.

---

## Avvio del Sistema

Per avviare l'intero sistema in locale, basta eseguire lo script dedicato situato nella cartella principale del progetto:

```bash
./run_dashboard.sh
```

Questo script provvederà automaticamente a:
1. Attivare il virtual environment Python.
2. Lanciare il server FastAPI (Backend) in modalità hot-reload sulla porta `:8000`.
3. Avviare il server di sviluppo Angular (Frontend) sulla porta `:4200`.

Al termine dell'avvio, l'interfaccia utente sarà accessibile da browser all'indirizzo `http://localhost:4200`.
