import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({ selector: 'app-services', standalone: false, templateUrl: './services.html', styleUrl: './services.css', changeDetection: ChangeDetectionStrategy.OnPush })
export class ServicesComponent {
  readonly domains = [
    { number: '01', title: 'Conseil IT & transformation', text: 'Cadrage des besoins, feuille de route digitale et accompagnement des décisions structurantes.' },
    { number: '02', title: 'Applications & plateformes métier', text: 'Conception et développement de produits web, API et outils internes adaptés à vos équipes.' },
    { number: '03', title: 'Data, IA & automatisation', text: 'Valorisation de la donnée, intelligence artificielle appliquée et automatisation des parcours.' },
    { number: '04', title: 'Cloud, qualité & évolution', text: 'Architecture, sécurité, qualité logicielle et amélioration continue pour des solutions durables.' }
  ];
  readonly experience = [
    { step: 'Écouter', title: 'Partir du réel', text: 'Les projets commencent par vos métiers, vos contraintes et les usages qui comptent vraiment.' },
    { step: 'Concevoir', title: 'Donner une direction claire', text: 'Nous relions expérience utilisateur, choix techniques et objectifs opérationnels.' },
    { step: 'Livrer', title: 'Progresser par étapes', text: 'Des livraisons visibles permettent d’apprendre, d’ajuster et de sécuriser l’adoption.' }
  ];
}
