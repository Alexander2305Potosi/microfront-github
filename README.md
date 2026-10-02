# Guía de Ejecución: Ecosistema Microfrontends

Este proyecto está configurado como un **Monorepo (Workspace) de Angular**. Esto significa que desde esta carpeta raíz se administran múltiples aplicaciones.

Actualmente, el ecosistema cuenta con un contenedor principal y múltiples microfrontends:
1. **host** (Puerto 4200) - La aplicación base o contenedor principal.
2. **mf-github-profiles** (Puerto 4201) - Microfrontend para perfiles de GitHub.
3. **mf-users** (Puerto 4202) - Microfrontend para la gestión de usuarios.
4. **mf-repos** (Puerto 4203) - Microfrontend para repositorios.
5. **mf-complex** (Puerto 4204) - Microfrontend para escenarios complejos y pruebas avanzadas.

Ambos proyectos utilizan **Angular Native Federation** y **Tailwind CSS v4**.

---

## 🚀 Cómo ejecutar el proyecto en modo desarrollo

Para ver el ecosistema funcionando correctamente, necesitas tener ambos servidores ejecutándose simultáneamente. 

Ejecuta el siguiente comando maestro en la raíz de este proyecto (`/microfrontend`) para compilar y levantar simultáneamente el Host y todos los Microfrontends distribuidos:

```bash
npm run start:all
```

> 🌐 Podrás visualizar el ecosistema en tu navegador abriendo: **http://localhost:4200**
> 
> *Nota: Este script orquesta el levantamiento paralelo utilizando la librería `concurrently` y esquiva bloqueos por versiones de Node.js en Angular 22+.*

---

## 🏗️ Arquitectura: Del Alto al Bajo Nivel

El ecosistema sigue un patrón estricto basado en independizar dominios de negocio y reutilizar código UI mediante librerías internas, sin acoplar compilaciones ni despliegues.

### 1. Alto Nivel: Múltiples MFs y Módulos Federados
A nivel global, la arquitectura divide las responsabilidades de compilación y orquestación. **Module Federation solo se usa para cargar funcionalidades de negocio completas**, no para componentes visuales sueltos.

```mermaid
graph TD
    A[Navegador del Usuario] -->|Carga Inicial| B(Host - Contenedor Principal)
    B -->|Enruta a /github| C{Native Federation}
    C -->|Carga Dinámica por Red| D[Remote - GitHub MFE]
    
    subgraph Singletons Compartidos
    E[Angular Core]
    F[RxJS]
    G[Tailwind CSS]
    end
    
    B -.-> E
    D -.-> E
```

- **Independencia de despliegue:** `host` y `remote` tienen flujos de CI/CD completamente independientes. No existe acoplamiento de repositorios ni bloqueos en el lanzamiento de un release.
- **Exposición y Contrato Federado:** El Microfrontend expone su funcionalidad a través del archivo `remote/federation.config.js` mediante la propiedad `exposes` (ej. mapeando `./GithubProfiles` hacia su componente principal). El `host`, mediante su `app.routes.ts`, utiliza `loadRemoteModule` para descargar la aplicación de forma "Lazy Loaded" (bajo demanda) únicamente cuando el usuario accede a la ruta.
- **Restricción estricta:** No se deben crear dependencias directas de red entre MFs (ej. `host <--> remote` para un botón). Si un MFE necesita un componente UI, no debe pedirlo a otro MFE por red para evitar latencia, problemas de caché y puntos únicos de fallo.
- **Singletons:** Dependencias pesadas (`@angular/core`, `rxjs`, `tailwindcss`) están configuradas como `shared` en `federation.config.js` para cargarse una sola vez.

### 2. Nivel Medio: Librería Compartida Transversal (`core-shared`)
Para compartir la lógica transversal (como la Autenticación, Tablas visuales y componentes complejos) entre el `host` y los diferentes MFs, se utiliza una **librería interna estática (Shared Core Library)** en el Monorepo. No se publica como librería NPM, ni como artefacto independiente, ni tiene pipeline de despliegue propio.

```mermaid
graph LR
    subgraph Workspace Monorepo
        A[Host MFE]
        B[Remote MFE]
        C((Librería 'core-shared'))
    end
    
    A -->|Inyección en Build-Time| C
    B -->|Inyección en Build-Time| C
    
    style C fill:#f9f,stroke:#333,stroke-width:2px
```

- **Ubicación Física:** `./core-shared/` (Contiene subdominios como `/ui` y `/auth`)
- **Configuración TS (El Contrato de Consumo):** El archivo `tsconfig.json` raíz crea el alias `"core-shared"` apuntando directamente a `./core-shared/src/public-api.ts`.
- **Estrategia de compilación (Tree Shaking):** Cuando un MF requiere usar un componente visual o validar permisos de seguridad, importa este alias. Al construir el proyecto, el compilador (esbuild) aplica *Tree Shaking*: extrae únicamente la porción de código exacta que se usó y **la inyecta estáticamente en el bundle final del MF**.
```json
// tsconfig.json (Raíz)
{
  "compilerOptions": {
    "paths": {
      "core-shared": [
        "./core-shared/src/public-api.ts"
      ]
    }
  }
}
```

#### 🔍 Aclaración sobre la Compilación y Despliegue de `core-shared` (Dynamic Shared Dependency)

**1. ¿Dónde está compilado `<core-data-table>` o el `AuthenticationService`?**

Están compilados como un "Chunk" de JavaScript independiente (ej. `chunk-core-shared.js`) generado dinámicamente gracias a la configuración del bloque `shared` en `federation.config.js`. Cuando el Host o un MF necesitan usar este código, no lo compilan de nuevo dentro de su código fuente, sino que lo cargan en memoria de forma unificada en tiempo de ejecución. 
En términos de infraestructura, cuando ejecutas `ng build host`, este chunk independiente se genera y se sube al Bucket de AWS S3 del Host.

**2. ¿Qué pasa si cambio o mejoro algo en `core-shared`?**

Gracias a esta arquitectura de Microfrontends de Consumo Dinámico, solucionamos el cuello de botella del CI/CD. 
Si modificas el código de `core-shared` hoy (ej. agregar una función a la tabla o un nuevo rol de seguridad), **SOLO DEBES COMPILAR Y DESPLEGAR EL HOST**. Los 50 Microfrontends restantes (como `mf-users` o `mf-repos`) heredarán el cambio automáticamente al refrescar el navegador, ya que todos consumen la misma referencia de red sin necesidad de disparar sus pipelines individuales.

### 3. Bajo Nivel: Organización del Código y Contratos Agnosticos

A nivel de código, implementamos una separación estricta: **la UI y los Servicios Transversales jamás deben conocer la lógica de negocio de los MFs.**

