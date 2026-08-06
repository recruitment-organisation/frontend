import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Auth } from '../../core/services/auth';
import { WorkspaceNavItem, WorkspaceShellComponent } from '../../shared/components/workspace-shell/workspace-shell';

type NavItem = {
  label: string;
  link: string;
  roles: string[];
};

@Component({
  selector: 'app-employee-layout',
  standalone: false,
  templateUrl: './employee-layout.html',
  styleUrl: './employee-layout.css'
})
export class EmployeeLayoutComponent {
  private readonly navItems: NavItem[] = [
    { label: 'Dashboard', link: '/employee/dashboard', roles: ['EMPLOYEE'] },
    { label: 'Profil', link: '/employee/profile', roles: ['EMPLOYEE'] },
    { label: 'Entretiens', link: '/employee/interviews', roles: ['EMPLOYEE'] },
    { label: 'Notifications', link: '/employee/notifications', roles: ['EMPLOYEE'] }
  ];

  constructor(public auth: Auth) {}

  get menu(): WorkspaceNavItem[] {
    const roles = this.auth.getRoles();
    return this.navItems
      .filter(item => item.roles.some(role => roles.includes(role)))
      .map(({ label, link }) => ({ label, link }));
  }
}
