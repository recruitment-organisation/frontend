import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Auth } from '../../../core/services/auth';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card';

@Component({
  selector: 'app-employee-dashboard',
  standalone: false,
  templateUrl: './employee-dashboard.html',
  styleUrl: './employee-dashboard.css'
})
export class EmployeeDashboardComponent {
  readonly auth = inject(Auth);

  get workspaceMode(): string {
    const roles = this.auth.getRoles();
    if (roles.includes('HR')) return 'Pilotage RH';
    if (roles.includes('MANAGER')) return 'Décision manager';
    return 'Espace employé';
  }
}
