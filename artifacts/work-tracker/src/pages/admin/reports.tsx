import { useState } from "react";
import Layout from "@/components/Layout";
import { useGetDailyReport } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Download } from "lucide-react";

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

export default function AdminReportsPage() {
  const today = format(new Date(), "yyyy-MM-dd");
  const [date, setDate] = useState(today);

  const { data: report, isLoading } = useGetDailyReport({ date });

  const totalWorked = report?.reduce((s, r) => s + r.workedMinutes, 0) ?? 0;
  const avgCompletion = report?.length
    ? Math.round(report.reduce((s, r) => s + (r.completionPercent ?? 0), 0) / report.length)
    : 0;

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Reports</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Daily team work summary</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="px-3 py-2 bg-card border border-input rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            data-testid="input-report-date"
          />
          <button
            onClick={() => report && exportCsv(report.map(r => ({
              Name: r.userFullName, Date: r.date,
              Start: r.startTime ? format(new Date(r.startTime), "HH:mm") : "",
              End: r.endTime ? format(new Date(r.endTime), "HH:mm") : "",
              "Worked (min)": r.workedMinutes, "Target (min)": r.targetMinutes,
              "Completion %": Math.round(r.completionPercent ?? 0),
            })), `admin-report-${date}.csv`)}
            className="flex items-center gap-2 px-3 py-2 bg-card border border-input rounded-md text-sm text-muted-foreground hover:text-foreground transition-colors"
            data-testid="button-export-report"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>

          {report && (
            <div className="ml-auto flex gap-4 text-sm">
              <span className="text-muted-foreground">Total worked: <span className="font-semibold text-foreground">{formatMins(totalWorked)}</span></span>
              <span className="text-muted-foreground">Avg completion: <span className="font-semibold text-foreground">{avgCompletion}%</span></span>
            </div>
          )}
        </div>

        <div className="bg-card border border-card-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border bg-muted/30">
                {["Employee", "Start", "End", "Worked", "Target", "Completion"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3.5"><div className="h-4 bg-muted/50 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : report?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No data for this date.</td>
                </tr>
              ) : report?.map((r, i) => (
                <tr key={i} className="hover:bg-muted/20 transition-colors" data-testid={`row-report-${i}`}>
                  <td className="px-4 py-3.5">
                    <div className="font-medium text-foreground">{r.userFullName}</div>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-sm">{r.startTime ? format(new Date(r.startTime), "HH:mm") : "—"}</td>
                  <td className="px-4 py-3.5 font-mono text-sm">{r.endTime ? format(new Date(r.endTime), "HH:mm") : "—"}</td>
                  <td className="px-4 py-3.5 font-semibold text-foreground">{formatMins(r.workedMinutes)}</td>
                  <td className="px-4 py-3.5 text-muted-foreground">{formatMins(r.targetMinutes)}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-muted rounded-full">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, r.completionPercent ?? 0)}%` }} />
                      </div>
                      <span className="text-xs font-semibold">{Math.round(r.completionPercent ?? 0)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
