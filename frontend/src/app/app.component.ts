import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <div class="app-layout">
      <header class="glass-panel header">
        <div class="logo">
          <h1>Terrascope <span class="highlight">Dashboard</span></h1>
        </div>
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
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .logo h1 {
      font-size: 20px;
      font-weight: 600;
      letter-spacing: -0.5px;
    }
    .highlight {
      color: var(--accent-primary);
    }
  `]
})
export class AppComponent {
  title = 'frontend';
}
