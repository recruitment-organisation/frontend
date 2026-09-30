import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Company, CreateHrResponse, HrUser } from '../../../core/models/admin';
import { AdminService } from '../../../core/services/admin';

@Component({ selector: 'app-company-detail', standalone: false, templateUrl: './company-detail.html', styleUrl: './company-detail.css' })
export class CompanyDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly admin = inject(AdminService);
  readonly company = signal<Company | null>(null); readonly hrUsers = signal<HrUser[]>([]); readonly loading = signal(true); readonly error = signal(''); readonly hrDialog = signal(false); readonly saving = signal(false); readonly credentials = signal<CreateHrResponse | null>(null);
  readonly hrForm = this.fb.nonNullable.group({ firstName: ['', Validators.required], lastName: ['', Validators.required], email: ['', [Validators.required, Validators.email]], phone: ['', [Validators.required, Validators.pattern(/^\+?[0-9]{8,15}$/)]], active: [true] });
  private companyId = 0;
  ngOnInit(): void { this.companyId = Number(this.route.snapshot.paramMap.get('id')); this.load(); }
  load(): void { this.loading.set(true); this.error.set(''); let done = 0; const finish = () => { if (++done === 2) this.loading.set(false); }; this.admin.getCompany(this.companyId).subscribe({ next: value => this.company.set(value), error: () => this.error.set('Société introuvable ou indisponible.'), complete: finish }); this.admin.getHrUsers(this.companyId).subscribe({ next: page => this.hrUsers.set(page.content), error: () => this.error.set('Impossible de charger les responsables RH.'), complete: finish }); }
  createHr(): void { if (this.hrForm.invalid) { this.hrForm.markAllAsTouched(); return; } this.saving.set(true); this.admin.createHr(this.companyId, this.hrForm.getRawValue()).subscribe({ next: response => { this.credentials.set(response); this.hrDialog.set(false); this.hrForm.reset({ active: true }); this.load(); }, error: () => { this.error.set('Le compte RH n’a pas pu être créé. Vérifiez que l’email et le téléphone sont uniques.'); this.saving.set(false); }, complete: () => this.saving.set(false) }); }
  toggle(user: HrUser): void { this.admin.setHrStatus(user.id, !user.active).subscribe({ next: () => this.hrUsers.update(items => items.map(item => item.id === user.id ? { ...item, active: !item.active } : item)), error: () => this.error.set('Le statut du compte n’a pas pu être modifié.') }); }
}
