import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CandidateData } from '../../../core/services/candidate-data';
import { Application, WorkflowTask } from '../../../core/models/hr';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge';
import { DialogComponent } from '../../../shared/components/dialog/dialog';
import { Snackbar } from '../../../core/services/snackbar';

interface WorkflowStep {
  readonly key: string;
  readonly label: string;
  readonly description: string;
}

@Component({ selector: 'app-candidate-applications', standalone: false, templateUrl: './candidate-applications.html', styleUrl: './candidate-applications.css', changeDetection: ChangeDetectionStrategy.OnPush })
export class CandidateApplicationsComponent {
  private readonly api = inject(CandidateData); private readonly destroyRef = inject(DestroyRef); private readonly snackbar = inject(Snackbar);
  readonly applications = signal<Application[]>([]); readonly selected = signal<Application | null>(null); readonly workflowTask = signal<WorkflowTask | null>(null); readonly workflowTaskLoading = signal(false); readonly workflowTaskError = signal(''); readonly updatingCv = signal(false); readonly loading = signal(true); readonly error = signal(''); readonly success = signal(''); readonly page = signal(0); readonly total = signal(0); readonly now = signal(Date.now()); readonly pageSize = 20;
  readonly workflowSteps: readonly WorkflowStep[] = [
    { key: 'submitted', label: 'Candidature transmise', description: 'Votre dossier et votre CV ont été reçus.' },
    { key: 'cv-validation', label: 'Validation du CV', description: 'Le format et les informations du CV sont vérifiés.' },
    { key: 'ai-review', label: 'Analyse de compatibilité', description: 'Votre profil est comparé aux exigences du poste.' },
    { key: 'hr-cv-filtering', label: 'Filtrage CV RH', description: 'Les ressources humaines acceptent ou rejettent votre CV.' },
    { key: 'hr-interview', label: 'Entretien RH', description: 'Les ressources humaines préparent votre entretien.' },
    { key: 'technical-interview', label: 'Entretien technique', description: 'Vos compétences techniques sont évaluées.' },
    { key: 'manager-interview', label: 'Entretien manager', description: 'La décision est préparée avec le manager.' },
    { key: 'final-decision', label: 'Décision finale', description: 'Le processus se termine par une décision de recrutement.' }
  ];
  constructor() {
    this.load();
    const clock = window.setInterval(() => this.now.set(Date.now()), 1_000);
    this.destroyRef.onDestroy(() => window.clearInterval(clock));
  }
  load(nextPage = this.page()): void { this.page.set(nextPage); this.loading.set(true); this.error.set(''); this.api.applications(nextPage, this.pageSize).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: response => { this.applications.set(response.content); this.total.set(response.totalElements); this.loading.set(false); }, error: () => { this.error.set('Impossible de charger vos candidatures pour le moment.'); this.loading.set(false); } }); }
  open(application: Application): void { this.success.set(''); this.selected.set(application); this.loadWorkflowTask(application); }
  replaceCv(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.item(0);
    const application = this.selected();
    if (!file || !application || this.updatingCv()) return;
    if (!this.canReplaceCv(application)) {
      this.error.set('Votre CV est verrouillé pendant et après le filtrage RH.');
      return;
    }
    if (!file.name.toLocaleLowerCase().endsWith('.pdf') || (file.type && file.type !== 'application/pdf')) {
      this.error.set('Le document doit être un CV au format PDF.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.error.set('Le CV ne doit pas dépasser 10 Mo.');
      return;
    }
    this.updatingCv.set(true);
    this.error.set('');
    this.api.replaceCv(application, file).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.updatingCv.set(false);
        this.selected.set(null);
        this.snackbar.success(this.requiresCvRevision(application)
          ? 'CV corrigé envoyé : la validation du workflow reprend.'
          : 'Votre candidature a été mise à jour avec le nouveau CV.');
        this.load();
      },
      error: () => {
        this.updatingCv.set(false);
        this.error.set('La mise à jour ou la reprise du workflow a échoué.');
      }
    });
  }

  private loadWorkflowTask(application: Application): void {
    this.workflowTask.set(null);
    this.workflowTaskError.set('');
    if (!application.currentTaskId) return;

    this.workflowTaskLoading.set(true);
    this.api.workflowTask(application.currentTaskId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: task => { this.workflowTask.set(task); this.workflowTaskLoading.set(false); },
      error: () => { this.workflowTaskError.set('Les détails temps réel de cette étape ne sont pas disponibles.'); this.workflowTaskLoading.set(false); }
    });
  }

  isWorkflowFinished(application: Application): boolean {
    return ['REJECTED', 'HIRED', 'CLOSED'].includes(application.status);
  }

  workflowCompletionMessage(application: Application): string {
    if (application.status === 'HIRED') return 'Votre candidature a été retenue. Le processus est terminé.';
    if (application.status === 'REJECTED') return 'Votre candidature n’a pas été retenue. Le processus est terminé.';
    return 'Votre candidature a été clôturée. Le processus est terminé.';
  }

  currentWorkflowLabel(application: Application): string {
    return this.workflowSteps[this.currentWorkflowStepIndex(application)]?.label ?? 'Candidature transmise';
  }

  remainingWorkflowStepCount(application: Application): number {
    return Math.max(0, this.workflowSteps.length - this.currentWorkflowStepIndex(application) - 1);
  }

  requiresCvRevision(application: Application): boolean {
    const taskKey = application.currentTaskDefinitionKey ?? '';
    const taskName = application.currentTaskName?.toLocaleLowerCase() ?? '';
    return taskKey === 'sid-3140788F-868D-4F20-88A1-D66AF0BA345A'
      || taskName.includes('revise cv')
      || application.status === 'CV_REVISION_REQUIRED';
  }

  canReplaceCv(application: Application): boolean {
    return !application.processInstanceId || this.requiresCvRevision(application);
  }

  cvRevisionTimeLeft(application: Application): string {
    const createdAt = this.workflowTask()?.createdAt ?? application.updatedAt;
    const deadline = createdAt ? new Date(createdAt).getTime() + 2 * 60 * 60 * 1_000 : this.now() + 2 * 60 * 60 * 1_000;
    const seconds = Math.max(0, Math.ceil((deadline - this.now()) / 1_000));
    const hours = Math.floor(seconds / 3_600);
    const minutes = Math.floor((seconds % 3_600) / 60);
    const remainingSeconds = seconds % 60;
    return [hours, minutes, remainingSeconds].map(value => value.toString().padStart(2, '0')).join(':');
  }

  isCvRevisionExpired(application: Application): boolean {
    return this.cvRevisionTimeLeft(application) === '00:00:00';
  }

  workflowStepState(application: Application, stepIndex: number): 'completed' | 'current' | 'upcoming' {
    const currentIndex = this.currentWorkflowStepIndex(application);
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
  }

  private currentWorkflowStepIndex(application: Application): number {
    const taskKey = application.currentTaskDefinitionKey ?? '';
    const taskName = application.currentTaskName?.toLowerCase() ?? '';
    if (this.requiresCvRevision(application)) return 1;
    if (taskKey === 'hrCvFiltering' || taskName.includes('hr cv filtering')) return 3;
    if (taskKey === 'hrInterview' || taskName.includes('hr interview')) return 4;
    if (taskKey === 'technicalInterview' || taskName.includes('technical interview')) return 5;
    if (taskKey === 'managerInterview' || taskName.includes('manager interview')) return 6;
    if (application.status === 'CV_REVISION_REQUIRED') return 1;
    return 0;
  }
}
