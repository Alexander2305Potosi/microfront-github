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
    
    // Por políticas de negocio (Timeout de sesión a 20 minutos), 
    // forzamos un loginRedirect() para manejar la recarga de toda la aplicación.
    // El resultado volverá recargando la página en el app.component.ts
    try {
      this.msalService.loginRedirect();
    } catch (error) {
      console.error('Error al intentar redireccionar a Azure:', error);
      alert('MSAL Error al intentar redireccionar. \nVerifica tu configuración en app.config.ts');
    }
  }
}
