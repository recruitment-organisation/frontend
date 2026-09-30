import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({ selector: 'app-home', standalone: false, templateUrl: './home.html', styleUrl: './home.css', changeDetection: ChangeDetectionStrategy.OnPush })
export class HomeComponent {
  readonly expertise = [
    { icon: '✦', title: 'Analyse intelligente des CV', description: 'Le matching candidat/offre et le score IA existants deviennent immédiatement lisibles.' },
    { icon: '◫', title: 'Gestion des candidatures', description: 'Suivez le pipeline complet sans perdre le contexte ni les prochaines actions.' },
    { icon: '◷', title: 'Entretiens structurés', description: 'Organisez les étapes RH, technique et manager dans un parcours cohérent.' },
    { icon: '↗', title: 'Workflow automatisé', description: 'Flowable orchestre les étapes métier et sécurise les transitions du processus.' },
    { icon: '◎', title: 'Notifications', description: 'Retrouvez les événements importants et les actions à prioriser au bon moment.' },
    { icon: '◇', title: 'Multi-sociétés', description: 'Chaque société bénéficie de son espace isolé et de sa propre équipe RH.' }
  ];
  readonly pipeline = [{ label: 'Nouveau', value: 32 }, { label: 'Analyse IA', value: 18 }, { label: 'Entretien', value: 9 }, { label: 'Finalistes', value: 4 }];
  readonly process = [
    { title: 'Publiez votre offre', text: 'Structurez le besoin et rendez-le visible.' },
    { title: 'Recevez les candidatures', text: 'Centralisez les dossiers dans un pipeline unique.' },
    { title: 'Analyse IA du CV', text: 'Exploitez le score et l’analyse déjà produits par le RAG.' },
    { title: 'Menez les entretiens', text: 'RH, technique puis manager selon le workflow.' },
    { title: 'Prenez la décision finale', text: 'Conservez une vue claire jusqu’à l’acceptation ou au rejet.' }
  ];
}
