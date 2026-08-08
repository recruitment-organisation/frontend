import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Auth } from '../../core/services/auth';
import { WorkspaceNavItem, WorkspaceShellComponent } from '../../shared/components/workspace-shell/workspace-shell';

@Component({
  selector: 'app-manager-layout',
  standalone: false,
  templateUrl: './manager-layout.html',
  styleUrl: './manager-layout.css'
})
export class ManagerLayoutComponent {
  readonly menu: WorkspaceNavItem[] = [
    { label: 'Tableau de bord', link: '/manager/dashboard' },
    { label: 'Candidats', link: '/manager/candidates' },
    { label: 'Candidatures', link: '/manager/applications' },
    { label: 'Entretiens', link: '/manager/interviews' },
    { label: 'Notifications', link: '/manager/notifications' },
    { label: 'Mon profil', link: '/manager/profile' }
  ];

  constructor(readonly auth: Auth) {}
}
