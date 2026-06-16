import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule],
  template: `
    <div class="app-layout">
      <header class="glass-panel header">
        <div class="logo">
          <h1>NexusEO <span class="highlight">Hub</span></h1>
        </div>
        <nav class="main-nav">
          <a href="/terrascope" class="nav-link" routerLink="/terrascope" routerLinkActive="active">Terrascope (NDVI)</a>
          <a href="/soilgrids" class="nav-link" routerLink="/soilgrids" routerLinkActive="active">SoilGrids</a>
        </nav>
      </header>
      <main class="container">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .app-layout {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .header {
      border-radius: 0;
      border-top: none;
      border-left: none;
      border-right: none;
      padding: 16px 40px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .logo h1 {
      font-size: 20px;
      font-weight: 600;
      letter-spacing: -0.5px;
      margin: 0;
    }
    .highlight {
      color: var(--accent-primary);
    }
    .main-nav {
      display: flex;
      gap: 20px;
    }
    .nav-link {
      text-decoration: none;
      color: var(--text-secondary);
      font-weight: 500;
      padding: 8px 12px;
      border-radius: 6px;
      transition: all 0.2s ease;
    }
    .nav-link:hover {
      color: var(--text-primary);
      background: rgba(255,255,255,0.05);
    }
    .nav-link.active {
      color: var(--accent-primary);
      background: rgba(var(--accent-primary-rgb), 0.1);
    }
  `]
})
export class AppComponent {
  title = 'frontend';
}
