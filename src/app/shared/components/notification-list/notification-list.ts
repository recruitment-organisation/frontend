import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CandidateNotification, CandidateNotificationType } from '../../../core/models/hr';

@Component({
  selector: 'app-notification-list',
  standalone: false,
  templateUrl: './notification-list.html',
  styleUrl: './notification-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationListComponent {
  @Input() notifications: CandidateNotification[] = [];
  @Input() loading = false;
  @Input() emptyTitle = 'Aucune notification';
  @Input() emptyDescription = 'Les nouvelles notifications apparaîtront ici.';

  notificationMeta(type: CandidateNotificationType): { icon: string; label: string; tone: string } {
    switch (type) {
      case 'OFFER_ACCEPTED': return { icon: '✓', label: 'Offre acceptée', tone: 'positive' };
      case 'WELCOME': return { icon: '✦', label: 'Bienvenue', tone: 'positive' };
      case 'INTERVIEW_SCHEDULED': return { icon: '◷', label: 'Entretien', tone: 'primary' };
      case 'CV_REVISION_REQUIRED': return { icon: '↻', label: 'Action requise', tone: 'warning' };
      case 'CV_TIMEOUT': return { icon: '⌛', label: 'Délai dépassé', tone: 'danger' };
      case 'REJECTION': return { icon: '×', label: 'Candidature', tone: 'danger' };
      case 'APPLICATION_RECEIVED': return { icon: '↗', label: 'Candidature', tone: 'primary' };
      default: return { icon: 'i', label: 'Mise à jour', tone: 'neutral' };
    }
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
}
