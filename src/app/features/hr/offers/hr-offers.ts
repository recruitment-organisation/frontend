import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HrData } from '../../../core/services/hr-data';
import { JobOffer } from '../../../core/models/hr';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header';
import { HrAssistantComponent } from '../../../shared/components/hr-assistant/hr-assistant';
import { DialogComponent } from '../../../shared/components/dialog/dialog';
import { Snackbar } from '../../../core/services/snackbar';

const validDateRange: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const openingDate = control.get('openingDate')?.value as string | undefined;
  const closingDate = control.get('closingDate')?.value as string | undefined;
  return openingDate && closingDate && closingDate < openingDate
    ? { invalidDateRange: true }
    : null;
};

@Component({
  selector: 'app-hr-offers',
  standalone: false,
  templateUrl: './hr-offers.html',
  styleUrl: './hr-offers.css',
})
export class HrOffersComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(HrData);
  private readonly destroyRef = inject(DestroyRef);
  private readonly snackbar = inject(Snackbar);
  readonly offers = signal<JobOffer[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly offerError = signal('');
  readonly editingId = signal<number | null>(null);
  readonly assistantFilterIds = signal<number[] | null>(null);
  readonly offerDialog = signal(false);
  readonly statuses: JobOffer['status'][] = ['DRAFT', 'OPEN', 'CLOSED', 'CANCELLED'];
  readonly types: JobOffer['employmentType'][] = [
    'CDI',
    'CDD',
    'INTERNSHIP',
    'FREELANCE',
    'PART_TIME',
    'FULL_TIME',
  ];
  readonly levels: JobOffer['experienceLevel'][] = ['JUNIOR', 'MID', 'SENIOR', 'LEAD'];
  readonly filteredOffers = computed(() => {
    const ids = this.assistantFilterIds();
    return ids === null
      ? this.offers()
      : this.offers().filter((offer) => offer.id !== undefined && ids.includes(offer.id));
  });
  readonly form = this.fb.nonNullable.group(
    {
      title: ['', [Validators.required, Validators.maxLength(100)]],
      domain: ['Général', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.maxLength(3000)]],
      location: ['', Validators.required],
      employmentType: ['CDI' as JobOffer['employmentType'], Validators.required],
      experienceLevel: ['MID' as JobOffer['experienceLevel'], Validators.required],
      openingDate: ['', Validators.required],
      closingDate: ['', Validators.required],
      status: ['DRAFT' as JobOffer['status'], Validators.required],
      requirements: this.fb.nonNullable.array([this.requirement()]),
      skills: this.fb.nonNullable.array([this.skill()]),
    },
    { validators: validDateRange },
  );
  get requirements(): FormArray {
    return this.form.controls.requirements;
  }
  get skills(): FormArray {
    return this.form.controls.skills;
  }
  constructor() {
    this.load();
  }
  load(): void {
    this.loading.set(true);
    this.api
      .offers(0, 100)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => {
          this.offers.set(page.content);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Impossible de charger les offres.');
          this.loading.set(false);
        },
      });
  }
  addRequirement(): void {
    this.requirements.push(this.requirement());
  }
  removeRequirement(index: number): void {
    if (this.requirements.length > 1) this.requirements.removeAt(index);
  }
  syncRequirement(index: number, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.requirements.at(index).get('requirement')?.setValue(value);
    this.offerError.set('');
  }
  addSkill(): void {
    this.skills.push(this.skill());
  }
  removeSkill(index: number): void {
    if (this.skills.length > 1) this.skills.removeAt(index);
  }
  syncSkill(index: number, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.skills.at(index).get('skillName')?.setValue(value);
    this.offerError.set('');
  }
  openCreateDialog(): void {
    this.cancelEdit(false);
    this.offerDialog.set(true);
  }
  edit(offer: JobOffer): void {
    if (!offer.id) return;
    this.editingId.set(offer.id);
    this.offerError.set('');
    this.form.patchValue({ ...offer, domain: offer.domain || 'Général' });
    this.requirements.clear();
    offer.requirements.forEach((item) =>
      this.requirements.push(this.requirement(item.requirement)),
    );
    this.skills.clear();
    offer.skills.forEach((item) => this.skills.push(this.skill(item.skillName, item.mandatory)));
    this.offerDialog.set(true);
  }
  cancelEdit(closeDialog = true): void {
    this.editingId.set(null);
    this.saving.set(false);
    this.offerError.set('');
    this.form.reset({
      title: '',
      domain: 'Général',
      description: '',
      location: '',
      employmentType: 'CDI',
      experienceLevel: 'MID',
      openingDate: '',
      closingDate: '',
      status: 'DRAFT',
    });
    this.requirements.clear();
    this.requirements.push(this.requirement());
    this.skills.clear();
    this.skills.push(this.skill());
    if (closeDialog) this.offerDialog.set(false);
  }
  submit(): void {
    this.offerError.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      const message =
        this.form.hasError('invalidDateRange')
          ? 'La date de clôture doit être postérieure ou égale à la date d’ouverture.'
          : 'Vérifiez les champs obligatoires et les longueurs indiquées.';
      this.showOfferError(message);
      setTimeout(() => {
        const firstInvalid = document.querySelector<HTMLElement>(
          '.offer-form [formControlName].ng-invalid',
        );
        firstInvalid?.focus();
        firstInvalid?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      return;
    }
    const offer = this.form.getRawValue() as JobOffer;
    const id = this.editingId();
    const request = id ? this.api.updateOffer(id, offer) : this.api.createOffer(offer);
    this.saving.set(true);
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        const message = id ? 'Offre modifiée.' : 'Offre créée.';
        this.cancelEdit();
        this.snackbar.success(message);
        this.load();
      },
      error: (response: HttpErrorResponse) => {
        this.saving.set(false);
        this.showOfferError(this.requestError(response, Boolean(id)));
      },
    });
  }
  private requirement(value = '') {
    return this.fb.nonNullable.group({
      requirement: [value, [Validators.required, Validators.maxLength(255)]],
    });
  }
  private skill(skillName = '', mandatory = true) {
    return this.fb.nonNullable.group({
      skillName: [skillName, Validators.required],
      mandatory: [mandatory],
    });
  }
  private requestError(response: HttpErrorResponse, editing: boolean): string {
    if (response.status === 0)
      return 'Le service des offres est injoignable. Vérifiez qu’il est démarré.';
    if (response.status === 400)
      return 'Certaines informations sont refusées par le service. Vérifiez les dates, exigences et compétences.';
    if (response.status === 401) return 'Votre session a expiré. Reconnectez-vous puis réessayez.';
    if (response.status === 403)
      return 'Votre compte ne possède pas le rôle HR requis pour cette action.';
    if (response.status >= 500)
      return 'Le service des offres rencontre une erreur interne. Réessayez dans quelques instants.';
    return editing ? 'La modification de l’offre a échoué.' : 'La création de l’offre a échoué.';
  }
  private showOfferError(message: string): void {
    this.offerError.set(message);
    this.snackbar.error(message);
  }
}
