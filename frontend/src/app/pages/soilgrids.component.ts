import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, SoilGridsRequest } from '../services/api.service';
import { convertMGRSToBBox } from '../utils/mgrs-utils';

@Component({
  selector: 'app-soilgrids',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './soilgrids.component.html',
  styleUrls: ['./soilgrids.component.scss']
})
export class SoilgridsComponent {
  mgrsInput: string = '';
  loading = false;

  request: SoilGridsRequest = {
    bbox: { west: 6.108398, south: 34.578952, east: 18.94043, north: 47.487513 },
    properties: ['cec', 'soc', 'phh2o'],
    depths: ['0-5cm', '5-15cm'],
    stats: ['mean']
  };

  availableProperties = ['cec', 'ocd', 'phh2o', 'soc', 'bdod', 'cfvo', 'silt', 'nitrogen', 'clay', 'sand', 'wv1500', 'wv0033', 'wv0010'];
  availableDepths = ['0-5cm', '5-15cm', '15-30cm', '30-60cm', '60-100cm', '100-200cm'];
  availableStats = ['mean', 'uncertainty', 'Q0.05', 'Q0.5', 'Q0.95'];

  constructor(private api: ApiService) {}

  convertMGRS() {
    if (!this.mgrsInput) return;
    try {
      const bbox = convertMGRSToBBox(this.mgrsInput);
      this.request.bbox = bbox;
    } catch (e) {
      alert("Formato MGRS non valido o libreria non caricata correttamente.");
    }
  }

  toggleSelection(listName: 'properties' | 'depths' | 'stats', value: string) {
    const list = this.request[listName] as string[];
    const index = list.indexOf(value);
    if (index === -1) {
      list.push(value);
    } else {
      list.splice(index, 1);
    }
  }

  submitRequest() {
    if (this.request.properties.length === 0 || this.request.depths.length === 0 || this.request.stats.length === 0) {
      alert("Seleziona almeno una Property, una Depth e una Stat.");
      return;
    }
    
    this.loading = true;
    this.api.downloadSoilGrids(this.request).subscribe({
      next: (res) => {
        alert(res.message || 'Download avviato in background con successo!');
        this.loading = false;
      },
      error: (err) => {
        alert(`Errore: ${err.message}`);
        this.loading = false;
      }
    });
  }
}
