import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FeaturePlaceholderComponent } from './feature-placeholder/feature-placeholder';
import { ProfilePageComponent } from './profile-page/profile-page';
import { SharedModule } from '../../shared/shared-module';

@NgModule({
  declarations: [FeaturePlaceholderComponent, ProfilePageComponent],
  imports: [CommonModule, ReactiveFormsModule, SharedModule],
  exports: [FeaturePlaceholderComponent, ProfilePageComponent]
})
export class WorkspaceModule {}
