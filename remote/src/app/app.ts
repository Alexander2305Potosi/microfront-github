import { Component } from '@angular/core';
import { GithubProfilesComponent } from './github-profiles/github-profiles.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [GithubProfilesComponent],
  template: '<app-github-profiles></app-github-profiles>'
})
export class App {}
