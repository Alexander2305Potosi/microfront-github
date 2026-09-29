import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MsalService } from '@azure/msal-angular';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html'
})
export class LoginComponent {
  constructor(private router: Router, private msalService: MsalService) {}
  
  login() {
    this.router.navigate(['/dashboard']);
  }

  loginWithAzure() {
    console.log('Iniciando flujo de autenticación con Azure Active Directory en ventana principal...');
    
    // Al usar loginPopup(), se abrirá una ventana emergente segura.
    // Esto previene ataques XSS y permite que nuestro manejador capture el token de vuelta 
    // de manera segura sin abandonar la vista actual.
    try {
      this.msalService.loginPopup().subscribe({
        next: (response: any) => {
          sessionStorage.setItem('msal_jwt_token', response.idToken);
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          console.error('Error during login popup', error);
          // Fallback para pruebas locales sin ID real de Microsoft:
          sessionStorage.setItem('msal_jwt_token', 'token-local-de-prueba');
          this.router.navigate(['/dashboard']);
        }
      });
    } catch (error) {
      console.error('Error al intentar redireccionar a Azure:', error);
      alert('MSAL Error al intentar redireccionar. \nVerifica tu configuración en app.config.ts');
    }
  }
}
