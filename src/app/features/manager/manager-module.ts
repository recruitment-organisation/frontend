import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { HrInterviewsComponent } from '../hr/interviews/hr-interviews';
import { HrNotificationsComponent } from '../hr/hr-notifications/hr-notifications';
import { HrRecordsComponent } from '../hr/records/hr-records';
import { HrComponentsModule } from '../hr/hr-components-module';
import { WorkspaceModule } from '../workspace/workspace-module';
import { ManagerLayoutComponent } from '../../layouts/manager-layout/manager-layout';
import { SharedModule } from '../../shared/shared-module';
import { ManagerProfileComponent } from './manager-profile/manager-profile';
import { ManagerWorkspaceComponent } from './manager-workspace/manager-workspace';

const routes: Routes = [
  {
    path: '',
    component: ManagerLayoutComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: ManagerWorkspaceComponent },
      { path: 'candidates', component: HrRecordsComponent, data: { mode: 'candidates', readOnly: true } },
      { path: 'applications', component: HrRecordsComponent, data: { mode: 'applications', readOnly: true } },
      { path: 'interviews', component: HrInterviewsComponent },
      { path: 'notifications', component: HrNotificationsComponent, data: { managerView: true } },
      { path: 'profile', component: ManagerProfileComponent }
    ]
  }
];

@NgModule({
  declarations: [ManagerLayoutComponent, ManagerProfileComponent, ManagerWorkspaceComponent],
  imports: [CommonModule, ReactiveFormsModule, RouterModule.forChild(routes), SharedModule, WorkspaceModule, HrComponentsModule]
})
export class ManagerModule {}
