import { Component, OnInit, signal } from '@angular/core';

import { CoreDataTableComponent, CoreStatCardComponent } from 'core-ui';

@Component({
  selector: 'app-github-profiles',
  standalone: true,
  imports: [CoreDataTableComponent, CoreStatCardComponent],
  templateUrl: './github-profiles.component.html',
})
export class GithubProfilesComponent implements OnInit {
  users = signal<any[]>([]);
  loading = signal(true);

  // Table Configuration for our Smart Table
  tableColumns = [
    { key: 'avatar_url', label: 'Avatar', type: 'avatar' as const },
    { key: 'login', label: 'Usuario', type: 'text' as const },
    { key: 'id', label: 'ID Sistema', type: 'text' as const },
    { key: 'type', label: 'Tipo', type: 'badge' as const },
    { key: 'html_url', label: 'Perfil', type: 'link' as const },
  ];

  async ngOnInit() {
    try {
      const response = await fetch('https://api.github.com/users?per_page=15');
      const data = await response.json();
      this.users.set(data);
    } catch (e) {
      console.error('Failed to fetch github users', e);
    } finally {
      this.loading.set(false);
    }
  }

  handleFilter(term: string) {
    console.log('Filtrando por:', term);
  }
}
