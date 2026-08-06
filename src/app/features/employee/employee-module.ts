import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { EmployeeLayoutComponent } from '../../layouts/employee-layout/employee-layout';
import { SharedModule } from '../../shared/shared-module';
import { FeaturePlaceholderComponent } from '../workspace/feature-placeholder/feature-placeholder';
import { ProfilePageComponent } from '../workspace/profile-page/profile-page';
import { WorkspaceModule } from '../workspace/workspace-module';
import { EmployeeDashboardComponent } from './employee-dashboard/employee-dashboard';
import { EmployeeInterviewsComponent } from './interviews/employee-interviews';
import { EmployeeNotificationsComponent } from './notifications/employee-notifications';

const routes: Routes = [
  {
    path: '',
    component: EmployeeLayoutComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: EmployeeDashboardComponent },
      { path: 'profile', component: ProfilePageComponent, data: { eyebrow: 'Profil employé', title: 'Session et identité employé', description: 'Affichage des données disponibles dans la réponse de connexion actuelle.' } },
      { path: 'offers', component: FeaturePlaceholderComponent, data: { eyebrow: 'Offres', title: 'Gestion des offres d’emploi', description: 'L’espace offre s’appuie sur job-offer-service.', emptyDescription: 'Le backend confirme la gestion CRUD des offres pour le rôle HR. Cette UI prépare la liste, le détail et les filtres sans exposer encore de faux jeux de données.', bullets: ['Enums confirmés : DRAFT, OPEN, CLOSED, CANCELLED', 'Types confirmés : CDI, CDD, INTERNSHIP, FREELANCE, PART_TIME, FULL_TIME', 'Niveaux confirmés : JUNIOR, MID, SENIOR, LEAD'] } },
      { path: 'applications', component: FeaturePlaceholderComponent, data: { eyebrow: 'Candidatures', title: 'Vue de pilotage des candidatures', description: 'Zone RH / manager pour le suivi du pipe de recrutement.', emptyDescription: 'application-service expose des routes HR pour la consultation par statut, candidat et offre.' } },
      { path: 'candidates', component: FeaturePlaceholderComponent, data: { eyebrow: 'Candidats', title: 'Référentiel candidats', description: 'Vue prête pour consulter les profils de candidats.', emptyDescription: 'candidate-service expose bien les routes de consultation côté HR.' } },
      { path: 'interviews', component: EmployeeInterviewsComponent },
      { path: 'notifications', component: EmployeeNotificationsComponent },
      { path: 'workflow', component: FeaturePlaceholderComponent, data: { eyebrow: 'Workflow', title: 'Pilotage Flowable', description: 'Vue prête pour afficher les tâches, transitions et statuts issus du moteur de workflow.', emptyDescription: 'workflow-service expose le démarrage de processus, la liste des tâches et la complétion de tâche. Une tâche BPMN reste toutefois mal câblée : cvValidationDelegate.' } }
    ]
  }
];

@NgModule({
  declarations: [EmployeeLayoutComponent, EmployeeDashboardComponent, EmployeeInterviewsComponent, EmployeeNotificationsComponent],
  imports: [CommonModule, ReactiveFormsModule, RouterModule.forChild(routes), SharedModule, WorkspaceModule]
})
export class EmployeeModule {}
