import { Routes } from '@angular/router';
import { loadRemoteModule } from '@angular-architects/native-federation';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent },
  { 
    path: 'github', 
    loadComponent: () => loadRemoteModule('remote', './GithubProfiles').then(m => m.GithubProfilesComponent) 
  },
  { 
    path: 'github-users', 
    loadComponent: () => loadRemoteModule('remote', './GithubUsers').then(m => m.GithubUsersComponent) 
  },
  { 
    path: 'github-repos', 
    loadComponent: () => loadRemoteModule('remote', './GithubRepos').then(m => m.GithubReposComponent) 
  },
  { 
    path: 'complex-demo', 
    loadComponent: () => loadRemoteModule('remote', './ComplexDemo').then(m => m.ComplexDemoComponent) 
  }
];
