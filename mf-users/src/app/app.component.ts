import { Component } from '@angular/core';
import { GithubUsersComponent } from './github-users/github-users.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [GithubUsersComponent],
  template: '<app-github-users></app-github-users>'
})
export class AppComponent {}