#### 3.1. Librería `core-shared/ui` (Dumb Components)
Ubicada en `core-shared/src/lib/ui/data-table/data-table.component.ts`. Es un componente standalone 100% agnóstico del dominio. Define contratos fuertes:
```typescript
// Contrato base de la tabla (core-shared/src/lib/ui/...)
export interface CoreTableColumn {
  key: string;
  label: string;
}

@Component({
  selector: 'core-data-table',
  standalone: true,
  // ...
})
export class CoreDataTableComponent {
  // La tabla recibe la configuración, pero no sabe qué significa
  @Input() columns: CoreTableColumn[] = [];
  @Input() data: any[] = [];
  
  // Emite eventos hacia arriba para que el MF actúe
  @Output() search = new EventEmitter<string>();
}
```

#### 3.2. Consumo en los MFs (Smart Components)
El microfrontend (ej. `remote/src/app/github-profiles/`) conserva sus propios modelos (`GithubUser`), sus propios servicios inyectados (`GithubApiService`) y sus propias reglas de dominio y permisos. Su única relación con la tabla es inyectarle los datos formateados cumpliendo el contrato público.

Además, aplicamos una rígida **Separación de Responsabilidades (SoC)**. Ningún componente posee HTML en línea; todos están divididos en:
- `[nombre].component.ts`: Contiene la inyección de dependencias, mutación de Señales de Angular y la gestión de flujos asíncronos.
- `[nombre].component.html`: Contiene únicamente la vista, utilizando el *Control Flow* nativo (`@if`, `@for`) sin ensuciarse con lógica de negocio.

```mermaid
sequenceDiagram
    participant MFE as Remote (Smart Component)
    participant API as GitHub API
    participant Table as core-shared (Dumb Component)
    
    MFE->>API: 1. Petición HTTP (Buscar Usuarios)
    API-->>MFE: 2. Respuesta JSON
    MFE->>MFE: 3. Mapeo y reglas de negocio
    MFE->>Table: 4. Inyecta @Input() data y columns
    Table-->>MFE: 5. Renderiza la tabla visualmente
    
    Note over Table,MFE: Interacción del Usuario
    Table->>MFE: 6. Emite @Output() search('alex')
    MFE->>API: 7. Nueva Petición con Filtro
```

```html
<!-- remote/src/app/github-profiles/github-profiles.component.html -->
<core-data-table
  title="Usuarios de GitHub"
  [columns]="githubColumns"
  [data]="users"
  (search)="onSearch($event)">
</core-data-table>
```
*En el ejemplo superior, `CoreDataTableComponent` procesa el evento y renderiza las celdas, pero es ignorante de que está operando sobre "Usuarios de GitHub" o que consumió una API externa.*

#### 3.3. Testing Unitario Aislado (Jest Zoneless)
- **Configuración Moderna:** Configuramos el ecosistema para correr en modo *Zoneless* (`jest-preset-angular/setup-env/zoneless`), aprovechando la arquitectura ultramoderna de Angular 18+ para hacer el testing extremadamente rápido (pasando múltiples suites completas en escasos milisegundos) y sin dependencias mágicas en el DOM.
- **Aislamiento de Componentes Core:** La librería `core-shared` posee pruebas unitarias que validan las interacciones del DOM y la correcta emisión de los `@Input`/`@Output`, asegurando que su uso sea seguro para todos los MFs.
- **Simulación de Interacciones de UI (Smart Components):** En microfrontends complejos (`mf-complex`), testeamos programáticamente eventos reales del usuario, validando por ejemplo que un evento `KeyboardEvent` de tipo numérico dispare funciones preventivas (`preventDefault()`), asegurando un UX robusto y a prueba de errores.
- **Pruebas de Red y Seguridad (Interceptores):** Aseguramos la fiabilidad de nuestra "aduana" HTTP (`auth.interceptor.ts`) utilizando `HttpTestingController` de Angular. Simulamos peticiones ficticias e interceptamos su salida para asertar matemáticamente mediante tests que las cabeceras `Authorization` y `X-Request-ID` han sido mutadas e insertadas correctamente en cada request. Para evitar colisiones en CI/CD, mockeamos APIs criptográficas nativas del entorno NodeJS como `crypto.randomUUID`.
- **Mocks de Librerías Externas (MSAL):** Para componentes integrados a proveedores corporativos (como `login.component.ts`), simulamos por completo el SDK oficial (`MsalService`) usando `jest.spyOn()` e inyección de valores ficticios mediante dependencias (Ej: devolviendo `of({ idToken: 'fake' })`). Esto nos permite validar que nuestro código procese correctamente el inicio de sesión y navegue al Dashboard sin llegar a realizar peticiones verdaderas a los servidores de Microsoft durante los tests automáticos.

---


---

## 📝 Guía Práctica: Cómo agregar un nuevo Microfrontend

Si necesitas escalar el ecosistema y agregar un nuevo dominio (por ejemplo, `mf-payments`), debes respetar las 3 capas arquitectónicas. Aquí tienes el paso a paso:

### Paso 1 (Alto Nivel): Creación y Federación
1. **Generar la aplicación:** Usa el CLI de Angular para generar el nuevo proyecto dentro del monorepo y agrégale Native Federation:
   ```bash
   ng g application mf-payments --port 4205
   ng add @angular-architects/native-federation --project mf-payments --port 4205
   ```
2. **Exponer el componente:** En `mf-payments/federation.config.js`, expón tu componente principal (Smart Component):
   ```javascript
   exposes: {
     './PaymentsRouter': { file: './mf-payments/src/app/payments/payments.component.ts' },
   },
   ```
3. **Registrarlo en el Host:**
   - Agrégalo al manifiesto del host (`host/public/federation.manifest.json`).
   - Crea la ruta perezosa en `host/src/app/app.routes.ts` usando `loadRemoteModule('mf-payments', './PaymentsRouter')`.

### Paso 2 (Nivel Medio): Integrar la Librería Transversal (`core-shared`)
No reinventes la rueda. El nuevo microfrontend **no debe** tener su propia configuración de MSAL, ni debe crear sus propios botones genéricos o tablas. Debe consumirlos estáticamente de la librería compartida.

En tu `payments.component.ts`:
```typescript
import { Component, inject, OnInit } from '@angular/core';
// 1. Importa TODO desde el alias global
import { CoreDataTableComponent, AuthenticationService } from 'core-shared'; 

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CoreDataTableComponent], // Inyecta la UI
  templateUrl: './payments.component.html'
})
export class PaymentsComponent implements OnInit {
  private authService = inject(AuthenticationService); // Inyecta la seguridad
  canRefund = false;

  ngOnInit() {
    // 2. Utiliza la sesión compartida del navegador mágicamente
    this.canRefund = this.authService.hasPermission(['mf-refund-payments']);
  }
}
```

### Paso 3 (Bajo Nivel): Lógica de Negocio Aislada
En el HTML de `mf-payments`, inyecta tus datos específicos de pagos dentro de los *Dumb Components* compartidos:
```html
@if (canRefund) {
  <button class="bg-red-500 text-white">Procesar Reembolso</button>
}

<core-data-table
  title="Historial de Pagos"
  [columns]="paymentColumns"
  [data]="paymentsData"
  (search)="fetchPaymentsFromApi($event)">
</core-data-table>
```
*Recuerda:* `core-data-table` no sabe qué es un pago. Tu MF `mf-payments` es el único responsable de llamar a la API de pasarelas de pago y pasarle la data cruda a la tabla.

