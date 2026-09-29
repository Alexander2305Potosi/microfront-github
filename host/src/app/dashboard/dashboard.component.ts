import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthenticationService } from 'core-shared';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthenticationService);
  
  hasGithubProfileRole = false;

  ngOnInit() {
    // Validar si tiene el rol requerido para ver el MF de Perfiles
    this.hasGithubProfileRole = this.authService.hasPermission(['listGitHubProfiles']);
    
    // Fallback temporal si estás testeando sin login real:
    // Puedes borrar estas 3 líneas si ya estás probando con tokens verdaderos
    if (!this.authService.authenticated()) {
      this.hasGithubProfileRole = true; // Forzar a true para pruebas locales sin login
    }
  }
}
