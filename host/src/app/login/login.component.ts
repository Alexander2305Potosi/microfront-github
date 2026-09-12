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
    
    // Al usar loginRedirect(), el navegador abandonará nuestra página e irá a Microsoft.
    // Una vez autenticado, Microsoft redireccionará de vuelta a nuestra App y el token 
    // será procesado globalmente en app.component.ts
    try {
      this.msalService.loginRedirect();
    } catch (error) {
      console.error('Error al intentar redireccionar a Azure:', error);
      alert('MSAL Error al intentar redireccionar. \nVerifica tu configuración en app.config.ts');
    }
  }
}
