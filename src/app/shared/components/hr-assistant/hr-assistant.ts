import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HrAssistantScope } from '../../../core/models/hr';
import { HrData } from '../../../core/services/hr-data';

type ChatMessage = { role: 'assistant' | 'user'; content: string; suggestions?: string[] };

@Component({
  selector: 'app-hr-assistant',
  standalone: false,
  templateUrl: './hr-assistant.html',
  styleUrl: './hr-assistant.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HrAssistantComponent {
  private readonly api = inject(HrData);
  private readonly destroyRef = inject(DestroyRef);

  readonly scope = input.required<HrAssistantScope>();
  readonly page = input(0);
  readonly pageSize = input(20);
  readonly filterChanged = output<number[] | null>();
  readonly question = signal('');
  readonly loading = signal(false);
  readonly open = signal(false);
  readonly activeFilterCount = signal<number | null>(null);
  readonly messages = signal<ChatMessage[]>([{ role: 'assistant', content: 'Bonjour ! Je peux répondre à vos questions sur les données visibles et appliquer un filtre à cette liste.' }]);
  readonly resourceLabel = computed(() => ({ APPLICATIONS: 'candidatures', CANDIDATES: 'candidats', JOB_OFFERS: 'offres' })[this.scope()]);
  readonly starterQuestions = computed(() => {
    switch (this.scope()) {
      case 'APPLICATIONS': return ['Affiche les candidatures recommandées', 'Quelles candidatures ont un score inférieur à 70 ?', 'Résume les candidatures en attente'];
      case 'CANDIDATES': return ['Affiche les candidats disponibles', 'Quels profils sont basés à Tunis ?', 'Quels candidats ont des candidatures en cours ?'];
      case 'JOB_OFFERS': return ['Affiche les offres ouvertes', 'Quelles offres recherchent Java ?', 'Quelles offres sont de niveau senior ?'];
    }
  });

  ask(question = this.question().trim()): void {
    if (!question || this.loading()) return;
    this.question.set('');
    this.loading.set(true);
    this.messages.update(messages => [...messages, { role: 'user', content: question }]);
    this.api.askAssistant(question, this.scope(), this.page(), this.pageSize())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          this.loading.set(false);
          this.messages.update(messages => [...messages, { role: 'assistant', content: response.answer, suggestions: response.followUpQuestions ?? [] }]);
          if (response.filterApplied) {
            const ids = response.matchingIds ?? [];
            this.activeFilterCount.set(ids.length);
            this.filterChanged.emit(ids);
          } else {
            this.activeFilterCount.set(null);
            this.filterChanged.emit(null);
          }
        },
        error: () => {
          this.loading.set(false);
          this.messages.update(messages => [...messages, { role: 'assistant', content: 'L’assistant est indisponible pour le moment. Réessayez dans quelques instants.' }]);
        }
      });
  }

  clearFilter(): void {
    this.activeFilterCount.set(null);
    this.filterChanged.emit(null);
  }

  toggle(): void { this.open.update(value => !value); }

  close(): void { this.open.set(false); }
}
