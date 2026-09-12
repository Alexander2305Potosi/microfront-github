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
    console.log('Iniciando flujo de autenticación con Azure Active Directory...');
    
    // Si quisieras redirigir en lugar de un popup, usarías loginRedirect()
    this.msalService.loginPopup().subscribe({
      next: (response) => {
        console.log('Login exitoso de Azure', response);
        // Guardamos el token para que el interceptor lo tome
        localStorage.setItem('msal_jwt_token', response.idToken);
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        console.error('Error de login en Azure (Probablemente porque el ClientID es falso):', error);
        
        // --- SOLO PARA DEMOSTRACIÓN (Como no tenemos credenciales reales aún) ---
        // Forzamos el paso al Dashboard para que puedas probar
        alert('MSAL Error: ' + error.message + '\n\nSaltando validación por ser un demo...');
        this.router.navigate(['/dashboard']);
      }
    });
  }
}
