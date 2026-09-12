import { Component, OnInit, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { CoreDataTableComponent, CoreStatCardComponent } from 'core-ui';

@Component({
  selector: 'app-github-profiles',
  standalone: true,
  imports: [CoreDataTableComponent, CoreStatCardComponent],
  templateUrl: './github-profiles.component.html',
})
export class GithubProfilesComponent implements OnInit {
  private http = inject(HttpClient);
  
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
    await this.fetchUsers();
  }
  
  async fetchUsers() {
    this.loading.set(true);
    try {
      // Usamos HttpClient para que la petición pase por el interceptor del Host.
      // El interceptor identificará que es "api.github.com" y NO le enviará el token de Azure,
      // pero SÍ enviará el X-Request-ID (UUID) por trazabilidad.
      const data = await firstValueFrom(this.http.get<any[]>('https://api.github.com/users?per_page=15'));
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
