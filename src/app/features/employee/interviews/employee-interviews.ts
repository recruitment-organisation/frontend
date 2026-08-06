import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { catchError, of, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HrData } from '../../../core/services/hr-data';
import { Employee, Interview, PageResponse } from '../../../core/models/hr';
import { Snackbar } from '../../../core/services/snackbar';

@Component({
  selector: 'app-employee-interviews',
  standalone: false,
  templateUrl: './employee-interviews.html',
  styleUrl: './employee-interviews.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmployeeInterviewsComponent {
  private readonly api = inject(HrData);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly snackbar = inject(Snackbar);

  readonly loading = signal(true);
  readonly error = signal('');
  readonly employee = signal<Employee | null>(null);
  readonly interviews = signal<Interview[]>([]);
  readonly selectedInterview = signal<Interview | null>(null);
  readonly feedbackDialog = signal(false);
  readonly saving = signal(false);

  readonly feedbackForm = this.fb.nonNullable.group({
    feedback: ['', Validators.required],
    notes: [''],
    result: ['PASSED' as NonNullable<Interview['result']>, Validators.required]
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.currentEmployee().pipe(
      switchMap(employee => {
        this.employee.set(employee);
        return this.api.interviewsByInterviewer(employee.id, 0, 100).pipe(catchError(() => of({ content: [] as Interview[], totalElements: 0, totalPages: 0, number: 0, size: 100 } as PageResponse<Interview>)));
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: page => {
        this.interviews.set(page.content);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Impossible de charger vos entretiens.');
      }
    });
  }

  openFeedback(interview: Interview): void {
    if (!interview.id || interview.status !== 'IN_PROGRESS') return;
    this.selectedInterview.set(interview);
    this.feedbackForm.reset({ feedback: '', notes: '', result: 'PASSED' });
    this.feedbackDialog.set(true);
  }

  closeFeedback(): void {
    this.feedbackDialog.set(false);
    this.selectedInterview.set(null);
    this.feedbackForm.reset({ feedback: '', notes: '', result: 'PASSED' });
  }

  start(interview: Interview): void {
    if (!interview.id) return;
    this.api.updateInterviewStatus(interview.id, 'IN_PROGRESS').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.snackbar.success('Entretien démarré.');
        this.load();
      },
      error: () => this.error.set('Impossible de démarrer cet entretien.')
    });
  }

  completeInterview(): void {
    const interview = this.selectedInterview();
    if (!interview?.id || this.feedbackForm.invalid) {
      this.feedbackForm.markAllAsTouched();
      return;
    }
    const raw = this.feedbackForm.getRawValue();
    this.saving.set(true);
    this.api.addInterviewFeedback(interview.id, raw.feedback, raw.notes, raw.result).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving.set(false);
        this.closeFeedback();
        this.snackbar.success('Résultat enregistré.');
        this.load();
      },
      error: () => {
        this.saving.set(false);
        this.error.set('L’enregistrement du résultat a échoué.');
      }
    });
  }

  stageLabel(interview: Interview): string {
    switch (interview.stage) {
      case 'HR_INTERVIEW': return 'Entretien RH';
      case 'TECHNICAL_INTERVIEW': return 'Entretien technique';
      case 'MANAGER_INTERVIEW': return 'Entretien manager';
      default: return 'Entretien';
    }
  }

  venueLabel(interview: Interview): string {
    if (interview.type === 'ONLINE' && interview.meetingLink) return 'Lien de réunion';
    if (interview.type === 'ONSITE' && interview.location) return 'Lieu';
    if (interview.type === 'PHONE') return 'Téléphone';
    return 'Modalité';
  }
}
