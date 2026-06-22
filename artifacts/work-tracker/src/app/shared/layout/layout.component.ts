import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/api.models';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <div class="wt-shell">
      <!-- Sidebar -->
      <aside class="wt-sidebar">
        <div class="wt-sidebar__logo">
          <i class="pi pi-clock"></i>
          <span>WorkTracker</span>
        </div>

        <nav class="wt-sidebar__nav">
          <a class="wt-sidebar__link" routerLink="/dashboard" routerLinkActive="active">
            <i class="pi pi-home"></i> Dashboard
          </a>
          <a class="wt-sidebar__link" routerLink="/sessions" routerLinkActive="active">
            <i class="pi pi-list"></i> Sessions
          </a>
          <a class="wt-sidebar__link" routerLink="/reports" routerLinkActive="active">
            <i class="pi pi-chart-bar"></i> Reports
          </a>
          <a class="wt-sidebar__link" routerLink="/settings" routerLinkActive="active">
            <i class="pi pi-cog"></i> Settings
          </a>

          <ng-container *ngIf="user?.isAdmin">
            <div class="wt-sidebar__section-label">Admin</div>
            <a class="wt-sidebar__link" routerLink="/admin/overview" routerLinkActive="active">
              <i class="pi pi-th-large"></i> Overview
            </a>
            <a class="wt-sidebar__link" routerLink="/admin/users" routerLinkActive="active">
              <i class="pi pi-users"></i> Users
            </a>
            <a class="wt-sidebar__link" routerLink="/admin/reports" routerLinkActive="active">
              <i class="pi pi-file"></i> Reports
            </a>
            <a class="wt-sidebar__link" routerLink="/admin/activity" routerLinkActive="active">
              <i class="pi pi-bolt"></i> Activity
            </a>
            <a class="wt-sidebar__link" routerLink="/admin/analytics" routerLinkActive="active">
              <i class="pi pi-chart-line"></i> Analytics
            </a>
          </ng-container>
        </nav>

        <div class="wt-sidebar__footer">
          <div class="user-info" *ngIf="user">
            <div class="avatar">{{ initials }}</div>
            <div>
              <div class="user-name">{{ user.fullName }}</div>
              <div class="user-email" title="{{ user.email }}">{{ user.email }}</div>
            </div>
          </div>
          <button class="logout-btn" (click)="logout()">
            <i class="pi pi-sign-out"></i> Sign out
          </button>
        </div>
      </aside>

      <!-- Main content -->
      <main class="wt-content">
        <router-outlet />
      </main>
    </div>
  `,
})
export class LayoutComponent implements OnInit {
  user: User | null = null;

  constructor(private auth: AuthService) {}

  ngOnInit(): void {
    this.auth.user$.subscribe(u => this.user = u);
  }

  get initials(): string {
    return (this.user?.fullName ?? '')
      .split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  }

  logout(): void { this.auth.logout(); }
}