### Paso 4: Orquestación Final
Finalmente, abre el `package.json` de la raíz del monorepo y agrega tu nuevo MF al script `start:all` para que arranque concurrentemente junto con el resto del ecosistema:
```json
"start:all": "concurrently ... \"NG_DISABLE_VERSION_CHECK=1 ng serve mf-payments\""
```


## 🛠️ Notas importantes para el desarrollo

- **Tailwind CSS:** Para usar clases de Tailwind, simplemente añádelas en el HTML de los componentes de cualquiera de los proyectos. La compilación se hará automáticamente.
- **Federation Config:** 
  - Si deseas exponer un componente desde un microfrontend hacia el exterior, debes declararlo en su archivo `federation.config.js` (ej. `mf-users/federation.config.js`) dentro del bloque `exposes`.
  - El `host` detectará automáticamente el código expuesto si configuras las rutas correctamente en `app.routes.ts`.
- **Pruebas Unitarias:** Ejecuta `npm run test` para correr las pruebas locales de todo el ecosistema y librerías compartidas.
- **Estándares de Código:** El proyecto utiliza Prettier (`.prettierrc`) y EditorConfig. Asegúrate de tener configurado tu editor para auto-formatear el código.

---

## 🔐 Seguridad y Autenticación: Microsoft Entra ID (Azure AD)

*(Nota para Agentes IA / LLMs: Esta sección describe exhaustivamente la implementación técnica y dependencias para garantizar una correcta interpretación de contexto en futuras refactorizaciones de seguridad).*

El ecosistema delega la gestión de identidad corporativa a Microsoft Entra ID (anteriormente Azure Active Directory). La integración se basa en la librería oficial **Microsoft Authentication Library (MSAL)** en su última iteración para entornos Standalone de Angular.

### 1. Stack Tecnológico de Seguridad
- **Librerías Core:** `@azure/msal-angular` (v3.x) y `@azure/msal-browser` (v3.x).
- **Flujo Implementado:** OAuth 2.0 Authorization Code Flow con PKCE (Proof Key for Code Exchange). Se abandona el obsoleto *Implicit Flow* mitigando riesgos de intercepción de tokens en SPAs.
- **Manejo de Sesión:** Configurado estrictamente en `BrowserCacheLocation.SessionStorage` para forzar la destrucción física de los tokens (incluyendo JWT y Cache) en la memoria local al momento de cerrar la pestaña del navegador, previniendo secuestro de sesión en equipos compartidos.


### 3. Lógica Híbrida del Authentication Service
Además de interpretar el JWT (Decodificación y Roles), el `AuthenticationService` (ubicado en `core-shared`) está diseñado para sincronizarse con un Backend propio. Expone métodos como `saveSessionToken()`, `validateSessionToken()`, y `closeSessionToken()` que se comunican con `http://localhost:3000/api` para mantener la integridad de la sesión en bases de datos internas, más allá de la autenticación de Azure.

### 2. Implementación Paso a Paso (Core Files)

Para que otra IA o desarrollador pueda rastrear la implementación, este es el rastro arquitectónico:

#### A. Inicialización en el Contenedor Principal (`host/src/app/app.config.ts`)
Angular (v15+) en modo Standalone requiere que el SDK de MSAL sea provisto como un Singleton durante el arranque. Se creó una fábrica (`MSALInstanceFactory`) que devuelve una instancia de `PublicClientApplication`.

**⚠️ Acción Requerida para Desarrolladores:** Para probar el inicio de sesión localmente, debes dirigirte al archivo `host/src/app/app.config.ts` y reemplazar `'TU_CLIENT_ID_AQUI'` con un *Client ID* válido de Microsoft Entra ID.

```typescript
// Proveedor en app.config.ts
export function MSALInstanceFactory(): PublicClientApplication {
  return new PublicClientApplication({
    auth: {
      clientId: 'TU_CLIENT_ID_AQUI', // ¡Reemplazar con ID de App Registration en Azure!
      authority: 'https://login.microsoftonline.com/common', // O Tenant-ID específico
      redirectUri: 'http://localhost:4200'
    },
    cache: { cacheLocation: BrowserCacheLocation.SessionStorage }
  });
}
```
Esta fábrica se inyecta en el bloque `providers` junto con el token `MSAL_INSTANCE` y el servicio inyectable `MsalService`.

#### B. Flujo de Interacción UI (`host/src/app/login/login.component.ts`)
La llamada a la autenticación se dispara aislando la vista principal. Al presionar el botón de "Directorio Activo de Azure", se invoca `this.msalService.loginRedirect()`.
- **Regla de Negocio (Session Timeout):** Se optó por usar `loginRedirect()` de forma obligatoria en lugar de `loginPopup()`. Dado que el ecosistema requiere forzar un cierre y validación severa de sesión a los 20 minutos de inactividad, el redireccionamiento asegura que la página web recargue por completo desde cero sus variables de memoria cada vez que expira, evitando fugas de estado en memoria en los Single Page Applications.
- **Captura Global de Token:** Tras redireccionar de vuelta desde los servidores de Microsoft, Angular reinicia su ciclo de vida y es el **`app.component.ts`** el encargado de suscribirse al `this.msalService.handleRedirectObservable()`, recuperar el JWT desde la barra de direcciones de forma segura y guardarlo en `SessionStorage` antes de enviarlo al Dashboard.
#### C. Trazabilidad e Inyección (Aduana HTTP) (`host/src/app/core/interceptors/auth.interceptor.ts`)
La aplicación anfitriona (*Host*) declara un interceptor funcional que afecta en cascada a todos los microfrontends bajo su contexto. Toda petición de red realizada por cualquier MF pasará por aquí.

**Whitelisting de Dominios (Seguridad):** El interceptor previene inyectar el token JWT de Microsoft en peticiones dirigidas a APIs de terceros utilizando el arreglo `externalDomains`. Por ejemplo, `api.github.com` y `s3.amazonaws.com` están excluidos para evitar errores de CORS y fugas de tokens corporativos. Si un nuevo MF necesita llamar a una API externa, ese dominio debe registrarse aquí.
```mermaid
sequenceDiagram
    participant MFE as Microfrontend (Remote)
    participant Interceptor as auth.interceptor.ts
    participant Backend as API Backend
    
    MFE->>Interceptor: this.http.get('/api/data')
    Interceptor->>Interceptor: 1. Inyecta Header Authorization: Bearer {Azure_JWT}
    Interceptor->>Interceptor: 2. Genera y adjunta X-Request-ID (crypto.randomUUID)
    Interceptor->>Backend: Ejecuta la petición mutada
```

- **Inyección de JWT:** Recupera el token asíncrono y lo añade a `req.headers.set('Authorization', 'Bearer ...')`.
- **Inyección de Trazabilidad:** Para facilitar la observabilidad en logs de Backend (Datadog, Grafana), el interceptor llama a la API nativa `crypto.randomUUID()` inyectando a cada petición HTTP la cabecera `X-Request-ID`. Así, se rastrea cada clic del usuario transversal a los microservicios.

