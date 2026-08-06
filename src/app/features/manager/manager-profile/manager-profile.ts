import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Auth } from '../../../core/services/auth';
import { Snackbar } from '../../../core/services/snackbar';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header';

@Component({
  selector: 'app-manager-profile',
  standalone: false,
  templateUrl: './manager-profile.html',
  styleUrl: './manager-profile.css'
})
export class ManagerProfileComponent {
  readonly auth = inject(Auth);
  private readonly fb = inject(FormBuilder);
  private readonly snackbar = inject(Snackbar);
  readonly error = signal('');
  readonly form = this.fb.nonNullable.group({ password: ['', [Validators.required, Validators.minLength(8)]], confirmation: ['', Validators.required] });

  initials(): string { const user = this.auth.getCurrentUser(); return `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase() || 'M'; }
  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const value = this.form.getRawValue();
    if (value.password !== value.confirmation) { this.error.set('La confirmation ne correspond pas au nouveau mot de passe.'); return; }
    this.error.set('');
    this.auth.updateMyAccount({ password: value.password }).subscribe({ next: () => { this.form.reset(); this.snackbar.success('Mot de passe mis à jour.'); }, error: () => this.error.set('La mise à jour du mot de passe a échoué.') });
  }
}
