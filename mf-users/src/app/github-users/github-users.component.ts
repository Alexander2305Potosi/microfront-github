import { Component, signal, inject, OnInit } from '@angular/core';
import { CoreDataTableComponent, AuthenticationService } from 'core-shared';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-github-users',
  standalone: true,
  imports: [CoreDataTableComponent, FormsModule],
  templateUrl: './github-users.component.html'
})
export class GithubUsersComponent implements OnInit {
  private authService = inject(AuthenticationService);
  
  users = signal<any[]>([
    { id: 1, login: 'admin_local', type: 'Admin', avatar_url: 'https://ui-avatars.com/api/?name=Admin' }
  ]);
  
  newUserLogin = '';
  newUserId = 2;
  canAddUser = false;

  tableColumns = [
    { key: 'avatar_url', label: 'Avatar', type: 'avatar' as const },
    { key: 'login', label: 'Usuario', type: 'text' as const },
    { key: 'id', label: 'ID', type: 'text' as const },
    { key: 'type', label: 'Tipo', type: 'badge' as const }
  ];

  ngOnInit() {
    this.canAddUser = this.authService.hasPermission(['mf-add-user']);
    
    if (!this.authService.authenticated()) {
      // Fallback para pruebas locales
      this.canAddUser = true; 
    }
  }

  addUser() {
    if (!this.newUserLogin.trim()) return;
    
    const newUser = {
      id: this.newUserId++,
      login: this.newUserLogin,
      type: 'User',
      avatar_url: `https://ui-avatars.com/api/?name=${this.newUserLogin}`
    };

    this.users.update(current => [...current, newUser]);
    this.newUserLogin = '';
  }
}