*(Si se requiere Bypass para otros proveedores, los desarrolladores deberán usar `HttpContext` de Angular en la petición de origen para evadir este interceptor).*


## 🤖 Prompts de Refactorización para Agentes IA

Si necesitas utilizar un Agente de Inteligencia Artificial (Antigravity, Copilot, Cursor) para escalar este ecosistema, utiliza los siguientes prompts diseñados para máxima eficiencia. Proveen el contexto arquitectónico exacto para que la IA entienda el "por qué" y ejecute la tarea enfocada en la necesidad del despliegue, sin redundancias:

### 1. Crear una nueva librería transversal
> **Prompt:** "Actúa como un Arquitecto Angular experto en Native Federation. Crea una nueva librería transversal llamada `core-shared`. No debe ser una aplicación ejecutable. Genera la estructura de carpetas, configura `public-api.ts`, el alias en `tsconfig.json` raíz, y configúrala en el `federation.config.js` del Host como *Shared Dependency* (`singleton: true`, `strictVersion: false`). **Contexto de Negocio:** Esta configuración dinámica es un requisito estricto para asegurar que futuras actualizaciones en la librería solo requieran redesplegar el Host y el MF implicado, eliminando la necesidad de recompilar los 50+ microfrontends de la empresa. Valida compilación."

### 2. Centralizar Servicios de Autenticación (`AuthService`)
> **Prompt:** "Analiza los Microfrontends (`mf-*`) y el `host`. Centraliza toda la lógica de autenticación, validación de JWT y manejo de `sessionStorage` en `core-shared/auth`. Refactoriza cada MF para eliminar su lógica local e inyectar el servicio central desde el alias `'core-shared'`. **Contexto de Negocio:** Los MFs deben consumir la versión singleton proveída dinámicamente por la Federación. El objetivo de la tarea es garantizar que un futuro parche de seguridad en `AuthService` se propague instantáneamente a todo el ecosistema con tan solo redesplegar el Host (que distribuye el chunk modificado). Repara las pruebas unitarias."

### 3. Extraer Componentes Comunes y Limpiar Deuda Técnica
> **Prompt:** "Analiza los MFs (ej. `mf-users`, `mf-repos`). Identifica Dumb Components genéricos duplicados (botones, modales, tablas). Mueve estos componentes a `core-shared/src/lib/ui/`, expórtalos en `public-api.ts` y refactoriza los MFs para consumirlos desde `'core-shared'`. Elimina el código duplicado y las dependencias sin uso. **Contexto de Negocio:** Todo componente extraído debe distribuirse dinámicamente. Esto garantiza que un rediseño UI futuro (ej. cambiar un color primario) solo requiera redesplegar el Host y el MF directamente afectado, facilitando el control de versiones independientes en AWS S3. Repara `jest`, valida `esbuild` y asegura ausencia de dependencias cíclicas."

---

---

## 📐 Caso de Estudio Arquitectónico: Migración de 1 a 2 Buckets S3 y Escalabilidad de IaC para N Microfrontends

*(Nota: Esta guía de aprovisionamiento y arquitectura aplica exclusivamente a la capa de Infraestructura e IaC en CloudFront y S3).*

---

### 1. Diagnóstico del Caso Real: Migración de 1 a 2 Buckets S3 (Host en S3.1 y MF en S3.2)

#### 🔴 Planteamiento del Caso Real:
Se tiene una arquitectura en AWS compuesta por **Route 53 + CloudFront + S3** donde S3 aloja el contenido estático del frontend:
- **Escenario Inicial (1 Bucket Monolítico S3):** En la raíz del mismo bucket S3 (`mfs-app-dev-host`) se guardaba la aplicación `host` (`/index.html`) y en una carpeta subdirectorio `/mf-**` se guardaba el módulo remoto. El `host` llamaba a `remoteEntry.json` y este archivo se visualizaba correctamente a través de la URL de la página.
- **El Problema al Crear un Nuevo S3 para el MF (`S3.2`):** Se creó un nuevo bucket S3 exclusivo para el microfrontend (`mfs-app-dev-mf-payments`). Sin embargo, al intentar abrir o cargar `remoteEntry.json`, S3 generaba una URL temporal y el llamado directo desde el navegador arrojaba un error de **"No Autorizado" (HTTP 403 Forbidden / Access Denied)**.

#### ❓ ¿Qué se debe hacer para que el Host en S3.1 pueda llamar al MF en S3.2 sin errores 403 ni URLs temporales?

Para que el Host en `S3.1` pueda invocar al microfrontend en `S3.2` de forma transparente y segura, **NUNCA se deben consumir URLs temporales ni endpoints directos de S3**. En su lugar, se aplican **3 acciones de infraestructura en CloudFront y S3**:

1. **Registrar S3.2 como un nuevo "Origin" en CloudFront:** Se agrega la dirección del bucket `mfs-app-dev-mf-payments.s3.us-east-1.amazonaws.com` a la distribución existente de CloudFront.
2. **Crear una Regla de Ruta (`CacheBehavior`) en CloudFront:** Se mapea la ruta `mf-payments/*` para que CloudFront dirija las peticiones hacia el origen de `S3.2`.
3. **Aplicar la Bucket Policy con OAC en S3.2:** Se mantiene `S3.2` 100% privado y se concede permiso `s3:GetObject` únicamente al Service Principal de CloudFront firmado con la condición `AWS:SourceArn`.

*Resultado:* El Host solicitará `https://mi-empresa-mfs.com/mf-payments/remoteEntry.json`. CloudFront interceptará la petición, leerá los archivos de `S3.2` de forma privada y los entregará al navegador en el **mismo origen que el Host**, eliminando de raíz los errores 403, las URLs temporales y los bloqueos de CORS.

---

### 🟢 2. Alto Nivel (Decisión Estratégica y ¿Qué se Gana?)

Al implementar la arquitectura desacoplada con **Patrón A (Bucket Físico por MF - Aislamiento Total)** mediante CloudFront OAC:

```mermaid
flowchart TD
    Browser["💻 Navegador (https://mi-empresa-mfs.com)"] -->|"1. GET / (Carga Host App)"| CF["⚡ AWS CloudFront CDN (ID: E1A2B3C4D5E6F7)"]
    Browser -->|"2. GET /mf-payments/remoteEntry.json"| CF
    
    subgraph "AWS Cloud Infrastructure (Account: 123456789012)"
        direction TB
        CF -->|"PathPattern / (Default)"| S3_1[("🪣 S3.1: mfs-app-dev-host")]
        CF -->|"PathPattern /mf-payments/*"| S3_2[("🪣 S3.2: mfs-app-dev-mf-payments")]
        CF -->|"PathPattern /mf-billing/*"| S3_3[("🪣 S3.3: mfs-app-dev-mf-billing")]
    end
```

