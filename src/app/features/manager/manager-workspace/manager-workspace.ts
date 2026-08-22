import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Auth } from '../../../core/services/auth';
import { HrData } from '../../../core/services/hr-data';
import { Snackbar } from '../../../core/services/snackbar';
import {
  Application,
  ApplicationDashboardCounts,
  Candidate,
  Department,
  EmployeeRole,
  Interview,
  JobOffer
} from '../../../core/models/hr';

type ManagerCandidate = {
  id: number;
  name: string;
  position: string;
  location: string;
  score?: number;
  appliedAt?: string;
  status: string;
  currentStep?: string;
  interview?: Interview;
};

@Component({
  selector: 'app-manager-workspace',
  standalone: false,
  templateUrl: './manager-workspace.html',
  styleUrl: './manager-workspace.css'
})
export class ManagerWorkspaceComponent {
  readonly auth = inject(Auth);
  private readonly api = inject(HrData);
  private readonly fb = inject(FormBuilder);
  private readonly snackbar = inject(Snackbar);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly error = signal('');
  readonly actionError = signal('');
  readonly finalists = signal<ManagerCandidate[]>([]);
  readonly departments = signal<Department[]>([]);
  readonly roles = signal<EmployeeRole[]>([]);
  readonly counts = signal<ApplicationDashboardCounts>({ total: 0, pending: 0, hired: 0, rejected: 0 });
  readonly pending = computed(() => this.finalists().length);
  readonly averageScore = computed(() => {
    const scores = this.finalists().map(candidate => candidate.score).filter((score): score is number => score !== undefined);
    return scores.length ? Math.round(scores.reduce((total, score) => total + score, 0) / scores.length) : 0;
  });
  readonly decisionDialog = signal(false);
  readonly selectedCandidate = signal<ManagerCandidate | null>(null);
  readonly savingDecision = signal(false);
  readonly actingInterviewId = signal<number | null>(null);

  readonly decisionForm = this.fb.nonNullable.group({
    result: ['PASSED' as 'PASSED' | 'FAILED', Validators.required],
    feedback: ['', Validators.required],
    notes: [''],
    departmentId: [0],
    employeeRoleId: [0],
    position: ['']
  });

  constructor() {
    this.load();
  }

