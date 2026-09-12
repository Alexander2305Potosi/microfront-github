import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html'
})
export class LoginComponent {
  constructor(private router: Router) {}
  
  login() {
    this.router.navigate(['/dashboard']);
  }

  loginWithAzure() {
    // Aquí iría la integración real con this.msalService.loginPopup() o loginRedirect()
    console.log('Iniciando flujo de autenticación con Azure Active Directory...');
    this.router.navigate(['/dashboard']);
  }
}
