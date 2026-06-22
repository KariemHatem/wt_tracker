import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { TabsModule } from 'primeng/tabs';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { ChartModule } from 'primeng/chart';
import { ApiService } from '../../services/api.service';
import { DailyReportRow, WeeklyReport, MonthlyReport } from '../../models/api.models';

const CHART_OPTS = {
  responsive: true,
  plugins: { legend: { labels: { color: '#94a3b8' } } },
  scales: {
    x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,0.08)' } },
    y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,0.08)' }, beginAtZero: true },
  },
};

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, TabsModule, DatePickerModule, ButtonModule, TableModule, ChartModule],
  template: `
    <div class="page-header d-flex align-items-start justify-content-between">
      <div>
        <h1 class="wt-section-title">Reports</h1>
        <p class="wt-section-sub">Track your productivity over time</p>
      </div>
    </div>
    <div class="page-body">
      <p-tabs [value]="0">
        <p-tablist>
          <p-tab [value]="0">Daily</p-tab>
          <p-tab [value]="1">Weekly</p-tab>
          <p-tab [value]="2">Monthly</p-tab>
        </p-tablist>
        <p-tabpanels>
          <!-- DAILY -->
          <p-tabpanel [value]="0">
            <div class="d-flex align-items-center gap-3 mb-4 flex-wrap" style="padding-top:16px">
              <div>
                <label class="d-block text-muted mb-1" style="font-size:12px">Date</label>
                <p-datepicker [(ngModel)]="dailyDate" dateFormat="yy-mm-dd" [showIcon]="true"
                            (ngModelChange)="loadDaily()" />
              </div>
              <p-button icon="pi pi-download" label="Export CSV" severity="secondary"
                        size="small" (click)="exportDaily()" [disabled]="!dailyRows.length" />
            </div>
            <div class="wt-card">
              <p-table [value]="dailyRows" [loading]="loadingDaily" responsiveLayout="scroll">
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
                          <div style="height:100%;background:#3b82f6;border-radius:3px"
                               [style.width.%]="Math.min(100, r.completionPercent ?? 0)"></div>
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
          </p-tabpanel>

          <!-- WEEKLY -->
          <p-tabpanel [value]="1">
            <div class="d-flex align-items-center gap-3 mb-4" style="padding-top:16px">
              <div>
                <label class="d-block text-muted mb-1" style="font-size:12px">Week starting</label>
                <p-datepicker [(ngModel)]="weekDate" dateFormat="yy-mm-dd" [showIcon]="true"
                            (ngModelChange)="loadWeekly()" />
              </div>
            </div>
            <div *ngIf="weekly" class="row g-3 mb-4">
              <div class="col-6 col-md-3" *ngFor="let s of weeklySummary">
                <div class="wt-card text-center">
                  <div style="font-size:20px;font-weight:700" [style.color]="s.color">{{ s.val }}</div>
                  <div class="text-muted" style="font-size:12px;margin-top:4px">{{ s.label }}</div>
                </div>
              </div>
            </div>
            <div class="wt-card" *ngIf="weeklyChartData">
              <h6 style="font-size:13px;font-weight:600;margin-bottom:16px">Hours per Day</h6>
              <p-chart type="bar" [data]="weeklyChartData" [options]="chartOpts" height="220" />
            </div>
          </p-tabpanel>

          <!-- MONTHLY -->
          <p-tabpanel [value]="2">
            <div *ngIf="monthly" class="row g-3 mb-4" style="padding-top:16px">
              <div class="col-6 col-md-3" *ngFor="let s of monthlySummary">
                <div class="wt-card text-center">
                  <div style="font-size:20px;font-weight:700" [style.color]="s.color">{{ s.val }}</div>
                  <div class="text-muted" style="font-size:12px;margin-top:4px">{{ s.label }}</div>
                </div>
              </div>
            </div>
            <div class="wt-card" *ngIf="monthlyChartData">
              <h6 style="font-size:13px;font-weight:600;margin-bottom:16px">Hours by Week</h6>
              <p-chart type="bar" [data]="monthlyChartData" [options]="chartOpts" height="220" />
            </div>
          </p-tabpanel>
        </p-tabpanels>
      </p-tabs>
    </div>
  `,
})
export class ReportsComponent implements OnInit, OnDestroy {
  dailyDate  = new Date();
  weekDate   = this.startOfWeek(new Date());
  daily      = new Date();
  dailyRows: DailyReportRow[] = [];
  weekly?: WeeklyReport;
  monthly?: MonthlyReport;
  loadingDaily = true;
  weeklyChartData: any = null;
  monthlyChartData: any = null;
  chartOpts = CHART_OPTS;
  Math = Math;

