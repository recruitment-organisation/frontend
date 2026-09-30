import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Company } from '../../../core/models/admin';
import { AdminService } from '../../../core/services/admin';

@Component({ selector: 'app-companies', standalone: false, templateUrl: './companies.html', styleUrl: './companies.css' })
export class CompaniesComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly admin = inject(AdminService);
  readonly loading = signal(true); readonly saving = signal(false); readonly error = signal(''); readonly companies = signal<Company[]>([]); readonly query = signal(''); readonly status = signal('all'); readonly dialog = signal(false);
  readonly filtered = computed(() => this.companies().filter(c => c.name.toLowerCase().includes(this.query().toLowerCase()) && (this.status() === 'all' || c.active === (this.status() === 'active'))));
  readonly form = this.fb.nonNullable.group({ name: ['', [Validators.required, Validators.maxLength(160)]], slug: [''], email: ['', Validators.email], phone: [''], address: [''], website: [''], logoUrl: [''], description: [''], active: [true] });
  ngOnInit(): void { this.load(); if (location.hash === '#new') this.dialog.set(true); }
  load(): void { this.loading.set(true); this.error.set(''); this.admin.getCompanies(0, 100).subscribe({ next: page => this.companies.set(page.content), error: () => { this.error.set('Impossible de charger les sociétés.'); this.loading.set(false); }, complete: () => this.loading.set(false) }); }
  create(): void { if (this.form.invalid) { this.form.markAllAsTouched(); return; } this.saving.set(true); this.error.set(''); this.admin.createCompany(this.form.getRawValue()).subscribe({ next: company => { this.companies.update(items => [company, ...items]); this.dialog.set(false); this.form.reset({ active: true }); }, error: () => { this.error.set('La société n’a pas pu être créée. Vérifiez le nom et les coordonnées.'); this.saving.set(false); }, complete: () => this.saving.set(false) }); }
  toggle(company: Company): void { this.admin.setCompanyStatus(company.id, !company.active).subscribe({ next: updated => this.companies.update(items => items.map(item => item.id === updated.id ? updated : item)), error: () => this.error.set('Le statut n’a pas pu être modifié.') }); }
}
