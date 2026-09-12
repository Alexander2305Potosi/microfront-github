import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Cuando MSAL esté completamente configurado, usualmente puedes usar su servicio inyectado.
  // const authService = inject(MsalService);
  // const token = authService.instance.getActiveAccount()?.idToken;

  // Generar un UUID único para la trazabilidad de esta petición
  const uuid = crypto.randomUUID();

  // Inicializar cabeceras con el UUID (El UUID siempre se envía por temas de trazabilidad global)
  let headers = req.headers.set('X-Request-ID', uuid);

  // Intentar obtener el token de Azure AD
  const token = localStorage.getItem('msal_jwt_token');

  // DOMAIN WHITELISTING: 
  // Evaluamos si el destino es un tercero. Por seguridad, NUNCA debemos mandar 
  // nuestro JWT interno de Azure a APIs externas (ej. GitHub).
  const isExternalApi = req.url.includes('api.github.com');

  // Si existe el token y no es una API externa, lo añadimos
  if (token && !isExternalApi) {
    headers = headers.set('Authorization', `Bearer ${token}`);
  }

  // Clonar la petición con las nuevas cabeceras
  const modifiedReq = req.clone({ headers });
  
  // Continuar con la petición modificada
  return next(modifiedReq);
};
