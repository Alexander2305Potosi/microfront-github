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

El ecosistema sigue un patrón estricto basado en independizar dominios de negocio y reutilizar código UI mediante librerías internas, sin acoplar compilaciones ni despliegues.

### 1. Alto Nivel: Múltiples MFs y Módulos Federados
A nivel global, la arquitectura divide las responsabilidades de compilación y orquestación. **Module Federation solo se usa para cargar funcionalidades de negocio completas**, no para componentes visuales sueltos.
- **Independencia de despliegue:** `host` y `remote` tienen flujos de CI/CD completamente independientes. No existe acoplamiento de repositorios ni bloqueos en el lanzamiento de un release.
- **Restricción estricta:** No se deben crear dependencias directas de red entre MFs (ej. `host <--> remote` para un botón). Si un MFE necesita un componente UI, no debe pedirlo a otro MFE por red para evitar latencia, problemas de caché y puntos únicos de fallo.
- **Singletons:** Dependencias pesadas (`@angular/core`, `rxjs`, `tailwindcss`) están configuradas como `shared` en `federation.config.js` para cargarse una sola vez.

### 2. Nivel Medio: Librería Compartida (`core-ui`) en el Workspace
Para compartir la tabla y otros componentes complejos entre el `host` y los diferentes MFs, se utiliza una **librería interna estática** en el Monorepo. No se publica como librería NPM, ni como artefacto independiente, ni tiene pipeline propio.
- **Ubicación Física:** `projects/core-ui/`
- **Configuración TS (El Contrato de Consumo):** El archivo `tsconfig.json` raíz crea el alias `"core-ui"` apuntando directamente a `projects/core-ui/src/public-api.ts`.
- **Estrategia de compilación:** Cuando un MF (`remote` o `host`) requiere usar la tabla, importa este alias. Al construir el proyecto, el pipeline de compilación del MF en turno toma el código fuente de `core-ui` y **lo inyecta estáticamente en su propio bundle**.
```json
// tsconfig.json (Raíz)
{
  "compilerOptions": {
    "paths": {
      "core-ui": [
        "projects/core-ui/src/public-api.ts"
      ]
    }
  }
}
```

### 3. Bajo Nivel: Organización del Código y Contratos Agnosticos

A nivel de código, implementamos una separación estricta: **la UI jamás debe conocer la lógica de negocio ni el dominio de datos.**

#### 3.1. Librería `core-ui` (Dumb Components)
Ubicada en `projects/core-ui/src/lib/data-table/data-table.component.ts`. Es un componente standalone 100% agnóstico del dominio. Define contratos fuertes (interfaces) que dictan cómo los MFs deben interactuar con él:
```typescript
// Contrato base de la tabla (projects/core-ui/src/lib/...)
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
- **Aislamiento Absoluto:** La librería `core-ui` posee pruebas unitarias escritas en **Jest** (`data-table.component.spec.ts`) que validan las interacciones del DOM y la correcta emisión de los `@Input`/`@Output`. Nunca dependen de mocks de servicios de los MFs.
- **Configuración Moderna:** Configuramos el ecosistema para correr en modo *Zoneless* (`jest-preset-angular/setup-env/zoneless`), aprovechando la arquitectura ultramoderna de Angular 18+ para hacer el testing extremadamente rápido y sin dependencias mágicas en el DOM.

---

## 🛠️ Notas importantes para el desarrollo

- **Tailwind CSS:** Para usar clases de Tailwind, simplemente añádelas en el HTML de los componentes de cualquiera de los dos proyectos. La compilación se hará automáticamente.
- **Federation Config:** 
  - Si deseas exponer un componente desde el `remote` hacia el exterior, debes declararlo en el archivo `remote/federation.config.js` dentro del bloque `exposes`.
  - El `host` detectará automáticamente el código expuesto si configuras las rutas correctamente.
- **Pruebas Unitarias:** Ejecuta `npm run test` para correr las pruebas locales de todo el ecosistema y librerías compartidas.
