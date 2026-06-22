import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { TableModule } from 'primeng/table';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { ApiService } from '../../../services/api.service';
import { DailyReportRow } from '../../../models/api.models';

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, TableModule, DatePickerModule, ButtonModule],
  template: `
    <div class="page-header">
      <h1 class="wt-section-title">Admin Reports</h1>
      <p class="wt-section-sub">Daily team work summary</p>
    </div>
    <div class="page-body">
      <div class="wt-card mb-4">
        <div class="d-flex align-items-center gap-3 flex-wrap">
          <div>
            <label class="text-muted d-block mb-1" style="font-size:12px">Date</label>
            <p-datepicker [(ngModel)]="selectedDate" dateFormat="yy-mm-dd" [showIcon]="true"
                        (ngModelChange)="load()" />
          </div>
          <div class="ms-auto d-flex align-items-center gap-3">
            <span *ngIf="report.length" style="font-size:13px;color:var(--text-color-secondary)">
              {{ report.length }} employees · {{ fmtMins(totalWorked) }} worked · avg {{ avgCompletion }}%
            </span>
            <p-button icon="pi pi-download" label="Export CSV" severity="secondary" size="small"
                      (click)="exportCsv()" [disabled]="!report.length" />
          </div>
        </div>
      </div>

      <div class="wt-card">
        <p-table [value]="report" [loading]="loading" responsiveLayout="scroll">
          <ng-template pTemplate="header">
            <tr><th>Employee</th><th>Start</th><th>End</th><th>Worked</th><th>Target</th><th>Completion</th></tr>
          </ng-template>
          <ng-template pTemplate="body" let-r>
            <tr>
              <td><strong>{{ r.userFullName }}</strong></td>
              <td class="font-mono">{{ r.startTime ? (r.startTime | date:'HH:mm') : '—' }}</td>
              <td class="font-mono">{{ r.endTime   ? (r.endTime   | date:'HH:mm') : '—' }}</td>
              <td><strong>{{ fmtMins(r.workedMinutes) }}</strong></td>
              <td class="text-muted">{{ fmtMins(r.targetMinutes) }}</td>
              <td>
                <div class="d-flex align-items-center gap-2">
                  <div style="width:60px;height:5px;background:rgba(255,255,255,.08);border-radius:3px">
                    <div [style.width.%]="Math.min(100, r.completionPercent ?? 0)"
                         style="height:100%;background:#3b82f6;border-radius:3px"></div>
                  </div>
                  <span style="font-size:12px;font-weight:600">{{ (r.completionPercent ?? 0).toFixed(0) }}%</span>
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-color-secondary)">No data for this date.</td></tr>
          </ng-template>
        </p-table>
      </div>
    </div>
  `,
})
export class AdminReportsComponent implements OnInit, OnDestroy {
  report: DailyReportRow[] = [];
  loading = true;
  selectedDate = new Date();
  Math = Math;
  private sub?: Subscription;

  constructor(private api: ApiService) {}

  ngOnInit(): void { this.load(); }
  ngOnDestroy(): void { this.sub?.unsubscribe(); }

  load(): void {
    this.loading = true;
    this.sub?.unsubscribe();
    this.sub = this.api.getDailyReport(this.fmt(this.selectedDate)).subscribe({
      next: r => { this.report = r; this.loading = false; },
      error: () => this.loading = false,
    });
  }

  get totalWorked(): number { return this.report.reduce((s, r) => s + r.workedMinutes, 0); }
  get avgCompletion(): number {
    if (!this.report.length) return 0;
    return Math.round(this.report.reduce((s, r) => s + (r.completionPercent ?? 0), 0) / this.report.length);
  }

  fmtMins(n?: number | null): string {
    const v = n ?? 0; const h = Math.floor(v/60), m = v%60;
    return h === 0 ? `${m}m` : m === 0 ? `${h}h` : `${h}h ${m}m`;
  }

  fmt(d: Date): string { return d.toISOString().split('T')[0]; }

  exportCsv(): void {
    const rows = this.report.map(r => `"${r.userFullName}","${r.date}","${r.workedMinutes}","${r.targetMinutes}","${(r.completionPercent ?? 0).toFixed(0)}"`);
    const csv = ['Name,Date,Worked(min),Target(min),Completion%', ...rows].join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `admin-report-${this.fmt(this.selectedDate)}.csv`; a.click();
  }
}
