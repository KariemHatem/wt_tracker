import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { TabsModule } from 'primeng/tabs';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { ApiService } from '../../../services/api.service';
import { WeeklyAnalytics, MonthlyAnalytics } from '../../../models/api.models';

const CHART_OPTS = {
  responsive: true,
  plugins: { legend: { labels: { color: '#94a3b8' } } },
  scales: {
    x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,0.08)' } },
    y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,0.08)' }, beginAtZero: true },
  },
};

const LINE_OPTS = {
  ...CHART_OPTS,
  elements: { line: { tension: 0.3 } },
};

@Component({
  selector: 'app-admin-analytics',
  standalone: true,
  imports: [CommonModule, TabsModule, ChartModule, TableModule],
  template: `
    <div class="page-header">
      <h1 class="wt-section-title">Analytics</h1>
      <p class="wt-section-sub">Team productivity trends and insights</p>
    </div>
    <div class="page-body">
      <p-tabs [value]="0">
        <p-tablist>
          <p-tab [value]="0">Weekly</p-tab>
          <p-tab [value]="1">Monthly</p-tab>
        </p-tablist>
        <p-tabpanels>
          <!-- WEEKLY -->
          <p-tabpanel [value]="0">
            <ng-container *ngIf="weekly; else loadingTpl">
              <div class="row g-3 mb-4" style="padding-top:16px">
                <div class="col-12 col-lg-8">
                  <div class="wt-card">
                    <h6 style="font-size:13px;font-weight:600;margin-bottom:4px">Daily Hours — Week of {{ weekly.weekStart | slice:0:10 }}</h6>
                    <p class="text-muted mb-4" style="font-size:12px">Worked vs. target per day</p>
                    <p-chart type="bar" [data]="weeklyBarData" [options]="chartOpts" height="220" />
                  </div>
                </div>
                <div class="col-12 col-lg-4">
                  <div class="wt-card">
                    <h6 style="font-size:13px;font-weight:600;margin-bottom:4px">Daily Productivity %</h6>
                    <p class="text-muted mb-4" style="font-size:12px">Completion rate</p>
                    <p-chart type="line" [data]="weeklyLineData" [options]="lineOpts" height="220" />
                  </div>
                </div>
              </div>
              <div class="wt-card">
                <h6 style="font-size:13px;font-weight:600;margin-bottom:16px">Day-by-Day Breakdown</h6>
                <p-table [value]="weekly.days" responsiveLayout="scroll">
                  <ng-template pTemplate="header">
                    <tr><th>Day</th><th>Date</th><th>Worked</th><th>Target</th><th>Productivity</th></tr>
                  </ng-template>
                  <ng-template pTemplate="body" let-d>
                    <tr>
                      <td><strong>{{ d.dayName }}</strong></td>
                      <td class="text-muted" style="font-size:13px">{{ fmtDay(d.date) }}</td>
                      <td><strong>{{ (d.workedMinutes/60).toFixed(1) }}h</strong></td>
                      <td class="text-muted">{{ (d.targetMinutes/60).toFixed(1) }}h</td>
                      <td>
                        <div class="d-flex align-items-center gap-2">
                          <div style="width:60px;height:5px;background:rgba(255,255,255,.08);border-radius:3px">
                            <div [style.width.%]="Math.min(100, d.productivityPercent)"
                                 style="height:100%;background:#3b82f6;border-radius:3px"></div>
                          </div>
                          <span style="font-size:12px;font-weight:600">{{ d.productivityPercent.toFixed(0) }}%</span>
                        </div>
                      </td>
                    </tr>
                  </ng-template>
                </p-table>
              </div>
            </ng-container>
          </p-tabpanel>

          <!-- MONTHLY -->
          <p-tabpanel [value]="1">
            <ng-container *ngIf="monthly; else loadingTpl">
              <div class="row g-3 mb-4" style="padding-top:16px">
                <div class="col-12 col-lg-8">
                  <div class="wt-card">
                    <h6 style="font-size:13px;font-weight:600;margin-bottom:4px">Hours by Week — {{ monthly.year }}/{{ fmtMonth(monthly.month) }}</h6>
                    <p class="text-muted mb-4" style="font-size:12px">Worked vs. target per week</p>
                    <p-chart type="bar" [data]="monthlyBarData" [options]="chartOpts" height="220" />
                  </div>
                </div>
                <div class="col-12 col-lg-4">
                  <div class="wt-card mb-3">
                    <div class="text-muted mb-2" style="font-size:11px;text-transform:uppercase;letter-spacing:.06em">Avg Hours / Day</div>
                    <div style="font-size:28px;font-weight:700;color:#3b82f6">{{ monthly.avgHoursWorked?.toFixed(1) ?? '—' }}h</div>
                  </div>
                  <div class="wt-card">
                    <div class="text-muted mb-3" style="font-size:11px;text-transform:uppercase;letter-spacing:.06em">Most Productive Days</div>
                    <div class="d-flex flex-wrap gap-2">
                      <span *ngFor="let d of monthly.mostProductiveDays"
                            style="padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;background:rgba(59,130,246,.15);color:#60a5fa">
                        {{ d }}
                      </span>
                      <span *ngIf="!monthly.mostProductiveDays.length" class="text-muted" style="font-size:13px">No data yet</span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="wt-card">
                <h6 style="font-size:13px;font-weight:600;margin-bottom:16px">Weekly Breakdown</h6>
                <p-table [value]="monthly.weeks" responsiveLayout="scroll">
                  <ng-template pTemplate="header">
                    <tr><th>Week</th><th>Worked</th><th>Target</th><th>Difference</th></tr>
                  </ng-template>
                  <ng-template pTemplate="body" let-w>
                    <tr>
                      <td><strong>Week {{ w.weekNumber }}</strong></td>
                      <td><strong>{{ (w.workedMinutes/60).toFixed(1) }}h</strong></td>
                      <td class="text-muted">{{ (w.targetMinutes/60).toFixed(1) }}h</td>
                      <td [style.color]="(w.workedMinutes-w.targetMinutes)>=0?'#22c55e':'#f59e0b'">
                        {{ (w.workedMinutes-w.targetMinutes) >= 0 ? '+' : '' }}{{ ((w.workedMinutes-w.targetMinutes)/60).toFixed(1) }}h
                      </td>
                    </tr>
                  </ng-template>
                </p-table>
              </div>
            </ng-container>
          </p-tabpanel>
        </p-tabpanels>
      </p-tabs>

      <ng-template #loadingTpl>
        <div style="padding:60px;text-align:center;color:var(--text-color-secondary)">
          <i class="pi pi-spin pi-spinner" style="font-size:28px"></i>
        </div>
      </ng-template>
    </div>
  `,
})
export class AdminAnalyticsComponent implements OnInit, OnDestroy {
  weekly?: WeeklyAnalytics;
  monthly?: MonthlyAnalytics;
  weeklyBarData: any = null;
  weeklyLineData: any = null;
  monthlyBarData: any = null;
  chartOpts = CHART_OPTS;
  lineOpts = LINE_OPTS;
  Math = Math;
  private subs = new Subscription();

