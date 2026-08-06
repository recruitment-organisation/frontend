import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Snackbar } from '../../../core/services/snackbar';

@Component({
  selector: 'app-snackbar',
  standalone: false,
  templateUrl: './snackbar.html',
  styleUrl: './snackbar.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SnackbarComponent {
  readonly snackbar = inject(Snackbar);
}
