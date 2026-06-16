import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, JobRequest, SeasonConfig } from '../services/api.service';
import { convertMGRSToBBox } from '../utils/mgrs-utils';
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  jobs: any[] = [];
  loading = false;
  loadingJobs = false;
  loadingMessage = 'Avvia Job Terrascope';
  selectedJobDiag: any = null;
  loadingInfoMap: { [id: string]: boolean } = {};
  loadingDownloadMap: { [id: string]: boolean } = {};
  loadingRetryMap: { [id: string]: boolean } = {};
  loadingDeleteMap: { [id: string]: boolean } = {};

  mgrsInput: string = '';

  request: JobRequest = {
    bbox: { west: 6.108398, south: 34.578952, east: 18.94043, north: 47.487513 },
    grid: { cols: 1, rows: 1 },
    seasons: [
      { name: 'Primavera', time_range: '2024-04-01/2024-06-30' }
    ]
  };

  sparkConfig = {
    executorMemory: 2,
    executorMemoryOverhead: 2,
    pythonMemory: 2
  };

  constructor(private api: ApiService) { }

  ngOnInit() {
    this.loadJobs();
  }

  loadJobs() {
    this.loadingJobs = true;
    this.api.getJobs().subscribe({
      next: (data) => {
        this.jobs = data;
        this.loadingJobs = false;
      },
      error: (err) => {
        console.error(err);
        this.loadingJobs = false;
      }
    });
  }

  convertMGRS() {
    if (!this.mgrsInput) return;
    try {
      const bbox = convertMGRSToBBox(this.mgrsInput);
      this.request.bbox = bbox;
    } catch (e) {
      alert("Formato MGRS non valido o libreria non caricata correttamente.");
    }
  }

  addSeason() {
    this.request.seasons.push({ name: '', time_range: '' });
  }

  removeSeason(index: number) {
    this.request.seasons.splice(index, 1);
  }

  async submitRequest() {
    this.loading = true;
    this.loadingMessage = 'Avvio richiesta in corso...';
    
    this.request.job_options = {
      'executor-memory': `${this.sparkConfig.executorMemory}G`,
      'executor-memoryOverhead': `${this.sparkConfig.executorMemoryOverhead}G`,
      'python-memory': `${this.sparkConfig.pythonMemory}G`
    };
    
    if (this.mgrsInput && this.mgrsInput.trim()) {
      this.request.mgrs_tile = this.mgrsInput.trim();
    } else {
      this.request.mgrs_tile = undefined;
    }

    try {
      const response = await fetch('http://localhost:8000/api/jobs/grid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.request)
      });
      
      if (!response.body) throw new Error('ReadableStream non supportato dal browser.');
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(l => l.trim() !== '');
        
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.message) {
              this.loadingMessage = data.message;
            }
            if (data.error) {
               console.error('Errore nel job ricevuto dal server:', data.message);
            }
            if (data.done) {
               alert(`Elaborazione completata. Lanciati: ${data.launched_jobs?.length || 0} jobs. Errori: ${data.errors?.length || 0}`);
            }
          } catch (e) {
            console.error('JSON parse error su linea dello stream:', line);
          }
        }
      }
    } catch (err: any) {
      alert(`Errore di rete o del server: ${err.message}`);
    } finally {
      this.loading = false;
      this.loadingMessage = 'Avvia Job Terrascope';
      this.loadJobs();
    }
  }

  deleteJob(id: string) {
    if (confirm('Sei sicuro di voler eliminare questo job?')) {
      this.loadingDeleteMap[id] = true;
      this.api.deleteJob(id).subscribe({
        next: () => {
          this.loadingDeleteMap[id] = false;
          this.loadJobs();
        },
        error: (err) => {
          console.error(err);
          this.loadingDeleteMap[id] = false;
        }
      });
    }
  }

  deleteBatch() {
    if (confirm('Sei sicuro di voler eliminare tutti i job completati o in errore?')) {
      this.api.deleteBatch(['finished', 'error', 'canceled']).subscribe(() => this.loadJobs());
    }
  }

  downloadJob(id: string) {
    this.loadingDownloadMap[id] = true;
    this.api.downloadJob(id).subscribe({
      next: (res) => {
        alert(res.message);
        this.loadingDownloadMap[id] = false;
      },
      error: (err) => {
        alert(`Errore: ${err.message}`);
        this.loadingDownloadMap[id] = false;
      }
    });
  }

  downloadAll() {
    this.api.downloadAll().subscribe({
      next: (res) => alert(`Elaborati ${res.processed} jobs. Dettagli in console.`),
      error: (err) => alert(`Errore: ${err.message}`)
    });
  }

  infoJob(id: string) {
    this.loadingInfoMap[id] = true;
    this.api.getJobDiagnostics(id).subscribe({
      next: (res) => {
        this.selectedJobDiag = res;
        this.loadingInfoMap[id] = false;
      },
      error: (err) => {
        alert(`Errore: ${err.message}`);
        this.loadingInfoMap[id] = false;
      }
    });
  }

  retryJob(id: string) {
    if (confirm('Sei sicuro di voler riavviare questo job?')) {
      this.loadingRetryMap[id] = true;
      this.api.restartJob(id).subscribe({
        next: (res) => {
          alert(res.message);
          this.loadJobs();
          this.loadingRetryMap[id] = false;
        },
        error: (err) => {
          alert(`Errore durante il riavvio: ${err.error?.detail || err.message}`);
          this.loadingRetryMap[id] = false;
        }
      });
    }
  }
}
