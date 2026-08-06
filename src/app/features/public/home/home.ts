import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({ selector: 'app-home', standalone: false, templateUrl: './home.html', styleUrl: './home.css', changeDetection: ChangeDetectionStrategy.OnPush })
export class HomeComponent {
  readonly expertise = [
    { icon: '⌘', title: 'Conseil & stratégie', description: 'Nous clarifions les enjeux, les usages et la trajectoire digitale avant de construire.' },
    { icon: '◫', title: 'Produits & plateformes', description: 'Nous concevons des applications web et des services métiers fiables, pensés pour évoluer.' },
    { icon: '✦', title: 'Data & intelligence artificielle', description: 'Nous transformons la donnée en repères actionnables et en expériences utiles.' }
  ];
  readonly commitments = [
    { title: 'Comprendre avant de produire', text: 'Chaque mission commence par le contexte métier, les équipes et les résultats attendus.' },
    { title: 'Construire pour durer', text: 'Architecture, sécurité et maintenabilité guident nos choix techniques dès le départ.' },
    { title: 'Avancer en partenariat', text: 'Des échanges directs, des décisions partagées et une progression visible à chaque étape.' }
  ];
}
