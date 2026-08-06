import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HrData } from '../../../core/services/hr-data';
import { CandidateNotification } from '../../../core/models/hr';

@Component({
  selector: 'app-employee-notifications',
  standalone: false,
  templateUrl: './employee-notifications.html',
  styleUrl: './employee-notifications.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmployeeNotificationsComponent {
  private readonly api = inject(HrData);
  private readonly destroyRef = inject(DestroyRef);

  readonly notifications = signal<CandidateNotification[]>([]);
  readonly page = signal(0);
  readonly total = signal(0);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly pageSize = 20;

  constructor() {
    this.load();
  }

  load(nextPage = this.page()): void {
    this.page.set(nextPage);
    this.loading.set(true);
    this.error.set('');
    this.api.notifications(nextPage, this.pageSize).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: response => {
        this.notifications.set(response.content);
        this.total.set(response.totalElements);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Impossible de charger les notifications.');
        this.loading.set(false);
      }
    });
  }
}
