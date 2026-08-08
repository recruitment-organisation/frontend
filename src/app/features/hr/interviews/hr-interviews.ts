import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HrData } from '../../../core/services/hr-data';
import { Application, Candidate, Employee, Interview, InterviewStatus, InterviewType, JobOffer } from '../../../core/models/hr';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header';
import { DialogComponent } from '../../../shared/components/dialog/dialog';
import { Snackbar } from '../../../core/services/snackbar';

type ApplicationOption = { id: number; candidateName: string; offerTitle: string; candidate?: Candidate };
type TechScheduleContext = { application: Application; candidateName: string; offerTitle: string; candidate?: Candidate | null };

@Component({ selector: 'app-hr-interviews', standalone: false, templateUrl: './hr-interviews.html', styleUrl: './hr-interviews.css' })
export class HrInterviewsComponent {
  private readonly fb = inject(FormBuilder); private readonly api = inject(HrData); private readonly destroyRef = inject(DestroyRef); private readonly route = inject(ActivatedRoute); private readonly router = inject(Router); private readonly snackbar = inject(Snackbar);
  readonly interviews = signal<Interview[]>([]); readonly applications = signal<ApplicationOption[]>([]); readonly interviewers = signal<Employee[]>([]); readonly candidateSearch = signal(''); readonly error = signal(''); readonly success = signal(''); readonly loading = signal(false); readonly optionsLoading = signal(false); readonly scheduleDialog = signal(false); readonly feedbackDialog = signal(false); readonly techScheduleDialog = signal(false); readonly techScheduleError = signal(''); readonly techOptionsLoading = signal(false); readonly techScheduling = signal(false); readonly selectedInterview = signal<Interview | null>(null); readonly techContext = signal<TechScheduleContext | null>(null); readonly completing = signal(false); readonly types: InterviewType[] = ['ONLINE','ONSITE','PHONE'];
  readonly filteredApplications = computed(() => { const term = this.candidateSearch().trim().toLocaleLowerCase(); return term ? this.applications().filter(application => application.candidateName.toLocaleLowerCase().includes(term)) : this.applications(); });
  readonly form = this.fb.nonNullable.group({ applicationId: [0, [Validators.required, Validators.min(1)]], interviewerId: [0, [Validators.required, Validators.min(1)]], scheduledAt: ['', Validators.required], duration: [60, [Validators.required, Validators.min(15)]], type: ['ONLINE' as InterviewType, Validators.required], meetingLink: [''], location: [''], notes: [''] });
  readonly feedbackForm = this.fb.nonNullable.group({ feedback: ['', Validators.required], notes: [''], result: ['PASSED' as NonNullable<Interview['result']>, Validators.required] });
  readonly techForm = this.fb.nonNullable.group({ applicationId: [0, [Validators.required, Validators.min(1)]], interviewerId: [0, [Validators.required, Validators.min(1)]], scheduledAt: ['', Validators.required], duration: [60, [Validators.required, Validators.min(15)]], type: ['ONLINE' as InterviewType, Validators.required], meetingLink: [''], location: [''], notes: [''] });
  constructor(){this.load(); this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => { const applicationId = Number(params.get('applicationId')); const technicalApplicationId = Number(params.get('technicalApplicationId')); if (Number.isInteger(technicalApplicationId) && technicalApplicationId > 0) this.openTechScheduleDialog(technicalApplicationId); else if (Number.isInteger(applicationId) && applicationId > 0) this.openScheduleDialog(applicationId); });}
  load():void{this.loading.set(true);this.api.interviews(0,100).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({next:page=>{this.interviews.set(page.content);this.loading.set(false);},error:()=>{this.error.set('Impossible de charger les entretiens.');this.loading.set(false);}});}
  openScheduleDialog(applicationId?: number): void { this.error.set(''); this.success.set(''); this.scheduleDialog.set(true); this.optionsLoading.set(true); forkJoin({ applications: this.api.applications(0, 100), candidates: this.api.candidates(0, 100), offers: this.api.offers(0, 100), interviewers: this.api.employees(0, 100) }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: data => { this.applications.set(this.applicationOptions(data.applications.content, data.candidates.content, data.offers.content)); this.interviewers.set(data.interviewers.content); if (applicationId && this.applications().some(application => application.id === applicationId)) { const selected = this.applications().find(application => application.id === applicationId)!; this.form.controls.applicationId.setValue(applicationId); this.candidateSearch.set(selected.candidateName); } this.optionsLoading.set(false); }, error: () => { this.error.set('Impossible de charger les candidatures et les intervieweurs.'); this.optionsLoading.set(false); } }); }
  closeScheduleDialog(): void { this.scheduleDialog.set(false); this.candidateSearch.set(''); this.form.reset({ applicationId: 0, interviewerId: 0, scheduledAt: '', duration: 60, type: 'ONLINE', meetingLink: '', location: '', notes: '' }); this.router.navigate([], { relativeTo: this.route, queryParams: { applicationId: null }, queryParamsHandling: 'merge', replaceUrl: true }); }
  filterCandidates(value: string): void { this.candidateSearch.set(value); }
  schedule():void{if(this.form.invalid){this.form.markAllAsTouched();return;}const raw=this.form.getRawValue();const request:Interview={...raw,scheduledAt:new Date(raw.scheduledAt).toISOString()};const selected = this.applications().find(application => application.id === raw.applicationId);const modeDetail = raw.type === 'ONLINE' ? `Lien : ${raw.meetingLink.trim() || 'non renseigné'}` : raw.type === 'ONSITE' ? `Lieu : ${raw.location.trim() || 'non renseigné'}` : 'Téléphone';this.api.createInterview(request).pipe(switchMap(interview => selected?.candidate ? this.api.notifyCandidate(selected.candidate, raw.applicationId, 'INTERVIEW_SCHEDULED', 'Votre entretien est programmé', `Un entretien est programmé le ${new Date(raw.scheduledAt).toLocaleString('fr-FR')}. ${modeDetail}.`).pipe(map(() => interview),catchError(() => of(interview))) : of(interview)),takeUntilDestroyed(this.destroyRef)).subscribe({next:()=>{this.success.set('');this.closeScheduleDialog();this.snackbar.success('Entretien programmé et candidat notifié.');this.load();},error:()=>this.error.set('La programmation a échoué.')});}
  cancel(interview:Interview):void{if(!interview.id||!confirm('Annuler cet entretien ?'))return;this.api.updateInterviewStatus(interview.id,'CANCELLED').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({next:()=>{this.snackbar.success('Entretien annulé.');this.load();},error:()=>this.error.set('L’annulation a échoué.')});}
  viewDetails(interview: Interview): void { if (interview.id) this.router.navigate(['/hr/interviews', interview.id]); }
  start(interview: Interview): void { if (!interview.id) return; this.api.updateInterviewStatus(interview.id, 'IN_PROGRESS').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: () => { this.snackbar.success('Entretien démarré.'); this.load(); }, error: () => this.error.set('Impossible de démarrer cet entretien.') }); }
  openFeedback(interview: Interview): void { if (!interview.id || interview.status !== 'IN_PROGRESS') return; this.selectedInterview.set(interview); this.feedbackForm.reset({ feedback: '', notes: '', result: 'PASSED' }); this.feedbackDialog.set(true); }
  closeFeedback(): void { this.feedbackDialog.set(false); this.selectedInterview.set(null); this.feedbackForm.reset({ feedback: '', notes: '', result: 'PASSED' }); }
  closeTechScheduleDialog(): void { this.techScheduleDialog.set(false); this.techContext.set(null); this.techScheduleError.set(''); this.techForm.reset({ applicationId: 0, interviewerId: 0, scheduledAt: '', duration: 60, type: 'ONLINE', meetingLink: '', location: '', notes: '' }); this.router.navigate([], { relativeTo: this.route, queryParams: { technicalApplicationId: null }, queryParamsHandling: 'merge', replaceUrl: true }); }
  openTechScheduleDialog(applicationId: number): void {
    this.techScheduleError.set('');
    this.techOptionsLoading.set(true);
    this.techScheduleDialog.set(true);
    this.api.application(applicationId).pipe(
      switchMap(application => forkJoin({
        application: of(application),
        candidate: this.api.candidate(application.candidateId).pipe(catchError(() => of(null))),
        offer: this.api.offer(application.jobOfferId).pipe(catchError(() => of(null))),
        interviewers: this.api.employees(0, 100)
      })),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: data => {
        if (data.application.currentTaskDefinitionKey !== 'technicalInterview') {
          this.techOptionsLoading.set(false);
          this.techScheduleError.set('Le workflow n’est pas encore passé à l’entretien technique.');
          return;
        }
        this.techContext.set({
          application: data.application,
          candidateName: data.candidate ? `${data.candidate.firstName} ${data.candidate.lastName}` : `Candidat #${data.application.candidateId}`,
          offerTitle: data.offer?.title ?? `Offre #${data.application.jobOfferId}`,
          candidate: data.candidate
        });
        this.interviewers.set(data.interviewers.content);
        this.techForm.reset({
          applicationId: data.application.id,
          interviewerId: 0,
          scheduledAt: '',
          duration: 60,
          type: 'ONLINE',
          meetingLink: '',
          location: '',
          notes: ''
        });
        this.techOptionsLoading.set(false);
      },
      error: () => {
        this.techOptionsLoading.set(false);
        this.techScheduleError.set('Impossible de charger le formulaire d’entretien manager.');
      }
    });
  }
  scheduleTechInterview(): void {
    const context = this.techContext();
    if (!context || this.techForm.invalid) {
      this.techForm.markAllAsTouched();
      return;
    }
    const raw = this.techForm.getRawValue();
    const selected = context.candidate;
    this.techScheduling.set(true);
    this.techScheduleError.set('');
    const notes = ['Entretien technique', raw.notes.trim()].filter(Boolean).join(' · ');
    const modeDetail = raw.type === 'ONLINE' ? `Lien : ${raw.meetingLink.trim() || 'non renseigné'}` : raw.type === 'ONSITE' ? `Lieu : ${raw.location.trim() || 'non renseigné'}` : 'Téléphone';
    const interview: Interview = {
      applicationId: context.application.id,
      interviewerId: raw.interviewerId,
      scheduledAt: new Date(raw.scheduledAt).toISOString(),
      duration: raw.duration,
      type: raw.type,
      meetingLink: raw.meetingLink.trim() || undefined,
      location: raw.location.trim() || undefined,
      notes
    };
    this.api.createInterview(interview).pipe(
      switchMap(created => selected
        ? this.api.notifyCandidate(
            selected,
            context.application.id,
            'INTERVIEW_SCHEDULED',
            'Votre entretien technique est programmé',
            `Votre entretien technique est programmé le ${new Date(raw.scheduledAt).toLocaleString('fr-FR')}. ${modeDetail}.`
          ).pipe(map(() => created), catchError(() => of(created)))
        : of(created)
      ),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.techScheduling.set(false);
        this.closeTechScheduleDialog();
        this.snackbar.success('Entretien technique créé ; le candidat et l’intervieweur sont notifiés.');
        this.load();
      },
      error: () => {
        this.techScheduling.set(false);
        this.techScheduleError.set('La planification de l’entretien technique a échoué.');
      }
    });
  }
  completeInterview(): void {
    const interview = this.selectedInterview();
    if (!interview?.id || this.feedbackForm.invalid) {
      this.feedbackForm.markAllAsTouched();
      return;
    }
    const raw = this.feedbackForm.getRawValue();
    const approved = raw.result === 'PASSED';
    this.completing.set(true);
    this.error.set('');
    this.api.addInterviewFeedback(interview.id, raw.feedback, raw.notes, raw.result).pipe(
      switchMap(completed => approved
        ? this.api.application(completed.applicationId).pipe(map(application => ({ completed, application })))
        : of({ completed, application: null as Application | null })
      ),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: payload => {
        this.completing.set(false);
        this.closeFeedback();
        this.snackbar.success('Résultat enregistré et workflow mis à jour.');
        this.load();
        if (approved && payload.completed.stage === 'HR_INTERVIEW' && payload.application?.currentTaskDefinitionKey === 'technicalInterview') {
          this.openTechScheduleDialog(payload.completed.applicationId);
        }
      },
      error: () => {
        this.completing.set(false);
        this.error.set('L’entretien est terminé, mais le workflow doit être réessayé.');
      }
    });
  }
  isHrInterview(interview: Interview): boolean { return interview.stage === 'HR_INTERVIEW' || interview.notes?.startsWith('Entretien RH') === true; }
  private applicationOptions(applications: Application[], candidates: Candidate[], offers: JobOffer[]): ApplicationOption[] { const candidatesById = new Map(candidates.map(candidate => [candidate.id, candidate])); const offersById = new Map(offers.filter(offer => offer.id !== undefined).map(offer => [offer.id!, offer])); return applications.map(application => { const candidate = candidatesById.get(application.candidateId); const offer = offersById.get(application.jobOfferId); return { id: application.id, candidateName: candidate ? `${candidate.firstName} ${candidate.lastName}` : `Candidat indisponible`, offerTitle: offer?.title ?? `Offre #${application.jobOfferId}`, candidate }; }).sort((first, second) => first.candidateName.localeCompare(second.candidateName)); }
}
