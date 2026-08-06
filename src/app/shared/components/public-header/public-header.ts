import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostListener, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-public-header',
  standalone: false,
  templateUrl: './public-header.html',
  styleUrl: './public-header.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PublicHeaderComponent {
  readonly menuOpen = signal(false);
  readonly scrolled = signal(false);

  @HostListener('window:scroll') onScroll(): void { this.scrolled.set(window.scrollY > 12); }
  closeMenu(): void { this.menuOpen.set(false); }
  toggleMenu(): void { this.menuOpen.update(open => !open); }
}
