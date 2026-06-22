import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { PasswordModule } from 'primeng/password';
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ApiService } from '../../../services/api.service';
import { User } from '../../../models/api.models';

const DAYS = [
  { label: 'Sun', v: 0 }, { label: 'Mon', v: 1 }, { label: 'Tue', v: 2 },
  { label: 'Wed', v: 3 }, { label: 'Thu', v: 4 }, { label: 'Fri', v: 5 },
  { label: 'Sat', v: 6 },
];

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TableModule, DialogModule, ButtonModule,
            InputTextModule, InputNumberModule, PasswordModule, CheckboxModule, ConfirmDialogModule],
  template: `
    <div class="page-header d-flex align-items-start justify-content-between">
      <div>
        <h1 class="wt-section-title">Users</h1>
        <p class="wt-section-sub">Manage your team members</p>
      </div>
      <p-button label="Add User" icon="pi pi-plus" (click)="openCreate()" />
    </div>

    <div class="page-body">
      <div class="wt-card">
        <p-table [value]="users" [loading]="loading" responsiveLayout="scroll">
          <ng-template pTemplate="header">
            <tr><th>User</th><th>Role</th><th>Target</th><th>Working Days</th><th>Actions</th></tr>
          </ng-template>
          <ng-template pTemplate="body" let-u>
            <tr>
              <td>
                <div style="font-weight:500">{{ u.fullName }}</div>
                <div style="font-size:12px;color:var(--text-color-secondary)">{{ u.email }}</div>
              </td>
              <td>
                <span style="padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600"
                      [style.background]="u.isAdmin ? 'rgba(59,130,246,.15)' : 'rgba(148,163,184,.1)'"
                      [style.color]="u.isAdmin ? '#60a5fa' : '#94a3b8'">
                  {{ u.isAdmin ? 'Admin' : 'Employee' }}
                </span>
              </td>
              <td>{{ u.targetHoursPerDay }}h/day</td>
              <td style="font-size:12px;color:var(--text-color-secondary)">{{ dayLabels(u.workingDays) }}</td>
              <td>
                <p-button icon="pi pi-pencil" severity="secondary" [text]="true" size="small" (click)="openEdit(u)" />
                <p-button icon="pi pi-trash"  severity="danger"    [text]="true" size="small" (click)="confirmDelete(u)" />
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr><td colspan="5" style="text-align:center;padding:40px;color:var(--text-color-secondary)">No users found.</td></tr>
          </ng-template>
        </p-table>
      </div>
    </div>

    <!-- User dialog -->
    <p-dialog [(visible)]="showDialog" [modal]="true"
              [header]="editId ? 'Edit User' : 'Add User'"
              [style]="{width:'460px'}" [draggable]="false">
      <form [formGroup]="form" (ngSubmit)="save()">
        <div class="field mb-3">
          <label class="text-muted d-block mb-1" style="font-size:12px">Full Name</label>
          <input pInputText formControlName="fullName" class="w-100" />
        </div>
        <div class="field mb-3">
          <label class="text-muted d-block mb-1" style="font-size:12px">Email</label>
          <input pInputText type="email" formControlName="email" class="w-100" />
        </div>
        <div *ngIf="!editId" class="field mb-3">
          <label class="text-muted d-block mb-1" style="font-size:12px">Password</label>
          <p-password formControlName="password" [feedback]="false" [toggleMask]="true"
                      styleClass="w-100" inputStyleClass="w-100" />
        </div>
        <div class="row g-3 mb-3">
          <div class="col">
            <label class="text-muted d-block mb-1" style="font-size:12px">Daily Target (h)</label>
            <p-inputNumber formControlName="targetHoursPerDay" [min]="1" [max]="12" [step]="0.5" inputStyleClass="w-100" />
          </div>
          <div class="col d-flex align-items-end">
            <label class="d-flex align-items-center gap-2" style="cursor:pointer;font-size:13px">
              <p-checkbox formControlName="isAdmin" [binary]="true" />
              Admin access
            </label>
          </div>
        </div>
        <div class="field mb-3">
          <label class="text-muted d-block mb-2" style="font-size:12px">Working Days</label>
          <div class="d-flex gap-2 flex-wrap">
            <button *ngFor="let d of days" type="button"
                    [class]="'btn btn-sm ' + (isWD(d.v) ? 'btn-primary' : 'btn-outline-secondary')"
                    style="font-size:12px;padding:4px 10px;border-radius:6px"
                    (click)="toggleWD(d.v)">
              {{ d.label }}
            </button>
          </div>
        </div>
      </form>
      <ng-template pTemplate="footer">
        <p-button label="Cancel" severity="secondary" [text]="true" (click)="closeDialog()" />
        <p-button [label]="editId ? 'Save Changes' : 'Create User'" (click)="save()" [loading]="saving" />
      </ng-template>
    </p-dialog>
  `,
})
export class AdminUsersComponent implements OnInit, OnDestroy {
  users: User[] = [];
  loading = true;
  showDialog = false;
  editId: number | null = null;
  form!: FormGroup;
  saving = false;
  workingDays: number[] = [1, 2, 3, 4, 5];
  days = DAYS;
  private subs = new Subscription();

