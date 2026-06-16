import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'terrascope',
    pathMatch: 'full'
  },
  {
    path: 'terrascope',
    loadComponent: () => import('./pages/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'soilgrids',
    loadComponent: () => import('./pages/soilgrids.component').then(m => m.SoilgridsComponent)
  }
];
