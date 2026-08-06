import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-action-button',
  standalone: false,
  templateUrl: './action-button.html',
  styleUrl: './action-button.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActionButtonComponent {
  @Input() variant: 'primary' | 'secondary' | 'light' | 'outline-light' = 'primary';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() loadingLabel = 'Chargement…';
}