  initials(): string {
    const user = this.auth.getCurrentUser();
    return `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase() || 'M';
  }

  scoreColor(score?: number): string {
    if (score === undefined) return '#94a3b8';
    const hue = Math.round(Math.max(0, Math.min(100, score)) * 1.2);
    return `linear-gradient(135deg, hsl(${Math.max(0, hue - 8)} 72% 37%), hsl(${Math.min(125, hue + 8)} 76% 47%))`;
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.actionError.set('');
    forkJoin({
      applications: this.api.applications(0, 100),
      candidates: this.api.candidates(0, 100),
      offers: this.api.offers(0, 100),
      interviews: this.api.interviews(0, 100),
      departments: this.api.departments(0, 100),
      roles: this.api.roles(0, 100),
      counts: this.api.applicationDashboardCounts()
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: data => {
        const candidates = new Map<number, Candidate>(data.candidates.content.map(candidate => [candidate.id, candidate]));
        const offers = new Map<number, JobOffer>(data.offers.content.filter(offer => offer.id !== undefined).map(offer => [offer.id!, offer]));
        const interviews = new Map<number, Interview>();
        data.interviews.content
          .filter(interview => interview.stage === 'MANAGER_INTERVIEW')
          .sort((first, second) => (first.id ?? 0) - (second.id ?? 0))
          .forEach(interview => interviews.set(interview.applicationId, interview));

        this.finalists.set(data.applications.content
          .filter(application => application.status === 'MANAGER_INTERVIEW')
          .map(application => this.toManagerCandidate(application, candidates, offers, interviews))
          .sort((first, second) => (second.score ?? -1) - (first.score ?? -1)));
        this.departments.set(data.departments.content);
        this.roles.set(data.roles.content);
        this.counts.set(data.counts);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Impossible de charger les données du dashboard manager. Vérifiez les droits manager et réessayez.');
        this.loading.set(false);
      }
    });
  }

  startInterview(candidate: ManagerCandidate): void {
    const interviewId = candidate.interview?.id;
    if (!interviewId || this.actingInterviewId() !== null) return;
    this.actingInterviewId.set(interviewId);
    this.actionError.set('');
    this.api.updateInterviewStatus(interviewId, 'IN_PROGRESS').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: interview => {
        this.actingInterviewId.set(null);
        this.finalists.update(items => items.map(item => item.id === candidate.id ? { ...item, interview } : item));
        this.snackbar.success('Entretien manager démarré.');
      },
      error: () => {
        this.actingInterviewId.set(null);
        this.actionError.set('Impossible de démarrer cet entretien manager.');
      }
    });
  }

  openDecision(candidate: ManagerCandidate): void {
    if (!candidate.interview?.id || candidate.interview.status !== 'IN_PROGRESS') return;
    this.selectedCandidate.set(candidate);
    this.decisionForm.reset({
      result: 'PASSED',
      feedback: '',
      notes: '',
      departmentId: 0,
      employeeRoleId: 0,
      position: candidate.position
    });
    this.actionError.set('');
    this.decisionDialog.set(true);
  }

  closeDecision(): void {
    if (this.savingDecision()) return;
    this.decisionDialog.set(false);
    this.selectedCandidate.set(null);
  }

  completeDecision(): void {
    const candidate = this.selectedCandidate();
    const interviewId = candidate?.interview?.id;
    if (!candidate || !interviewId || this.decisionForm.invalid) {
      this.decisionForm.markAllAsTouched();
      return;
    }

    const decision = this.decisionForm.getRawValue();
    const accepted = decision.result === 'PASSED';
    if (accepted && (decision.departmentId < 1 || decision.employeeRoleId < 1 || !decision.position.trim())) {
      this.actionError.set('Pour une acceptation, sélectionnez le département, le rôle employé et le poste.');
      return;
    }

    this.savingDecision.set(true);
    this.actionError.set('');
    this.api.addInterviewFeedback(
      interviewId,
      decision.feedback.trim(),
      decision.notes.trim(),
      decision.result,
      accepted ? {
        departmentId: decision.departmentId,
        employeeRoleId: decision.employeeRoleId,
        position: decision.position.trim()
      } : undefined
    ).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.savingDecision.set(false);
        this.decisionDialog.set(false);
        this.selectedCandidate.set(null);
        this.snackbar.success(accepted
          ? 'Candidature acceptée : l’offre et la notification ont été envoyées.'
          : 'Candidature rejetée : le candidat a été notifié.');
        this.load();
      },
      error: () => {
        this.savingDecision.set(false);
        this.actionError.set('La décision finale n’a pas pu être enregistrée. Vérifiez le workflow puis réessayez.');
      }
    });
  }

  interviewState(candidate: ManagerCandidate): string {
    switch (candidate.interview?.status) {
      case 'SCHEDULED': return 'Entretien planifié';
      case 'RESCHEDULED': return 'Entretien replanifié';
      case 'IN_PROGRESS': return 'Entretien en cours';
      case 'COMPLETED': return candidate.interview.result === 'PASSED' ? 'Décision positive' : 'Décision négative';
      case 'CANCELLED': return 'Entretien annulé';
      default: return 'Entretien à planifier';
    }
  }

  private toManagerCandidate(
    application: Application,
    candidates: Map<number, Candidate>,
    offers: Map<number, JobOffer>,
    interviews: Map<number, Interview>
  ): ManagerCandidate {
    const candidate = candidates.get(application.candidateId);
    const offer = offers.get(application.jobOfferId);
    return {
      id: application.id,
      name: candidate ? `${candidate.firstName} ${candidate.lastName}` : `Candidat #${application.candidateId}`,
      position: offer?.title ?? `Offre #${application.jobOfferId}`,
      location: offer?.location ?? 'Localisation non renseignée',
      score: application.matchingScore,
      appliedAt: application.appliedAt,
      status: application.status,
      currentStep: application.currentStep,
      interview: interviews.get(application.id)
    };
  }
}
