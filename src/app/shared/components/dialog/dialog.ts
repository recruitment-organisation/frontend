import { Component, input, output } from '@angular/core';

@Component({ selector: 'app-dialog', standalone: false, templateUrl: './dialog.html', styleUrl: './dialog.css' })
export class DialogComponent {
  readonly open = input(false);
  readonly title = input.required<string>();
  readonly size = input<'default' | 'wide'>('default');
  readonly closed = output<void>();
}
