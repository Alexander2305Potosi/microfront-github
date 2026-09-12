# Guía de Ejecución: Ecosistema Microfrontends

Este proyecto está configurado como un **Monorepo (Workspace) de Angular**. Esto significa que desde esta carpeta raíz se administran múltiples aplicaciones.

Actualmente, el ecosistema cuenta con dos aplicaciones:
1. **host** (Puerto 4200) - La aplicación base o contenedor principal.
2. **remote** (Puerto 4201) - El microfrontend que expone componentes/funcionalidades.

Ambos proyectos utilizan **Angular Native Federation** y **Tailwind CSS v4**.

---

## 🚀 Cómo ejecutar el proyecto en modo desarrollo

Para ver el ecosistema funcionando correctamente, necesitas tener ambos servidores ejecutándose simultáneamente. 

Abre **dos terminales** diferentes ubicadas en la raíz de este proyecto (`/microfrontend`):

### Terminal 1: Iniciar el Host
Ejecuta el siguiente comando para levantar el contenedor principal:
```bash
ng serve host
```
> 🌐 Podrás visualizarlo en tu navegador abriendo: **http://localhost:4200**

### Terminal 2: Iniciar el Remote (Microfrontend)
Ejecuta el siguiente comando para levantar el componente remoto:
```bash
ng serve remote
```
> 🌐 El remote estará vivo de forma independiente en: **http://localhost:4201**

---

## 🏗️ Arquitectura: Del Alto al Bajo Nivel

El ecosistema sigue un patrón estricto para garantizar la independencia funcional de cada aplicación (Microfrontend), manteniendo al mismo tiempo la estandarización visual.

### 1. Alto Nivel: Ecosistema Federado (Module Federation)
A nivel global, la arquitectura se divide en responsabilidades de despliegue y orquestación:
- **`host` (Shell):** Es el contenedor principal. Se encarga únicamente del enrutamiento base, la autenticación, la estructura maestra de la pantalla (Layout/Menús) y la orquestación. Su responsabilidad principal es cargar aplicaciones remotas en tiempo de ejecución.
- **`remote` (MFE):** Es un microfrontend que encapsula todo un dominio de negocio funcional (ej: Búsqueda de Usuarios de GitHub). Posee sus propios modelos, lógica de negocio y llamadas HTTP. Se expone a sí mismo a través del archivo `remoteEntry.json`.
- **`Native Federation`**: Permite que el `host` consuma el código del `remote` a través de la red sin tenerlo en su bundle de compilación, compartiendo de forma inteligente librerías pesadas en formato "singleton" (como `@angular/core` o `rxjs`).

### 2. Nivel Medio: Librerías Internas (`core-ui`)
En lugar de compartir componentes puramente visuales a través de la red (lo cual agrega latencia e inestabilidad), los componentes reutilizables viven en el mismo workspace pero se compilan de forma estática en cada MFE:
- **`projects/core-ui` (Librería compartida):** Contiene los componentes de UI complejos (Tablas con filtros, Tarjetas de Estadísticas).
- **Inyección directa:** No se publica en NPM ni se distribuye como Microfrontend. Cuando el `host` o el `remote` necesitan la tabla, la importan mediante el alias (paths de TS) configurado en el `tsconfig.json`. En tiempo de compilación, el pipeline de Angular inyecta el código fuente de la tabla dentro del bundle del MFE que lo consume.
- **Ventaja de Despliegue:** Cada MFE puede tener pipelines (CI/CD) y lanzamientos (releases) completamente independientes sin depender de que exista un pipeline central de UI.

### 3. Bajo Nivel: Organización del Código y Contratos
A nivel de código, se mantiene una estricta separación de responsabilidades:
- **Componentes "Tontos" (Dumb Components) en `core-ui`:**
  - Ubicación: `projects/core-ui/src/lib/data-table/`
  - La tabla no sabe de dónde vienen los datos ni conoce endpoints de APIs.
  - El contrato de comunicación es estricto a través de inputs y outputs genéricos: recibe `@Input() columns` e `@Input() data` agnósticos. Las interacciones internas (como filtrar) emiten eventos hacia arriba.
- **Componentes "Inteligentes" (Smart Components) en los Remotes:**
  - Ubicación: `remote/src/app/github-profiles/`
  - El microfrontend remoto mantiene su propia lógica de negocio y dependencias específicas.
  - Se encarga de hacer peticiones a la API de negocio, mapear la respuesta, decidir los permisos, y finalmente inyectarle los datos brutos a `CoreDataTableComponent`.
- **Testing Aislado (Jest Zoneless):**
  - El ecosistema usa configuración nativa de **Jest** sin `zone.js` (arquitectura ultramoderna de Angular 18+).
  - Las pruebas (`.spec.ts`) residen junto al código de la librería y prueban el comportamiento del UI (eventos, manipulación del DOM, filtros) de forma completamente aislada de la lógica de los Remotes.

---

## 🛠️ Notas importantes para el desarrollo

- **Tailwind CSS:** Para usar clases de Tailwind, simplemente añádelas en el HTML de los componentes de cualquiera de los dos proyectos. La compilación se hará automáticamente.
- **Federation Config:** 
  - Si deseas exponer un componente desde el `remote` hacia el exterior, debes declararlo en el archivo `remote/federation.config.js` dentro del bloque `exposes`.
  - El `host` detectará automáticamente el código expuesto si configuras las rutas correctamente.
- **Dependencias Compartidas:** Las dependencias como Angular Core o RxJS ya están configuradas como singletons en los archivos `federation.config.js` para evitar duplicidad de carga en el navegador.
- **Pruebas Unitarias:** Ejecuta `npm run test` para correr las pruebas locales de las librerías compartidas.
