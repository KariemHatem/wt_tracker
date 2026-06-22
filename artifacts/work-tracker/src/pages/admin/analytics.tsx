import Layout from "@/components/Layout";
import { useGetWeeklyAnalytics, useGetMonthlyAnalytics } from "@workspace/api-client-react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from "recharts";
import { useState } from "react";
import { format } from "date-fns";

type View = "weekly" | "monthly";

const CHART_STYLE = {
  xAxis: { tick: { fontSize: 11, fill: "hsl(var(--muted-foreground))" }, axisLine: false as const, tickLine: false as const },
  yAxis: { tick: { fontSize: 11, fill: "hsl(var(--muted-foreground))" }, axisLine: false as const, tickLine: false as const },
  tooltip: { contentStyle: { background: "hsl(var(--card))", border: "1px solid hsl(var(--card-border))", borderRadius: 8, fontSize: 12 }, labelStyle: { color: "hsl(var(--foreground))" } },
};

export default function AdminAnalyticsPage() {
  const [view, setView] = useState<View>("weekly");
  const now = new Date();
  const weekStr = format(now, "yyyy-MM-dd");

  const { data: weekly } = useGetWeeklyAnalytics({ week: weekStr });
  const { data: monthly } = useGetMonthlyAnalytics({ year: now.getFullYear(), month: now.getMonth() + 1 });

  return (
    <Layout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Team productivity trends and insights</p>
          </div>
          <div className="flex gap-1 bg-muted/50 p-1 rounded-lg">
            {(["weekly", "monthly"] as View[]).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-all ${view === v ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                data-testid={`tab-${v}`}>
                {v}
              </button>
            ))}
          </div>
        </div>

        {view === "weekly" && weekly && (
          <div className="space-y-5">
            <div className="bg-card border border-card-border rounded-xl p-5">
              <div className="text-sm font-semibold text-foreground mb-1">Daily Hours — Week of {format(new Date(weekly.weekStart), "MMM d")}</div>
              <div className="text-xs text-muted-foreground mb-4">Worked vs. target per day</div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={weekly.days.map(d => ({ day: d.dayName.slice(0, 3), worked: +(d.workedMinutes / 60).toFixed(1), target: +(d.targetMinutes / 60).toFixed(1) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="day" {...CHART_STYLE.xAxis} />
                  <YAxis {...CHART_STYLE.yAxis} />
                  <Tooltip {...CHART_STYLE.tooltip} formatter={(v: number) => [`${v}h`]} />
                  <Legend wrapperStyle={{ fontSize: 12, color: "hsl(var(--muted-foreground))" }} />
                  <Bar dataKey="target" name="Target" fill="hsl(var(--muted))" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="worked" name="Worked" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-card border border-card-border rounded-xl p-5">
              <div className="text-sm font-semibold text-foreground mb-1">Daily Productivity %</div>
              <div className="text-xs text-muted-foreground mb-4">Completion rate per day</div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={weekly.days.map(d => ({ day: d.dayName.slice(0, 3), productivity: Math.round(d.productivityPercent) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="day" {...CHART_STYLE.xAxis} />
                  <YAxis {...CHART_STYLE.yAxis} domain={[0, 120]} tickFormatter={(v: number) => `${v}%`} />
                  <Tooltip {...CHART_STYLE.tooltip} formatter={(v: number) => [`${v}%`]} />
                  <Line type="monotone" dataKey="productivity" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ fill: "hsl(var(--chart-2))", r: 3 }} name="Productivity" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Day breakdown table */}
            <div className="bg-card border border-card-border rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-card-border">
                <div className="text-sm font-semibold text-foreground">Day-by-Day Breakdown</div>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-card-border bg-muted/30">
                    {["Day", "Date", "Worked", "Target", "Productivity"].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-card-border">
                  {weekly.days.map(d => (
                    <tr key={d.date} className="hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-3.5 font-semibold text-foreground">{d.dayName}</td>
                      <td className="px-5 py-3.5 text-muted-foreground">{format(new Date(d.date), "MMM d")}</td>
                      <td className="px-5 py-3.5 font-semibold text-foreground">{(d.workedMinutes / 60).toFixed(1)}h</td>
                      <td className="px-5 py-3.5 text-muted-foreground">{(d.targetMinutes / 60).toFixed(1)}h</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-muted rounded-full">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, d.productivityPercent)}%` }} />
                          </div>
                          <span className="text-xs font-semibold">{Math.round(d.productivityPercent)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {view === "monthly" && monthly && (
          <div className="space-y-5">
            <div className="bg-card border border-card-border rounded-xl p-5">
              <div className="text-sm font-semibold text-foreground mb-1">Hours by Week — {monthly.year}/{String(monthly.month).padStart(2, "0")}</div>
              <div className="text-xs text-muted-foreground mb-4">Worked vs. target per week</div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={monthly.weeks.map(w => ({ week: `W${w.weekNumber}`, worked: +(w.workedMinutes / 60).toFixed(1), target: +(w.targetMinutes / 60).toFixed(1) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="week" {...CHART_STYLE.xAxis} />
                  <YAxis {...CHART_STYLE.yAxis} />
                  <Tooltip {...CHART_STYLE.tooltip} formatter={(v: number) => [`${v}h`]} />
                  <Legend wrapperStyle={{ fontSize: 12, color: "hsl(var(--muted-foreground))" }} />
                  <Bar dataKey="target" name="Target" fill="hsl(var(--muted))" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="worked" name="Worked" fill="hsl(var(--chart-2))" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-card border border-card-border rounded-xl p-5">
                <div className="text-xs text-muted-foreground mb-2">Avg Hours Worked</div>
                <div className="text-2xl font-bold text-primary">{monthly.avgHoursWorked?.toFixed(1) ?? "—"}h</div>
                <div className="text-xs text-muted-foreground mt-1">Per working day</div>
              </div>
              <div className="col-span-2 bg-card border border-card-border rounded-xl p-5">
                <div className="text-xs text-muted-foreground mb-3">Most Productive Days</div>
                <div className="flex flex-wrap gap-2">
                  {monthly.mostProductiveDays.length > 0 ? monthly.mostProductiveDays.map(d => (
                    <span key={d} className="px-3 py-1 bg-primary/15 text-primary rounded-full text-sm font-medium">{d}</span>
                  )) : (
                    <span className="text-sm text-muted-foreground">No data available yet</span>
                  )}
                </div>
              </div>
            </div>

            {/* Weekly table */}
            <div className="bg-card border border-card-border rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-card-border">
                <div className="text-sm font-semibold text-foreground">Weekly Breakdown</div>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-card-border bg-muted/30">
                    {["Week", "Worked", "Target", "Difference"].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-card-border">
                  {monthly.weeks.map(w => {
                    const diff = w.workedMinutes - w.targetMinutes;
                    return (
                      <tr key={w.weekNumber} className="hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-3.5 font-semibold text-foreground">Week {w.weekNumber}</td>
                        <td className="px-5 py-3.5 font-semibold text-foreground">{(w.workedMinutes / 60).toFixed(1)}h</td>
                        <td className="px-5 py-3.5 text-muted-foreground">{(w.targetMinutes / 60).toFixed(1)}h</td>
                        <td className="px-5 py-3.5">
                          <span className={diff >= 0 ? "text-green-500" : "text-amber-500"}>
                            {diff >= 0 ? "+" : ""}{(diff / 60).toFixed(1)}h
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
