import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HrData } from '../../../core/services/hr-data';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card';
import { Application, Department, Interview } from '../../../core/models/hr';
import { RouterLink } from '@angular/router';
import { Auth } from '../../../core/services/auth';
import { DialogComponent } from '../../../shared/components/dialog/dialog';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge';
import { Snackbar } from '../../../core/services/snackbar';

@Component({ selector: 'app-hr-dashboard', standalone: false, templateUrl: './hr-dashboard.html', styleUrl: './hr-dashboard.css', changeDetection: ChangeDetectionStrategy.OnPush })
export class HrDashboardComponent {
  private readonly api = inject(HrData); private readonly destroyRef = inject(DestroyRef); private readonly fb = inject(FormBuilder); private readonly snackbar = inject(Snackbar); readonly auth = inject(Auth);
  readonly isManagerView = this.auth.hasRole('MANAGER') && !this.auth.hasRole('HR');
  readonly loading = signal(true); readonly error = signal(''); readonly totals = signal({ departments: 0, employees: 0, candidates: 0, activeOffers: 0, applications: 0, scheduledInterviews: 0, pending: 0, hired: 0, rejected: 0 });
  readonly recent = signal<Application[]>([]); readonly upcoming = signal<Interview[]>([]);
  readonly pipeline = computed(() => {
    const totals = this.totals();
    const inProgress = Math.max(totals.applications - totals.pending - totals.hired - totals.rejected, 0);
    const decided = totals.hired + totals.rejected;
    return { ...totals, inProgress, decided, completionRate: totals.applications ? Math.round((decided / totals.applications) * 100) : 0 };
  });
  readonly departments = signal<Department[]>([]); readonly departmentDialog = signal(false); readonly departmentError = signal(''); readonly departmentSuccess = signal('');
  readonly editingDepartment = signal<Department | null>(null); readonly departmentPendingDeletion = signal<Department | null>(null); readonly departmentSaving = signal(false);
  readonly departmentForm = this.fb.nonNullable.group({ name: ['', Validators.required], description: ['', Validators.required] });
  constructor() { this.load(); }
  routeFor(section: 'candidates' | 'applications'): string { return this.isManagerView ? `/manager/${section}` : `/hr/${section}`; }
  load(): void {
    this.loading.set(true); this.error.set('');
    forkJoin({ employees: this.api.employees(0, 1), departments: this.api.departments(0, 100), candidates: this.api.candidates(0, 1), activeOffers: this.api.offersByStatus('OPEN', 0, 1), applications: this.api.applications(0, 6), applicationCounts: this.api.applicationDashboardCounts(), scheduled: this.api.interviewsByStatus('SCHEDULED', 0, 50) }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: data => { this.departments.set(data.departments.content); this.totals.set({ departments: data.departments.totalElements, employees: data.employees.totalElements, candidates: data.candidates.totalElements, activeOffers: data.activeOffers.totalElements, applications: data.applicationCounts.total, scheduledInterviews: data.scheduled.totalElements, pending: data.applicationCounts.pending, hired: data.applicationCounts.hired, rejected: data.applicationCounts.rejected }); this.recent.set(data.applications.content); this.upcoming.set(data.scheduled.content.filter(interview => new Date(interview.scheduledAt) >= new Date()).sort((a,b) => a.scheduledAt.localeCompare(b.scheduledAt)).slice(0, 5)); this.loading.set(false); }, error: () => { this.error.set('Impossible de charger les indicateurs RH.'); this.loading.set(false); } });
  }
  saveDepartment(): void { if (this.departmentForm.invalid) { this.departmentForm.markAllAsTouched(); return; } const editing = this.editingDepartment(); this.departmentSaving.set(true); this.departmentError.set(''); this.departmentSuccess.set(''); const request = editing ? this.api.updateDepartment({ ...editing, ...this.departmentForm.getRawValue() }) : this.api.createDepartment(this.departmentForm.getRawValue()); request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: () => { const message = editing ? 'Département mis à jour.' : 'Département créé.'; this.departmentSuccess.set(''); this.cancelDepartmentEdit(); this.departmentDialog.set(false); this.departmentSaving.set(false); this.snackbar.success(message); this.load(); }, error: () => { this.departmentError.set(editing ? 'La mise à jour du département a échoué.' : 'La création du département a échoué.'); this.departmentSaving.set(false); } }); }
  editDepartment(department: Department): void { this.editingDepartment.set(department); this.departmentError.set(''); this.departmentSuccess.set(''); this.departmentForm.setValue({ name: department.name, description: department.description }); }
  cancelDepartmentEdit(): void { this.editingDepartment.set(null); this.departmentForm.reset(); }
  confirmDepartmentDeletion(department: Department): void { this.departmentPendingDeletion.set(department); }
  deleteDepartment(): void { const department = this.departmentPendingDeletion(); if (!department) return; this.departmentSaving.set(true); this.departmentError.set(''); this.api.deleteDepartment(department.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: () => { this.departmentPendingDeletion.set(null); this.departmentDialog.set(false); this.departmentSaving.set(false); this.departmentSuccess.set(''); if (this.editingDepartment()?.id === department.id) this.cancelDepartmentEdit(); this.snackbar.success('Département supprimé.'); this.load(); }, error: () => { this.departmentPendingDeletion.set(null); this.departmentSaving.set(false); this.departmentError.set('La suppression a été refusée. Vérifiez notamment si ce département est encore lié à des employés.'); } }); }
}
