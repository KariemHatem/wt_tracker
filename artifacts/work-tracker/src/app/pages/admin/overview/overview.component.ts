import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ApiService } from '../../../services/api.service';
import { AdminStats, UserMonitoring } from '../../../models/api.models';

@Component({
  selector: 'app-admin-overview',
  standalone: true,
  imports: [CommonModule, TableModule],
  template: `
    <div class="page-header">
      <h1 class="wt-section-title">Admin Overview</h1>
      <p class="wt-section-sub">Real-time workspace monitoring</p>
    </div>
    <div class="page-body">
      <!-- Stats -->
      <div class="row g-3 mb-4">
        <div class="col-6 col-lg-3" *ngFor="let s of statCards">
          <div class="wt-stat-card">
            <div class="stat-icon" [style.color]="s.color"><i [class]="'pi ' + s.icon"></i></div>
            <div class="stat-value">{{ s.value }}</div>
            <div class="stat-label">{{ s.label }}</div>
          </div>
        </div>
      </div>

      <!-- Live monitoring -->
      <div class="wt-card mb-4">
        <div class="d-flex align-items-center justify-content-between mb-3">
          <h6 style="font-size:14px;font-weight:600;margin:0">Live User Status</h6>
          <div class="d-flex align-items-center gap-2" style="font-size:12px;color:var(--text-color-secondary)">
            <span style="width:8px;height:8px;border-radius:50%;background:#22c55e;display:inline-block;animation:pulse 2s infinite"></span>
            Live
          </div>
        </div>
        <p-table [value]="monitoring" [loading]="loading" responsiveLayout="scroll">
          <ng-template pTemplate="header">
            <tr><th>Employee</th><th>Status</th><th>Last Login</th><th>Hours Today</th><th>This Week</th></tr>
          </ng-template>
          <ng-template pTemplate="body" let-u>
            <tr>
              <td>
                <div style="font-weight:500">{{ u.fullName }}</div>
                <div style="font-size:12px;color:var(--text-color-secondary)">{{ u.email }}</div>
              </td>
              <td>
                <span [class]="statusBadge(u.status)">
                  {{ u.status || 'idle' }}
                </span>
              </td>
              <td style="color:var(--text-color-secondary);font-size:13px">
                {{ u.lastLogin ? (u.lastLogin | date:'MMM d, HH:mm') : '—' }}
              </td>
              <td><strong>{{ u.hoursToday?.toFixed(1) }}h</strong></td>
              <td style="color:var(--text-color-secondary)">{{ u.hoursThisWeek?.toFixed(1) }}h</td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr><td colspan="5" style="text-align:center;padding:40px;color:var(--text-color-secondary)">No users found.</td></tr>
          </ng-template>
        </p-table>
      </div>

      <!-- Hours summary -->
      <div class="row g-3" *ngIf="stats">
        <div class="col-12 col-md-6">
          <div class="wt-card">
            <div style="font-size:12px;color:var(--text-color-secondary);margin-bottom:8px;text-transform:uppercase;letter-spacing:.06em">This Week</div>
            <div style="font-size:32px;font-weight:700;color:#3b82f6">{{ stats.totalHoursThisWeek.toFixed(1) }}<span style="font-size:16px">h</span></div>
            <div style="font-size:12px;color:var(--text-color-secondary);margin-top:4px">Total team hours</div>
          </div>
        </div>
        <div class="col-12 col-md-6">
          <div class="wt-card">
            <div style="font-size:12px;color:var(--text-color-secondary);margin-bottom:8px;text-transform:uppercase;letter-spacing:.06em">This Month</div>
            <div style="font-size:32px;font-weight:700;color:#22c55e">{{ stats.totalHoursThisMonth.toFixed(1) }}<span style="font-size:16px">h</span></div>
            <div style="font-size:12px;color:var(--text-color-secondary);margin-top:4px">Total team hours</div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }`],
})
export class AdminOverviewComponent implements OnInit, OnDestroy {
  stats?: AdminStats;
  monitoring: UserMonitoring[] = [];
  loading = true;
  private subs = new Subscription();

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.subs.add(this.api.getAdminStats().subscribe(s => this.stats = s));
    this.subs.add(this.api.getUsersMonitoring().subscribe(m => { this.monitoring = m; this.loading = false; }));
  }

  ngOnDestroy(): void { this.subs.unsubscribe(); }

  get statCards() {
    if (!this.stats) return [];
    return [
      { label: 'Total Users',       value: this.stats.totalUsers,                       icon: 'pi-users',      color: '#3b82f6' },
      { label: 'Active Today',      value: this.stats.activeUsersToday,                 icon: 'pi-bolt',       color: '#22c55e' },
      { label: 'Total Logins',      value: this.stats.totalLogins,                      icon: 'pi-sign-in',    color: '#f59e0b' },
      { label: 'Avg Productivity',  value: `${Math.round(this.stats.avgDailyProductivity)}%`, icon: 'pi-chart-line', color: '#a78bfa' },
    ];
  }

  statusBadge(s?: string): string {
    if (s === 'working') return 'badge-working';
    if (s === 'idle')    return 'badge-idle';
    return 'badge-offline';
  }
}
