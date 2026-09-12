import { Component } from '@angular/core';
import { GithubReposComponent } from './github-repos/github-repos.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [GithubReposComponent],
  template: '<app-github-repos></app-github-repos>'
})
export class AppComponent {}
