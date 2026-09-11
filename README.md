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

## 🛠️ Notas importantes para el desarrollo

- **Tailwind CSS:** Para usar clases de Tailwind, simplemente añádelas en el HTML de los componentes de cualquiera de los dos proyectos. La compilación se hará automáticamente.
- **Federation Config:** 
  - Si deseas exponer un componente desde el `remote` hacia el exterior, debes declararlo en el archivo `remote/federation.config.js` dentro del bloque `exposes`.
  - El `host` detectará automáticamente el código expuesto si configuras las rutas correctamente.
- **Dependencias Compartidas:** Las dependencias como Angular Core o RxJS ya están configuradas como singletons en los archivos `federation.config.js` para evitar duplicidad de carga en el navegador.
