import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Auth } from '../../../core/services/auth';
import { EmployeeData } from '../../../core/services/employee-data';
import { CandidateData } from '../../../core/services/candidate-data';
import { Candidate, Employee } from '../../../core/models/hr';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header';
import { Snackbar } from '../../../core/services/snackbar';

@Component({
  selector: 'app-profile-page',
  standalone: false,
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.css'
})
export class ProfilePageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly employeeData = inject(EmployeeData);
  private readonly candidateData = inject(CandidateData);
  private readonly fb = inject(FormBuilder);
  private readonly snackbar = inject(Snackbar);
  readonly auth = inject(Auth);
  readonly data = computed(() => this.route.snapshot.data);
  readonly employee = signal<Employee | null>(null);
  readonly candidate = signal<Candidate | null>(null);
  readonly employeeError = signal('');
  readonly accountSuccess = signal('');
  readonly accountError = signal('');
  readonly accountForm = this.fb.group({ password: ['', Validators.minLength(8)], confirmation: ['', Validators.minLength(8)] });

  constructor() {
    const user = this.auth.getCurrentUser();
    if (user?.roles.includes('CANDIDATE')) {
      this.candidateData.me()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({ next: candidate => this.candidate.set(candidate), error: () => this.employeeError.set('Impossible de charger votre profil candidat.') });
      return;
    }

    const userId = user?.userId;
    if (!userId) return;

    this.employeeData.getById(userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: employee => this.employee.set(employee),
        error: () => this.employeeError.set('Impossible de charger les informations employé à jour.')
      });
  }

  get eyebrow(): string {
    return (this.data()['eyebrow'] as string | undefined) ?? 'Profil';
  }

  get title(): string {
    return (this.data()['title'] as string | undefined) ?? 'Profil utilisateur';
  }

  get description(): string {
    return (this.data()['description'] as string | undefined)
      ?? 'Informations issues de la session active.';
  }

  updateAccount(): void {
    if (this.accountForm.invalid) { this.accountForm.markAllAsTouched(); return; }
    const value = this.accountForm.getRawValue();
    const payload = { password: value.password || undefined };
    if (!payload.password) { this.accountError.set('Saisissez un nouveau mot de passe.'); return; }
    if (value.password !== value.confirmation) { this.accountError.set('La confirmation du mot de passe ne correspond pas.'); return; }
    this.accountError.set('');
    this.auth.updateMyAccount(payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: () => { this.accountSuccess.set(''); this.accountForm.reset(); this.snackbar.success('Compte mis à jour.'); }, error: () => this.accountError.set('La mise à jour du compte a échoué.') });
  }
}
