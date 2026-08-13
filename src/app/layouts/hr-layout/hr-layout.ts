import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { WorkspaceNavItem, WorkspaceShellComponent } from '../../shared/components/workspace-shell/workspace-shell';
import { HrAssistantComponent } from '../../shared/components/hr-assistant/hr-assistant';

@Component({ selector: 'app-hr-layout', standalone: false, templateUrl: './hr-layout.html', styleUrl: './hr-layout.css' })
export class HrLayoutComponent {
  private readonly router = inject(Router);
  readonly items: WorkspaceNavItem[] = [
    { label: 'Tableau de bord', link: '/hr/dashboard' }, { label: 'Mon profil', link: '/hr/profile' }, { label: 'Employés', link: '/hr/employees' },
    { label: 'Rôles', link: '/hr/roles' },
    { label: 'Offres', link: '/hr/offers' }, { label: 'Candidats', link: '/hr/candidates' }, { label: 'Candidatures', link: '/hr/applications' }, { label: 'Entretiens', link: '/hr/interviews' }, { label: 'Notifications', link: '/hr/notifications' }
  ];

  hasPageAssistant(): boolean {
    return ['/hr/applications', '/hr/candidates', '/hr/offers'].some(path => this.router.url.startsWith(path));
  }
}
