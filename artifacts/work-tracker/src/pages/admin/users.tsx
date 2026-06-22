import { useState } from "react";
import Layout from "@/components/Layout";
import { useListUsers, useCreateUser, useUpdateUser, useDeleteUser, getListUsersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, X, Loader2, ShieldCheck, User } from "lucide-react";

type UserFormState = {
  fullName: string;
  email: string;
  password: string;
  targetHoursPerDay: number;
  workingDays: number[];
  isAdmin: boolean;
};

const DEFAULT_FORM: UserFormState = {
  fullName: "",
  email: "",
  password: "",
  targetHoursPerDay: 8,
  workingDays: [0, 1, 2, 3, 4],
  isAdmin: false,
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const { data: users, isLoading } = useListUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<UserFormState>(DEFAULT_FORM);
  const [error, setError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const openCreate = () => { setEditId(null); setForm(DEFAULT_FORM); setError(""); setShowModal(true); };
  const openEdit = (u: NonNullable<typeof users>[0]) => {
    setEditId(u.id);
    setForm({ fullName: u.fullName, email: u.email, password: "", targetHoursPerDay: u.targetHoursPerDay, workingDays: u.workingDays, isAdmin: u.isAdmin });
    setError("");
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const invalidate = () => qc.invalidateQueries({ queryKey: getListUsersQueryKey() });

    if (editId !== null) {
      updateUser.mutate({ id: editId, data: { fullName: form.fullName, email: form.email, targetHoursPerDay: form.targetHoursPerDay, workingDays: form.workingDays, isAdmin: form.isAdmin } }, {
        onSuccess: () => { invalidate(); setShowModal(false); },
        onError: () => setError("Failed to update user."),
      });
    } else {
      if (!form.password) { setError("Password is required."); return; }
      createUser.mutate({ data: { fullName: form.fullName, email: form.email, password: form.password, targetHoursPerDay: form.targetHoursPerDay, workingDays: form.workingDays, isAdmin: form.isAdmin } }, {
        onSuccess: () => { invalidate(); setShowModal(false); },
        onError: () => setError("Failed to create user."),
      });
    }
  };

  const handleDelete = (id: number) => {
    deleteUser.mutate({ id }, {
      onSuccess: () => qc.invalidateQueries({ queryKey: getListUsersQueryKey() }),
      onError: () => {},
    });
    setDeleteConfirm(null);
  };

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Users</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage your team members</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
            data-testid="button-add-user"
          >
            <Plus className="w-4 h-4" /> Add User
          </button>
        </div>

        <div className="bg-card border border-card-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border bg-muted/30">
                {["User", "Role", "Target", "Working Days", "Actions"].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-5 py-3.5"><div className="h-4 bg-muted/50 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : users?.map(u => (
                <tr key={u.id} className="hover:bg-muted/20 transition-colors" data-testid={`row-user-${u.id}`}>
                  <td className="px-5 py-3.5">
                    <div className="font-medium text-foreground">{u.fullName}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      u.isAdmin ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                    }`}>
                      {u.isAdmin ? <><ShieldCheck className="w-3 h-3" />Admin</> : <><User className="w-3 h-3" />Employee</>}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-foreground">{u.targetHoursPerDay}h/day</td>
                  <td className="px-5 py-3.5 text-muted-foreground text-xs">
                    {u.workingDays.map(d => DAYS[d]).join(", ")}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(u)}
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                        data-testid={`button-edit-${u.id}`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(u.id)}
                        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                        data-testid={`button-delete-${u.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* User form modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
            <div className="relative w-full max-w-md bg-card border border-card-border rounded-xl shadow-2xl">
              <div className="flex items-center justify-between px-5 py-4 border-b border-card-border">
                <div className="text-sm font-semibold text-foreground">{editId ? "Edit User" : "Add User"}</div>
                <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Full Name</label>
                    <input type="text" value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} required
                      className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      data-testid="input-user-full-name" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Email</label>
                    <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required
                      className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      data-testid="input-user-email" />
                  </div>
                  {!editId && (
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">Password</label>
                      <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                        className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        data-testid="input-user-password" />
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Daily Target (hours)</label>
                    <input type="number" min={1} max={12} step={0.5} value={form.targetHoursPerDay}
                      onChange={e => setForm(f => ({ ...f, targetHoursPerDay: Number(e.target.value) }))}
                      className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      data-testid="input-user-target-hours" />
                  </div>
                  <div className="flex items-end pb-0.5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.isAdmin} onChange={e => setForm(f => ({ ...f, isAdmin: e.target.checked }))}
                        className="w-4 h-4 rounded accent-primary"
                        data-testid="checkbox-user-admin" />
                      <span className="text-sm text-foreground">Admin access</span>
                    </label>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Working Days</label>
                    <div className="flex gap-1.5 flex-wrap">
                      {DAYS.map((d, i) => (
                        <button key={i} type="button"
                          onClick={() => setForm(f => ({ ...f, workingDays: f.workingDays.includes(i) ? f.workingDays.filter(x => x !== i) : [...f.workingDays, i].sort() }))}
                          className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                            form.workingDays.includes(i) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                          data-testid={`button-user-day-${d.toLowerCase()}`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                {error && <div className="px-3 py-2 bg-destructive/10 border border-destructive/20 rounded text-xs text-destructive">{error}</div>}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 bg-muted text-muted-foreground rounded-md text-sm font-medium hover:bg-muted/80 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={createUser.isPending || updateUser.isPending}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors"
                    data-testid="button-save-user">
                    {(createUser.isPending || updateUser.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {editId ? "Save changes" : "Create user"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete confirm */}
        {deleteConfirm !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
            <div className="relative w-full max-w-sm bg-card border border-card-border rounded-xl shadow-2xl p-5">
              <div className="text-sm font-semibold text-foreground mb-2">Delete User</div>
              <p className="text-sm text-muted-foreground mb-4">This will permanently delete the user and all their data.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 bg-muted text-muted-foreground rounded-md text-sm font-medium hover:bg-muted/80 transition-colors">
                  Cancel
                </button>
                <button onClick={() => handleDelete(deleteConfirm)} disabled={deleteUser.isPending}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-md text-sm font-medium hover:bg-destructive/90 disabled:opacity-60 transition-colors"
                  data-testid="button-confirm-delete">
                  {deleteUser.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
