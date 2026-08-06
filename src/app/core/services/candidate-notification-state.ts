import { Injectable, inject, signal } from '@angular/core';
import { CandidateData } from './candidate-data';

@Injectable({ providedIn: 'root' })
export class CandidateNotificationState {
  private readonly api = inject(CandidateData);
  readonly unreadCount = signal(0);

  refresh(): void {
    this.api.notifications(0, 100).subscribe({
      next: response => this.unreadCount.set(response.content.filter(notification => !notification.readAt).length),
      error: () => this.unreadCount.set(0)
    });
  }

  markAsRead(): void {
    this.unreadCount.update(count => Math.max(0, count - 1));
  }
}
