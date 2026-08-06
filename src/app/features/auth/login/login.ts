import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Auth } from '../../../core/services/auth';

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrl: './login.css',
  standalone: false
})
export class Login {
  private fb = inject(FormBuilder);
  private auth = inject(Auth);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly loading = signal(false);
  readonly showPassword = signal(false);
  errorMessage = '';

  form = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  get username() {
    return this.form.get('username');
  }

  get password() {
    return this.form.get('password');
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.loading()) return;
    this.loading.set(true);
    this.errorMessage = '';

    const { username, password } = this.form.value;

    this.auth.login({ username: username!, password: password! }).subscribe({
      next: () => {
        this.loading.set(false);
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        this.router.navigateByUrl(returnUrl?.startsWith('/') ? returnUrl : this.auth.getDefaultRoute());
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage = this.messageForStatus(err.status);
      }
    });
  }

  togglePassword(): void { this.showPassword.update(value => !value); }
  private messageForStatus(status: number): string {
    if (status === 400) return 'Vérifiez les informations saisies.';
    if (status === 401) return "Nom d'utilisateur ou mot de passe incorrect.";
    if (status === 403) return 'Votre compte ne dispose pas des autorisations nécessaires.';
    if (status >= 500) return 'Le service de connexion est temporairement indisponible.';
    return 'Une erreur est survenue. Veuillez réessayer.';
  }
}