  constructor(private api: ApiService, private fb: FormBuilder,
              private msg: MessageService, private confirm: ConfirmationService) {}

  ngOnInit(): void { this.load(); }
  ngOnDestroy(): void { this.subs.unsubscribe(); }

  load(): void {
    this.loading = true;
    this.subs.add(this.api.listUsers().subscribe({ next: u => { this.users = u; this.loading = false; }, error: () => this.loading = false }));
  }

  buildForm(u?: User): void {
    this.form = this.fb.group({
      fullName: [u?.fullName ?? '', Validators.required],
      email: [u?.email ?? '', [Validators.required, Validators.email]],
      password: [this.editId ? '' : '', this.editId ? [] : [Validators.required, Validators.minLength(6)]],
      targetHoursPerDay: [u?.targetHoursPerDay ?? 8, Validators.required],
      isAdmin: [u?.isAdmin ?? false],
    });
    this.workingDays = u ? [...u.workingDays] : [1, 2, 3, 4, 5];
  }

  openCreate(): void { this.editId = null; this.buildForm(); this.showDialog = true; }
  openEdit(u: User): void { this.editId = u.id; this.buildForm(u); this.showDialog = true; }
  closeDialog(): void { this.showDialog = false; }

  isWD(d: number): boolean { return this.workingDays.includes(d); }
  toggleWD(d: number): void {
    this.workingDays = this.isWD(d) ? this.workingDays.filter(x => x !== d) : [...this.workingDays, d].sort();
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    const v = this.form.value;
    const obs = this.editId
      ? this.api.updateUser(this.editId, { fullName: v.fullName, email: v.email, targetHoursPerDay: v.targetHoursPerDay, workingDays: this.workingDays, isAdmin: v.isAdmin })
      : this.api.createUser({ ...v, workingDays: this.workingDays });

    obs.subscribe({
      next: () => { this.saving = false; this.showDialog = false; this.load(); this.msg.add({ severity: 'success', summary: 'Saved', detail: 'User saved.' }); },
      error: (e) => { this.saving = false; this.msg.add({ severity: 'error', summary: 'Error', detail: e?.error?.message || 'Failed to save.' }); },
    });
  }

  confirmDelete(u: User): void {
    this.confirm.confirm({
      message: `Delete ${u.fullName}? This cannot be undone.`,
      header: 'Delete User',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.api.deleteUser(u.id).subscribe({ next: () => { this.load(); this.msg.add({ severity: 'success', summary: 'Deleted', detail: 'User deleted.' }); }, error: () => {} }),
    });
  }

  dayLabels(days: number[]): string { return days.map(d => DAYS.find(x => x.v === d)?.label ?? '').join(', '); }
}
