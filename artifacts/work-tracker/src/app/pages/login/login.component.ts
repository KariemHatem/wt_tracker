import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { MessageModule } from 'primeng/message';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonModule, InputTextModule, PasswordModule, MessageModule],
  template: `
    <div class="login-page">
      <div class="login-card">
        <div class="login-logo">
          <i class="pi pi-clock"></i>
          <h1>WorkTracker</h1>
          <p>Sign in to your workspace</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="field">
            <label for="email">Email address</label>
            <input id="email" type="email" pInputText formControlName="email"
                   placeholder="you@company.com" class="w-100"
                   [class.ng-invalid]="form.get('email')?.invalid && form.get('email')?.touched" />
          </div>
          <div class="field">
            <label for="password">Password</label>
            <p-password id="password" formControlName="password"
                        [feedback]="false" [toggleMask]="true"
                        styleClass="w-100" inputStyleClass="w-100"
                        placeholder="Enter your password" />
          </div>
          <div *ngIf="error" class="mb-3" style="color:#ef4444;font-size:13px;padding:10px;background:rgba(239,68,68,.08);border-radius:8px;">
            {{ error }}
          </div>
          <p-button type="submit" label="Sign in" styleClass="w-100"
                    [loading]="loading" [disabled]="form.invalid" />
        </form>

        <div class="login-footer">
          Default admin: <code>admin&#64;company.com</code> / <code>admin123</code>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  form: FormGroup;
  loading = false;
  error = '';

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.form = this.fb.group({
      email:    ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    const { email, password } = this.form.value;
    this.auth.login(email, password).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: () => { this.error = 'Invalid email or password.'; this.loading = false; },
    });
  }
}
