import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { PublicLayoutComponent } from '../../layouts/public-layout/public-layout';
import { SharedModule } from '../../shared/shared-module';
import { AboutComponent } from './about/about';
import { ContactComponent } from './contact/contact';
import { HomeComponent } from './home/home';
import { ServicesComponent } from './services/services';

const routes: Routes = [
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      { path: '', component: HomeComponent },
      { path: 'about', component: AboutComponent },
      { path: 'contact', component: ContactComponent },
      { path: 'services', component: ServicesComponent }
    ]
  }
];

@NgModule({
  declarations: [PublicLayoutComponent, AboutComponent, ContactComponent, HomeComponent, ServicesComponent],
  imports: [CommonModule, ReactiveFormsModule, RouterModule.forChild(routes), SharedModule]
})
export class PublicModule {}
