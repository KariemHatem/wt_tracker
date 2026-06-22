import { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import {
  useGetTodayProgress, useGetActiveSession, useStartSession, useEndSession,
  useListSessions, useGetWeeklyReport, useGetMonthlyReport,
  getGetActiveSessionQueryKey, getGetTodayProgressQueryKey, getListSessionsQueryKey,
} from "@workspace/api-client-react";
import { Play, Square, Clock, TrendingUp, Calendar, CheckCircle2, AlertCircle } from "lucide-react";
import { format } from "date-fns";

function formatMinutes(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function formatElapsed(startIso: string): string {
  const diffMs = Date.now() - new Date(startIso).getTime();
  const totalSecs = Math.floor(diffMs / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tick, setTick] = useState(0);

  const { data: progress } = useGetTodayProgress();
  const { data: activeData } = useGetActiveSession();
  const { data: sessions } = useListSessions({ from: format(new Date(), "yyyy-MM-dd"), to: format(new Date(), "yyyy-MM-dd") });
  const { data: weeklyReport } = useGetWeeklyReport();
  const { data: monthlyReport } = useGetMonthlyReport();

  const startSession = useStartSession();
  const endSession = useEndSession();

  const activeSession = activeData?.session ?? null;

  // Tick every second when active session
  useEffect(() => {
    if (!activeSession) return;
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [activeSession]);

  const handleStart = useCallback(() => {
    startSession.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetActiveSessionQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetTodayProgressQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListSessionsQueryKey() });
      },
    });
  }, [startSession, queryClient]);

  const handleEnd = useCallback(() => {
    endSession.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetActiveSessionQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetTodayProgressQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListSessionsQueryKey() });
      },
    });
  }, [endSession, queryClient]);

  const worked = progress?.workedMinutes ?? 0;
  const target = progress?.targetMinutes ?? 480;
  const remaining = progress?.remainingMinutes ?? target;
  const percent = progress?.progressPercent ?? 0;
  const isComplete = progress?.isComplete ?? false;

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Welcome */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, {user?.fullName?.split(" ")[0]}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
          </div>
          {isComplete && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full text-sm text-green-500" data-testid="status-target-complete">
              <CheckCircle2 className="w-4 h-4" />
              Target reached
            </div>
          )}
        </div>

        {/* Timer card */}
        <div className="bg-card border border-card-border rounded-xl overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">Current Session</div>
                {activeSession ? (
                  <div className="text-4xl font-mono font-bold text-foreground tabular-nums" data-testid="text-timer">
                    {formatElapsed(activeSession.startTime)}
                  </div>
                ) : (
                  <div className="text-4xl font-bold text-muted-foreground/30" data-testid="text-timer">00:00:00</div>
                )}
                {activeSession && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Started at {format(new Date(activeSession.startTime), "HH:mm")}
                  </div>
                )}
              </div>
              <div>
                {!activeSession ? (
                  <button
                    onClick={handleStart}
                    disabled={startSession.isPending}
                    className="flex items-center gap-2.5 px-5 py-3 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-primary/90 disabled:opacity-60 transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98]"
                    data-testid="button-start-work"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    Start Work
                  </button>
                ) : (
                  <button
                    onClick={handleEnd}
                    disabled={endSession.isPending}
                    className="flex items-center gap-2.5 px-5 py-3 bg-destructive text-destructive-foreground rounded-xl font-medium text-sm hover:bg-destructive/90 disabled:opacity-60 transition-all shadow-lg shadow-destructive/25 hover:scale-[1.02] active:scale-[0.98]"
                    data-testid="button-end-work"
                  >
                    <Square className="w-4 h-4 fill-current" />
                    End Work
                  </button>
                )}
              </div>
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span>Daily progress</span>
                <span className="font-semibold text-foreground" data-testid="text-progress-percent">{Math.round(percent)}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${isComplete ? "bg-green-500" : "bg-primary"}`}
                  style={{ width: `${Math.min(100, percent)}%` }}
                  data-testid="progress-bar-daily"
                />
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="border-t border-card-border grid grid-cols-3 divide-x divide-card-border">
            {[
              { label: "Worked", value: formatMinutes(worked), icon: <Clock className="w-3.5 h-3.5" /> },
              { label: "Target", value: formatMinutes(target), icon: <TrendingUp className="w-3.5 h-3.5" /> },
              { label: "Remaining", value: remaining > 0 ? formatMinutes(remaining) : "Done!", icon: <AlertCircle className="w-3.5 h-3.5" /> },
            ].map(stat => (
              <div key={stat.label} className="px-6 py-4 text-center">
                <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mb-1">
                  {stat.icon}{stat.label}
                </div>
                <div className="text-lg font-semibold text-foreground" data-testid={`text-${stat.label.toLowerCase()}`}>{stat.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly / Monthly summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card border border-card-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-primary" />
              <div className="text-sm font-semibold text-foreground">This Week</div>
            </div>
            {weeklyReport ? (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Worked</span>
                  <span className="font-semibold text-foreground">{formatMinutes(weeklyReport.totalWorkedMinutes)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Target</span>
                  <span className="text-foreground">{formatMinutes(weeklyReport.totalTargetMinutes)}</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${Math.min(100, weeklyReport.totalTargetMinutes > 0 ? (weeklyReport.totalWorkedMinutes / weeklyReport.totalTargetMinutes) * 100 : 0)}%` }}
                  />
                </div>
                {(weeklyReport.overtimeMinutes ?? 0) > 0 && (
                  <div className="text-xs text-green-500">+{formatMinutes(weeklyReport.overtimeMinutes ?? 0)} overtime</div>
                )}
                {(weeklyReport.missingMinutes ?? 0) > 0 && (
                  <div className="text-xs text-amber-500">-{formatMinutes(weeklyReport.missingMinutes ?? 0)} missing</div>
                )}
              </div>
            ) : (
              <div className="h-20 bg-muted/30 rounded-lg animate-pulse" />
            )}
          </div>

          <div className="bg-card border border-card-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-primary" />
              <div className="text-sm font-semibold text-foreground">This Month</div>
            </div>
            {monthlyReport ? (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Worked</span>
                  <span className="font-semibold text-foreground">{formatMinutes(monthlyReport.totalWorkedMinutes)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Productivity</span>
                  <span className="text-foreground">{Math.round(monthlyReport.productivityPercent ?? 0)}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full">
                  <div
                    className="h-full bg-chart-2 rounded-full"
                    style={{ width: `${Math.min(100, monthlyReport.productivityPercent ?? 0)}%` }}
                  />
                </div>
                {(monthlyReport.overtimeMinutes ?? 0) > 0 && (
                  <div className="text-xs text-green-500">+{formatMinutes(monthlyReport.overtimeMinutes ?? 0)} overtime</div>
                )}
              </div>
            ) : (
              <div className="h-20 bg-muted/30 rounded-lg animate-pulse" />
            )}
          </div>
        </div>

        {/* Recent sessions */}
        <div className="bg-card border border-card-border rounded-xl">
          <div className="px-5 py-4 border-b border-card-border">
            <div className="text-sm font-semibold text-foreground">Today's Sessions</div>
          </div>
          {sessions && sessions.length > 0 ? (
            <div className="divide-y divide-card-border">
              {sessions.map(s => (
                <div key={s.id} className="px-5 py-3.5 flex items-center justify-between" data-testid={`row-session-${s.id}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${!s.endTime ? "bg-green-500 animate-pulse" : "bg-muted-foreground/30"}`} />
                    <div>
                      <div className="text-sm text-foreground">
                        {format(new Date(s.startTime), "HH:mm")}
                        {s.endTime ? ` — ${format(new Date(s.endTime), "HH:mm")}` : " — ongoing"}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-foreground">
                    {s.totalMinutes ? formatMinutes(s.totalMinutes) : "Active"}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">
              No sessions recorded today yet.
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
