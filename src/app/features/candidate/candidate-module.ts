import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { CandidateLayoutComponent } from '../../layouts/candidate-layout/candidate-layout';
import { SharedModule } from '../../shared/shared-module';
import { WorkspaceModule } from '../workspace/workspace-module';
import { CandidateApplicationsComponent } from './candidate-applications/candidate-applications';
import { CandidateDashboardComponent } from './candidate-dashboard/candidate-dashboard';
import { CandidateNotificationsComponent } from './candidate-notifications/candidate-notifications';
import { CandidateOffersComponent } from './candidate-offers/candidate-offers';
import { FeaturePlaceholderComponent } from '../workspace/feature-placeholder/feature-placeholder';
import { ProfilePageComponent } from '../workspace/profile-page/profile-page';

const routes: Routes = [
  {
    path: '',
    component: CandidateLayoutComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: CandidateDashboardComponent },
      { path: 'profile', component: ProfilePageComponent, data: { eyebrow: 'Profil candidat', title: 'Informations de profil', description: 'Affichage de la session courante en attendant le branchement d’un endpoint profil candidat dédié.' } },
      { path: 'offers', component: CandidateOffersComponent },
      { path: 'applications', component: CandidateApplicationsComponent },
      { path: 'interviews', component: FeaturePlaceholderComponent, data: { eyebrow: 'Entretiens', title: 'Calendrier et suivi des entretiens', description: 'Zone prête pour afficher les entretiens liés au candidat.', emptyDescription: 'Le service entretien existe, mais il reste des incohérences backend sur certains clients Feign avant d’étendre proprement l’expérience.', note: 'Aucune donnée de démonstration injectée.' } },
      { path: 'notifications', component: CandidateNotificationsComponent }
    ]
  }
];

@NgModule({
  declarations: [CandidateLayoutComponent, CandidateApplicationsComponent, CandidateDashboardComponent, CandidateNotificationsComponent, CandidateOffersComponent],
  imports: [CommonModule, ReactiveFormsModule, RouterModule.forChild(routes), SharedModule, WorkspaceModule]
})
export class CandidateModule {}
