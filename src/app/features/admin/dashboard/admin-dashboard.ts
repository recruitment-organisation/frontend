import { Component, OnInit, signal } from '@angular/core';
import { AdminDashboardStats, Company } from '../../../core/models/admin';
import { AdminService } from '../../../core/services/admin';
import { Auth } from '../../../core/services/auth';

@Component({ selector: 'app-admin-dashboard', standalone: false, templateUrl: './admin-dashboard.html', styleUrl: './admin-dashboard.css' })
export class AdminDashboardComponent implements OnInit {
  readonly loading = signal(true); readonly error = signal(''); readonly companies = signal<Company[]>([]);
  readonly stats = signal<AdminDashboardStats>({ companies: 0, activeCompanies: 0, hrUsers: 0, activeHrUsers: 0 });
  constructor(private readonly admin: AdminService, readonly auth: Auth) {}
  ngOnInit(): void { this.load(); }
  load(): void {
    this.loading.set(true); this.error.set(''); let done = 0; const finish = () => { if (++done === 2) this.loading.set(false); };
    this.admin.getDashboard().subscribe({ next: value => this.stats.set(value), error: () => this.error.set('Impossible de charger les statistiques.'), complete: finish });
    this.admin.getCompanies(0, 5).subscribe({ next: value => this.companies.set(value.content), error: () => this.error.set('Impossible de charger les sociétés.'), complete: finish });
  }
}
