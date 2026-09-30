import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { AdminLayoutComponent } from '../../layouts/admin-layout/admin-layout';
import { SharedModule } from '../../shared/shared-module';
import { AdminDashboardComponent } from './dashboard/admin-dashboard';
import { CompaniesComponent } from './companies/companies';
import { CompanyDetailComponent } from './company-detail/company-detail';

const routes: Routes = [{ path: '', component: AdminLayoutComponent, children: [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'dashboard', component: AdminDashboardComponent },
  { path: 'companies', component: CompaniesComponent },
  { path: 'companies/:id', component: CompanyDetailComponent },
  { path: 'hr-users', component: CompaniesComponent }
]}];

@NgModule({ declarations: [AdminLayoutComponent, AdminDashboardComponent, CompaniesComponent, CompanyDetailComponent], imports: [CommonModule, ReactiveFormsModule, SharedModule, RouterModule.forChild(routes)] })
export class AdminModule {}
