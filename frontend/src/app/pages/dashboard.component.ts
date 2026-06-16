import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, JobRequest, SeasonConfig } from '../services/api.service';
// @ts-ignore
import * as mgrs from 'mgrs';

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
  selectedJobDiag: any = null;
  loadingInfoMap: { [id: string]: boolean } = {};
  loadingDownloadMap: { [id: string]: boolean } = {};
  loadingRetryMap: { [id: string]: boolean } = {};

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
    this.api.getJobs().subscribe({
      next: (data) => this.jobs = data,
      error: (err) => console.error(err)
    });
  }

  convertMGRS() {
    if (!this.mgrsInput) return;
    try {
      let base = this.mgrsInput.trim().toUpperCase().replace(/\s/g, '');
      if (base.length <= 5) {
        // Tile 100kmx100km (e.g. 32TNR)
        // Pad to 10 digits for SW and NE corners
        let sw = mgrs.toPoint(base + '0000000000');
        let ne = mgrs.toPoint(base + '9999999999');
        this.request.bbox.west = sw[0];
        this.request.bbox.south = sw[1];
        this.request.bbox.east = ne[0];
        this.request.bbox.north = ne[1];
      } else {
        // Exact point
        let pt = mgrs.toPoint(base);
        this.request.bbox.west = pt[0];
        this.request.bbox.south = pt[1];
        this.request.bbox.east = pt[0];
        this.request.bbox.north = pt[1];
      }
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

  submitRequest() {
    this.loading = true;
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
    this.api.requestGriddedJobs(this.request).subscribe({
      next: (res) => {
        alert(`Richiesta inviata: ${res.launched_jobs?.length || 0} jobs avviati.`);
        this.loading = false;
        this.loadJobs();
      },
      error: (err) => {
        alert(`Errore: ${err.message}`);
        this.loading = false;
      }
    });
  }

  deleteJob(id: string) {
    if (confirm('Sei sicuro di voler eliminare questo job?')) {
      this.api.deleteJob(id).subscribe(() => this.loadJobs());
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
