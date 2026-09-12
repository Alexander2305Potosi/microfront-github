import { Component } from '@angular/core';
import { GithubProfilesComponent } from './github-profiles/github-profiles.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [GithubProfilesComponent],
  templateUrl: './app.component.html'
})
export class AppComponent {}
