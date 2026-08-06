import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Auth } from '../../../core/services/auth';
import { HrData } from '../../../core/services/hr-data';
import { ApplicationDashboardCounts, Candidate, JobOffer } from '../../../core/models/hr';

type ManagerCandidate = { id: number; name: string; position: string; location: string; score?: number; appliedAt?: string; status: string; currentStep?: string; };

@Component({
  selector: 'app-manager-workspace',
  standalone: false,
  templateUrl: './manager-workspace.html',
  styleUrl: './manager-workspace.css'
})
export class ManagerWorkspaceComponent {
  readonly auth = inject(Auth);
  private readonly api = inject(HrData);
  private readonly destroyRef = inject(DestroyRef);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly finalists = signal<ManagerCandidate[]>([]);
  readonly counts = signal<ApplicationDashboardCounts>({ total: 0, pending: 0, hired: 0, rejected: 0 });
  readonly pending = computed(() => this.finalists().length);
  readonly averageScore = computed(() => { const scores = this.finalists().map(candidate => candidate.score).filter((score): score is number => score !== undefined); return scores.length ? Math.round(scores.reduce((total, score) => total + score, 0) / scores.length) : 0; });

  constructor() { this.load(); }

  initials(): string { const user = this.auth.getCurrentUser(); return `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase() || 'M'; }
  scoreColor(score?: number): string { if (score === undefined) return '#94a3b8'; const hue = Math.round(Math.max(0, Math.min(100, score)) * 1.2); return `linear-gradient(135deg, hsl(${Math.max(0, hue - 8)} 72% 37%), hsl(${Math.min(125, hue + 8)} 76% 47%))`; }

  load(): void {
    this.loading.set(true); this.error.set('');
    forkJoin({ applications: this.api.applications(0, 100), candidates: this.api.candidates(0, 100), offers: this.api.offers(0, 100), counts: this.api.applicationDashboardCounts() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => {
          const candidates = new Map<number, Candidate>(data.candidates.content.map(candidate => [candidate.id, candidate]));
          const offers = new Map<number, JobOffer>(data.offers.content.filter(offer => offer.id !== undefined).map(offer => [offer.id!, offer]));
          this.finalists.set(data.applications.content.filter(application => application.status === 'MANAGER_INTERVIEW').map(application => {
            const candidate = candidates.get(application.candidateId);
            const offer = offers.get(application.jobOfferId);
            return { id: application.id, name: candidate ? `${candidate.firstName} ${candidate.lastName}` : `Candidat #${application.candidateId}`, position: offer?.title ?? `Offre #${application.jobOfferId}`, location: offer?.location ?? 'Localisation non renseignée', score: application.matchingScore, appliedAt: application.appliedAt, status: application.status, currentStep: application.currentStep };
          }).sort((first, second) => (second.score ?? -1) - (first.score ?? -1)));
          this.counts.set(data.counts); this.loading.set(false);
        },
        error: () => { this.error.set('Impossible de charger les données du dashboard manager. Vérifiez les droits manager et réessayez.'); this.loading.set(false); }
      });
  }
}
