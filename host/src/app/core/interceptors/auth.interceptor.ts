import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Cuando MSAL esté completamente configurado, usualmente puedes usar su servicio inyectado.
  // const authService = inject(MsalService);
  // const token = authService.instance.getActiveAccount()?.idToken;

  // Por ahora, o si extraes el token manualmente tras el login de Azure:
  const token = localStorage.getItem('msal_jwt_token');

  if (token) {
    // Clonar la petición para inyectar el Header de Autorización
    const authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    
    // Continuar con la petición modificada
    return next(authReq);
  }

  // Si no hay token, la petición pasa intacta
  return next(req);
};
