import { Component, computed, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Auth } from '../../../core/services/auth';

export interface WorkspaceNavItem {
  label: string;
  link: string;
  badge?: number;
}

@Component({
  selector: 'app-workspace-shell',
  standalone: false,
  templateUrl: './workspace-shell.html',
  styleUrl: './workspace-shell.css'
})
export class WorkspaceShellComponent {
  readonly brand = input.required<string>();
  readonly subtitle = input('');
  readonly brandLink = input.required<string>();
  readonly workspaceLabel = input.required<string>();
  readonly items = input<readonly WorkspaceNavItem[]>([]);
  readonly tone = input<'candidate' | 'hr' | 'employee'>('candidate');
  readonly notificationItem = computed(() => this.items().find(item => item.badge !== undefined));

  constructor(readonly auth: Auth) {}

  logout(): void {
    this.auth.logout();
  }

  initials(): string {
    const user = this.auth.getCurrentUser();
    return `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase() || 'U';
  }

  formatBadge(count: number): string {
    return count > 99 ? '99+' : String(count);
  }
}
