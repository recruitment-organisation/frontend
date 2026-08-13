import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HrLayoutComponent } from '../../layouts/hr-layout/hr-layout';
import { SharedModule } from '../../shared/shared-module';
import { WorkspaceModule } from '../workspace/workspace-module';
import { HrDashboardComponent } from './dashboard/hr-dashboard';
import { HrNotificationsComponent } from './hr-notifications/hr-notifications';
import { HrInterviewsComponent } from './interviews/hr-interviews';
import { HrInterviewDetailComponent } from './interview-detail/hr-interview-detail';
import { HrOffersComponent } from './offers/hr-offers';
import { HrRecordsComponent } from './records/hr-records';
import { HrComponentsModule } from './hr-components-module';
import { ProfilePageComponent } from '../workspace/profile-page/profile-page';
import { HrRolesComponent } from './roles/hr-roles';

const routes: Routes = [
  {
    path: '',
    component: HrLayoutComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: HrDashboardComponent },
      { path: 'profile', component: ProfilePageComponent, data: { eyebrow: 'Profil RH', title: 'Mon compte RH', description: 'Vos informations de session et les paramètres de sécurité de votre compte RH.' } },
      { path: 'employees', component: HrRecordsComponent, data: { mode: 'employees' } },
      { path: 'roles', component: HrRolesComponent },
      { path: 'managers', component: HrRecordsComponent, data: { mode: 'managers' } },
      { path: 'offers', component: HrOffersComponent },
      { path: 'candidates', component: HrRecordsComponent, data: { mode: 'candidates' } },
      { path: 'applications', component: HrRecordsComponent, data: { mode: 'applications' } },
      { path: 'interviews/:id', component: HrInterviewDetailComponent },
      { path: 'interviews', component: HrInterviewsComponent },
      { path: 'notifications', component: HrNotificationsComponent }
    ]
  }
];

@NgModule({
  declarations: [HrLayoutComponent],
  imports: [CommonModule, RouterModule.forChild(routes), SharedModule, WorkspaceModule, HrComponentsModule]
})
export class HrModule {}
