# 🛠️ Plan de Acción Detallado: Despliegue Masivo en AWS S3

Este plan proporciona las instrucciones técnicas, configuraciones de código y comandos de pipeline exactos para resolver los 4 riesgos críticos de infraestructura y orquestación del ecosistema de Microfrontends.

---

## Solución 1: Escapar del Cuello de Botella del CI/CD
**El Objetivo:** Evitar reconstruir 50 Microfrontends (MFs) cada vez que se modifique un botón o la lógica en `core-shared`.

**Plan de Ejecución:**
En lugar de depender de alias de TypeScript (que causan inyección estática), convertiremos `core-shared` en un bloque compartido en tiempo de ejecución de Native Federation.

1.  **Refactorizar el `federation.config.js`:**
    Abre el archivo `federation.config.js` del Host y de cada MF, y agrega `core-shared` a los módulos estrictamente compartidos. 
    ```javascript
    // federation.config.js
    const { withNativeFederation, shareAll } = require('@angular-architects/native-federation/config');

    module.exports = withNativeFederation({
      shared: {
        ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }),
        'core-shared': { singleton: true, strictVersion: false } // <- La magia ocurre aquí
      }
    });
    ```
2.  Al configurar esto, Angular compilará `core-shared` como un paquete independiente y el Host cargará su código en memoria. Los MFs dejarán de compilarlo físicamente en su código y lo consumirán dinámicamente de la memoria del Host.
3.  **Resultado:** Actualizas `core-shared` => Despliegas solo el Host => Los 50 MFs reflejan el cambio instantáneamente.

---

## Solución 2: Estrategia Definitiva de Caché en AWS S3 y CloudFront
**El Objetivo:** Evitar los errores `404` por índices obsoletos, forzando a CloudFront a pedir siempre el último `remoteEntry.json`.

**Plan de Ejecución (Para integrar en tu GitHub Actions / GitLab CI):**
Al momento de desplegar a S3, debes dividir el comando de copiado (`aws s3 sync`) en dos pasos distintos manejando los *headers HTTP*.

1.  **Sincronizar el Código (Archivos cacheados por 1 Año):**
    Los archivos de JavaScript tienen un *hash* en su nombre (ej. `chunk-1A2B.js`). Estos jamás cambian, por lo tanto, pueden vivir en la caché de CloudFront para siempre.
    ```bash
    # Paso 1: Subir archivos JS/CSS estáticos
    aws s3 sync dist/mf-users/browser s3://mi-bucket-mf-users \
      --exclude "*.json" \
      --cache-control "public, max-age=31536000, immutable"
    ```

2.  **Sincronizar el Índice Maestro (NUNCA Cachear):**
    El archivo `remoteEntry.json` y `manifest.json` conservan siempre su nombre. Hay que obligar a los navegadores a no cachearlo jamás.
    ```bash
    # Paso 2: Subir el Entry (Zero Cache)
    aws s3 sync dist/mf-users/browser s3://mi-bucket-mf-users \
      --exclude "*" --include "*.json" \
      --cache-control "no-cache, no-store, must-revalidate"
    ```

3.  **Invalidar Distribución (Paso Final de Pipeline):**
    ```bash
    aws cloudfront create-invalidation --distribution-id E1A2B3C4D5 --paths "/remoteEntry.json"
    ```

---

## Solución 3: Control de Versiones en el Navegador (`sessionStorage`)
**El Objetivo:** Evitar que MFs viejos y MFs nuevos colisionen intentando leer el mismo Token de sesión de formas distintas.

**Plan de Ejecución:**
Debes crear un contrato estricto (Interfaz) para el guardado de llaves y añadirle una etiqueta de versión al string.

1.  **En `AuthenticationService`:**
    ```typescript
    // core-shared/src/lib/auth/authentication.service.ts
    const SESSION_KEY = 'msal_jwt_token_v1'; // Siempre sufijo con la versión

    public getToken(): string | null {
       return sessionStorage.getItem(SESSION_KEY);
    }
    ```
2.  Si en el futuro (ej. en 2 años) cambias la estructura de autenticación radicalmente, solo debes cambiar la constante a `msal_jwt_token_v2`. Los MFs obsoletos que nunca se actualizaron seguirán buscando `v1` (y fallarán dignamente o lanzarán advertencias), pero no causarán una corrupción de memoria destructiva con los datos `v2`.

---

## Solución 4: Resolución Dinámica de URLs
**El Objetivo:** Deshacerse del `localhost:4201` quemado y utilizar dominios de producción sin tener archivos duplicados.

**Plan de Ejecución:**
Existen dos opciones principales, pero la más limpia para Infraestructuras S3 es inyectar un script dinámico justo antes del Bootstrap.

1.  **Modificar `main.ts` del Host:**
    Native Federation permite cargar el manifiesto de forma asíncrona apuntando a una API, o a un entorno.
    ```typescript
    // host/src/main.ts
    import { initFederation } from '@angular-architects/native-federation';

    // Se detecta el entorno actual (Prod vs Local)
    const isProd = window.location.hostname !== 'localhost';
    const manifestPath = isProd 
        ? '/assets/federation.manifest.prod.json' 
        : '/assets/federation.manifest.json';

    initFederation(manifestPath)
      .catch(err => console.error(err))
      .then(_ => import('./bootstrap'))
      .catch(err => console.error(err));
    ```

2.  **Archivos Separados:**
    Mantienes el archivo local `federation.manifest.json` apuntando a `http://localhost:4201`.
    Creas el archivo `federation.manifest.prod.json` apuntando a tus distribuciones CloudFront (`https://mf-users.miempresa.com`). 
    El código autodetectará de dónde debe descargar los remotos basándose en la URL de la barra de navegación del cliente.
