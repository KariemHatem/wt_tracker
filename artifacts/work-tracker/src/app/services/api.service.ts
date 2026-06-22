import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  WorkSession, TodayProgress, WeeklyReport, MonthlyReport,
  DailyReportRow, AdminStats, UserMonitoring, LoginActivity,
  WeeklyAnalytics, MonthlyAnalytics, User, UserCreate, UserUpdate
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  // ── Sessions ────────────────────────────────────────────────────────────────
  listSessions(from?: string, to?: string): Observable<WorkSession[]> {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to)   params = params.set('to', to);
    return this.http.get<WorkSession[]>('/api/sessions', { params });
  }

  getActiveSession(): Observable<WorkSession | null> {
    return this.http.get<WorkSession | null>('/api/sessions/active');
  }

  getTodayProgress(): Observable<TodayProgress> {
    return this.http.get<TodayProgress>('/api/sessions/today');
  }

  startSession(notes?: string): Observable<WorkSession> {
    return this.http.post<WorkSession>('/api/sessions/start', { notes });
  }

  endSession(): Observable<WorkSession> {
    return this.http.post<WorkSession>('/api/sessions/end', {});
  }

  // ── Reports ─────────────────────────────────────────────────────────────────
  getDailyReport(date: string): Observable<DailyReportRow[]> {
    return this.http.get<DailyReportRow[]>('/api/reports/daily', { params: { date } });
  }

  getWeeklyReport(week?: string): Observable<WeeklyReport> {
    let params = new HttpParams();
    if (week) params = params.set('week', week);
    return this.http.get<WeeklyReport>('/api/reports/weekly', { params });
  }

  getMonthlyReport(year?: number, month?: number): Observable<MonthlyReport> {
    let params = new HttpParams();
    if (year)  params = params.set('year', year);
    if (month) params = params.set('month', month);
    return this.http.get<MonthlyReport>('/api/reports/monthly', { params });
  }

  // ── Admin ───────────────────────────────────────────────────────────────────
  getAdminStats(): Observable<AdminStats> {
    return this.http.get<AdminStats>('/api/admin/stats');
  }

  getUsersMonitoring(): Observable<UserMonitoring[]> {
    return this.http.get<UserMonitoring[]>('/api/admin/users/monitoring');
  }

  // ── Users ───────────────────────────────────────────────────────────────────
  listUsers(): Observable<User[]> {
    return this.http.get<User[]>('/api/users');
  }

  createUser(data: UserCreate): Observable<User> {
    return this.http.post<User>('/api/users', data);
  }

  updateUser(id: number, data: UserUpdate): Observable<User> {
    return this.http.put<User>(`/api/users/${id}`, data);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`/api/users/${id}`);
  }

  // ── Login Activity ──────────────────────────────────────────────────────────
  getLoginActivity(limit = 50): Observable<LoginActivity[]> {
    return this.http.get<LoginActivity[]>('/api/activity/login', { params: { limit } });
  }

  // ── Analytics ───────────────────────────────────────────────────────────────
  getWeeklyAnalytics(week?: string): Observable<WeeklyAnalytics> {
    let params = new HttpParams();
    if (week) params = params.set('week', week);
    return this.http.get<WeeklyAnalytics>('/api/admin/analytics/weekly', { params });
  }

  getMonthlyAnalytics(year?: number, month?: number): Observable<MonthlyAnalytics> {
    let params = new HttpParams();
    if (year)  params = params.set('year', year);
    if (month) params = params.set('month', month);
    return this.http.get<MonthlyAnalytics>('/api/admin/analytics/monthly', { params });
  }
}
