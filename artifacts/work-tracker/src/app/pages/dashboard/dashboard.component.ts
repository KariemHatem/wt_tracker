import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Subscription, interval } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { TodayProgress, WorkSession, WeeklyReport, MonthlyReport } from '../../models/api.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, DatePipe, ButtonModule, ProgressBarModule, TableModule, TagModule, ToastModule],
  providers: [DatePipe],
  template: `
    <div class="page-header d-flex align-items-start justify-content-between">
      <div>
        <h1 class="wt-section-title">Dashboard</h1>
        <p class="wt-section-sub">{{ today | date:'EEEE, MMMM d, yyyy' }}</p>
      </div>
      <span style="font-size:12px;color:var(--text-color-secondary);">{{ user?.fullName }}</span>
    </div>

    <div class="page-body">
      <!-- Stats row -->
      <div class="row g-3 mb-4">
        <div class="col-6 col-lg-3">
          <div class="wt-stat-card">
            <div class="stat-icon" style="color:#3b82f6"><i class="pi pi-clock"></i></div>
            <div class="stat-value">{{ fmtMins(progress?.workedMinutes) }}</div>
            <div class="stat-label">Worked Today</div>
          </div>
        </div>
        <div class="col-6 col-lg-3">
          <div class="wt-stat-card">
            <div class="stat-icon" style="color:#22c55e"><i class="pi pi-check-circle"></i></div>
            <div class="stat-value" style="color:#22c55e">{{ progress?.completionPercent?.toFixed(0) ?? 0 }}%</div>
            <div class="stat-label">Goal Completion</div>
          </div>
        </div>
        <div class="col-6 col-lg-3">
          <div class="wt-stat-card">
            <div class="stat-icon" style="color:#f59e0b"><i class="pi pi-calendar"></i></div>
            <div class="stat-value">{{ progress?.sessionsCount ?? 0 }}</div>
            <div class="stat-label">Sessions Today</div>
          </div>
        </div>
        <div class="col-6 col-lg-3">
          <div class="wt-stat-card">
            <div class="stat-icon" style="color:#a78bfa"><i class="pi pi-flag"></i></div>
            <div class="stat-value">{{ fmtMins(progress?.targetMinutes) }}</div>
            <div class="stat-label">Daily Target</div>
          </div>
        </div>
      </div>

      <div class="row g-3 mb-4">
        <!-- Timer -->
        <div class="col-12 col-lg-4">
          <div class="wt-card h-100 text-center d-flex flex-column align-items-center justify-content-center" style="min-height:200px">
            <h6 class="text-muted mb-2" style="font-size:12px;text-transform:uppercase;letter-spacing:.06em">Session Timer</h6>
            <div class="timer-display" [class.timer-running]="isRunning">{{ timerDisplay }}</div>
            <p class="text-muted" style="font-size:12px;margin:4px 0 16px">
              {{ isRunning ? 'Session in progress' : 'No active session' }}
            </p>
            <p-button
              [label]="isRunning ? 'Stop Session' : 'Start Session'"
              [severity]="isRunning ? 'danger' : 'success'"
              [loading]="actionLoading"
              (click)="toggleSession()" />
          </div>
        </div>

        <!-- Progress ring / progress bar -->
        <div class="col-12 col-lg-4">
          <div class="wt-card h-100" style="min-height:200px">
            <h6 class="text-muted mb-3" style="font-size:12px;text-transform:uppercase;letter-spacing:.06em">Today's Progress</h6>
            <div class="mb-2 d-flex justify-content-between" style="font-size:13px">
              <span class="text-muted">{{ fmtMins(progress?.workedMinutes) }} worked</span>
              <span style="color:var(--primary-color)">{{ progress?.completionPercent?.toFixed(0) ?? 0 }}%</span>
            </div>
            <p-progressBar [value]="progress?.completionPercent ?? 0" [showValue]="false" />
            <div class="mt-3 d-flex justify-content-between" style="font-size:12px;color:var(--text-color-secondary)">
              <span>Target: {{ fmtMins(progress?.targetMinutes) }}</span>
              <span *ngIf="progress?.isGoalReached" style="color:#22c55e">🎯 Goal reached!</span>
            </div>
          </div>
        </div>

        <!-- Weekly summary -->
        <div class="col-12 col-lg-4">
          <div class="wt-card h-100" style="min-height:200px" *ngIf="weekly; else weeklyLoading">
            <h6 class="text-muted mb-3" style="font-size:12px;text-transform:uppercase;letter-spacing:.06em">This Week</h6>
            <div class="mb-2 d-flex justify-content-between" style="font-size:13px">
              <span class="text-muted">Worked</span>
              <strong>{{ fmtMins(weekly.totalWorkedMinutes) }}</strong>
            </div>
            <p-progressBar [value]="weeklyPercent" [showValue]="false" />
            <div class="mt-2 d-flex justify-content-between" style="font-size:12px;color:var(--text-color-secondary)">
              <span>Target: {{ fmtMins(weekly.totalTargetMinutes) }}</span>
              <span>{{ weeklyPercent }}%</span>
            </div>
            <div *ngIf="(weekly.overtimeMinutes ?? 0) > 0" class="mt-2" style="font-size:12px;color:#22c55e">+{{ fmtMins(weekly.overtimeMinutes) }} overtime</div>
            <div *ngIf="(weekly.missingMinutes ?? 0) > 0" class="mt-2" style="font-size:12px;color:#f59e0b">−{{ fmtMins(weekly.missingMinutes) }} missing</div>
          </div>
          <ng-template #weeklyLoading>
            <div class="wt-card h-100 d-flex align-items-center justify-content-center" style="min-height:200px">
              <i class="pi pi-spin pi-spinner" style="font-size:24px;color:var(--text-color-secondary)"></i>
            </div>
          </ng-template>
        </div>
      </div>

      <!-- Today's sessions -->
      <div class="wt-card">
        <h6 class="mb-3" style="font-size:14px;font-weight:600">Today's Sessions</h6>
        <p-table [value]="todaySessions" [loading]="loadingSessions" responsiveLayout="scroll">
          <ng-template pTemplate="header">
            <tr>
              <th>Start</th><th>End</th><th>Duration</th><th>Status</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-s>
            <tr>
              <td class="font-mono">{{ s.startTime | date:'HH:mm:ss' }}</td>
              <td class="font-mono">{{ s.endTime ? (s.endTime | date:'HH:mm:ss') : '—' }}</td>
              <td><strong>{{ fmtMins(s.totalMinutes) }}</strong></td>
              <td>
                <span [class]="s.isActive ? 'badge-working' : 'badge-offline'">
                  {{ s.isActive ? 'Active' : 'Completed' }}
                </span>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr><td colspan="4" style="text-align:center;padding:32px;color:var(--text-color-secondary)">No sessions today. Start your first one!</td></tr>
          </ng-template>
        </p-table>
      </div>
    </div>
  `,
})
export class DashboardComponent implements OnInit, OnDestroy {
  progress?: TodayProgress;
  weekly?: WeeklyReport;
  todaySessions: WorkSession[] = [];
  loadingSessions = true;
  actionLoading = false;
  isRunning = false;
  elapsedSeconds = 0;
  today = new Date();

