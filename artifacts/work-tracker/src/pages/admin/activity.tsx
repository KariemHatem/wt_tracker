import { useState } from "react";
import Layout from "@/components/Layout";
import { useListLoginActivity } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Monitor, Smartphone, Clock } from "lucide-react";

export default function AdminActivityPage() {
  const [limit, setLimit] = useState(50);

  const { data: activity, isLoading } = useListLoginActivity({ limit });

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Login Activity</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Recent authentication events across your team</p>
        </div>

        {/* Controls */}
        <div className="bg-card border border-card-border rounded-xl p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Show last</span>
              <select
                value={limit}
                onChange={e => setLimit(Number(e.target.value))}
                className="px-2.5 py-1.5 bg-background border border-input rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                data-testid="select-limit"
              >
                {[25, 50, 100, 200].map(n => (
                  <option key={n} value={n}>{n} records</option>
                ))}
              </select>
            </div>
            {activity && (
              <div className="ml-auto text-sm text-muted-foreground">
                {activity.length} records
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-card border border-card-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border bg-muted/30">
                {["User", "Login Time", "Logout Time", "IP Address", "Device"].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-5 py-3.5"><div className="h-4 bg-muted/50 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : activity?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">No activity found.</td>
                </tr>
              ) : activity?.map((a, i) => (
                <tr key={i} className="hover:bg-muted/20 transition-colors" data-testid={`row-activity-${i}`}>
                  <td className="px-5 py-3.5">
                    <div className="font-medium text-foreground">{a.userFullName ?? `User ${a.userId}`}</div>
                    <div className="text-xs text-muted-foreground">{a.userEmail ?? ""}</div>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground font-mono text-xs">
                    {format(new Date(a.loginTime), "MMM d, HH:mm:ss")}
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground font-mono text-xs">
                    {a.logoutTime ? format(new Date(a.logoutTime), "MMM d, HH:mm:ss") : (
                      <span className="text-green-500 font-sans font-medium">Active</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">{a.ipAddress ?? "—"}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      {a.device?.toLowerCase().includes("mobile") ? (
                        <Smartphone className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                      ) : (
                        <Monitor className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                      )}
                      <span className="text-xs text-muted-foreground">
                        {[a.browser, a.operatingSystem].filter(Boolean).join(" / ") || "—"}
                      </span>
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
