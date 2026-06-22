import { useState } from "react";
import Layout from "@/components/Layout";
import { useListSessions } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Calendar, Clock } from "lucide-react";

function formatMinutes(mins: number | null | undefined): string {
  if (!mins) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export default function SessionsPage() {
  const today = format(new Date(), "yyyy-MM-dd");
  const thirtyDaysAgo = format(new Date(Date.now() - 30 * 86400_000), "yyyy-MM-dd");
  const [from, setFrom] = useState(thirtyDaysAgo);
  const [to, setTo] = useState(today);

  const { data: sessions, isLoading } = useListSessions({ from, to });

  const totalMinutes = sessions?.reduce((sum, s) => sum + (s.totalMinutes ?? 0), 0) ?? 0;

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sessions</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Your work session history</p>
        </div>

        {/* Filters */}
        <div className="bg-card border border-card-border rounded-xl p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">From</span>
              <input
                type="date"
                value={from}
                onChange={e => setFrom(e.target.value)}
                className="px-2.5 py-1.5 bg-background border border-input rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                data-testid="input-date-from"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">To</span>
              <input
                type="date"
                value={to}
                onChange={e => setTo(e.target.value)}
                className="px-2.5 py-1.5 bg-background border border-input rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                data-testid="input-date-to"
              />
            </div>
            {sessions && (
              <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{sessions.length} sessions — </span>
                <span className="font-semibold text-foreground">{formatMinutes(totalMinutes)} total</span>
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-card border border-card-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border bg-muted/30">
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Start</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">End</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Duration</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-5 py-3.5">
                        <div className="h-4 bg-muted/50 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : sessions?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">
                    No sessions found in this date range.
                  </td>
                </tr>
              ) : (
                sessions?.map(s => (
                  <tr key={s.id} className="hover:bg-muted/20 transition-colors" data-testid={`row-session-${s.id}`}>
                    <td className="px-5 py-3.5 text-foreground font-medium">{format(new Date(s.date), "MMM d, yyyy")}</td>
                    <td className="px-5 py-3.5 text-foreground font-mono">{format(new Date(s.startTime), "HH:mm:ss")}</td>
                    <td className="px-5 py-3.5 text-foreground font-mono">
                      {s.endTime ? format(new Date(s.endTime), "HH:mm:ss") : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-foreground">{formatMinutes(s.totalMinutes)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        !s.endTime
                          ? "bg-green-500/15 text-green-500"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {!s.endTime ? "Active" : "Completed"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
