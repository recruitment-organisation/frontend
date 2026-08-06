import { Component, DestroyRef, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { WorkspaceNavItem, WorkspaceShellComponent } from '../../shared/components/workspace-shell/workspace-shell';
import { CandidateNotificationState } from '../../core/services/candidate-notification-state';

@Component({
  selector: 'app-candidate-layout',
  standalone: false,
  templateUrl: './candidate-layout.html',
  styleUrl: './candidate-layout.css'
})
export class CandidateLayoutComponent {
  private readonly notificationState = inject(CandidateNotificationState);
  private readonly destroyRef = inject(DestroyRef);
  readonly navItems = computed<WorkspaceNavItem[]>(() => [
    { label: 'Dashboard', link: '/candidate/dashboard' },
    { label: 'Profil', link: '/candidate/profile' },
    { label: 'Offres', link: '/candidate/offers' },
    { label: 'Candidatures', link: '/candidate/applications' },
    { label: 'Entretiens', link: '/candidate/interviews' },
    { label: 'Notifications', link: '/candidate/notifications', badge: this.notificationState.unreadCount() }
  ]);

  constructor() {
    this.notificationState.refresh();
    const refreshTimer = window.setInterval(() => this.notificationState.refresh(), 60_000);
    this.destroyRef.onDestroy(() => window.clearInterval(refreshTimer));
  }
}
