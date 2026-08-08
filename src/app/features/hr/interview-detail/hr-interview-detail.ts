import { ChangeDetectionStrategy, Component, DestroyRef, OnDestroy, computed, inject, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Application, Candidate, Employee, Interview, InterviewStage, JobOffer } from '../../../core/models/hr';
import { HrData } from '../../../core/services/hr-data';
import { Snackbar } from '../../../core/services/snackbar';

type DetailContext = {
  application: Application;
  candidate: Candidate;
  interviewer: Employee;
  offer: JobOffer;
  history: Interview[];
};

type TimelineState = 'done' | 'current' | 'upcoming' | 'rejected';
type TimelineStep = { label: string; description: string; state: TimelineState };

@Component({
  selector: 'app-hr-interview-detail',
  standalone: false,
  templateUrl: './hr-interview-detail.html',
  styleUrl: './hr-interview-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HrInterviewDetailComponent implements OnDestroy {
  private readonly api = inject(HrData);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly snackbar = inject(Snackbar);
  private readonly timerId: number;

  readonly interview = signal<Interview | null>(null);
  readonly context = signal<DetailContext | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly decisionDialog = signal(false);
  readonly saving = signal(false);
  readonly selectedDecision = signal<'PASSED' | 'FAILED'>('PASSED');
  readonly now = signal(Date.now());
  readonly decisionForm = this.fb.nonNullable.group({
    feedback: ['', Validators.required],
    notes: ['']
  });

  readonly remainingTime = computed(() => {
    const interview = this.interview();
    if (!interview) return '';
    const delta = new Date(interview.scheduledAt).getTime() - this.now();
    if (interview.status === 'COMPLETED') return 'Entretien terminé';
    if (interview.status === 'CANCELLED') return 'Entretien annulé';
    if (delta <= 0) return interview.status === 'IN_PROGRESS' ? 'Entretien en cours' : 'L’entretien peut commencer';
    const totalMinutes = Math.floor(delta / 60_000);
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;
    return `Début dans ${days ? `${days} j ` : ''}${hours ? `${hours} h ` : ''}${minutes} min`;
  });

  readonly timeline = computed<TimelineStep[]>(() => {
    const context = this.context();
    if (!context) return [];
    const application = context.application;
    const history = context.history;
    const rejected = application.status === 'REJECTED' || application.status === 'CLOSED';
    const stages: Array<{ stage: InterviewStage; task: string; label: string }> = [
      { stage: 'HR_INTERVIEW', task: 'hrInterview', label: 'Entretien RH' },
      { stage: 'TECHNICAL_INTERVIEW', task: 'technicalInterview', label: 'Entretien technique' },
      { stage: 'MANAGER_INTERVIEW', task: 'managerInterview', label: 'Entretien manager' }
    ];
    const steps: TimelineStep[] = [{ label: 'Candidature reçue', description: 'Dossier enregistré et examiné.', state: 'done' }];
    for (const item of stages) {
      const stageInterviews = history.filter(interview => interview.stage === item.stage);
      const completed = stageInterviews.some(interview => interview.status === 'COMPLETED' && interview.result === 'PASSED');
      const failed = stageInterviews.some(interview => interview.status === 'COMPLETED' && interview.result === 'FAILED');
      const active = application.currentTaskDefinitionKey === item.task;
      steps.push({
        label: item.label,
        description: failed ? 'Candidat rejeté à cette étape.' : completed ? 'Étape approuvée.' : active ? 'Étape actuelle du candidat.' : 'Étape à venir.',
        state: failed ? 'rejected' : completed ? 'done' : active ? 'current' : 'upcoming'
      });
    }
    steps.push({
      label: 'Décision finale',
      description: application.status === 'HIRED' ? 'Candidat recruté.' : rejected ? 'Processus terminé sans recrutement.' : 'Décision à venir.',
      state: application.status === 'HIRED' ? 'done' : rejected ? 'rejected' : 'upcoming'
    });
    return steps;
  });

  constructor() {
    this.timerId = window.setInterval(() => this.now.set(Date.now()), 30_000);
    this.load();
  }

  ngOnDestroy(): void {
    window.clearInterval(this.timerId);
  }

  load(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isInteger(id) || id < 1) {
      this.loading.set(false);
      this.error.set('Identifiant d’entretien invalide.');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.api.interview(id).pipe(
      switchMap(interview => {
        this.interview.set(interview);
        return forkJoin({
          application: this.api.application(interview.applicationId),
          interviewer: this.api.employee(interview.interviewerId),
          history: this.api.interviewsByApplication(interview.applicationId, 0, 100)
        });
      }),
      switchMap(data => forkJoin({
        application: of(data.application),
        interviewer: of(data.interviewer),
        history: of(data.history.content),
        candidate: this.api.candidate(data.application.candidateId),
        offer: this.api.offer(data.application.jobOfferId)
      })),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: data => {
        this.context.set({ application: data.application, interviewer: data.interviewer, history: data.history, candidate: data.candidate, offer: data.offer });
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Impossible de charger le détail complet de cet entretien.');
      }
    });
  }

  start(): void {
    const interview = this.interview();
    if (!interview?.id) return;
    this.api.updateInterviewStatus(interview.id, 'IN_PROGRESS').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: updated => { this.interview.set(updated); this.snackbar.success('Entretien démarré.'); },
      error: () => this.error.set('Impossible de démarrer cet entretien.')
    });
  }

  openDecision(decision: 'PASSED' | 'FAILED'): void {
    if (this.interview()?.status !== 'IN_PROGRESS') return;
    this.selectedDecision.set(decision);
    this.decisionForm.reset({ feedback: '', notes: '' });
    this.decisionDialog.set(true);
  }

  closeDecision(): void {
    if (this.saving()) return;
    this.decisionDialog.set(false);
  }

  saveDecision(): void {
    const interview = this.interview();
    if (!interview?.id || this.decisionForm.invalid) {
      this.decisionForm.markAllAsTouched();
      return;
    }
    const decision = this.selectedDecision();
    const form = this.decisionForm.getRawValue();
    this.saving.set(true);
    this.api.addInterviewFeedback(interview.id, form.feedback, form.notes, decision).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: updated => {
        this.interview.set(updated);
        this.saving.set(false);
        this.decisionDialog.set(false);
        if (decision === 'PASSED' && updated.stage === 'HR_INTERVIEW') {
          this.snackbar.success('Candidat approuvé : planifiez maintenant son entretien technique.');
          this.router.navigate(['/hr/interviews'], { queryParams: { technicalApplicationId: updated.applicationId } });
        } else {
          this.snackbar.success(decision === 'PASSED' ? 'Entretien approuvé et workflow poursuivi.' : 'Candidature rejetée.');
          this.load();
        }
      },
      error: () => {
        this.saving.set(false);
        this.error.set('La décision n’a pas pu être enregistrée.');
      }
    });
  }

  stageLabel(stage?: InterviewStage): string {
    return stage === 'HR_INTERVIEW' ? 'Entretien RH' : stage === 'TECHNICAL_INTERVIEW' ? 'Entretien technique' : stage === 'MANAGER_INTERVIEW' ? 'Entretien manager' : 'Entretien';
  }

  statusLabel(status?: Interview['status']): string {
    const labels: Record<string, string> = { SCHEDULED: 'Planifié', RESCHEDULED: 'Replanifié', IN_PROGRESS: 'En cours', COMPLETED: 'Terminé', CANCELLED: 'Annulé' };
    return status ? labels[status] ?? status : 'Inconnu';
  }
}
