import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HrData } from '../../../core/services/hr-data';
import { JobOffer } from '../../../core/models/hr';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header';
import { HrAssistantComponent } from '../../../shared/components/hr-assistant/hr-assistant';
import { DialogComponent } from '../../../shared/components/dialog/dialog';
import { Snackbar } from '../../../core/services/snackbar';

@Component({ selector: 'app-hr-offers', standalone: false, templateUrl: './hr-offers.html', styleUrl: './hr-offers.css' })
export class HrOffersComponent {
  private readonly fb = inject(FormBuilder); private readonly api = inject(HrData); private readonly destroyRef = inject(DestroyRef); private readonly snackbar = inject(Snackbar);
  readonly offers = signal<JobOffer[]>([]); readonly loading = signal(false); readonly error = signal(''); readonly success = signal(''); readonly editingId = signal<number | null>(null); readonly assistantFilterIds = signal<number[] | null>(null); readonly offerDialog = signal(false); readonly statuses: JobOffer['status'][] = ['DRAFT','OPEN','CLOSED','CANCELLED']; readonly types: JobOffer['employmentType'][] = ['CDI','CDD','INTERNSHIP','FREELANCE','PART_TIME','FULL_TIME']; readonly levels: JobOffer['experienceLevel'][] = ['JUNIOR','MID','SENIOR','LEAD'];
  readonly filteredOffers = computed(() => { const ids = this.assistantFilterIds(); return ids === null ? this.offers() : this.offers().filter(offer => offer.id !== undefined && ids.includes(offer.id)); });
  readonly form = this.fb.nonNullable.group({ title: ['', Validators.required], domain: ['Général', Validators.required], description: ['', [Validators.required, Validators.maxLength(3000)]], location: ['', Validators.required], employmentType: ['CDI' as JobOffer['employmentType'], Validators.required], experienceLevel: ['MID' as JobOffer['experienceLevel'], Validators.required], openingDate: ['', Validators.required], closingDate: ['', Validators.required], status: ['DRAFT' as JobOffer['status'], Validators.required], requirements: this.fb.nonNullable.array([this.requirement()]), skills: this.fb.nonNullable.array([this.skill()]) });
  get requirements(): FormArray { return this.form.controls.requirements; } get skills(): FormArray { return this.form.controls.skills; }
  constructor(){ this.load(); }
  load(): void { this.loading.set(true); this.api.offers(0, 100).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: page => { this.offers.set(page.content); this.loading.set(false); }, error: () => { this.error.set('Impossible de charger les offres.'); this.loading.set(false); } }); }
  addRequirement(): void { this.requirements.push(this.requirement()); } removeRequirement(index: number): void { if(this.requirements.length > 1) this.requirements.removeAt(index); } addSkill(): void { this.skills.push(this.skill()); } removeSkill(index: number): void { if(this.skills.length > 1) this.skills.removeAt(index); }
  openCreateDialog(): void { this.cancelEdit(false); this.error.set(''); this.offerDialog.set(true); }
  edit(offer: JobOffer): void { if (!offer.id) return; this.editingId.set(offer.id); this.error.set(''); this.success.set(''); this.form.patchValue({ ...offer, domain: offer.domain || 'Général' }); this.requirements.clear(); offer.requirements.forEach(item => this.requirements.push(this.fb.nonNullable.group({ requirement: [item.requirement, Validators.required] }))); this.skills.clear(); offer.skills.forEach(item => this.skills.push(this.fb.nonNullable.group({ skillName: [item.skillName, Validators.required], mandatory: [item.mandatory] }))); this.offerDialog.set(true); }
  cancelEdit(closeDialog = true): void { this.editingId.set(null); this.form.reset({ domain: 'Général', employmentType:'CDI', experienceLevel:'MID', status:'DRAFT' }); this.requirements.clear(); this.requirements.push(this.requirement()); this.skills.clear(); this.skills.push(this.skill()); if (closeDialog) this.offerDialog.set(false); }
  submit(): void { if(this.form.invalid){this.form.markAllAsTouched();return;} const offer = this.form.getRawValue() as JobOffer; const id = this.editingId(); const request = id ? this.api.updateOffer(id, offer) : this.api.createOffer(offer); request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: () => { const message = id ? 'Offre modifiée.' : 'Offre créée.'; this.success.set(''); this.cancelEdit(); this.snackbar.success(message); this.load(); }, error: () => this.error.set(id ? 'La modification de l’offre a échoué.' : 'La création de l’offre a échoué.') }); }
  private requirement(){return this.fb.nonNullable.group({ requirement:['',Validators.required] });} private skill(){return this.fb.nonNullable.group({ skillName:['',Validators.required],mandatory:[true] });}
}
