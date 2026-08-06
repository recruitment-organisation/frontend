import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ActionButtonComponent } from './components/action-button/action-button';
import { DialogComponent } from './components/dialog/dialog';
import { EmptyStateComponent } from './components/empty-state/empty-state';
import { InterviewListComponent } from './components/interview-list/interview-list';
import { HrAssistantComponent } from './components/hr-assistant/hr-assistant';
import { NotificationListComponent } from './components/notification-list/notification-list';
import { PageHeaderComponent } from './components/page-header/page-header';
import { PublicFooterComponent } from './components/public-footer/public-footer';
import { PublicHeaderComponent } from './components/public-header/public-header';
import { SnackbarComponent } from './components/snackbar/snackbar';
import { StatCardComponent } from './components/stat-card/stat-card';
import { StatusBadgeComponent } from './components/status-badge/status-badge';
import { WorkspaceShellComponent } from './components/workspace-shell/workspace-shell';

const SHARED_COMPONENTS = [
  ActionButtonComponent,
  DialogComponent,
  EmptyStateComponent,
  InterviewListComponent,
  HrAssistantComponent,
  NotificationListComponent,
  PageHeaderComponent,
  PublicFooterComponent,
  PublicHeaderComponent,
  SnackbarComponent,
  StatCardComponent,
  StatusBadgeComponent,
  WorkspaceShellComponent
];

@NgModule({
  declarations: SHARED_COMPONENTS,
  imports: [CommonModule, FormsModule, RouterModule],
  exports: SHARED_COMPONENTS
})
export class SharedModule {}
