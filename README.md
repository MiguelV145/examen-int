# Portafolio Administrativo – Informe/README

---

## 1. Logo de la Carrera y del Proyecto

-Logo de la U   
<img src="public/img/logoinstituto.jpg" alt="logfo instirtuto"  />    

-Logo de la Empresa   
<img src="public/img/logoempresA.jpeg" alt="Empreas"  />



---

## 2. Integrantes

*Miguel Ángel Vanegas*  
📧 mvanegasp@est.ups.edu.ec  
💻 GitHub: [MiguelV145](https://github.com/MiguelV145)  

*Jose Vanegas*  
📧 jvanegasp1@est.ups.edu.ec   
💻 GitHub: [josevac1](https://github.com/josevac1)

Repositorio principal: https://github.com/MiguelV145/examen-int

---

## 3. Tecnologías Utilizadas

Principales dependencias detectadas en `package.json`:

- Angular 21 (`@angular/core`, `@angular/router`, `@angular/forms`, etc.)
- Firebase 12 (`firebase`) y AngularFire 20 (`@angular/fire`)
- EmailJS (`@emailjs/browser`)
- Tailwind CSS 4 + DaisyUI (`tailwindcss`, `daisyui`, `@tailwindcss/postcss`)
- Toastr (`ngx-toastr`) para notificaciones
- Bootstrap Icons (`bootstrap-icons`)
- RxJS 7
- Vitest para pruebas (`vitest`, `jsdom`)

Estructura del proyecto (carpetas principales):

- `src/` (aplicación Angular: componentes, rutas, servicios)
- `functions/` (Cloud Functions para Firebase)
- `public/` (assets públicos)

Configuración de estilos: Tailwind + DaisyUI está habilitado en [src/styles.css](src/styles.css).

```css
/* src/styles.css */
@import "tailwindcss";
@plugin "daisyui" {
	themes: light --default, dark --prefersdark, abyss;
}
```


---

## 4. Descripción del Proyecto

El Portafolio Administrativo es una plataforma web diseñada para gestionar solicitudes, proyectos y registros administrativos según el rol del usuario. Permite a administradores gestionar usuarios y roles, a programadores revisar y dar mantenimiento al sistema, y a usuarios generales crear y monitorear solicitudes.

El sistema está construido con Angular y utiliza Firebase como backend para autenticación, almacenamiento de datos y hosting. Opcionalmente integra EmailJS para el envío de notificaciones por correo y enlaces directos mediante WhatsApp API.

### Objetivos y Alcance

- Autenticación de usuarios con email/contraseña y Google.
- Gestión de perfiles: nombre, foto y rol almacenados en Firestore (`users/{uid}`).
- Panel administrativo para revisión/gestión (según rol).
- Notificaciones al usuario (Toastr) y contacto rápido vía WhatsApp.
- Estilos modernos con Tailwind + DaisyUI e iconografía con Bootstrap Icons.

---

## 5. Roles y Funcionalidades

### Administrador

- Gestión de usuarios
- Gestión de roles
- Revisión y aprobación de solicitudes
- Acceso completo al panel administrativo
- Edición de módulos internos

### Programador

- Acceso al área técnica
- Edición de proyectos y solicitudes
- Mantenimiento de datos
- Acceso limitado según permisos

### Usuario General

- Crear solicitudes
- Visualizar solicitudes enviadas
- Actualizar datos personales
- Recibir notificaciones y correos

---

## 6. Módulos y Pantallas del Sistema

Páginas principales en `src/app/features/pages/`:

- `Login-Page/`: acceso al sistema (email/password, Google)
- `Register-Page/`: registro de usuarios
- `Home-Page/`: página de inicio y navegación principal
- `Adminpage/`: panel administrativo (gestión y revisión)
- `Perfil-page/`: edición de datos personales del usuario
- `Portafolio-Detail/`: detalle de portafolio/solicitudes/proyectos

Componentes compartidos en `src/app/features/Component/`:

- `Navbar/`: navegación entre módulos
- `Footer/`: pie de página y enlaces

Guards en `src/app/core/guards/`:

- `auth-guard.ts`: protege rutas autenticadas
- `admin-guard.ts`: restringe acceso a rol administrador
- `public-guard.ts`: rutas públicas o redirecciones según sesión

### Componentes y Arquitectura (detallado)

- [src/app/app.routes.ts](src/app/app.routes.ts): ruteo principal con carga perezosa de páginas y guards de acceso.
	- Rutas clave: `login` (público), `register` (público), `home` (público), `admin` (solo admin), `panel` (autenticado), `portfolio/:id` (detalle).
- `Navbar` y `Footer`: componentes UI comunes con Tailwind/DaisyUI; muestran navegación y acciones rápidas.
- Notificaciones: `ngx-toastr` para feedback de acciones (login, registro, operaciones CRUD).
- Estilos: Tailwind + DaisyUI configurados en [src/styles.css](src/styles.css) para temas y utilidades.
- Utilidades compartidas: [src/app/features/share/Formutils/Formutils.ts](src/app/features/share/Formutils/Formutils.ts) para formularios y validaciones.
- Modelos/Interfaces: [src/app/features/share/Interfaces/Interfaces-Users.ts](src/app/features/share/Interfaces/Interfaces-Users.ts) define `UserProfile` y estructuras de datos del usuario.

---

## 7. Flujos Principales del Usuario

- Ingreso: desde `Login-Page` con email/password o Google (Firebase Auth).
- Registro: en `Register-Page`, se crea documento inicial en `users/{uid}` con rol por defecto.
- Navegación: `Navbar` dirige a `Home-Page`, perfil y áreas según rol.
- Persistencia: los datos de usuario y rol se almacenan en Firestore (colección `users`).
- Control de acceso: `auth-guard`, `admin-guard` y `public-guard` gestionan redirecciones.
 - Vistas: `Adminpage` disponible solo si el rol lo permite; `Perfil-page` para editar datos personales; `Portafolio-Detail` para visualizar detalles.

Ejemplo:

> El usuario se registra, se crea `users/{uid}` con rol "user". Si inicia con Google, se sincroniza `photoURL` y `displayName`. El administrador accede a `Adminpage` (si tiene rol) para gestionar y revisar estados.

---

## 8. Fragmentos Técnicos Importantes

### Firebase Auth Service (implementado)

Archivo: `src/app/core/services/firebase/authservice.ts`

Características clave:

- Señales: `currentUser`, `currentProfile`, `currentRole` para estado reactivo.
- Registro: crea `users/{uid}` con rol `user` y perfil básico.
- Login Google: sincroniza `photoURL` preferiendo la personalizada de Firestore.
- Logout: limpia estado y redirige a `/login`.

Extracto relevante:

```ts
const finalPhoto = userData.photoURL || firebaseUser.photoURL || '';
await updateDoc(userRef, {
	photoURL: finalPhoto,
	displayName: userData.displayName || firebaseUser.displayName,
	email: firebaseUser.email
});
```

### Envío de correo (EmailJS)

Dependencia: `@emailjs/browser` incluida. Agreguen un servicio, por ejemplo `src/app/core/services/email.service.ts`:

```ts
import emailjs from '@emailjs/browser';
export async function sendContactEmail(templateParams: any) {
	return emailjs.send('service_id', 'template_id', templateParams, { publicKey: 'PUBLIC_KEY' });
}
```

### WhatsApp API (link de contacto)

```ts
const phone = '51999999999';
const text = encodeURIComponent('Hola, tengo una consulta sobre el proyecto');
const whatsappUrl = `https://wa.me/${phone}?text=${text}`;
```

---

## 9. Conclusiones

- Logros del proyecto
- Qué se aprendió
- Posibles mejoras futuras

---

## Desarrollo y Ejecución

### Requisitos

- Node.js LTS
- Angular CLI
- Firebase CLI (opcional para deploy y emuladores)

### Comandos útiles

Desarrollo local:

```bash
pnpm install
pnpm start
```

Angular CLI directo:

```bash
ng serve
```

Build de producción:

```bash
ng build
```

Pruebas unitarias:

```bash
pnpm test
```

Deploy (si aplica):

```bash
firebase deploy
```

---

## Estructura de Carpetas (resumen)

- `src/` – Código principal Angular (componentes, páginas, rutas, servicios)
- `functions/` – Cloud Functions para Firebase (TypeScript)
- `public/` – Imágenes y recursos públicos
- `assets/` – Recursos estáticos para Angular
- `environments/` – Configuraciones de entorno de Angular

---

## Licencia

Este repositorio es de carácter educativo y académico. Ajusta la licencia según necesidades del equipo.
