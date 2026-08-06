import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { CandidateData } from '../../../core/services/candidate-data';
import { CandidateNotificationState } from '../../../core/services/candidate-notification-state';
import { CandidateNotification, CandidateNotificationType } from '../../../core/models/hr';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header';
import { Snackbar } from '../../../core/services/snackbar';

@Component({ selector: 'app-candidate-notifications', standalone: false, templateUrl: './candidate-notifications.html', styleUrl: './candidate-notifications.css', changeDetection: ChangeDetectionStrategy.OnPush })
export class CandidateNotificationsComponent {
  private readonly api = inject(CandidateData);
  private readonly destroyRef = inject(DestroyRef);
  private readonly snackbar = inject(Snackbar);
  private readonly notificationState = inject(CandidateNotificationState);
  readonly notifications = signal<CandidateNotification[]>([]);
  readonly page = signal(0);
  readonly total = signal(0);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly pageSize = 20;
  readonly filter = signal<'all' | 'unread'>('all');
  readonly markingAll = signal(false);
  readonly unread = computed(() => this.notifications().filter(notification => !notification.readAt).length);
  readonly visibleNotifications = computed(() => this.filter() === 'unread'
    ? this.notifications().filter(notification => !notification.readAt)
    : this.notifications());

  constructor() { this.load(); }

  load(nextPage = this.page()): void {
    this.page.set(nextPage);
    this.loading.set(true);
    this.error.set('');
    this.api.notifications(nextPage, this.pageSize).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: response => { this.notifications.set(response.content); this.total.set(response.totalElements); this.loading.set(false); this.notificationState.refresh(); },
      error: () => { this.error.set('Impossible de charger vos notifications pour le moment.'); this.loading.set(false); }
    });
  }

  markAsRead(notification: CandidateNotification): void {
    if (notification.readAt) return;
    this.api.markNotificationAsRead(notification.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: updated => { this.notifications.update(items => items.map(item => item.id === updated.id ? updated : item)); this.notificationState.markAsRead(); this.snackbar.success('Notification marquée comme lue.'); },
      error: () => this.error.set('La notification n’a pas pu être marquée comme lue.')
    });
  }

  markAllAsRead(): void {
    const unreadNotifications = this.notifications().filter(notification => !notification.readAt);
    if (!unreadNotifications.length || this.markingAll()) return;

    this.markingAll.set(true);
    forkJoin(unreadNotifications.map(notification => this.api.markNotificationAsRead(notification.id)))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: updatedNotifications => {
          const updatedById = new Map(updatedNotifications.map(notification => [notification.id, notification]));
          this.notifications.update(items => items.map(item => updatedById.get(item.id) ?? item));
          this.notificationState.refresh();
          this.markingAll.set(false);
          this.snackbar.success('Toutes les notifications sont marquées comme lues.');
        },
        error: () => {
          this.markingAll.set(false);
          this.error.set('Certaines notifications n’ont pas pu être mises à jour.');
        }
      });
  }

  setFilter(filter: 'all' | 'unread'): void {
    this.filter.set(filter);
  }

  renderMessage(message: string): string {
    const escaped = message
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
    return escaped
      .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(/\n/g, '<br>');
  }

  notificationMeta(type: CandidateNotificationType): { icon: string; label: string; tone: string } {
    switch (type) {
      case 'WELCOME': return { icon: '✦', label: 'Bienvenue', tone: 'positive' };
      case 'INTERVIEW_SCHEDULED': return { icon: '◷', label: 'Entretien', tone: 'primary' };
      case 'CV_REVISION_REQUIRED': return { icon: '↻', label: 'Action requise', tone: 'warning' };
      case 'CV_TIMEOUT': return { icon: '⌛', label: 'Délai dépassé', tone: 'danger' };
      case 'REJECTION': return { icon: '×', label: 'Candidature', tone: 'danger' };
      case 'APPLICATION_RECEIVED': return { icon: '↗', label: 'Candidature', tone: 'primary' };
      default: return { icon: 'i', label: 'Mise à jour', tone: 'neutral' };
    }
  }
}
