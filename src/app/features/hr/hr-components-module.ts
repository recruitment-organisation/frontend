import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared-module';
import { HrDashboardComponent } from './dashboard/hr-dashboard';
import { HrNotificationsComponent } from './hr-notifications/hr-notifications';
import { HrInterviewsComponent } from './interviews/hr-interviews';
import { HrInterviewDetailComponent } from './interview-detail/hr-interview-detail';
import { HrOffersComponent } from './offers/hr-offers';
import { HrRecordsComponent } from './records/hr-records';

const HR_COMPONENTS = [HrDashboardComponent, HrNotificationsComponent, HrInterviewsComponent, HrInterviewDetailComponent, HrOffersComponent, HrRecordsComponent];

@NgModule({
  declarations: HR_COMPONENTS,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, SharedModule],
  exports: HR_COMPONENTS
})
export class HrComponentsModule {}
