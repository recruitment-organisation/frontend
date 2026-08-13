import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { EmployeeRole } from '../../../core/models/hr';
import { EmployeeData } from '../../../core/services/employee-data';
import { Snackbar } from '../../../core/services/snackbar';

@Component({
  selector: 'app-hr-roles',
  standalone: false,
  templateUrl: './hr-roles.html',
  styleUrl: './hr-roles.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HrRolesComponent {
  private readonly hiddenRoleNames = new Set([
    'offline_access',
    'default-roles-micro-service',
    'uma_authorization'
  ]);
  private readonly api = inject(EmployeeData);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly snackbar = inject(Snackbar);

  readonly roles = signal<EmployeeRole[]>([]);
  readonly visibleRoles = computed(() =>
    this.roles().filter(role => !this.hiddenRoleNames.has(role.name.trim().toLowerCase()))
  );
  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly error = signal('');
  readonly dialogOpen = signal(false);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', Validators.maxLength(500)]
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.getRoles().pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: page => this.roles.set(page.content),
      error: () => this.error.set('Impossible de charger les rôles pour le moment.')
    });
  }

  openCreateDialog(): void {
    this.form.reset();
    this.error.set('');
    this.dialogOpen.set(true);
  }

  closeDialog(): void {
    if (this.submitting()) return;
    this.dialogOpen.set(false);
    this.form.reset();
  }

  submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const role = {
      name: value.name.trim(),
      description: value.description.trim()
    };
    if (!role.name) {
      this.form.controls.name.setErrors({ required: true });
      this.form.controls.name.markAsTouched();
      return;
    }

    this.submitting.set(true);
    this.error.set('');
    this.api.createRole(role).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.submitting.set(false))
    ).subscribe({
      next: created => {
        this.roles.update(roles => [...roles, created].sort((a, b) => a.name.localeCompare(b.name)));
        this.dialogOpen.set(false);
        this.form.reset();
        this.snackbar.success(`Le rôle « ${created.name} » a été créé.`);
      },
      error: error => {
        const duplicate = error?.status === 409 || error?.error?.message?.includes('already exists');
        this.error.set(duplicate ? 'Un rôle portant ce nom existe déjà.' : 'La création du rôle a échoué.');
      }
    });
  }
}
