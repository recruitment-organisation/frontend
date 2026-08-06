import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header';

@Component({
  selector: 'app-feature-placeholder',
  standalone: false,
  templateUrl: './feature-placeholder.html',
  styleUrl: './feature-placeholder.css'
})
export class FeaturePlaceholderComponent {
  private readonly route = inject(ActivatedRoute);

  readonly data = computed(() => this.route.snapshot.data);

  get eyebrow(): string {
    return (this.data()['eyebrow'] as string | undefined) ?? '';
  }

  get title(): string {
    return (this.data()['title'] as string | undefined) ?? '';
  }

  get description(): string {
    return (this.data()['description'] as string | undefined) ?? '';
  }

  get emptyTitle(): string {
    return (this.data()['emptyTitle'] as string | undefined) ?? 'Intégration prête à brancher';
  }

  get emptyDescription(): string {
    return (this.data()['emptyDescription'] as string | undefined) ?? '';
  }

  get note(): string {
    return (this.data()['note'] as string | undefined) ?? '';
  }

  get bullets(): string[] {
    return (this.data()['bullets'] as string[] | undefined) ?? [];
  }
}
