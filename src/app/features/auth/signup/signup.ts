import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../../../core/services/auth';
import { Snackbar } from '../../../core/services/snackbar';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null { return control.get('password')?.value === control.get('confirmPassword')?.value ? null : { passwordMismatch: true }; }

@Component({ selector: 'app-signup', templateUrl: './signup.html', styleUrl: './signup.css', standalone: false })
export class Signup {
  private readonly fb = inject(FormBuilder); private readonly auth = inject(Auth); private readonly router = inject(Router); private readonly snackbar = inject(Snackbar); private readonly phonePattern = /^\+?[0-9]{8,15}$/;
  step = 1; loading = false; showPassword = false; showConfirmation = false; errorMessage = ''; successMessage = '';
  readonly form = this.fb.nonNullable.group({ firstName: ['', [Validators.required, Validators.maxLength(50)]], lastName: ['', [Validators.required, Validators.maxLength(50)]], email: ['', [Validators.required, Validators.email]], phone: ['', Validators.pattern(this.phonePattern)], location: ['', Validators.maxLength(100)], available: [true], linkedinUrl: ['', Validators.pattern(/^https?:\/\/.+$/)], githubUrl: ['', Validators.pattern(/^https?:\/\/.+$/)], password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]], confirmPassword: ['', Validators.required] }, { validators: passwordMatchValidator });
  get passwordStrength(): string { const value = this.form.controls.password.value ?? ''; if (!value) return ''; const score = [value.length >= 8, /[A-Z]/.test(value), /[0-9]/.test(value), /[^A-Za-z0-9]/.test(value)].filter(Boolean).length; return score <= 1 ? 'Faible' : score <= 3 ? 'Moyenne' : 'Solide'; }
  controlsForStep(): string[] { return this.step === 1 ? ['email', 'password', 'confirmPassword'] : this.step === 2 ? ['firstName', 'lastName', 'phone', 'location'] : ['linkedinUrl', 'githubUrl']; }
  next(): void { const controls = this.controlsForStep(); controls.forEach(name => this.form.get(name)?.markAsTouched()); if (this.step === 1 && this.form.errors?.['passwordMismatch']) { this.form.controls.confirmPassword.markAsTouched(); return; } if (controls.some(name => this.form.get(name)?.invalid)) return; this.step++; }
  previous(): void { this.step--; }
  togglePassword(field: 'password' | 'confirmation'): void { if (field === 'password') this.showPassword = !this.showPassword; else this.showConfirmation = !this.showConfirmation; }
  onSubmit(): void { if (this.loading) return; if (this.form.invalid) { this.form.markAllAsTouched(); return; } this.loading = true; this.errorMessage = ''; const value = this.form.getRawValue(); this.auth.signup({ firstName: value.firstName!, lastName: value.lastName!, email: value.email!, password: value.password!, phone: value.phone || undefined, location: value.location || undefined, available: value.available ?? true, linkedinUrl: value.linkedinUrl || undefined, githubUrl: value.githubUrl || undefined }).subscribe({ next: () => { this.loading = false; this.successMessage = ''; this.snackbar.success('Compte candidat créé.'); setTimeout(() => void this.router.navigate(['/auth/login']), 1200); }, error: error => { this.loading = false; this.errorMessage = error.status === 400 || error.status === 409 ? 'Cette adresse email est déjà utilisée ou certaines informations sont invalides.' : error.status >= 500 ? 'Le service d’inscription est temporairement indisponible.' : 'La création du compte a échoué. Réessayez plus tard.'; } }); }
}
