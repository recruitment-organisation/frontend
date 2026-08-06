import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CurrentUser } from '../../core/models/auth/current-user';
import { Auth } from '../../core/services/auth';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit {
  currentUser: CurrentUser | null = null;
  isLoggedIn = false;

  constructor(private authService: Auth , private router: Router) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.isLoggedIn = this.currentUser !== null;
  }

  get primaryRole(): string {
    if (!this.currentUser?.roles?.length) {
      return 'Utilisateur';
    }

    if (this.currentUser.roles.includes('HR')) {
      return 'HR';
    }

    if (this.currentUser.roles.includes('MANAGER')) {
      return 'MANAGER';
    }

    if (this.currentUser.roles.includes('EMPLOYEE')) {
      return 'EMPLOYEE';
    }

    if (this.currentUser.roles.includes('CANDIDATE')) {
      return 'CANDIDATE';
    }

    return this.currentUser.roles[0];
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
