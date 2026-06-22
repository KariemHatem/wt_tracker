import { useState } from "react";
import Layout from "@/components/Layout";
import { useGetDailyReport, useGetWeeklyReport, useGetMonthlyReport } from "@workspace/api-client-react";
import { format, startOfWeek } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Download } from "lucide-react";

type Tab = "daily" | "weekly" | "monthly";

function formatMins(m: number | undefined | null) {
  const n = m ?? 0;
  const h = Math.floor(n / 60), min = n % 60;
  return h === 0 ? `${min}m` : min === 0 ? `${h}h` : `${h}h ${min}m`;
}

function exportCsv(rows: Record<string, string | number>[], filename: string) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const csv = [keys.join(","), ...rows.map(r => keys.map(k => `"${r[k]}"`).join(","))].join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = filename;
  a.click();
}

export default function ReportsPage() {
  const [tab, setTab] = useState<Tab>("daily");
  const today = format(new Date(), "yyyy-MM-dd");
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedWeek, setSelectedWeek] = useState(format(startOfWeek(new Date(), { weekStartsOn: 0 }), "yyyy-MM-dd"));
  const now = new Date();

  const { data: dailyReport } = useGetDailyReport({ date: selectedDate });
  const { data: weeklyReport } = useGetWeeklyReport({ week: selectedWeek });
  const { data: monthlyReport } = useGetMonthlyReport({ year: now.getFullYear(), month: now.getMonth() + 1 });

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Reports</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Track your productivity over time</p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 bg-muted/50 p-1 rounded-lg w-fit">
          {(["daily", "weekly", "monthly"] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-all ${
                tab === t ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid={`tab-${t}`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* DAILY */}
        {tab === "daily" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="px-3 py-2 bg-card border border-input rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                data-testid="input-daily-date"
              />
              <button
                onClick={() => dailyReport && exportCsv(dailyReport.map(r => ({
                  Name: r.userFullName, Date: r.date, Start: r.startTime ?? "", End: r.endTime ?? "",
                  "Worked (min)": r.workedMinutes, "Target (min)": r.targetMinutes,
                  "Completion %": Math.round(r.completionPercent ?? 0)
                })), `daily-report-${selectedDate}.csv`)}
                className="flex items-center gap-2 px-3 py-2 bg-card border border-input rounded-md text-sm text-muted-foreground hover:text-foreground transition-colors"
                data-testid="button-export-daily"
              >
                <Download className="w-4 h-4" /> Export CSV
              </button>
            </div>
            <div className="bg-card border border-card-border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-card-border bg-muted/30">
                    {["User", "Start", "End", "Worked", "Target", "Completion"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-card-border">
                  {dailyReport?.map((r, i) => (
                    <tr key={i} className="hover:bg-muted/20 transition-colors" data-testid={`row-daily-${i}`}>
                      <td className="px-4 py-3 font-medium text-foreground">{r.userFullName}</td>
                      <td className="px-4 py-3 font-mono text-sm">{r.startTime ? format(new Date(r.startTime), "HH:mm") : "—"}</td>
                      <td className="px-4 py-3 font-mono text-sm">{r.endTime ? format(new Date(r.endTime), "HH:mm") : "—"}</td>
                      <td className="px-4 py-3 font-semibold text-foreground">{formatMins(r.workedMinutes)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatMins(r.targetMinutes)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-muted rounded-full max-w-[80px]">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, r.completionPercent ?? 0)}%` }} />
                          </div>
                          <span className="text-xs font-semibold text-foreground">{Math.round(r.completionPercent ?? 0)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* WEEKLY */}
        {tab === "weekly" && weeklyReport && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="date"
                value={selectedWeek}
                onChange={e => setSelectedWeek(e.target.value)}
                className="px-3 py-2 bg-card border border-input rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                data-testid="input-week"
              />
              <span className="text-sm text-muted-foreground">
                {format(new Date(weeklyReport.weekStart), "MMM d")} – {format(new Date(weeklyReport.weekEnd), "MMM d, yyyy")}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Worked", val: formatMins(weeklyReport.totalWorkedMinutes), color: "text-primary" },
                { label: "Target", val: formatMins(weeklyReport.totalTargetMinutes), color: "text-foreground" },
                { label: "Missing", val: formatMins(weeklyReport.missingMinutes ?? 0), color: "text-amber-500" },
                { label: "Overtime", val: formatMins(weeklyReport.overtimeMinutes ?? 0), color: "text-green-500" },
              ].map(s => (
                <div key={s.label} className="bg-card border border-card-border rounded-xl p-4">
                  <div className="text-xs text-muted-foreground mb-1">{s.label}</div>
                  <div className={`text-xl font-bold ${s.color}`}>{s.val}</div>
                </div>
              ))}
            </div>
            <div className="bg-card border border-card-border rounded-xl p-5">
              <div className="text-sm font-semibold text-foreground mb-4">Hours per Day</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={weeklyReport.dailyBreakdown.map(d => ({ day: d.dayName.slice(0, 3), worked: +(d.workedMinutes / 60).toFixed(1), target: +(d.targetMinutes / 60).toFixed(1) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--card-border))", borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Bar dataKey="target" fill="hsl(var(--muted))" radius={[3, 3, 0, 0]} name="Target" />
                  <Bar dataKey="worked" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} name="Worked" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* MONTHLY */}
        {tab === "monthly" && monthlyReport && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Total Worked", val: formatMins(monthlyReport.totalWorkedMinutes), color: "text-primary" },
                { label: "Target", val: formatMins(monthlyReport.totalTargetMinutes), color: "text-foreground" },
                { label: "Overtime", val: formatMins(monthlyReport.overtimeMinutes ?? 0), color: "text-green-500" },
                { label: "Productivity", val: `${Math.round(monthlyReport.productivityPercent ?? 0)}%`, color: "text-chart-2" },
              ].map(s => (
                <div key={s.label} className="bg-card border border-card-border rounded-xl p-4">
                  <div className="text-xs text-muted-foreground mb-1">{s.label}</div>
                  <div className={`text-xl font-bold ${s.color}`}>{s.val}</div>
                </div>
              ))}
            </div>
            <div className="bg-card border border-card-border rounded-xl p-5">
              <div className="text-sm font-semibold text-foreground mb-4">Hours by Week</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyReport.weeklyBreakdown.map(w => ({ week: `W${w.weekNumber}`, worked: +(w.workedMinutes / 60).toFixed(1), target: +(w.targetMinutes / 60).toFixed(1) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--card-border))", borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Bar dataKey="target" fill="hsl(var(--muted))" radius={[3, 3, 0, 0]} name="Target" />
                  <Bar dataKey="worked" fill="hsl(var(--chart-2))" radius={[3, 3, 0, 0]} name="Worked" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
