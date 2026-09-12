import { Component, signal } from '@angular/core';
import { CoreDataTableComponent } from 'core-ui';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-github-repos',
  standalone: true,
  imports: [CoreDataTableComponent, FormsModule],
  templateUrl: './github-repos.component.html'
})
export class GithubReposComponent {
  repos = signal<any[]>([]);
  loading = signal(false);
  searchTerm = 'angular';

  tableColumns = [
    { key: 'name', label: 'Repositorio', type: 'text' as const },
    { key: 'stargazers_count', label: 'Estrellas', type: 'badge' as const },
    { key: 'language', label: 'Lenguaje', type: 'text' as const },
    { key: 'html_url', label: 'Enlace', type: 'link' as const }
  ];

  async searchRepos() {
    if (!this.searchTerm.trim()) return;
    this.loading.set(true);
    
    try {
      const response = await fetch(`https://api.github.com/search/repositories?q=${this.searchTerm}&per_page=10`);
      const data = await response.json();
      this.repos.set(data.items || []);
    } catch (e) {
      console.error('Error fetching repos', e);
    } finally {
      this.loading.set(false);
    }
  }
}
