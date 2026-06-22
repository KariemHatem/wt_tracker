import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { ApiService } from '../../../services/api.service';
import { LoginActivity } from '../../../models/api.models';

@Component({
  selector: 'app-admin-activity',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, TableModule, SelectModule],
  template: `
    <div class="page-header">
      <h1 class="wt-section-title">Login Activity</h1>
      <p class="wt-section-sub">Recent authentication events across your team</p>
    </div>
    <div class="page-body">
      <div class="wt-card mb-4">
        <div class="d-flex align-items-center gap-4 flex-wrap">
          <div class="d-flex align-items-center gap-2">
            <i class="pi pi-clock text-muted" style="font-size:14px"></i>
            <span class="text-muted" style="font-size:13px">Show last</span>
            <p-select [options]="limitOptions" [(ngModel)]="limit" optionLabel="label" optionValue="value"
                      (ngModelChange)="load()" [style]="{width:'140px'}" />
          </div>
          <span *ngIf="activity.length" class="ms-auto text-muted" style="font-size:13px">{{ activity.length }} records</span>
        </div>
      </div>

      <div class="wt-card">
        <p-table [value]="activity" [loading]="loading" responsiveLayout="scroll">
          <ng-template pTemplate="header">
            <tr><th>User</th><th>Login Time</th><th>Logout Time</th><th>IP Address</th><th>Device / Browser</th></tr>
          </ng-template>
          <ng-template pTemplate="body" let-a>
            <tr>
              <td>
                <div style="font-weight:500">{{ a.userFullName || 'User ' + a.userId }}</div>
                <div style="font-size:12px;color:var(--text-color-secondary)">{{ a.userEmail }}</div>
              </td>
              <td class="font-mono" style="font-size:12px">{{ a.loginTime | date:'MMM d, HH:mm:ss' }}</td>
              <td class="font-mono" style="font-size:12px">
                <span *ngIf="a.logoutTime; else active">{{ a.logoutTime | date:'MMM d, HH:mm:ss' }}</span>
                <ng-template #active><span style="color:#22c55e;font-size:12px;font-weight:600;font-family:inherit">Active</span></ng-template>
              </td>
              <td class="font-mono" style="font-size:12px;color:var(--text-color-secondary)">{{ a.ipAddress || '—' }}</td>
              <td style="font-size:12px;color:var(--text-color-secondary)">
                <div class="d-flex align-items-center gap-1">
                  <i [class]="deviceIcon(a.device)" style="font-size:13px"></i>
                  {{ browserLabel(a) }}
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr><td colspan="5" style="text-align:center;padding:40px;color:var(--text-color-secondary)">No activity found.</td></tr>
          </ng-template>
        </p-table>
      </div>
    </div>
  `,
})
export class AdminActivityComponent implements OnInit, OnDestroy {
  activity: LoginActivity[] = [];
  loading = true;
  limit = 50;
  limitOptions = [
    { label: '25 records', value: 25 }, { label: '50 records', value: 50 },
    { label: '100 records', value: 100 }, { label: '200 records', value: 200 },
  ];
  private sub?: Subscription;

  constructor(private api: ApiService) {}

  ngOnInit(): void { this.load(); }
  ngOnDestroy(): void { this.sub?.unsubscribe(); }

  load(): void {
    this.loading = true;
    this.sub?.unsubscribe();
    this.sub = this.api.getLoginActivity(this.limit).subscribe({
      next: a => { this.activity = a; this.loading = false; },
      error: () => this.loading = false,
    });
  }

  deviceIcon(device?: string | null): string {
    return (device?.toLowerCase().includes('mobile')) ? 'pi pi-mobile' : 'pi pi-desktop';
  }

  browserLabel(a: LoginActivity): string {
    return [a.browser, a.operatingSystem].filter(Boolean).join(' / ') || '—';
  }
}
