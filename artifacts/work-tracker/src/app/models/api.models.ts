export interface User {
  id: number;
  fullName: string;
  email: string;
  targetHoursPerDay: number;
  workingDays: number[];
  isAdmin: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface WorkSession {
  id: number;
  userId: number;
  startTime: string;
  endTime?: string | null;
  totalMinutes?: number | null;
  notes?: string | null;
  isActive: boolean;
}

export interface TodayProgress {
  workedMinutes: number;
  targetMinutes: number;
  completionPercent: number;
  sessionsCount: number;
  isGoalReached: boolean;
}

export interface WeeklyReport {
  weekStart: string;
  weekEnd: string;
  totalWorkedMinutes: number;
  totalTargetMinutes: number;
  overtimeMinutes?: number;
  missingMinutes?: number;
  dailyBreakdown: DailyBreakdownItem[];
}

export interface DailyBreakdownItem {
  date: string;
  dayName: string;
  workedMinutes: number;
  targetMinutes: number;
}

export interface MonthlyReport {
  year: number;
  month: number;
  totalWorkedMinutes: number;
  totalTargetMinutes: number;
  overtimeMinutes?: number;
  productivityPercent?: number;
  weeklyBreakdown: WeeklyBreakdown[];
}

export interface WeeklyBreakdown {
  weekNumber: number;
  workedMinutes: number;
  targetMinutes: number;
}

export interface DailyReportRow {
  userId: number;
  userFullName: string;
  date: string;
  startTime?: string | null;
  endTime?: string | null;
  workedMinutes: number;
  targetMinutes: number;
  completionPercent?: number;
}

export interface AdminStats {
  totalUsers: number;
  activeUsersToday: number;
  totalHoursThisWeek: number;
  totalHoursThisMonth: number;
  totalLogins: number;
  avgDailyProductivity: number;
}

export interface UserMonitoring {
  userId: number;
  fullName: string;
  email: string;
  isActive: boolean;
  status?: 'working' | 'idle' | 'offline';
  hoursToday: number;
  hoursThisWeek: number;
  lastLogin?: string | null;
}

export interface LoginActivity {
  id: number;
  userId: number;
  userFullName?: string;
  userEmail?: string;
  loginTime: string;
  logoutTime?: string | null;
  ipAddress?: string | null;
  browser?: string | null;
  operatingSystem?: string | null;
  device?: string | null;
}

export interface WeeklyAnalytics {
  weekStart: string;
  days: DayAnalytics[];
}

export interface DayAnalytics {
  date: string;
  dayName: string;
  workedMinutes: number;
  targetMinutes: number;
  productivityPercent: number;
}

export interface MonthlyAnalytics {
  year: number;
  month: number;
  weeks: WeeklyBreakdown[];
  mostProductiveDays: string[];
  avgHoursWorked?: number;
}

export interface UserCreate {
  fullName: string;
  email: string;
  password: string;
  targetHoursPerDay: number;
  workingDays: number[];
  isAdmin: boolean;
}

export interface UserUpdate {
  fullName?: string;
  email?: string;
  targetHoursPerDay?: number;
  workingDays?: number[];
  isActive?: boolean;
  isAdmin?: boolean;
}

export interface ProfileUpdate {
  fullName?: string;
  email?: string;
  targetHoursPerDay?: number;
  workingDays?: number[];
  currentPassword?: string;
  newPassword?: string;
}