  fmtDay(d: string): string { return d.slice(5, 10).replace('-', '/'); }
  fmtMonth(m: number): string { return m.toString().padStart(2, '0'); }

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    const now = new Date();
    this.subs.add(this.api.getWeeklyAnalytics(now.toISOString().split('T')[0]).subscribe(w => {
      this.weekly = w;
      this.weeklyBarData = {
        labels: w.days.map(d => d.dayName.slice(0, 3)),
        datasets: [
          { label: 'Target (h)',  data: w.days.map(d => +(d.targetMinutes/60).toFixed(1)), backgroundColor: 'rgba(148,163,184,0.2)' },
          { label: 'Worked (h)', data: w.days.map(d => +(d.workedMinutes/60).toFixed(1)), backgroundColor: '#3b82f6' },
        ],
      };
      this.weeklyLineData = {
        labels: w.days.map(d => d.dayName.slice(0, 3)),
        datasets: [{ label: 'Productivity %', data: w.days.map(d => Math.round(d.productivityPercent)), borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,.1)', fill: true }],
      };
    }));
    this.subs.add(this.api.getMonthlyAnalytics(now.getFullYear(), now.getMonth() + 1).subscribe(m => {
      this.monthly = m;
      this.monthlyBarData = {
        labels: m.weeks.map(w => `W${w.weekNumber}`),
        datasets: [
          { label: 'Target (h)',  data: m.weeks.map(w => +(w.targetMinutes/60).toFixed(1)), backgroundColor: 'rgba(148,163,184,0.2)' },
          { label: 'Worked (h)', data: m.weeks.map(w => +(w.workedMinutes/60).toFixed(1)), backgroundColor: '#22c55e' },
        ],
      };
    }));
  }

  ngOnDestroy(): void { this.subs.unsubscribe(); }
}
