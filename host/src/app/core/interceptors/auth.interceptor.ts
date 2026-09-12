import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Cuando MSAL esté completamente configurado, usualmente puedes usar su servicio inyectado.
  // const authService = inject(MsalService);
  // const token = authService.instance.getActiveAccount()?.idToken;

  // Generar un UUID único para la trazabilidad de esta petición
  const uuid = crypto.randomUUID();

  // Inicializar cabeceras con el UUID
  let headers = req.headers.set('X-Request-ID', uuid);

  // Intentar obtener el token de Azure AD
  const token = localStorage.getItem('msal_jwt_token');

  // Si existe el token, añadirlo también
  if (token) {
    headers = headers.set('Authorization', `Bearer ${token}`);
  }

  // Clonar la petición con las nuevas cabeceras
  const modifiedReq = req.clone({ headers });
  
  // Continuar con la petición modificada
  return next(modifiedReq);
};
