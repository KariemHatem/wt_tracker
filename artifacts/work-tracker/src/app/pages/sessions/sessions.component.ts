import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { TableModule } from 'primeng/table';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ApiService } from '../../services/api.service';
import { WorkSession } from '../../models/api.models';

@Component({
  selector: 'app-sessions',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, TableModule, DatePickerModule, ButtonModule, TagModule],
  template: `
    <div class="page-header">
      <h1 class="wt-section-title">Sessions</h1>
      <p class="wt-section-sub">Your work session history</p>
    </div>
    <div class="page-body">
      <!-- Filters -->
      <div class="wt-card mb-4">
        <div class="row g-3 align-items-end">
          <div class="col-auto">
            <label class="d-block text-muted mb-1" style="font-size:12px;font-weight:500">From</label>
            <p-datepicker [(ngModel)]="fromDate" dateFormat="yy-mm-dd" [showIcon]="true"
                        (ngModelChange)="load()" />
          </div>
          <div class="col-auto">
            <label class="d-block text-muted mb-1" style="font-size:12px;font-weight:500">To</label>
            <p-datepicker [(ngModel)]="toDate" dateFormat="yy-mm-dd" [showIcon]="true"
                        (ngModelChange)="load()" />
          </div>
          <div class="col-auto">
            <p-button icon="pi pi-refresh" severity="secondary" (click)="load()" />
          </div>
          <div class="col ms-auto text-end" *ngIf="sessions.length">
            <span style="font-size:13px;color:var(--text-color-secondary)">
              {{ sessions.length }} sessions · {{ fmtMins(totalMinutes) }} total
            </span>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="wt-card">
        <p-table [value]="sessions" [loading]="loading" [paginator]="sessions.length > 20"
                 [rows]="20" responsiveLayout="scroll">
          <ng-template pTemplate="header">
            <tr>
              <th pSortableColumn="startTime">Start <p-sortIcon field="startTime"/></th>
              <th>End</th>
              <th pSortableColumn="totalMinutes">Duration <p-sortIcon field="totalMinutes"/></th>
              <th>Notes</th>
              <th>Status</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-s>
            <tr>
              <td class="font-mono">{{ s.startTime | date:'MMM d, HH:mm:ss' }}</td>
              <td class="font-mono">{{ s.endTime ? (s.endTime | date:'MMM d, HH:mm:ss') : '—' }}</td>
              <td><strong>{{ fmtMins(s.totalMinutes) }}</strong></td>
              <td style="color:var(--text-color-secondary);font-size:13px">{{ s.notes || '—' }}</td>
              <td>
                <span [class]="s.isActive ? 'badge-working' : 'badge-offline'">
                  {{ s.isActive ? 'Active' : 'Completed' }}
                </span>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr><td colspan="5" style="text-align:center;padding:40px;color:var(--text-color-secondary)">No sessions found for this period.</td></tr>
          </ng-template>
        </p-table>
      </div>
    </div>
  `,
})
export class SessionsComponent implements OnInit, OnDestroy {
  sessions: WorkSession[] = [];
  loading = true;
  fromDate: Date;
  toDate: Date;
  private sub?: Subscription;

  constructor(private api: ApiService) {
    const now = new Date();
    this.toDate = now;
    this.fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  ngOnInit(): void { this.load(); }
  ngOnDestroy(): void { this.sub?.unsubscribe(); }

  load(): void {
    this.loading = true;
    this.sub?.unsubscribe();
    this.sub = this.api.listSessions(this.fmt(this.fromDate), this.fmt(this.toDate)).subscribe({
      next: s => { this.sessions = s; this.loading = false; },
      error: () => this.loading = false,
    });
  }

  get totalMinutes(): number { return this.sessions.reduce((s, x) => s + (x.totalMinutes ?? 0), 0); }

  fmtMins(mins?: number | null): string {
    const n = mins ?? 0; const h = Math.floor(n / 60), m = n % 60;
    return h === 0 ? `${m}m` : m === 0 ? `${h}h` : `${h}h ${m}m`;
  }

  fmt(d: Date): string { return d.toISOString().split('T')[0]; }
}
