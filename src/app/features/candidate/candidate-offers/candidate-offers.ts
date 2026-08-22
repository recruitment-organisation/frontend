import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CandidateData } from '../../../core/services/candidate-data';
import { JobOffer } from '../../../core/models/hr';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header';
import { DialogComponent } from '../../../shared/components/dialog/dialog';
import { Snackbar } from '../../../core/services/snackbar';

@Component({
  selector: 'app-candidate-offers',
  standalone: false,
  templateUrl: './candidate-offers.html',
  styleUrl: './candidate-offers.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CandidateOffersComponent {
  private readonly api = inject(CandidateData);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly snackbar = inject(Snackbar);
  readonly offers = signal<JobOffer[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly detailOffer = signal<JobOffer | null>(null);
  readonly selectedOffer = signal<JobOffer | null>(null);
  readonly selectedCv = signal<File | null>(null);
  readonly applicationError = signal('');
  readonly applying = signal(false);
  readonly titleFilter = signal('');
  readonly domainFilter = signal('');
  readonly appliedOfferIds = signal<ReadonlySet<number>>(new Set());
  readonly domains = computed(() => [...new Set(this.offers().map(offer => offer.domain?.trim() || 'Général'))].sort((first, second) => first.localeCompare(second)));
  readonly filteredOffers = computed(() => {
    const title = this.titleFilter().trim().toLocaleLowerCase();
    const domain = this.domainFilter();
    return this.offers().filter(offer => (!title || offer.title.toLocaleLowerCase().includes(title)) && (!domain || (offer.domain?.trim() || 'Général') === domain));
  });
  readonly applicationForm = this.fb.nonNullable.group({ confirm: [false, Validators.requiredTrue] });

  constructor() { this.load(); }

  load(): void {
    this.loading.set(true); this.error.set('');
    this.api.openOffers().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: response => { this.offers.set(response.content); this.loading.set(false); },
      error: () => { this.error.set('Impossible de charger les offres.'); this.loading.set(false); }
    });
    this.api.applications(0, 100).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: response => this.appliedOfferIds.set(new Set(response.content.map(application => application.jobOfferId))),
      error: () => this.appliedOfferIds.set(new Set())
    });
  }

  openApplicationDialog(offer: JobOffer): void {
    if (!offer.id || this.hasApplied(offer)) return;
    this.applicationError.set('');
    this.selectedCv.set(null);
    this.applicationForm.reset({ confirm: false });
    this.selectedOffer.set(offer);
  }

  openOfferDetails(offer: JobOffer): void {
    this.detailOffer.set(offer);
  }

  closeOfferDetails(): void {
    this.detailOffer.set(null);
  }

  applyFromDetails(offer: JobOffer): void {
    this.closeOfferDetails();
    this.openApplicationDialog(offer);
  }

  closeApplicationDialog(): void {
    if (this.applying()) return;
    this.selectedOffer.set(null);
    this.selectedCv.set(null);
    this.applicationError.set('');
    this.applicationForm.reset({ confirm: false });
  }

  selectCv(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.item(0) ?? null;
    if (!file) return;
    if (!file.name.toLocaleLowerCase().endsWith('.pdf') || (file.type && file.type !== 'application/pdf')) {
      this.selectedCv.set(null);
      this.applicationError.set('Le CV doit être au format PDF.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.selectedCv.set(null);
      this.applicationError.set('Le CV ne doit pas dépasser 10 Mo.');
      return;
    }
    this.applicationError.set('');
    this.selectedCv.set(file);
  }

  apply(): void {
    const offer = this.selectedOffer();
    const cv = this.selectedCv();
    if (this.applicationForm.invalid || !offer?.id || !cv) {
      this.applicationForm.markAllAsTouched();
      if (!cv) this.applicationError.set('Ajoutez votre CV PDF pour envoyer la candidature.');
      return;
    }
    this.applying.set(true);
    this.applicationError.set('');
    this.api.applyToOffer(offer.id, cv).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.appliedOfferIds.update(ids => new Set([...ids, offer.id!]));
        this.applying.set(false);
        this.closeApplicationDialog();
        this.snackbar.success('Votre candidature a été envoyée. Le suivi du workflow est maintenant disponible.');
        void this.router.navigate(['/candidate/applications']);
      },
      error: (response: HttpErrorResponse) => {
        this.applying.set(false);
        this.applicationError.set(response.status === 409 ? 'Vous avez déjà postulé à cette offre.' : 'La candidature n’a pas pu être envoyée. Vérifiez votre CV puis réessayez.');
      }
    });
  }

  hasApplied(offer: JobOffer): boolean {
    return offer.id !== undefined && this.appliedOfferIds().has(offer.id);
  }
}