#### 🏆 ¿Qué se gana al migrar de 1 a 2 (o N) Buckets S3?
1. **Aislamiento Total de Despliegues:** Un despliegue, borrado accidental o fallo en `mf-payments` (S3.2) jamás afecta a los archivos estáticos del `host` (S3.1) ni de otros microfrontends.
2. **Seguridad Granular IAM:** Los desarrolladores del equipo de Pagos solo reciben permisos de escritura sobre `s3://mfs-app-dev-mf-payments/*`, previniendo que alteren el código del Shell principal.
3. **Cero Cambios de Dominio y Eliminación Definitiva de CORS:** CloudFront actúa como **fachada unificada**. Para el navegador, las peticiones a `https://mi-empresa-mfs.com/mf-payments/*` y `https://mi-empresa-mfs.com/` ocurren bajo el **mismo origen**, eliminando errores 403 y llamadas inter-origen.

---

### 🟡 3. Medio Nivel (Arquitectura Técnica y Configuración de Red)

Para migrar de 1 a N buckets de forma segura, CloudFront exige declarar **1 Origen** y **1 Regla de Caché (Cache Behavior)** por cada bucket S3 desacoplado:

| Componente | Valores Concretos de Ejemplo | Función en la Arquitectura |
| :--- | :--- | :--- |
| **AWS Account ID** | `123456789012` | Cuenta AWS donde se despliegan los recursos. |
| **CloudFront Distribution ID** | `E1A2B3C4D5E6F7` | Identificador único de la fachada CDN. |
| **Bucket Host (S3.1)** | `mfs-app-dev-host` | Almacena el `index.html` y bundles del Shell (`dist/host`). |
| **Bucket MF Payments (S3.2)** | `mfs-app-dev-mf-payments` | Almacena los bundles y `remoteEntry.json` del remoto (`dist/mf-payments`). |
| **Ruta en CloudFront** | `/mf-payments/*` | Regla de enrutamiento que redirige el tráfico hacia S3.2. |
| **Dominio Público** | `https://mi-empresa-mfs.com` | Dominio único expuesto al cliente. |

---

### 🔴 4. Bajo Nivel (Configuraciones Exactas e IaC con Valores Reales)

Para migrar o agregar un nuevo microfrontend (ej. `mf-payments`), se aplican los siguientes **4 bloques de código exactos** en la plantilla de CloudFormation [`infrastructure/cloudformation/mfs-stack.yaml`](file:///Volumes/Macintosh%20HD%20-%20Data/microfrontend/infrastructure/cloudformation/mfs-stack.yaml):

#### 1. Ubicación: Sección `Resources:` (Bucket S3.2 dedicado)
* **¿Para qué sirve?:** Crea el contenedor de almacenamiento aislado para `mf-payments`.
* **¿Qué se gana?:** Aislamiento físico de archivos e independencia de CI/CD.

```yaml
MfPaymentsBucket:
  Type: AWS::S3::Bucket
  Properties:
    BucketName: mfs-app-dev-mf-payments
    PublicAccessBlockConfiguration:
      BlockPublicAcls: true
      BlockPublicPolicy: false
      IgnorePublicAcls: true
      RestrictPublicBuckets: false
    CorsConfiguration:
      CorsRules:
        - AllowedHeaders: ['*']
          AllowedMethods: ['GET', 'HEAD']
          AllowedOrigins: ['*']
          MaxAge: 3600
```

#### 2. Ubicación: Dentro de `CloudFrontDistribution.Properties.DistributionConfig.Origins`
* **¿Para qué sirve?:** Registra el bucket S3.2 como punto de origen de datos en CloudFront.
* **¿Qué se gana?:** Conectividad privada dentro de la red global de AWS sin exponer la URL directa de S3.

```yaml
- Id: MfPaymentsOrigin
  DomainName: mfs-app-dev-mf-payments.s3.us-east-1.amazonaws.com
  S3OriginConfig:
    OriginAccessIdentity: !Sub "origin-access-identity/cloudfront/${CloudFrontOAI}"
  OriginAccessControlId: !GetAtt CloudFrontOAC.Id
```

#### 3. Ubicación: Dentro de `CloudFrontDistribution.Properties.DistributionConfig.CacheBehaviors`
* **¿Para qué sirve?:** Enruta las peticiones que comiencen con `/mf-payments/*` hacia `MfPaymentsOrigin`.
* **¿Qué se gana?:** Elimina bloqueos de CORS, habilita compresión Gzip/Brotli y almacenamiento en caché de borde.

```yaml
- PathPattern: "mf-payments/*"
  TargetOriginId: MfPaymentsOrigin
  ViewerProtocolPolicy: redirect-to-https
  AllowedMethods: ['GET', 'HEAD', 'OPTIONS']
  CachedMethods: ['GET', 'HEAD']
  Compress: true
  ForwardedValues:
    QueryString: true
    Cookies:
      Forward: none
```

#### 4. Ubicación: Sección `Resources:` (Política S3 Bucket Policy con OAC y JSON de Referencia)
* **¿Para qué sirve?:** Concede permisos `s3:GetObject` únicamente a las peticiones firmadas por CloudFront verificando su `AWS:SourceArn`.
* **¿Qué se gana?:** Seguridad de nivel empresarial. El bucket S3.2 permanece **100% privado** y bloqueado al acceso público directo.

##### En CloudFormation (YAML):
```yaml
MfPaymentsBucketPolicy:
  Type: AWS::S3::BucketPolicy
  Properties:
    Bucket: !Ref MfPaymentsBucket
    PolicyDocument:
      Statement:
        - Effect: Allow
          Principal:
            Service: cloudfront.amazonaws.com
          Action: 's3:GetObject'
          Resource: 'arn:aws:s3:::mfs-app-dev-mf-payments/*'
          Condition:
            StringEquals:
              AWS:SourceArn: 'arn:aws:cloudfront::123456789012:distribution/E1A2B3C4D5E6F7'
```

##### Representación equivalente en Política S3 nativa (JSON AWS Console):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontServicePrincipalReadOnly",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::mfs-app-dev-mf-payments/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::123456789012:distribution/E1A2B3C4D5E6F7"
        }
      }
    }
  ]
}
```



---

## 🧪 Análisis de Configuración Jest — Error `core-shared` no encontrado

> **Contexto:** Este análisis documenta el diagnóstico y solución del error `Could not locate module @ecommerce/core-shared` detectado al ejecutar `npm run test:product-management` en un monorepo Angular.

---

### 📋 Resumen del error

```
Configuration error:

Could not locate module @ecommerce/core-shared mapped as:
C:\ecommerce-application\product-management\core-shared\public-api.ts.