  private subs = new Subscription();

  constructor(private api: ApiService) {}

  ngOnInit(): void { this.loadDaily(); this.loadWeekly(); this.loadMonthly(); }
  ngOnDestroy(): void { this.subs.unsubscribe(); }

  loadDaily(): void {
    this.loadingDaily = true;
    this.subs.add(this.api.getDailyReport(this.fmt(this.dailyDate)).subscribe({
      next: r => { this.dailyRows = r; this.loadingDaily = false; },
      error: () => this.loadingDaily = false,
    }));
  }

  loadWeekly(): void {
    this.subs.add(this.api.getWeeklyReport(this.fmt(this.weekDate)).subscribe(w => {
      this.weekly = w;
      this.weeklyChartData = {
        labels: w.dailyBreakdown.map(d => d.dayName.slice(0, 3)),
        datasets: [
          { label: 'Target (h)',  data: w.dailyBreakdown.map(d => +(d.targetMinutes/60).toFixed(1)), backgroundColor: 'rgba(148,163,184,0.2)' },
          { label: 'Worked (h)', data: w.dailyBreakdown.map(d => +(d.workedMinutes/60).toFixed(1)), backgroundColor: '#3b82f6' },
        ],
      };
    }));
  }

  loadMonthly(): void {
    const now = new Date();
    this.subs.add(this.api.getMonthlyReport(now.getFullYear(), now.getMonth() + 1).subscribe(m => {
      this.monthly = m;
      this.monthlyChartData = {
        labels: m.weeklyBreakdown.map(w => `W${w.weekNumber}`),
        datasets: [
          { label: 'Target (h)',  data: m.weeklyBreakdown.map(w => +(w.targetMinutes/60).toFixed(1)), backgroundColor: 'rgba(148,163,184,0.2)' },
          { label: 'Worked (h)', data: m.weeklyBreakdown.map(w => +(w.workedMinutes/60).toFixed(1)), backgroundColor: '#22c55e' },
        ],
      };
    }));
  }

  get weeklySummary() {
    if (!this.weekly) return [];
    return [
      { label: 'Worked',   val: this.fmtMins(this.weekly.totalWorkedMinutes),  color: '#3b82f6' },
      { label: 'Target',   val: this.fmtMins(this.weekly.totalTargetMinutes),  color: 'var(--text-color)' },
      { label: 'Missing',  val: this.fmtMins(this.weekly.missingMinutes ?? 0), color: '#f59e0b' },
      { label: 'Overtime', val: this.fmtMins(this.weekly.overtimeMinutes ?? 0),color: '#22c55e' },
    ];
  }

  get monthlySummary() {
    if (!this.monthly) return [];
    return [
      { label: 'Total Worked',  val: this.fmtMins(this.monthly.totalWorkedMinutes),   color: '#3b82f6' },
      { label: 'Target',        val: this.fmtMins(this.monthly.totalTargetMinutes),   color: 'var(--text-color)' },
      { label: 'Overtime',      val: this.fmtMins(this.monthly.overtimeMinutes ?? 0), color: '#22c55e' },
      { label: 'Productivity',  val: `${(this.monthly.productivityPercent ?? 0).toFixed(0)}%`, color: '#a78bfa' },
    ];
  }

  exportDaily(): void {
    const rows = this.dailyRows.map(r => `"${r.userFullName}","${r.date}","${r.workedMinutes}","${r.targetMinutes}","${(r.completionPercent ?? 0).toFixed(0)}"`);
    const csv = ['Name,Date,Worked(min),Target(min),Completion%', ...rows].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `report-${this.fmt(this.dailyDate)}.csv`;
    a.click();
  }

  fmtMins(n?: number | null): string {
    const v = n ?? 0; const h = Math.floor(v/60), m = v%60;
    return h === 0 ? `${m}m` : m === 0 ? `${h}h` : `${h}h ${m}m`;
  }

  startOfWeek(d: Date): Date {
    const day = d.getDay(), diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  }

  fmt(d: Date): string { return d.toISOString().split('T')[0]; }
}
