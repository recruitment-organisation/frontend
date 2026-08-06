import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Interview } from '../../../core/models/hr';

@Component({
  selector: 'app-interview-list',
  standalone: false,
  templateUrl: './interview-list.html',
  styleUrl: './interview-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InterviewListComponent {
  @Input() interviews: Interview[] = [];
  @Input() loading = false;
  @Input() emptyLabel = 'Aucun entretien.';
  @Input() showCancelButton = false;
  @Input() showStartButton = true;
  @Input() showResultButton = true;
  @Input() startButtonLabel = 'Démarrer';
  @Input() resultButtonLabel = 'Résultat';
  @Input() cancelButtonLabel = 'Annuler';
  @Output() startInterview = new EventEmitter<Interview>();
  @Output() resultInterview = new EventEmitter<Interview>();
  @Output() cancelInterview = new EventEmitter<Interview>();

  stageLabel(interview: Interview): string {
    switch (interview.stage) {
      case 'HR_INTERVIEW': return 'Entretien RH';
      case 'TECHNICAL_INTERVIEW': return 'Entretien technique';
      case 'MANAGER_INTERVIEW': return 'Entretien manager';
      default: return 'Entretien';
    }
  }

  typeLabel(interview: Interview): string {
    return interview.type === 'ONSITE' ? 'Présentiel' : interview.type === 'ONLINE' ? 'En ligne' : 'Téléphone';
  }

  venueHref(interview: Interview): string | null {
    return interview.type === 'ONLINE' && interview.meetingLink ? interview.meetingLink : null;
  }

  venueLabel(interview: Interview): string | null {
    if (interview.type === 'ONLINE' && interview.meetingLink) return 'Lien de réunion';
    if (interview.type === 'ONSITE' && interview.location) return interview.location;
    if (interview.type === 'PHONE') return 'Téléphone';
    return null;
  }
}