Please check your configuration for these entries:
{
  "moduleNameMapper": {
    "/^@ecommerce\/core\-shared$/": "C:\ecommerce-application\product-management\core-shared\public-api.ts"
  },
  "resolver": undefined
}
```

**10 suites fallaron**, todas con la misma causa raíz. Las afectadas fueron:

| Archivo spec | Importación problemática |
|---|---|
| `inventory.service.spec.ts` | `import { CoreAuthService, User } from '@ecommerce/core-shared'` |
| `product-table.component.spec.ts` | (transitivo vía `inventory.service.ts`) |
| `filters.component.spec.ts` | (transitivo vía `inventory.service.ts`) |
| `analytics.service.spec.ts` | `import { UserModel, TokenDecode } from '@ecommerce/core-shared'` |
| `inventory-detail.service.spec.ts` | (transitivo vía `auth.service.mock.ts`) |
| `product-catalog.component.spec.ts` | `import { DialogModel, DynamicFormComponent } from '@ecommerce/core-shared'` |
| `category-settings.component.spec.ts` | `import { CoreAuthService } from '@ecommerce/core-shared'` |
| `inventory-reports.component.spec.ts` | (transitivo vía `inventory.service.ts`) |
| `audit-log.component.spec.ts` | `import { DialogModel, DynamicFormComponent } from '@ecommerce/core-shared'` |
| `analytics.component.spec.ts` | `import { DialogModel, DynamicFormComponent } from '@ecommerce/core-shared'` |

---

### 🔍 Causa raíz — Mismatch de `rootDir` vs ubicación real de `core-shared`

El comando que lanza los tests es:

```bash
jest --coverage --rootDir=product-management
```

Esto establece `<rootDir>` = `C:\ecommerce-application\product-management\`.

El `jest.config.js` dentro de `product-management/` tiene el mapper:

```js
// ❌ INCORRECTO — product-management/jest.config.js
moduleNameMapper: {
  '^@ecommerce/core-shared$': '<rootDir>/core-shared/public-api.ts'
  //                           ↑ resuelve a:
  //   C:\ecommerce-application\product-management\core-shared\public-api.ts
  //   ← Esta ruta NO EXISTE
}
```

Pero `core-shared` está un nivel arriba del `rootDir`:

```
C:\ecommerce-application\
├── node_modules/
├── package.json
├── core-shared/               ← ✅ Está aquí (raíz del monorepo)
│   └── public-api.ts
└── product-management/        ← rootDir del jest
    ├── jest.config.js
    └── src/
```

```
C:\ecommerce-application\
└── product-management\
    └── core-shared\           ← ❌ Jest busca aquí (no existe)
        └── public-api.ts
```

---

### ✅ Solución — Ajustar el path en `moduleNameMapper`

**Opción 1 — Subir un nivel con `../` (mínima intervención):**

```js
// product-management/jest.config.js
module.exports = {
  moduleNameMapper: {
    '^@ecommerce/core-shared$': '<rootDir>/../core-shared/public-api.ts'
    //                                    ↑ sube un nivel a la raíz del monorepo
  }
};
```

**Opción 2 — Usar `__dirname` para una ruta absoluta robusta:**

```js
// product-management/jest.config.js
const path = require('path');

module.exports = {
  moduleNameMapper: {
    '^@ecommerce/core-shared$': path.resolve(__dirname, '../core-shared/public-api.ts')
  }
};
```

**Opción 3 — Mover la configuración Jest a la raíz del monorepo** (patrón recomendado para monorepos):

```js
// jest.config.js (en la raíz C:\ecommerce-application\)
module.exports = {
  moduleNameMapper: {
    '^@ecommerce/core-shared$': '<rootDir>/core-shared/public-api.ts'
    //                           ↑ ahora rootDir = raíz del monorepo ✅
  }
};
```

Y en `package.json` raíz:

```json
{
  "scripts": {
    "test:product-management": "jest --coverage --testPathPattern=product-management"
  }
}
```

---

### 🗂️ Estado de archivos Jest en este monorepo (referencia)

Este monorepo (`microfrontend`) tiene una configuración Jest **correctamente ubicada** en la raíz. Sirve como referencia de la estructura esperada:

```
microfrontend/                        ← rootDir al correr "npm test"
├── jest.config.js                    ← Configuración centralizada
├── setup-jest.ts                     ← Setup global
├── tsconfig.json                     ← paths: { "core-shared": [...] }
├── tsconfig.spec.json                ← Extiende tsconfig.json
│
├── core-shared/                      ← Librería compartida real
│   └── src/
│       └── public-api.ts             ← Punto de entrada
│
└── host/src/app/
    ├── core/interceptors/auth.interceptor.spec.ts   ✅ PASS
    ├── login/login.component.spec.ts                ✅ PASS
    └── dashboard/dashboard.component.spec.ts        ❌ FAIL (mock faltante)
```

**[`jest.config.js`](jest.config.js) — Configuración actual (correcta):**

```js
module.exports = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testEnvironment: 'jsdom',
  modulePaths: ['<rootDir>'],
  moduleNameMapper: {
    '^core-shared$': '<rootDir>/core-shared/src/public-api.ts'
    // ✅ rootDir = raíz del monorepo → ruta correctamente resuelta
  },
  testMatch: ['**/+(*.)+(spec).+(ts)'],
  transform: {
    '^.+\\.(ts|mjs|js|html)$': ['jest-preset-angular', {
      tsconfig: '<rootDir>/tsconfig.spec.json',
      stringifyContentPathRegex: '\\.(html|svg)$',
    }],
  },
  transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$)'],
  moduleFileExtensions: ['ts', 'html', 'js', 'json', 'mjs'],
};
```

**[`tsconfig.json`](tsconfig.json) — Paths de TypeScript (deben espejear el `moduleNameMapper`):**

```json
{
  "compilerOptions": {
    "paths": {
      "core-shared": ["./core-shared/src/public-api.ts"]
    }
  }
}
```

> ⚠️ **Regla crítica:** El `moduleNameMapper` de Jest y los `paths` del `tsconfig.json` **siempre deben estar sincronizados**. Si TypeScript resuelve `core-shared` desde `./core-shared/src/public-api.ts`, Jest debe resolver exactamente el mismo archivo.

---

### 🔄 Comparativa: ecommerce-application vs microfrontend

| Aspecto | ❌ ecommerce-application (roto) | ✅ microfrontend (correcto) |
|---|---|---|
| Nombre del paquete compartido | `@ecommerce/core-shared` | `core-shared` |
| `rootDir` al ejecutar tests | `product-management/` (sub-carpeta) | `/microfrontend` (raíz) |
| `jest.config.js` ubicado en | `product-management/jest.config.js` | `jest.config.js` (raíz) |
| Path mapeado | `<rootDir>/core-shared/public-api.ts` ❌ | `<rootDir>/core-shared/src/public-api.ts` ✅ |
| Ruta resuelta | `…/product-management/core-shared/…` (no existe) | `…/microfrontend/core-shared/src/…` (existe) |
| Sincronización tsconfig ↔ jest | Desincronizados | Sincronizados |

---

## 🏗️ Estructura de Pruebas Jest para Angular 2026 (Angular 22+)

Angular 22 introduce cambios fundamentales en cómo se escriben y configuran las pruebas. Esta sección documenta la estructura completa y las diferencias respecto a versiones anteriores.

---

### 📦 Stack de dependencias (2026)

```json
{
  "devDependencies": {
    "jest": "^30.x",
    "jest-environment-jsdom": "^30.x",
    "jest-preset-angular": "^17.x",
    "@types/jest": "^30.x"
  }
}
```

> ⚠️ Angular 22 **eliminó el soporte oficial de Karma/Jasmine** en proyectos nuevos. Jest con `jest-preset-angular` es el estándar de facto en 2026.

---

### 📁 Estructura de archivos de configuración

```
monorepo-root/
│
├── jest.config.js          ← (1) Configuración central de Jest
├── setup-jest.ts           ← (2) Bootstrap del entorno de test
├── tsconfig.json           ← (3) Paths de TypeScript (compilación)
├── tsconfig.spec.json      ← (4) Extiende tsconfig.json para tests
│
└── src/
    └── app/
        └── feature/
            ├── feature.component.ts
            └── feature.component.spec.ts   ← (5) Archivo de test
