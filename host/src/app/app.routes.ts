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
    loadComponent: () => loadRemoteModule('mf-github-profiles', './GithubProfiles').then(m => m.GithubProfilesComponent) 
  },
  { 
    path: 'github-users', 
    loadComponent: () => loadRemoteModule('mf-users', './GithubUsers').then(m => m.GithubUsersComponent) 
  },
  { 
    path: 'github-repos', 
    loadComponent: () => loadRemoteModule('mf-repos', './GithubRepos').then(m => m.GithubReposComponent) 
  },
  { 
    path: 'complex-demo', 
    loadComponent: () => loadRemoteModule('mf-complex', './ComplexDemo').then(m => m.ComplexDemoComponent) 
  }
];
