import Layout from "@/components/Layout";
import { useGetAdminStats, useGetUsersMonitoring, UserMonitoringStatus } from "@workspace/api-client-react";
import { Users, Clock, TrendingUp, Activity } from "lucide-react";

export default function AdminDashboardPage() {
  const { data: stats } = useGetAdminStats();
  const { data: monitoring } = useGetUsersMonitoring();

  const statCards = [
    { label: "Total Users", value: stats?.totalUsers ?? "—", icon: <Users className="w-5 h-5" />, color: "text-primary" },
    { label: "Active Today", value: stats?.activeUsersToday ?? "—", icon: <Activity className="w-5 h-5" />, color: "text-green-500" },
    { label: "Total Logins", value: stats?.totalLogins ?? "—", icon: <Clock className="w-5 h-5" />, color: "text-chart-3" },
    { label: "Avg Productivity", value: stats ? `${Math.round(stats.avgDailyProductivity)}%` : "—", icon: <TrendingUp className="w-5 h-5" />, color: "text-chart-2" },
  ];

  return (
    <Layout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Overview</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Real-time workspace monitoring</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(s => (
            <div key={s.label} className="bg-card border border-card-border rounded-xl p-5">
              <div className={`${s.color} mb-3`}>{s.icon}</div>
              <div className="text-2xl font-bold text-foreground">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Live monitoring table */}
        <div className="bg-card border border-card-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-card-border flex items-center justify-between">
            <div className="text-sm font-semibold text-foreground">Live User Status</div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />
              Live
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border bg-muted/30">
                {["Employee", "Status", "Last Login", "Hours Today", "This Week"].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border">
              {monitoring?.map(u => {
                const isWorking = u.status === UserMonitoringStatus.working;
                return (
                  <tr key={u.userId} className="hover:bg-muted/20 transition-colors" data-testid={`row-user-${u.userId}`}>
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-foreground">{u.fullName}</div>
                      <div className="text-xs text-muted-foreground">{u.email}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                        isWorking
                          ? "bg-green-500/15 text-green-500"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isWorking ? "bg-green-500 animate-pulse" : "bg-muted-foreground/50"}`} />
                        {isWorking ? "Working" : u.status ?? "Idle"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground text-sm">
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-foreground">
                      {u.hoursToday?.toFixed(1) ?? "0"}h
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">
                      {u.hoursThisWeek?.toFixed(1) ?? "0"}h
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Summary stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card border border-card-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">This Week</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{stats.totalHoursThisWeek.toFixed(1)}h</div>
              <div className="text-xs text-muted-foreground mt-1">Total team hours</div>
            </div>
            <div className="bg-card border border-card-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-chart-2" />
                <span className="text-sm font-semibold text-foreground">This Month</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{stats.totalHoursThisMonth.toFixed(1)}h</div>
              <div className="text-xs text-muted-foreground mt-1">Total team hours</div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