```

---

### (1) `jest.config.js` — Configuración central

```js
module.exports = {
  // Preset oficial para Angular + Jest
  preset: 'jest-preset-angular',

  // (2) Archivo que se ejecuta antes de cada suite
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],

  // jsdom simula el DOM del navegador en Node.js
  testEnvironment: 'jsdom',

  // Permite imports sin prefijo (ej: import 'core-shared' en lugar de '../../../core-shared')
  modulePaths: ['<rootDir>'],

  // ✅ CLAVE: mapea alias de módulos locales/monorepo para que Jest los encuentre
  moduleNameMapper: {
    '^core-shared$': '<rootDir>/core-shared/src/public-api.ts',
    // Agregar aquí cualquier librería interna del monorepo:
    // '^@mi-empresa/ui-kit$': '<rootDir>/libs/ui-kit/src/public-api.ts',
  },

  // Solo ejecuta archivos .spec.ts
  testMatch: ['**/+(*.)+(spec).+(ts)'],

  // Transpila TypeScript, ESM y HTML con jest-preset-angular
  transform: {
    '^.+\\.(ts|mjs|js|html)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$',
      },
    ],
  },

  // Permite que Jest procese paquetes ESM de node_modules (ej: @angular/*)
  transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$)'],

  moduleFileExtensions: ['ts', 'html', 'js', 'json', 'mjs'],
};
```

---

### (2) `setup-jest.ts` — Bootstrap zoneless (Angular 18+)

```ts
// Angular 18+ introdujo el modo Zoneless (sin Zone.js)
// Este es el setup recomendado en 2026:
import { setupZonelessTestEnv } from 'jest-preset-angular/setup-env/zoneless';
setupZonelessTestEnv();

// ⚠️ Si tu app AÚN usa Zone.js, usa en su lugar:
// import 'jest-preset-angular/setup-env/zone';
```

| Modo | Cuándo usarlo |
|---|---|
| `setupZonelessTestEnv()` | Angular 18+ con `provideExperimentalZonelessChangeDetection()` |
| `zone` setup | Apps legacy que mantienen `zone.js` en `polyfills` |

---

### (3) `tsconfig.json` — Paths (deben espejear `moduleNameMapper`)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "preserve",       // ← Requerido por Angular 22 para ESM
    "isolatedModules": true,    // ← Requerido por jest-preset-angular
    "experimentalDecorators": true,
    "paths": {
      // ✅ DEBEN ser idénticos a los valores en moduleNameMapper
      "core-shared": ["./core-shared/src/public-api.ts"]
    }
  }
}
```

---

### (4) `tsconfig.spec.json` — Extensión para tests

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./out-tsc/spec",
    "types": ["jest"]           // Registra los tipos globales de Jest (describe, it, expect...)
  },
  "include": [
    "**/*.spec.ts",             // Todos los archivos de test
    "**/*.d.ts"
  ]
}
```

---

### (5) Anatomía de un `.spec.ts` en Angular 2026

Angular 22 usa **componentes standalone** por defecto. La estructura del spec cambió significativamente:

#### ✅ Componente standalone (patrón 2026)

```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MyComponent } from './my.component';
import { MyService } from '../services/my.service';

describe('MyComponent', () => {
  let component: MyComponent;
  let fixture: ComponentFixture<MyComponent>;

  // 1. Mock de servicios con dependencias externas (MSAL, HTTP, etc.)
  const mockMyService = {
    getData: jest.fn().mockReturnValue([]),
    isActive: jest.fn().mockReturnValue(true),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      // 2. Componentes standalone van en 'imports', NO en 'declarations'
      imports: [MyComponent],

      // 3. Providers: usa funciones 'provide*' de Angular 22
      providers: [
        provideRouter([]),                              // Router
        { provide: MyService, useValue: mockMyService } // Mock del servicio
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // Dispara ngOnInit y detección de cambios inicial
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call getData on init', () => {
    expect(mockMyService.getData).toHaveBeenCalled();
  });
});
```

#### ✅ Servicio con dependencias HTTP

```ts
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { MyApiService } from './my-api.service';

describe('MyApiService', () => {
  let service: MyApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MyApiService,
        provideHttpClient(),        // ← Nueva API de Angular 15+ (sin HttpClientModule)
        provideHttpClientTesting(), // ← Intercepta peticiones HTTP en tests
      ]
    });

    service = TestBed.inject(MyApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify()); // Verifica que no queden peticiones pendientes

  it('should fetch data', () => {
    service.getUsers().subscribe(users => {
      expect(users.length).toBe(1);
    });

    const req = httpMock.expectOne('/api/users');
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 1, name: 'Test' }]);
  });
});
```

#### ✅ Interceptor funcional (Angular 15+)

```ts
import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { myInterceptor } from './my.interceptor';

