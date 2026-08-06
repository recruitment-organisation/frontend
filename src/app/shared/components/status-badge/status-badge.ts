import { Component, computed, input } from '@angular/core';

const APPLICATION_LABELS: Record<string, string> = {
  SUBMITTED: 'Soumise',
  CV_REVISION_REQUIRED: 'Révision du CV',
  UNDER_AI_REVIEW: 'Analyse IA',
  HR_INTERVIEW: 'Entretien RH',
  TECHNICAL_INTERVIEW: 'Entretien technique',
  MANAGER_INTERVIEW: 'Entretien manager',
  REJECTED: 'Rejetée',
  HIRED: 'Recruté',
  CLOSED: 'Clôturée'
};

@Component({ selector: 'app-status-badge', standalone: false, templateUrl: './status-badge.html', styleUrl: './status-badge.css' })
export class StatusBadgeComponent {
  readonly status = input.required<string>();
  readonly label = computed(() => APPLICATION_LABELS[this.status()] ?? this.status().replaceAll('_', ' '));
  readonly tone = computed(() => {
    const value = this.status();
    if (value === 'REJECTED' || value === 'CANCELLED' || value === 'CLOSED') return 'danger';
    if (value === 'HIRED' || value === 'COMPLETED' || value === 'OPEN') return 'success';
    if (value.includes('INTERVIEW') || value === 'UNDER_AI_REVIEW') return 'info';
    return 'neutral';
  });
}
