import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { dashboardRedirectGuard } from './core/guards/dashboard-redirect-guard';
import { roleGuard } from './core/guards/role-guard';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { UnauthorizedComponent } from './pages/unauthorized/unauthorized';

const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth-module').then(m => m.AuthModule)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard, dashboardRedirectGuard],
    component: DashboardComponent
  },
  {
    path: 'candidate',
    canActivate: [authGuard, roleGuard(['CANDIDATE'])],
    loadChildren: () => import('./features/candidate/candidate-module').then(m => m.CandidateModule)
  },
  {
    path: 'hr',
    canActivate: [authGuard, roleGuard(['HR'])],
    loadChildren: () => import('./features/hr/hr-module').then(m => m.HrModule)
  },
  {
    path: 'manager',
    canActivate: [authGuard, roleGuard(['MANAGER'])],
    loadChildren: () => import('./features/manager/manager-module').then(m => m.ManagerModule)
  },
  {
    path: 'employee',
    canActivate: [authGuard, roleGuard(['EMPLOYEE'])],
    loadChildren: () => import('./features/employee/employee-module').then(m => m.EmployeeModule)
  },
  {
    path: 'unauthorized',
    component: UnauthorizedComponent
  },
  {
    path: '',
    loadChildren: () => import('./features/public/public-module').then(m => m.PublicModule)
  },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