describe('myInterceptor', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        // Se registran interceptores funcionales directamente en withInterceptors()
        provideHttpClient(withInterceptors([myInterceptor])),
        provideHttpClientTesting(),
      ]
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());
});
```

---

### 🚫 Patrones obsoletos en Angular 2026

| ❌ Antes (Angular <15) | ✅ Ahora (Angular 22) |
|---|---|
| `declarations: [MyComponent]` | `imports: [MyComponent]` (standalone) |
| `HttpClientModule` en imports | `provideHttpClient()` en providers |
| `HttpClientTestingModule` | `provideHttpClientTesting()` |
| `RouterTestingModule` | `provideRouter([])` |
| `RouterModule.forRoot([])` | `provideRouter(routes)` |
| `class interceptors` con `HTTP_INTERCEPTORS` | `fn interceptors` con `withInterceptors([])` |
| `import 'jest-preset-angular/setup-env/zone'` | `setupZonelessTestEnv()` |
| `NgModule` con `imports/declarations/exports` | Componentes standalone con `imports: []` interno |

---

### 🔑 Reglas de oro para tests Jest en Angular 22+

1. **Todo servicio con dependencias externas → siempre mockear** con `{ provide: X, useValue: mockX }`
2. **`moduleNameMapper` ↔ `tsconfig paths`** deben estar 100% sincronizados
3. **`jest.config.js` en la raíz del monorepo**, nunca en sub-carpetas que no sean `rootDir`
4. **`isolatedModules: true`** es obligatorio en `tsconfig.json` para `jest-preset-angular`
5. **`module: "preserve"`** es requerido por Angular 22 para soporte ESM correcto
6. **Nunca usar `describe.only` o `it.only`** en código committeado — rompe la cobertura del CI

---

## 🔎 Auditoría: ¿La documentación está alineada con este proyecto?

Comparación archivo por archivo entre lo documentado arriba y el estado **real** del código en este repositorio.

---

### ✅ (1) `jest.config.js` — **100% alineado**

| Propiedad | Documentado | Real en proyecto | Estado |
|---|---|---|---|
| `preset` | `'jest-preset-angular'` | `'jest-preset-angular'` | ✅ |
| `setupFilesAfterEnv` | `['<rootDir>/setup-jest.ts']` | `['<rootDir>/setup-jest.ts']` | ✅ |
| `testEnvironment` | `'jsdom'` | `'jsdom'` | ✅ |
| `modulePaths` | `['<rootDir>']` | `['<rootDir>']` | ✅ |
| `moduleNameMapper` | `'^core-shared$': '<rootDir>/core-shared/src/public-api.ts'` | Ídem | ✅ |
| `testMatch` | `['**/+(*.)+(spec).+(ts)']` | Ídem | ✅ |
| `transformIgnorePatterns` | `['node_modules/(?!.*\\.mjs$)']` | Ídem | ✅ |

---

### ✅ (2) `setup-jest.ts` — **100% alineado**

```ts
// Real en el proyecto:
import { setupZonelessTestEnv } from 'jest-preset-angular/setup-env/zoneless';
setupZonelessTestEnv();
```

Usa `setupZonelessTestEnv()` tal como se documenta. ✅

---

### ✅ (3) `tsconfig.json` — **100% alineado**

| Campo | Documentado | Real | Estado |
|---|---|---|---|
| `target` | `"ES2022"` | `"ES2022"` | ✅ |
| `module` | `"preserve"` | `"preserve"` | ✅ |
| `isolatedModules` | `true` | `true` | ✅ |
| `experimentalDecorators` | `true` | `true` | ✅ |
| `paths."core-shared"` | `["./core-shared/src/public-api.ts"]` | Ídem | ✅ |

---

### ⚠️ (4) `tsconfig.spec.json` — **2 desviaciones detectadas**

#### Desviación A — `types`: `vitest/globals` en lugar de `jest`

| Campo | Documentado (recomendado) | Real en proyecto | Estado |
|---|---|---|---|
| `types` | `["jest"]` | `["vitest/globals"]` | ⚠️ Desviación |

```jsonc
// Lo que dice el README (correcto para proyectos Jest puros):
"types": ["jest"]

// Lo que hay REALMENTE en el proyecto:
"types": ["vitest/globals"]
```

**¿Por qué funciona igual?** `vitest/globals` expone los mismos tipos globales que `jest` (`describe`, `it`, `expect`, `beforeEach`...) porque Vitest es compatible con la API de Jest. Sin embargo:

> ⚠️ **Riesgo**: Si el proyecto solo usa Jest (no Vitest), `"vitest/globals"` es una dependencia de tipos incorrecta. Puede generar advertencias de TypeScript o conflictos si en el futuro se actualiza Vitest a una versión con tipos divergentes.

**Corrección recomendada** en [`tsconfig.spec.json`](tsconfig.spec.json):

```diff
-  "types": ["vitest/globals"]
+  "types": ["jest"]
```

#### Desviación B — `include`: patrón demasiado restrictivo

| Campo | Documentado | Real en proyecto | Estado |
|---|---|---|---|
| `include` | `["**/*.spec.ts", "**/*.d.ts"]` | `["src/**/*.d.ts", "src/**/*.spec.ts"]` | ⚠️ Desviación |

El patrón `src/**/*.spec.ts` **no incluye** los specs de `core-shared/src/lib/...`:

```
core-shared/src/lib/ui/data-table/data-table.component.spec.ts  ← NO cubierto por tsconfig.spec.json
```

Jest **sí los encuentra** (vía `testMatch: '**/+(*.)+(spec).+(ts)'`), pero TypeScript no los type-check al correr `tsc --project tsconfig.spec.json`.

---

### ⚠️ (5) Specs `.spec.ts` — **1 incumplimiento de "Regla de oro #1"**

#### `dashboard.component.spec.ts` — Mock faltante

El componente [`dashboard.component.ts`](host/src/app/dashboard/dashboard.component.ts) inyecta `AuthenticationService` (que a su vez necesita `MsalService`), pero el spec no provee el mock:

```ts
// dashboard.component.ts
private authService = inject(AuthenticationService); // necesita MsalService

// dashboard.component.spec.ts ← INCOMPLETO
providers: [provideRouter([])]
// ↑ Falta: { provide: AuthenticationService, useValue: mockAuthService }
```

**Resultado:** `NG0201: No provider found for MsalService` → test FAIL.

**Corrección** según la Regla #1 ("Todo servicio con dependencias externas → siempre mockear"):

```ts
// dashboard.component.spec.ts — versión corregida
import { AuthenticationService } from 'core-shared';

const mockAuthService = {
  hasPermission: jest.fn().mockReturnValue(true),
  authenticated: jest.fn().mockReturnValue(false),
};

// En providers:
{ provide: AuthenticationService, useValue: mockAuthService }
```

---

### ✅ Specs correctos — alineados con Angular 2026

| Archivo | Patrón usado | Estado |
|---|---|---|
| [`login.component.spec.ts`](host/src/app/login/login.component.spec.ts) | `imports: [LoginComponent]` + `provideRouter` + mock de `MsalService` | ✅ |
| [`auth.interceptor.spec.ts`](host/src/app/core/interceptors/auth.interceptor.spec.ts) | `provideHttpClient(withInterceptors([]))` + `provideHttpClientTesting()` | ✅ |
| [`data-table.component.spec.ts`](core-shared/src/lib/ui/data-table/data-table.component.spec.ts) | Standalone imports | ✅ |

---

### 📊 Resumen de auditoría

| Archivo | ¿Alineado? | Detalle |
|---|---|---|
| `jest.config.js` | ✅ **Sí** | Configuración correcta y completa |
| `setup-jest.ts` | ✅ **Sí** | Usa `setupZonelessTestEnv()` correctamente |
| `tsconfig.json` | ✅ **Sí** | Paths sincronizados con `moduleNameMapper` |
| `tsconfig.spec.json` | ⚠️ **Parcial** | `types: vitest/globals` debería ser `jest`; `include` no cubre `core-shared/` |
| `app.config.ts` | ⚠️ **Observación** | No usa `provideZonelessChangeDetection()` pese a usar `setupZonelessTestEnv()` en tests |
| `dashboard.component.spec.ts` | ❌ **No** | Falta mock de `AuthenticationService` → FAIL |
| `login.component.spec.ts` | ✅ **Sí** | Patrón 2026 correcto |
| `auth.interceptor.spec.ts` | ✅ **Sí** | Patrón 2026 correcto |

> **Conclusión**: La estructura general del proyecto es correcta y moderna. Hay **2 ajustes menores en config** (`tsconfig.spec.json`) y **1 spec roto** (`dashboard`) que requieren atención.

