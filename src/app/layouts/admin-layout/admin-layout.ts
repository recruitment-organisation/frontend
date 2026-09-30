import { Component } from '@angular/core';
import { WorkspaceNavItem } from '../../shared/components/workspace-shell/workspace-shell';

@Component({ selector: 'app-admin-layout', standalone: false, templateUrl: './admin-layout.html', styleUrl: './admin-layout.css' })
export class AdminLayoutComponent {
  readonly items: WorkspaceNavItem[] = [
    { label: 'Tableau de bord', link: '/admin/dashboard' },
    { label: 'Sociétés', link: '/admin/companies' },
    { label: 'Utilisateurs RH', link: '/admin/hr-users' }
  ];
}
