import { ChangeDetectorRef, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { catchError, finalize, forkJoin, map, of, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HrData } from '../../../core/services/hr-data';
import { Application, Candidate, CreateEmployeeRequest, CvFile, CvRecommendation, Department, Employee, EmployeeRole, HrAssistantScope, Interview, InterviewType, JobOffer, WorkflowTask } from '../../../core/models/hr';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header';
import { DialogComponent } from '../../../shared/components/dialog/dialog';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge';
import { HrAssistantComponent } from '../../../shared/components/hr-assistant/hr-assistant';
import { Snackbar } from '../../../core/services/snackbar';

type Mode = 'employees' | 'managers' | 'candidates' | 'applications' | 'interviews';
type ApplicationView = 'all' | 'candidates' | 'hrInterview' | 'rejected';
type Row = { id: number; title: string; detail: string; status: string; metadata: string; cvId?: number; cvFileName?: string; keycloakId?: string; candidate?: Candidate; application?: Application; offerTitle?: string; offerTitles?: string[]; domains?: string[]; appliedAt?: string; matchingScore?: number; isNew?: boolean };
type OfferRecommendation = { offerId: number; offerTitle: string; candidates: Row[] };
type PendingApplicationAction = { kind: 'accept' | 'reject' | 'delete'; row: Row };

@Component({ selector: 'app-hr-records', standalone: false, templateUrl: './hr-records.html', styleUrl: './hr-records.css' })
export class HrRecordsComponent {
  private readonly api = inject(HrData); private readonly route = inject(ActivatedRoute); private readonly destroyRef = inject(DestroyRef); private readonly changeDetectorRef = inject(ChangeDetectorRef); private readonly fb = inject(FormBuilder); private readonly snackbar = inject(Snackbar);
  readonly mode = this.route.snapshot.data['mode'] as Mode; readonly isReadOnly = this.route.snapshot.data['readOnly'] === true; readonly page = signal(0); readonly total = signal(0); readonly loading = signal(false); readonly error = signal(''); readonly query = signal(''); readonly offerFilter = signal(''); readonly domainFilter = signal(''); readonly sort = signal<'appliedAt' | 'matchingScore'>('appliedAt'); readonly rows = signal<Row[]>([]); readonly assistantFilterIds = signal<number[] | null>(null); readonly applicationView = signal<ApplicationView>('all');
  readonly departments = signal<Department[]>([]); readonly employeeRoles = signal<EmployeeRole[]>([]); readonly employeeError = signal(''); readonly employeeSuccess = signal(''); readonly employeeOptionsLoading = signal(false); readonly employeeSubmitting = signal(false);
  readonly selected = signal<Row | null>(null); readonly recommendation = signal<{ applicationId: number; result: CvRecommendation } | null>(null); readonly recommendationLoading = signal<number | null>(null); readonly recommendationError = signal(''); readonly employeeDialog = signal(false);
  readonly scheduleDialog = signal(false); readonly schedulingRow = signal<Row | null>(null); readonly currentHr = signal<Employee | null>(null); readonly scheduling = signal(false); readonly scheduleError = signal(''); readonly acceptingApplicationId = signal<number | null>(null); readonly deletingApplicationIds = signal<ReadonlySet<number>>(new Set()); readonly deletingDisplayedApplications = signal(false); readonly pendingApplicationAction = signal<PendingApplicationAction | null>(null); readonly pendingDisplayedDeletion = signal(false);
  readonly employeeForm = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [
      Validators.required,
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,128}$/)
    ]],
    phone: ['', [Validators.required, Validators.pattern(/^\+?[0-9]{8,15}$/)]],
    hireDate: ['', Validators.required],
    position: ['', Validators.required],
    roleId: [0, Validators.min(1)],
    departmentId: [0, Validators.min(1)]
  });
  readonly interviewTypes: InterviewType[] = ['ONLINE', 'ONSITE', 'PHONE'];
  readonly hrInterviewForm = this.fb.nonNullable.group({ scheduledAt: ['', Validators.required], duration: [60, [Validators.required, Validators.min(15)]], type: ['ONLINE' as InterviewType, Validators.required], meetingLink: [''], location: [''], notes: [''] });
  readonly title = ({ employees: 'Employés', managers: 'Managers', candidates: 'Candidats', applications: 'Candidatures', interviews: 'Entretiens' } as const)[this.mode];
  readonly applicationViews: ReadonlyArray<{ value: ApplicationView; label: string }> = [
    { value: 'all', label: 'Toutes' },
    { value: 'candidates', label: 'Candidats à traiter' },
    { value: 'hrInterview', label: 'Pré-entretien RH' },
    { value: 'rejected', label: 'Rejetées' }
  ];
  readonly assistantScope: HrAssistantScope | null = this.mode === 'applications' ? 'APPLICATIONS' : this.mode === 'candidates' ? 'CANDIDATES' : null;
  readonly pageSize = this.mode === 'applications' ? 50 : 20;
  readonly offerOptions = computed(() => [...new Set(this.rows().flatMap(row => row.offerTitles ?? []))].sort((first, second) => first.localeCompare(second)));
  readonly domainOptions = computed(() => [...new Set(this.rows().flatMap(row => row.domains ?? []))].sort((first, second) => first.localeCompare(second)));
  readonly filtered = computed(() => {
    const term = this.query().toLocaleLowerCase().trim();
    const offer = this.offerFilter();
    const domain = this.domainFilter();
    const assistantIds = this.assistantFilterIds();
    const rows = assistantIds === null ? this.rows() : this.rows().filter(row => assistantIds.includes(row.id));
    const visible = rows.filter(row => this.matchesApplicationView(row) && (!term || `${row.title} ${row.detail} ${row.status} ${row.metadata}`.toLocaleLowerCase().includes(term)) && (!offer || row.offerTitles?.includes(offer)) && (!domain || row.domains?.includes(domain)));
    return [...visible].sort((first, second) => this.sort() === 'matchingScore'
      ? (second.matchingScore ?? Number.NEGATIVE_INFINITY) - (first.matchingScore ?? Number.NEGATIVE_INFINITY)
      : new Date(second.appliedAt ?? 0).getTime() - new Date(first.appliedAt ?? 0).getTime());
  });
  readonly topCandidatesByOffer = computed<OfferRecommendation[]>(() => {
    const byOffer = new Map<number, OfferRecommendation>();
    this.rows().filter(row => row.application && (row.matchingScore ?? -1) >= 70).forEach(row => {
      const application = row.application!;
      const group = byOffer.get(application.jobOfferId) ?? { offerId: application.jobOfferId, offerTitle: row.offerTitle ?? 'Offre non renseignée', candidates: [] };
      group.candidates.push(row);
      byOffer.set(application.jobOfferId, group);
    });
    return [...byOffer.values()].map(group => ({ ...group, candidates: group.candidates.sort((first, second) => (second.matchingScore ?? 0) - (first.matchingScore ?? 0)).slice(0, 2) })).sort((first, second) => first.offerTitle.localeCompare(second.offerTitle));
  });
  constructor() { this.load(); }
  load(nextPage = this.page()): void { this.page.set(nextPage); this.assistantFilterIds.set(null); this.loading.set(true); this.error.set(''); const done = (rows: Row[], total: number) => { this.rows.set(rows); this.total.set(total); this.loading.set(false); };
    if (this.mode === 'employees' || this.mode === 'managers') { forkJoin({ employees: this.api.employees(nextPage, this.pageSize), roles: this.api.roles(), departments: this.api.departments() }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: data => { this.employeeRoles.set(data.roles.content); this.departments.set(data.departments.content); const managerId = data.roles.content.find(role => role.name === 'MANAGER')?.id; const list = this.mode === 'managers' ? data.employees.content.filter(employee => employee.roleId === managerId) : data.employees.content; done(list.map(employee => this.employeeRow(employee, data.roles.content.find(role => role.id === employee.roleId)?.name)), this.mode === 'managers' ? list.length : data.employees.totalElements); }, error: () => this.fail() }); return; }
    if (this.mode === 'candidates') {
      forkJoin({ candidates: this.api.candidates(nextPage, this.pageSize), applications: this.api.applications(0, 100), offers: this.api.offers(0, 100) }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: data => {
          const offers = new Map(data.offers.content.filter(offer => offer.id !== undefined).map(offer => [offer.id!, offer]));
          const applicationsByCandidate = new Map<number, Application[]>();
          data.applications.content.forEach(application => applicationsByCandidate.set(application.candidateId, [...(applicationsByCandidate.get(application.candidateId) ?? []), application]));
          done(data.candidates.content.map(candidate => this.candidateRow(candidate, applicationsByCandidate.get(candidate.id) ?? [], offers)), data.candidates.totalElements);
        },
        error: () => this.fail()
      });
      return;
    }
    if (this.mode === 'applications') {
      const sort = this.sort() === 'matchingScore' ? 'matchingScore,desc' : 'appliedAt,desc';
      const status = this.applicationViewStatus();
      const applications = status
        ? this.api.applicationsByStatus(status, nextPage, this.pageSize, sort)
        : this.api.applications(nextPage, this.pageSize, sort);

      applications.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: page => forkJoin(page.content.map(application => forkJoin({ application: of(application), candidate: this.api.candidate(application.candidateId).pipe(catchError(() => of(null))), offer: this.api.offer(application.jobOfferId).pipe(catchError(() => of(null))), cv: application.cvId && !this.isReadOnly ? this.api.cv(application.cvId).pipe(catchError(() => of(null))) : of(null) }))).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: details => done(details.map(item => this.applicationRow(item.application, item.candidate, item.offer, item.cv)), page.totalElements), error: () => this.fail() }),
        error: () => this.fail()
      });
      return;
    }
    this.api.interviews(nextPage, this.pageSize).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: page => done(page.content.map(interview => this.interviewRow(interview)), page.totalElements), error: () => this.fail() });
  }
  downloadCv(row: Row): void { if (!row.cvId) return; this.api.downloadCv(row.cvId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: blob => { const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = row.cvFileName ?? 'cv.pdf'; anchor.click(); URL.revokeObjectURL(url); }, error: () => this.error.set('Le téléchargement du CV a échoué.') }); }
  analyzeApplication(row: Row): void { if (this.recommendationLoading() !== null) return; this.recommendationLoading.set(row.id); this.recommendationError.set(''); this.api.analyzeApplication(row.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: result => { this.recommendationLoading.set(null); this.selected.set(null); this.recommendation.set({ applicationId: row.id, result }); }, error: () => { this.recommendationLoading.set(null); this.recommendationError.set('Impossible de générer la recommandation IA pour cette candidature.'); } }); }
  openApplicationDetails(row: Row): void { this.selected.set(row); }
  changeSort(value: string): void { const sort = value === 'matchingScore' ? 'matchingScore' : 'appliedAt'; if (this.sort() === sort) return; this.sort.set(sort); this.load(0); }
  selectApplicationView(view: ApplicationView): void { if (this.applicationView() === view) return; this.applicationView.set(view); this.load(0); }
  canReviewApplication(row: Row): boolean { return !this.isReadOnly && row.application?.status === 'SUBMITTED' && row.application.currentTaskDefinitionKey === 'hrCvFiltering'; }
  canScheduleHrInterview(row: Row): boolean { return !this.isReadOnly && row.application?.status === 'HR_INTERVIEW' && row.application.currentTaskDefinitionKey === 'hrInterview'; }
  canReject(row: Row): boolean { return this.canReviewApplication(row); }
  isAcceptingApplication(id: number): boolean { return this.acceptingApplicationId() === id; }
  isDeletingApplication(id: number): boolean { return this.deletingApplicationIds().has(id); }
  canDeleteApplication(row: Row): boolean { return !['HR_INTERVIEW', 'TECHNICAL_INTERVIEW', 'MANAGER_INTERVIEW', 'REJECTED', 'HIRED', 'CLOSED'].includes(row.application?.status ?? ''); }
  deletableApplications(): Row[] { return this.filtered().filter(row => this.canDeleteApplication(row)); }
  requestDeleteDisplayedApplications(): void { if (!this.isReadOnly && this.deletableApplications().length && !this.deletingDisplayedApplications()) this.pendingDisplayedDeletion.set(true); }
  requestApplicationAction(kind: PendingApplicationAction['kind'], row: Row): void {
    if ((kind === 'accept' && !this.canReviewApplication(row))
      || (kind === 'reject' && !this.canReject(row))
      || (kind === 'delete' && (!this.canDeleteApplication(row) || this.isDeletingApplication(row.id)))) return;
    this.pendingApplicationAction.set({ kind, row });
  }
  closeApplicationAction(): void { this.pendingApplicationAction.set(null); }
  applicationActionTitle(): string {
    switch (this.pendingApplicationAction()?.kind) {
      case 'accept': return 'Accepter cette candidature ?';
      case 'reject': return 'Rejeter cette candidature ?';
      case 'delete': return 'Supprimer cette candidature ?';
      default: return 'Confirmer cette action';
    }
  }
  applicationActionDescription(): string {
    const pending = this.pendingApplicationAction();
    if (!pending) return '';
    if (pending.kind === 'accept') return `Le CV de ${pending.row.title} sera accepté et vous pourrez planifier immédiatement son entretien RH.`;
    if (pending.kind === 'reject') return `La candidature de ${pending.row.title} sera rejetée et le candidat sera notifié.`;
    return `La candidature de ${pending.row.title} sera supprimée définitivement.`;
  }
  applicationActionLabel(): string {
    switch (this.pendingApplicationAction()?.kind) {
      case 'accept': return 'Accepter et planifier';
      case 'reject': return 'Rejeter';
      case 'delete': return 'Supprimer';
      default: return 'Confirmer';
    }
  }
  isApplicationActionPending(): boolean {
    const pending = this.pendingApplicationAction();
    return !!pending && (this.isAcceptingApplication(pending.row.id) || this.isDeletingApplication(pending.row.id));
  }
  confirmApplicationAction(): void {
    const pending = this.pendingApplicationAction();
    if (!pending) return;
    this.pendingApplicationAction.set(null);
    if (pending.kind === 'accept') this.acceptApplication(pending.row);
    else if (pending.kind === 'reject') this.rejectApplication(pending.row);
    else this.deleteApplication(pending.row);
  }
  workflowActionMessage(row: Row): string {
    if (!row.application?.processInstanceId || !row.application.currentTaskId) {
      return 'Cette candidature historique n’est liée à aucun processus actif. Supprimez-la puis créez une nouvelle candidature pour tester la décision RH.';
    }
    return `Les actions seront disponibles quand la candidature arrivera à l’étape Filtrage CV RH${row.application.currentTaskName ? ` (étape actuelle : ${row.application.currentTaskName})` : ''}.`;
  }
  acceptApplication(row: Row): void {
    const taskId = row.application?.currentTaskId;
    if (!this.canReviewApplication(row) || !taskId || this.isAcceptingApplication(row.id)) return;
    this.acceptingApplicationId.set(row.id);
    this.api.completeWorkflowTask(taskId, { hrCvApproved: true, hrCvComment: 'CV accepté lors du filtrage RH.' }).pipe(
      switchMap(() => row.application?.processInstanceId
        ? this.api.workflowTasksByProcess(row.application.processInstanceId).pipe(catchError(() => of<WorkflowTask[]>([])))
        : of<WorkflowTask[]>([])
      ),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: tasks => {
        this.acceptingApplicationId.set(null);
        const hrInterviewTask = tasks.find(task => task.taskDefinitionKey === 'hrInterview');
        const updatedRow = this.patchApplicationRow(row.id, {
          status: 'HR_INTERVIEW',
          currentTaskId: hrInterviewTask?.taskId,
          currentTaskDefinitionKey: hrInterviewTask?.taskDefinitionKey ?? 'hrInterview',
          currentTaskName: hrInterviewTask?.taskName ?? 'HR Interview',
          updatedAt: new Date().toISOString()
        }) ?? row;
        this.selected.set(null);
        this.openHrInterviewSchedule(updatedRow, true);
        this.snackbar.success('CV accepté. Planifiez maintenant l’entretien RH avec ce candidat.');
        this.changeDetectorRef.markForCheck();
      },
      error: () => {
        this.acceptingApplicationId.set(null);
        this.error.set('L’acceptation de la candidature a échoué.');
      }
    });
  }
  openHrInterviewSchedule(row: Row, afterCvFiltering = false): void { if (!afterCvFiltering && !this.canScheduleHrInterview(row)) return; this.scheduleError.set(''); this.schedulingRow.set(row); this.scheduleDialog.set(true); this.api.currentEmployee().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: employee => this.currentHr.set(employee), error: () => this.scheduleError.set('Impossible de récupérer votre profil RH.') }); }
  closeHrInterviewSchedule(): void { this.scheduleDialog.set(false); this.schedulingRow.set(null); this.currentHr.set(null); this.scheduleError.set(''); this.hrInterviewForm.reset({ scheduledAt: '', duration: 60, type: 'ONLINE', meetingLink: '', location: '', notes: '' }); }
  scheduleHrInterview(): void { const row = this.schedulingRow(); const interviewer = this.currentHr(); if (!row || !interviewer || this.hrInterviewForm.invalid) { this.hrInterviewForm.markAllAsTouched(); return; } const raw = this.hrInterviewForm.getRawValue(); this.scheduling.set(true); this.scheduleError.set(''); const modeDetail = raw.type === 'ONLINE' ? `Lien : ${raw.meetingLink.trim() || 'non renseigné'}` : raw.type === 'ONSITE' ? `Lieu : ${raw.location.trim() || 'non renseigné'}` : 'Téléphone'; const notes = ['Entretien RH', raw.notes.trim()].filter(Boolean).join(' · '); const interview: Interview = { applicationId: row.id, interviewerId: interviewer.id, scheduledAt: new Date(raw.scheduledAt).toISOString(), duration: raw.duration, type: raw.type, stage: 'HR_INTERVIEW', meetingLink: raw.meetingLink.trim() || undefined, location: raw.location.trim() || undefined, notes }; this.api.createInterview(interview).pipe(switchMap(created => row.candidate ? this.api.notifyCandidate(row.candidate, row.id, 'INTERVIEW_SCHEDULED', 'Votre entretien RH est programmé', `Votre entretien RH est programmé le ${new Date(raw.scheduledAt).toLocaleString('fr-FR')}. ${modeDetail}.`).pipe(map(() => created), catchError(() => of(created))) : of(created)), takeUntilDestroyed(this.destroyRef)).subscribe({ next: () => { this.scheduling.set(false); this.patchApplicationRow(row.id, { currentTaskName: 'HR Interview · entretien planifié', updatedAt: new Date().toISOString() }); this.closeHrInterviewSchedule(); this.snackbar.success('Entretien RH créé à votre nom et candidat notifié.'); this.changeDetectorRef.markForCheck(); }, error: () => { this.scheduling.set(false); this.scheduleError.set('La planification de l’entretien RH a échoué.'); } }); }
  rejectApplication(row: Row): void { const taskId = row.application?.currentTaskId; if (!this.canReject(row) || !taskId) return; this.acceptingApplicationId.set(row.id); this.api.completeWorkflowTask(taskId, { hrCvApproved: false, hrCvComment: 'Candidature rejetée lors du filtrage CV RH.' }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: () => { this.acceptingApplicationId.set(null); this.patchApplicationRow(row.id, { status: 'REJECTED', currentTaskId: undefined, currentTaskDefinitionKey: undefined, currentTaskName: 'Candidature rejetée', updatedAt: new Date().toISOString() }); this.selected.set(null); this.snackbar.success('Candidature rejetée et candidat notifié.'); this.changeDetectorRef.markForCheck(); }, error: () => { this.acceptingApplicationId.set(null); this.error.set('Le rejet de la candidature a échoué.'); } }); }
  deleteApplication(row: Row): void {
    if (this.isReadOnly || !this.canDeleteApplication(row) || this.isDeletingApplication(row.id)) return;
    this.deletingApplicationIds.update(ids => new Set(ids).add(row.id));
    this.api.deleteApplication(row.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.deletingApplicationIds.update(ids => { const next = new Set(ids); next.delete(row.id); return next; });
        this.selected.set(null);
        this.rows.update(rows => rows.filter(item => item.id !== row.id));
        this.total.update(total => Math.max(0, total - 1));
        this.snackbar.success('Candidature supprimée. Le candidat peut de nouveau postuler à cette offre.');
        this.changeDetectorRef.markForCheck();
      },
      error: () => {
        this.deletingApplicationIds.update(ids => { const next = new Set(ids); next.delete(row.id); return next; });
        this.error.set('La suppression de la candidature a échoué.');
      }
    });
  }
  deleteDisplayedApplications(): void {
    const applications = this.deletableApplications();
    if (this.isReadOnly || !applications.length || this.deletingDisplayedApplications()) return;
    this.pendingDisplayedDeletion.set(false);
    this.deletingDisplayedApplications.set(true);
    forkJoin(applications.map(row => this.api.deleteApplication(row.id).pipe(map(() => true), catchError(() => of(false))))).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: results => {
        this.deletingDisplayedApplications.set(false);
        const deleted = results.filter(Boolean).length;
        this.selected.set(null);
        const deletedIds = new Set(applications.filter((_, index) => results[index]).map(row => row.id));
        this.rows.update(rows => rows.filter(row => !deletedIds.has(row.id)));
        this.total.update(total => Math.max(0, total - deleted));
        this.snackbar.success(`${deleted} candidature(s) supprimée(s).`);
        if (deleted !== applications.length) this.error.set('Certaines candidatures n’ont pas pu être supprimées.');
        this.changeDetectorRef.markForCheck();
      },
      error: () => {
        this.deletingDisplayedApplications.set(false);
        this.error.set('La suppression des candidatures a échoué.');
      }
    });
  }
  scoreGradient(score?: number): string { if (score === undefined || score === null) return '#8a9bb8'; return score >= 70 ? '#1d4ed8' : score >= 50 ? '#4f7fe4' : '#6f81a3'; }
  openEmployeeDialog(): void {
    this.employeeError.set('');
    this.employeeDialog.set(true);

    if (this.employeeRoles().length && this.departments().length) return;

    this.employeeOptionsLoading.set(true);
    forkJoin({ roles: this.api.roles(), departments: this.api.departments() }).pipe(
      finalize(() => this.employeeOptionsLoading.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: data => {
        this.employeeRoles.set(data.roles.content);
        this.departments.set(data.departments.content);
        if (!data.roles.content.length || !data.departments.content.length) {
          this.employeeError.set('Créez au moins un rôle et un département avant d’ajouter un employé.');
        }
      },
      error: () => this.employeeError.set('Impossible de charger les rôles et les départements. Réessayez après reconnexion.')
    });
  }

  closeEmployeeDialog(): void {
    if (this.employeeSubmitting()) return;
    this.employeeDialog.set(false);
    this.employeeError.set('');
    this.employeeForm.reset({ roleId: 0, departmentId: 0 });
  }

  createEmployee(): void {
    if (this.employeeSubmitting()) return;

    if (this.employeeOptionsLoading()) {
      this.employeeError.set('Attendez la fin du chargement des rôles et des départements.');
      return;
    }

    if (this.employeeForm.invalid) {
      this.employeeForm.markAllAsTouched();
      this.employeeError.set('Vérifiez les champs signalés avant de créer l’employé.');
      return;
    }

    const raw = this.employeeForm.getRawValue();
    const request: CreateEmployeeRequest = {
      ...raw,
      firstName: raw.firstName.trim(),
      lastName: raw.lastName.trim(),
      email: raw.email.trim(),
      phone: raw.phone.trim(),
      position: raw.position.trim()
    };

    this.employeeError.set('');
    this.employeeSubmitting.set(true);
    this.api.createEmployee(request).pipe(
      finalize(() => this.employeeSubmitting.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.employeeSubmitting.set(false);
        this.employeeSuccess.set('');
        this.closeEmployeeDialog();
        this.snackbar.success('Employé créé et compte Keycloak initialisé.');
        this.load(0);
      },
      error: (response: HttpErrorResponse) => this.employeeError.set(this.employeeCreationError(response))
    });
  }

  private employeeCreationError(response: HttpErrorResponse): string {
    if (response.status === 400) return 'Les données sont invalides. Vérifiez notamment le téléphone et le mot de passe.';
    if (response.status === 401) return 'Votre session a expiré. Reconnectez-vous puis réessayez.';
    if (response.status === 403) return 'Seul un utilisateur RH peut créer un employé.';
    if (response.status === 409) return 'Cet email, ce numéro de téléphone ou ce profil est déjà utilisé.';
    return 'La création de l’employé a échoué.';
  }
  private matchesApplicationView(row: Row): boolean {
    if (this.mode !== 'applications' || !row.application) return true;
    if (this.applicationView() === 'candidates') return row.application.status === 'SUBMITTED';
    if (this.applicationView() === 'hrInterview') return row.application.status === 'HR_INTERVIEW';
    if (this.applicationView() === 'rejected') return row.application.status === 'REJECTED';
    return true;
  }
  private patchApplicationRow(id: number, patch: Partial<Application>): Row | null {
    let updatedRow: Row | null = null;
    const update = (row: Row): Row => {
      if (row.id !== id || !row.application) return row;
      updatedRow = {
        ...row,
        status: patch.status ?? row.status,
        application: { ...row.application, ...patch }
      };
      return updatedRow;
    };
    this.rows.update(rows => rows.map(update));
    const selected = this.selected();
    if (selected) this.selected.set(update(selected));
    this.changeDetectorRef.markForCheck();
    return updatedRow;
  }
  private applicationViewStatus(): Application['status'] | null {
    switch (this.applicationView()) {
      case 'candidates': return 'SUBMITTED';
      case 'hrInterview': return 'HR_INTERVIEW';
      case 'rejected': return 'REJECTED';
      default: return null;
    }
  }
  private fail(): void { this.error.set('Impossible de charger les données demandées.'); this.loading.set(false); }
  private employeeRow(employee: Employee, role?: string): Row { return { id: employee.id, title: `${employee.firstName} ${employee.lastName}`, detail: `${employee.position} · ${employee.email}`, status: role ?? 'Rôle non renseigné', metadata: `Département associé · Depuis ${employee.hireDate}`, keycloakId: employee.keycloakId }; }
  private candidateRow(candidate: Candidate, applications: Application[] = [], offers: Map<number, JobOffer> = new Map()): Row { const linkedOffers = applications.map(application => offers.get(application.jobOfferId)).filter((offer): offer is JobOffer => !!offer); const offerTitles = [...new Set(linkedOffers.map(offer => offer.title))]; const domains = [...new Set(linkedOffers.map(offer => offer.domain?.trim() || 'Général'))]; return { id: candidate.id, title: `${candidate.firstName} ${candidate.lastName}`, detail: candidate.email, status: candidate.available ? 'Disponible' : 'Indisponible', metadata: [candidate.location, offerTitles.length ? `Offres : ${offerTitles.join(', ')}` : 'Aucune candidature associée'].filter(Boolean).join(' · '), keycloakId: candidate.keycloakId, offerTitles, domains }; }
  private applicationRow(application: Application, candidate: Candidate | null, offer: JobOffer | null, cv: CvFile | null): Row { const candidateName = candidate ? `${candidate.firstName} ${candidate.lastName}` : 'Candidat non renseigné'; const offerDetail = offer ? `${offer.title} · ${offer.location}` : 'Offre non renseignée'; const cvState = application.cvId ? (cv ? `CV ${cv.active ? 'actif' : 'inactif'} · ${cv.fileName}` : 'CV indisponible') : 'CV non envoyé'; const offerTitle = offer?.title ?? 'Offre non renseignée'; const domain = offer?.domain?.trim() || 'Général'; const appliedAt = application.appliedAt; const isNew = application.status === 'SUBMITTED' && !!appliedAt && Date.now() - new Date(appliedAt).getTime() < 48 * 60 * 60 * 1000; return { id: application.id, title: candidateName, detail: offerDetail, status: application.status, metadata: `${cvState} · ${application.currentStep ?? 'Étape non renseignée'}`, cvId: application.cvId, cvFileName: cv?.fileName, candidate: candidate ?? undefined, application, offerTitle, offerTitles: [offerTitle], domains: [domain], appliedAt, matchingScore: application.matchingScore, isNew }; }
  private interviewRow(interview: Interview): Row { return { id: interview.id ?? 0, title: 'Entretien planifié', detail: 'Candidature et intervieweur associés', status: interview.status ?? 'SCHEDULED', metadata: `${new Date(interview.scheduledAt).toLocaleString()} · ${interview.type}` }; }
}