  private timerSub?: Subscription;
  private subs = new Subscription();

  constructor(private api: ApiService, public auth: AuthService, private msg: MessageService) {}

  get user() { return this.auth.currentUser; }

  ngOnInit(): void { this.loadAll(); }

  ngOnDestroy(): void { this.subs.unsubscribe(); this.timerSub?.unsubscribe(); }

  loadAll(): void {
    this.subs.add(this.api.getTodayProgress().subscribe(p => this.progress = p));
    this.subs.add(this.api.getWeeklyReport().subscribe(w => this.weekly = w));
    this.subs.add(this.api.listSessions(this.fmtDate(new Date()), this.fmtDate(new Date())).subscribe(s => {
      this.todaySessions = s;
      this.loadingSessions = false;
    }));
    this.subs.add(this.api.getActiveSession().subscribe(s => {
      if (s?.isActive) { this.isRunning = true; this.startTimer(s.startTime); }
    }));
  }

  toggleSession(): void {
    this.actionLoading = true;
    if (this.isRunning) {
      this.api.endSession().subscribe({
        next: () => { this.isRunning = false; this.stopTimer(); this.actionLoading = false; this.loadAll(); },
        error: () => { this.actionLoading = false; this.msg.add({ severity: 'error', summary: 'Error', detail: 'Could not stop session.' }); }
      });
    } else {
      this.api.startSession().subscribe({
        next: s => { this.isRunning = true; this.startTimer(s.startTime); this.actionLoading = false; this.loadAll(); },
        error: () => { this.actionLoading = false; this.msg.add({ severity: 'error', summary: 'Error', detail: 'Could not start session.' }); }
      });
    }
  }

  startTimer(startTime: string): void {
    const start = new Date(startTime);
    this.elapsedSeconds = Math.floor((Date.now() - start.getTime()) / 1000);
    this.timerSub = interval(1000).subscribe(() => this.elapsedSeconds++);
  }

  stopTimer(): void { this.timerSub?.unsubscribe(); this.elapsedSeconds = 0; }

  get timerDisplay(): string {
    const h = Math.floor(this.elapsedSeconds / 3600);
    const m = Math.floor((this.elapsedSeconds % 3600) / 60);
    const s = this.elapsedSeconds % 60;
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  }

  get weeklyPercent(): number {
    if (!this.weekly || !this.weekly.totalTargetMinutes) return 0;
    return Math.round((this.weekly.totalWorkedMinutes / this.weekly.totalTargetMinutes) * 100);
  }

  fmtMins(mins?: number | null): string {
    const n = mins ?? 0;
    const h = Math.floor(n / 60), m = n % 60;
    return h === 0 ? `${m}m` : m === 0 ? `${h}h` : `${h}h ${m}m`;
  }

  fmtDate(d: Date): string {
    return d.toISOString().split('T')[0];
  }
}

function pad(n: number): string { return n.toString().padStart(2, '0'); }
