import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface BBox { west: number; south: number; east: number; north: number; }
export interface GridConfig { cols: number; rows: number; }
export interface SeasonConfig { name: string; time_range: string; }

export interface SoilGridsRequest {
  bbox: {
    west: number;
    south: number;
    east: number;
    north: number;
  };
  properties: string[];
  depths: string[];
  stats: string[];
}

export interface SparkOptions {
  'executor-memory': string;
  'executor-memoryOverhead': string;
  'python-memory': string;
}

export interface JobRequest {
  bbox: BBox;
  grid: GridConfig;
  seasons: SeasonConfig[];
  collection?: string;
  job_options?: SparkOptions;
  mgrs_tile?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'http://localhost:8000/api/jobs';

  constructor(private http: HttpClient) {}

  getJobs(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getJobDiagnostics(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/diagnostics`);
  }

  requestGriddedJobs(req: JobRequest): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/grid`, req);
  }

  deleteJob(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  deleteBatch(statuses: string[]): Observable<any> {
    // Usually standard DELETE doesn't accept body in all clients, but angular supports it via request:
    return this.http.request('delete', `${this.apiUrl}/batch`, { body: { statuses } });
  }

  restartJob(id: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/restart`, {});
  }

  downloadSoilGrids(req: SoilGridsRequest): Observable<any> {
    return this.http.post('http://localhost:8000/api/soilgrids/download', req);
  }

  downloadJob(id: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/download`, {});
  }

  downloadAll(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/download-all`, {});
  }
}
