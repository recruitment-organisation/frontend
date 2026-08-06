import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { CandidateNotification } from '../../../core/models/hr';
import { HrData } from '../../../core/services/hr-data';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header';

@Component({ selector: 'app-hr-notifications', standalone: false, templateUrl: './hr-notifications.html', styleUrl: './hr-notifications.css', changeDetection: ChangeDetectionStrategy.OnPush })
export class HrNotificationsComponent {
  private readonly api = inject(HrData); private readonly destroyRef = inject(DestroyRef); private readonly route = inject(ActivatedRoute);
  readonly isManagerView = this.route.snapshot.data['managerView'] === true;
  readonly notifications = signal<CandidateNotification[]>([]); readonly page = signal(0); readonly total = signal(0); readonly loading = signal(true); readonly error = signal(''); readonly pageSize = 20;
  constructor() { this.load(); }
  load(nextPage = this.page()): void { this.page.set(nextPage); this.loading.set(true); this.error.set(''); this.api.notifications(nextPage, this.pageSize).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: response => { this.notifications.set(response.content); this.total.set(response.totalElements); this.loading.set(false); }, error: () => { this.error.set('Impossible de charger les notifications RH.'); this.loading.set(false); } }); }

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
}
