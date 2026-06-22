import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { PasswordModule } from 'primeng/password';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../services/auth.service';

const DAYS = [
  { label: 'Sun', value: 0 }, { label: 'Mon', value: 1 }, { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 }, { label: 'Thu', value: 4 }, { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
];

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonModule, InputTextModule, InputNumberModule, PasswordModule, CheckboxModule, ToastModule],
  providers: [MessageService],
  template: `
    <div class="page-header">
      <h1 class="wt-section-title">Settings</h1>
      <p class="wt-section-sub">Manage your profile and preferences</p>
    </div>
    <div class="page-body">
      <div class="row g-4">
        <!-- Profile -->
        <div class="col-12 col-lg-6">
          <div class="wt-card">
            <h6 style="font-size:14px;font-weight:600;margin-bottom:20px">Profile</h6>
            <form [formGroup]="profileForm" (ngSubmit)="saveProfile()">
              <div class="field mb-3">
                <label class="text-muted mb-1 d-block" style="font-size:12px">Full Name</label>
                <input pInputText formControlName="fullName" class="w-100" />
              </div>
              <div class="field mb-3">
                <label class="text-muted mb-1 d-block" style="font-size:12px">Email</label>
                <input pInputText type="email" formControlName="email" class="w-100" />
              </div>
              <div class="field mb-3">
                <label class="text-muted mb-1 d-block" style="font-size:12px">Daily Target (hours)</label>
                <p-inputNumber formControlName="targetHoursPerDay" [min]="1" [max]="12" [step]="0.5"
                               inputStyleClass="w-100" mode="decimal" />
              </div>
              <div class="field mb-4">
                <label class="text-muted mb-2 d-block" style="font-size:12px">Working Days</label>
                <div class="d-flex gap-2 flex-wrap">
                  <button *ngFor="let d of days" type="button"
                          [class]="'btn btn-sm ' + (isWorkingDay(d.value) ? 'btn-primary' : 'btn-outline-secondary')"
                          style="font-size:12px;padding:4px 10px;border-radius:6px"
                          (click)="toggleDay(d.value)">
                    {{ d.label }}
                  </button>
                </div>
              </div>
              <p-button type="submit" label="Save Profile" [loading]="savingProfile" />
            </form>
          </div>
        </div>

        <!-- Password -->
        <div class="col-12 col-lg-6">
          <div class="wt-card">
            <h6 style="font-size:14px;font-weight:600;margin-bottom:20px">Change Password</h6>
            <form [formGroup]="passwordForm" (ngSubmit)="savePassword()">
              <div class="field mb-3">
                <label class="text-muted mb-1 d-block" style="font-size:12px">Current Password</label>
                <p-password formControlName="currentPassword" [feedback]="false" [toggleMask]="true"
                            styleClass="w-100" inputStyleClass="w-100" />
              </div>
              <div class="field mb-3">
                <label class="text-muted mb-1 d-block" style="font-size:12px">New Password</label>
                <p-password formControlName="newPassword" [toggleMask]="true"
                            styleClass="w-100" inputStyleClass="w-100" />
              </div>
              <div class="field mb-4">
                <label class="text-muted mb-1 d-block" style="font-size:12px">Confirm New Password</label>
                <p-password formControlName="confirmPassword" [feedback]="false" [toggleMask]="true"
                            styleClass="w-100" inputStyleClass="w-100" />
              </div>
              <div *ngIf="passwordError" style="color:#ef4444;font-size:13px;margin-bottom:12px">{{ passwordError }}</div>
              <p-button type="submit" label="Update Password" severity="secondary" [loading]="savingPassword" />
            </form>
          </div>

          <!-- Info card -->
          <div class="wt-card mt-4">
            <h6 style="font-size:14px;font-weight:600;margin-bottom:12px">Account Info</h6>
            <div class="d-flex justify-content-between mb-2" style="font-size:13px">
              <span class="text-muted">Role</span>
              <span style="color:#3b82f6">{{ user?.isAdmin ? 'Admin' : 'Employee' }}</span>
            </div>
            <div class="d-flex justify-content-between mb-2" style="font-size:13px">
              <span class="text-muted">Member since</span>
              <span>{{ user?.createdAt | date:'MMM yyyy' }}</span>
            </div>
            <div class="d-flex justify-content-between" style="font-size:13px">
              <span class="text-muted">Status</span>
              <span style="color:#22c55e">Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class SettingsComponent implements OnInit {
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  savingProfile = false;
  savingPassword = false;
  passwordError = '';
  days = DAYS;
  workingDays: number[] = [];

  constructor(private fb: FormBuilder, private auth: AuthService, private msg: MessageService) {}

  get user() { return this.auth.currentUser; }

  ngOnInit(): void {
    const u = this.user!;
    this.workingDays = [...(u.workingDays ?? [])];
    this.profileForm = this.fb.group({
      fullName: [u.fullName, Validators.required],
      email: [u.email, [Validators.required, Validators.email]],
      targetHoursPerDay: [u.targetHoursPerDay, [Validators.required, Validators.min(1)]],
    });
    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
    });
  }

  isWorkingDay(d: number): boolean { return this.workingDays.includes(d); }
  toggleDay(d: number): void {
    this.workingDays = this.workingDays.includes(d)
      ? this.workingDays.filter(x => x !== d)
      : [...this.workingDays, d].sort();
  }

  saveProfile(): void {
    if (this.profileForm.invalid) return;
    this.savingProfile = true;
    this.auth.updateProfile({ ...this.profileForm.value, workingDays: this.workingDays }).subscribe({
      next: () => { this.savingProfile = false; this.msg.add({ severity: 'success', summary: 'Saved', detail: 'Profile updated.' }); },
      error: () => { this.savingProfile = false; this.msg.add({ severity: 'error', summary: 'Error', detail: 'Failed to save.' }); },
    });
  }

  savePassword(): void {
    this.passwordError = '';
    const { currentPassword, newPassword, confirmPassword } = this.passwordForm.value;
    if (newPassword !== confirmPassword) { this.passwordError = 'Passwords do not match.'; return; }
    this.savingPassword = true;
    this.auth.updateProfile({ currentPassword, newPassword }).subscribe({
      next: () => { this.savingPassword = false; this.passwordForm.reset(); this.msg.add({ severity: 'success', summary: 'Updated', detail: 'Password changed.' }); },
      error: (e) => { this.savingPassword = false; this.passwordError = e?.error?.message || 'Failed to update password.'; },
    });
  }
}
