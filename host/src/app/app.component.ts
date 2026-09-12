import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { MsalService } from '@azure/msal-angular';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet></router-outlet>'
})
export class AppComponent implements OnInit {
  constructor(private msalService: MsalService, private router: Router) {}

  ngOnInit(): void {
    // Escuchar la respuesta cuando Microsoft redirige de vuelta a nuestra aplicación
    this.msalService.handleRedirectObservable().subscribe({
      next: (response) => {
        if (response !== null && response.idToken) {
          console.log('Login por redirección exitoso:', response);
          localStorage.setItem('msal_jwt_token', response.idToken);
          this.router.navigate(['/dashboard']);
        } else {
          // MSAL también dispara este evento inicialmente con response = null
          // si no viene de una redirección activa.
        }
      },
      error: (error) => {
        console.error('Error procesando el retorno del login de Azure:', error);
      }
    });
  }
}
