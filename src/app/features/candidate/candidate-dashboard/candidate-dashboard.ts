import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Auth } from '../../../core/services/auth';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-candidate-dashboard',
  standalone: false,
  templateUrl: './candidate-dashboard.html',
  styleUrl: './candidate-dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CandidateDashboardComponent {
  readonly auth = inject(Auth);
}
