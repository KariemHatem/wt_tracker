import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useUpdateMyProfile, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Save, Loader2, CheckCircle2 } from "lucide-react";

const DAYS = [
  { label: "Sun", value: 0 },
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const updateProfile = useUpdateMyProfile();

  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [targetHours, setTargetHours] = useState(user?.targetHoursPerDay ?? 8);
  const [workingDays, setWorkingDays] = useState<number[]>(user?.workingDays ?? [0, 1, 2, 3, 4]);
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      setTargetHours(user.targetHoursPerDay);
      setWorkingDays(user.workingDays);
    }
  }, [user]);

  const toggleDay = (day: number) => {
    setWorkingDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password && password !== confirmPw) {
      setError("Passwords do not match.");
      return;
    }
    const data: { fullName: string; targetHoursPerDay: number; workingDays: number[]; password?: string } = {
      fullName,
      targetHoursPerDay: targetHours,
      workingDays,
    };
    if (password) data.password = password;

    updateProfile.mutate({ data }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetMeQueryKey() });
        setSaved(true);
        setPassword("");
        setConfirmPw("");
        setTimeout(() => setSaved(false), 3000);
      },
      onError: () => setError("Failed to save settings."),
    });
  };

  return (
    <Layout>
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your account and preferences</p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Profile */}
          <div className="bg-card border border-card-border rounded-xl p-5 space-y-4">
            <div className="text-sm font-semibold text-foreground mb-2">Profile</div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                data-testid="input-full-name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
              <input
                type="text"
                value={user?.email ?? ""}
                disabled
                className="w-full px-3 py-2.5 bg-muted/30 border border-input rounded-md text-sm text-muted-foreground cursor-not-allowed"
              />
            </div>
          </div>

          {/* Work schedule */}
          <div className="bg-card border border-card-border rounded-xl p-5 space-y-4">
            <div className="text-sm font-semibold text-foreground">Work Schedule</div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">Working Days</label>
              <div className="flex gap-2 flex-wrap">
                {DAYS.map(d => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => toggleDay(d.value)}
                    className={`px-3.5 py-2 rounded-md text-sm font-medium transition-all ${
                      workingDays.includes(d.value)
                        ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                    data-testid={`button-day-${d.label.toLowerCase()}`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Daily Target: <span className="text-primary font-bold">{targetHours}h</span>
              </label>
              <input
                type="range"
                min={1}
                max={12}
                step={0.5}
                value={targetHours}
                onChange={e => setTargetHours(Number(e.target.value))}
                className="w-full accent-primary"
                data-testid="input-target-hours"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>1h</span><span>6h</span><span>12h</span>
              </div>
            </div>
          </div>

          {/* Password */}
          <div className="bg-card border border-card-border rounded-xl p-5 space-y-4">
            <div className="text-sm font-semibold text-foreground">Change Password</div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">New Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Leave blank to keep current"
                className="w-full px-3 py-2.5 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                data-testid="input-new-password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Confirm Password</label>
              <input
                type="password"
                value={confirmPw}
                onChange={e => setConfirmPw(e.target.value)}
                placeholder="Confirm new password"
                className="w-full px-3 py-2.5 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                data-testid="input-confirm-password"
              />
            </div>
          </div>

          {error && (
            <div className="px-4 py-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={updateProfile.isPending}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors"
              data-testid="button-save-settings"
            >
              {updateProfile.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save changes
            </button>
            {saved && (
              <div className="flex items-center gap-1.5 text-sm text-green-500" data-testid="status-saved">
                <CheckCircle2 className="w-4 h-4" /> Saved!
              </div>
            )}
          </div>
        </form>
      </div>
    </Layout>
  );
}
