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

Repositorio principal: [Repositorio](https://github.com/MiguelV145/examen-int)

Video Link: [Youtube](https://youtu.be/JUmw7vOs-qM?si=rQVeNxT2XuEnQnb6)

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

async submitBooking() {
    if (this.bookingForm.invalid) { this.bookingForm.markAllAsTouched(); return; }
    const currentUser = this.authService.currentUser();
    if (!currentUser || !this.targetProfile) return;
    this.loadingBooking.set(true);
    const formVal = this.bookingForm.value;
    try {
      await addDoc(collection(this.firestore, 'asesorias'), {
        programmerId: this.targetProfile.uid, programmerName: this.targetProfile.displayName || 'Programador',
        clientId: currentUser.uid, clientName: currentUser.displayName || currentUser.email,
        date: formVal.date!, time: formVal.time!, comment: `[${formVal.subject}] ${formVal.comment}`, status: 'pendiente'
      });
      if (this.targetProfile.email) {
        const templateParams = { to_email: this.targetProfile.email, to_name: this.targetProfile.displayName, from_name: currentUser.displayName || 'Usuario', subject: formVal.subject, message: formVal.comment, date_time: `${formVal.date} - ${formVal.time}` };
        await emailjs.send('service_y02aan7', 'template_faf7lba', templateParams, 'rjFCNekN83tOlNc19');
      }
      alert('✅ Solicitud enviada.');
      (document.getElementById('booking_modal') as HTMLDialogElement).close();
    } catch (e: any) { alert('Error: ' + e.message); } finally { this.loadingBooking.set(false); }
  }
```

+

---

## 9. Informe de Desarrollo - Códigos Fundamentales

Este informe detalla los componentes y servicios principales del proyecto con los métodos/funciones clave de cada módulo.

### 9.1 Estructura Principal de la Aplicación

**App Component** (`src/app/app.ts`) 

**Función Principal: `ngOnInit()`** - Inicializa la sincronización de autenticación al cargar la aplicación.

**Explicación:** Este método es el punto de entrada de la aplicación. Se ejecuta cuando el componente se inicializa y se suscribe al observable `user$` del AuthService. Espera una sola emisión (con `take(1)`) para detectar si hay un usuario autenticado en Firebase. Una vez Firebase se conecta y valida el estado del usuario, establece `authInitialized` en `true`, desbloqueando la vista principal.

```typescript
import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from "./features/Component/Navbar/Navbar";
import { Footer } from "./features/Component/Footer/Footer";
import { AuthService } from './core/services/firebase/authservice';
import { take } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Footer],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('examen-int');
  private authService = inject(AuthService);  
  authInitialized = signal(false);

  ngOnInit() {
    // FUNCIÓN PRINCIPAL: Espera la primera emisión de usuario de Firebase
    // Desbloquea la vista cuando la autenticación se haya inicializado
    this.authService.user$.pipe(take(1)).subscribe(() => {
      this.authInitialized.set(true);
    });
  }
}
```

### 9.2 Rutas y Navegación

**App Routes** (`src/app/app.routes.ts`) 

**Función Principal: Configuración de rutas con `canActivate` guards** - Define el sistema de enrutamiento con protección de rutas.

**Explicación:** El archivo de rutas es el mapa de navegación de la aplicación. Cada ruta especifica:
- El **path** (URL)
- El componente a cargar con **lazy loading** (carga bajo demanda)
- Los **guards** (`canActivate`) que validan si el usuario puede acceder

Los guards son funciones que validan automáticamente:
- `authGuard`: Solo usuarios autenticados
- `adminGuard`: Solo administradores
- `publicGuard`: Solo usuarios NO autenticados (redirige si ya estás logueado)

```typescript

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/pages/Login-Page/Login-Page')
      .then(m => m.LoginPage),
    canActivate: [publicGuard] // ⛔ Bloquea si ya estás logueado
  },
  {
    path: 'register',
    loadComponent: () => import('./features/pages/Register-Page/Register-Page')
      .then(m => m.RegisterPage),
  },
  {
    path: 'home',
    loadComponent: () => import('./features/pages/Home-Page/Home-Page')
      .then(m => m.HomePage),
  },
  {
    path: 'admin',
    loadComponent: () => import('./features/pages/Adminpage/Adminpage')
      .then(m => m.Adminpage),
    canActivate: [adminGuard] // 🔒 Solo administradores
  },
  {
    path: 'panel',
    loadComponent: () => import('./features/pages/Perfil-page/Perfil-Page')
      .then(m => m.ProgrammerPage),
    canActivate: [authGuard] // 🔐 Solo usuarios autenticados
  },
  {
    path: 'portfolio/:id',
    loadComponent: () => import('./features/pages/Portafolio-Detail/Portafolio-Detail')
      .then(m => m.PortfolioDetail)
  },
  {
    path: '**',
    redirectTo: 'home'
  }
];
```

### 9.3 Servicio de Autenticación Firebase

**AuthService** (`src/app/core/services/firebase/authservice.ts`)

**Función Principal: Constructor con sincronización reactiva** - Mantiene el estado del usuario en sincronía con Firebase en tiempo real.

**Explicación:** El constructor es el corazón del AuthService. Se ejecuta cuando se inyecta el servicio por primera vez. Utiliza RxJS para:

1. **Escuchar cambios en `user$`**: Observable que emite cada vez que el estado de autenticación cambia
2. **Usar `switchMap`**: Cuando hay usuario, obtiene sus datos de Firestore en tiempo real
3. **Actualizar señales**: Guarda el perfil, rol y usuario en signals reactivas
4. **Sincronización automática**: Si el usuario cierra sesión, las señales se limpian

Esto asegura que toda la aplicación siempre tenga acceso al usuario actual sin necesidad de consultas manuales.

```typescript
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);

  // Señales reactivas - Cualquier componente puede acceder a estos valores
  currentUser = signal<User | null>(null);
  currentProfile = signal<UserProfile | null>(null);
  currentRole = signal<string | null>(null);

  user$ = user(this.auth); // Observable de Firebase

  // ⭐ FUNCIÓN PRINCIPAL: Constructor con sincronización en tiempo real
  constructor() {
    // Se ejecuta automáticamente cuando hay cambios en la autenticación
    this.user$.pipe(
      switchMap(user => {
        if (user) {
          this.currentUser.set(user); // Actualiza usuario actual
          // Obtiene datos del usuario desde Firestore en tiempo real
          return docData(doc(this.firestore, 'users', user.uid));
        } else {
          this.currentUser.set(null);
          return of(null);
        }
      })
    ).subscribe((data: any) => {
      if (data) {
        this.currentRole.set(data.role);       // Guarda el rol
        this.currentProfile.set(data as UserProfile); // Guarda perfil completo
      } else {
        this.currentRole.set(null);
        this.currentProfile.set(null);
      }
    });
  }

  // Utilidad: Verifica si el usuario tiene un rol específico
  hasRole(role: string): boolean {
    return this.currentRole() === role;
  }

  // Método: Registro de nuevo usuario
  register(email: string, password: string): Observable<void> {
    return from(createUserWithEmailAndPassword(this.auth, email, password)).pipe(
      switchMap(async (credential) => {
        const newUser: UserProfile = {
          uid: credential.user.uid,
          email: email,
          role: 'user',
          displayName: 'Usuario Nuevo',
          photoURL: ''
        };
        await setDoc(doc(this.firestore, 'users', credential.user.uid), newUser);
        this.router.navigate(['/home']);
      })
    );
  }

  // Método: Login con email y contraseña
  login(email: string, password: string): Observable<void> {
    return from(signInWithEmailAndPassword(this.auth, email, password)).pipe(
      switchMap(result => this._handleUserLogin(result.user))
    );
  }

  // Método: Login con Google
  loginWithGoogle(): Observable<void> {
    return from(
      signInWithPopup(this.auth, new GoogleAuthProvider())
    ).pipe(
      switchMap(result => this._handleUserLogin(result.user))
    );
  }

  // Método privado: Maneja login exitoso (email o Google)
  private _handleUserLogin(firebaseUser: User): Observable<void> {
    return from((async () => {
      const userRef = doc(this.firestore, 'users', firebaseUser.uid);
      const userSnap = await getDoc(userRef);
      
      // Si el usuario es nuevo, crea su perfil en Firestore
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || 'Usuario',
          photoURL: firebaseUser.photoURL || '',
          role: 'user'
        });
      }
      this.router.navigate(['/home']);
    })());
  }

  // Método: Logout
  logout(): Observable<void> {
    return from(signOut(this.auth)).pipe(
      switchMap(() => {
        this.router.navigate(['/login']);
        return of(void 0);
      })
    );
  }
}
```

**Ejemplo de uso en un componente:**
```typescript
export class MyComponent {
  private authService = inject(AuthService);
  
  // Acceso directo a las señales reactivas
  currentUser = this.authService.currentUser;
  isAdmin = computed(() => this.authService.hasRole('admin'));
  
  logout() {
    this.authService.logout().subscribe();
  }
}
```

### 9.4 Guards de Protección de Rutas

#### **Auth Guard** - Protege rutas para usuarios autenticados

**Función Principal: `authGuard()`** - Valida que el usuario esté autenticado.

**Explicación:** Esta es una función guard que Angular ejecuta ANTES de navegar a una ruta. 
- Si hay usuario autenticado en Firebase → Permite acceso (`return true`)
- Si NO hay usuario → Redirige a login (`router.createUrlTree(['/login'])`)

Se usa en rutas que solo usuarios logueados deben ver (ej: `/panel`)

```typescript

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  // ⭐ FUNCIÓN PRINCIPAL: Verifica si hay usuario autenticado
  return authState(auth).pipe(
    take(1), // Espera una sola emisión
    map(user => {
      if (user) {
        return true; // ✅ Permite acceso
      } else {
        // ❌ Redirige a login
        return router.createUrlTree(['/login']); 
      }
    })
  );
};
```

---

#### **Admin Guard** - Restringe acceso solo a administradores

**Función Principal: `adminGuard()`** - Valida que el usuario sea administrador.

**Explicación:** Guard más restrictivo que:
1. Verifica si hay usuario autenticado en Firebase
2. Si hay usuario, obtiene su documento desde Firestore
3. Revisa el campo `role` del usuario
4. Si `role === 'admin'` → Permite acceso
5. Si no es admin → Redirige a `/home`

Se usa en rutas administrativas (ej: `/admin`)

```typescript

export const adminGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth);
  const firestore = inject(Firestore);
  const router = inject(Router);

  // ⭐ FUNCIÓN PRINCIPAL: Verifica autenticación + rol de admin
  return authState(auth).pipe(
    take(1),
    switchMap(user => {
      // Si no hay usuario, redirige a login
      if (!user) return of(router.createUrlTree(['/login']));

      // Obtiene el documento del usuario desde Firestore
      const userRef = doc(firestore, 'users', user.uid);
      return from(getDoc(userRef)).pipe(
        map(snapshot => {
          const userData = snapshot.data() as UserProfile;
          
          // Verifica si es administrador
          if (userData && userData.role === 'admin') {
            return true; // ✅ Acceso permitido
          }
          
          // ❌ No es admin, redirige a home
          return router.createUrlTree(['/home']);
        })
      );
    })
  );
};
```

**Flujo de validación:**
```
Usuario intenta acceder a /admin
    ↓
¿Hay usuario en Firebase?
    ├→ No → Redirige a /login
    └→ Sí → Obtiene documento del usuario en Firestore
        ↓
        ¿role === 'admin'?
        ├→ Sí → ✅ Permite acceso
        └→ No → ❌ Redirige a /home
```

---

### 9.5 Interfaces de Datos

**UserProfile Interface** (`src/app/features/share/Interfaces/Interfaces-Users.ts`)

**Estructura Principal:** Define el contrato de datos para toda la aplicación.

**Explicación:** Las interfaces son "moldes" que definen qué propiedades debe tener cada tipo de objeto. Son cruciales para:
- Type-safety: Angular valida que los datos tengan la forma correcta
- Autocompletado en el editor
- Documentación del código

```typescript
// Interfaz para el Horario disponible
export interface Availability {
  dias: string;   // Ej: "Lunes a Viernes"
  horas: string;  // Ej: "09:00 - 18:00"
}

// ⭐ INTERFAZ PRINCIPAL: Define la estructura de un Usuario
export interface UserProfile {
  // Datos de Autenticación
  uid: string;
  email: string;
  role: 'admin' | 'user' | 'Programador';
  
  // Datos Personales
  displayName?: string;
  photoURL?: string;
  
  // Datos de Programador (opcional)
  specialty?: string;          // Especialidad
  description?: string;        // Biografía
  skills?: string[];           // Tecnologías conocidas
  availability?: Availability; // Horario disponible
}

// Interfaz de Proyectos
export interface Project {
  id?: string;
  programmerId: string;
  title: string;
  description: string;
  category: 'Academico' | 'Laboral'; 
  role: string;
  technologies: string[];
  repoUrl?: string;
  demoUrl?: string;
  image?: string;
  likes?: string[];
}

// Interfaz de Asesorías/Solicitudes
export interface Asesoria {
  id?: string;
  programmerId: string;
  programmerName: string;
  clientId: string;
  clientName: string;
  date: string;
  time: string;
  comment: string;
  status: 'pendiente' | 'aprobada' | 'rechazada';
  responseMsg?: string;
}
```

**Uso en un componente:**
```typescript
export class AdminComponent {
  private authService = inject(AuthService);
  
  // TypeScript valida automáticamente que sea UserProfile
  currentUser: Signal<UserProfile | null> = this.authService.currentProfile;
}
```

---

### 9.6 Componente de Login

**LoginPage** (`src/app/features/pages/Login-Page/Login-Page.ts`)

**Función Principal: `loginWithEmail()`** - Autentica al usuario con email y contraseña.

**Explicación:** Este método es el corazón del componente de login. Hace lo siguiente:
1. Valida que el formulario esté completo (email y contraseña válidos)
2. Activa la bandera de `loading` para mostrar un spinner
3. Llama al método `login()` del AuthService con las credenciales
4. Si es exitoso, el AuthService redirige automáticamente a `/home`
5. Si hay error, muestra un mensaje de error al usuario

```typescript

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './Login-Page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  
  loading = signal(false);
  errorMessage = signal<string | null>(null);

  loginForm: FormGroup;
  formUtils = FormUtils;

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  // Previene cerrar la pestaña durante el login
  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any) {
    if (this.loading()) {
      $event.returnValue = true;
    }
  }

  // ⭐ FUNCIÓN PRINCIPAL: Login con correo y contraseña
  loginWithEmail() {
    // Valida el formulario
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.loginForm.value;

    // Llama al servicio de autenticación
    this.authService.login(email, password).subscribe({
      next: () => {
        // ✅ Login exitoso
        this.loading.set(false);
        // AuthService redirige automáticamente a /home
      },
      error: (err: any) => {
        // ❌ Error en el login
        this.loading.set(false);
        this.errorMessage.set('Email o contraseña incorrectos');
        console.error('Error en login:', err);
      }
    });
  }

  // Método alternativo: Login con Google
  loginWithGoogle() {
    this.loading.set(true);
    this.authService.loginWithGoogle().subscribe({
      next: () => {
        this.loading.set(false);
      },
      error: (err: any) => {
        this.loading.set(false);
        this.errorMessage.set('Error al iniciar sesión con Google');
        console.error('Error Google login:', err);
      }
    });
  }
}
```

**Flujo de ejecución:**
```
Usuario escribe email y contraseña
    ↓
Hace clic en "Login"
    ↓
loginWithEmail() valida el formulario
    ├→ No válido → Marca campos con error
    └→ Válido → Continúa
        ↓
        Activa loading = true (muestra spinner)
        ↓
        Llama authService.login(email, password)
        ↓
        Firebase valida credenciales
        ├→ Exitoso → AuthService sincroniza usuario
        │   ├→ Guarda currentUser signal
        │   ├→ Obtiene perfil de Firestore
        │   ├→ Redirige a /home
        │   └→ loading = false
        │
        └→ Error → Muestra mensaje de error
            └→ loading = false
```

---

### 9.7 Configuración de Estilos

**Tailwind + DaisyUI** (`src/styles.css`)

**Configuración Principal:** Sistema de temas y utilidades CSS.

**Explicación:** Este archivo configura el sistema de diseño completo del proyecto:
- **Tailwind CSS**: Framework de utilidades que permite escribir estilos rápidamente sin CSS personalizado
- **DaisyUI**: Librería de componentes construida sobre Tailwind que proporciona componentes UI listos para usar
- **Temas**: Define 3 temas disponibles (light, dark, abyss) que se pueden cambiar dinámicamente

```css
@import "tailwindcss";

/* ⭐ CONFIGURACIÓN PRINCIPAL: Habilita DaisyUI con 3 temas */
@plugin "daisyui" {
  themes: light --default, dark --prefersdark, abyss;
}

/* Estilos globales */
body {
  @apply bg-base-100 text-base-content transition-colors duration-300;
}

/* Animaciones personalizadas */
@keyframes fadeIn {
  from {
    @apply opacity-0;
  }
  to {
    @apply opacity-100;
  }
}

.fade-in {
  @apply animate-fadeIn;
}
```

**Ventajas de este enfoque:**
- Los cambios de tema son instantáneos (solo CSS)
- Reutilización de colores y estilos consistentes
- Reducción significativa de código CSS personalizado

---

### 9.8 Flujo Completo de Autenticación

**Diagrama del Flujo:**

```
┌─────────────────────────────────────────────────────────┐
│ USUARIO NO AUTENTICADO                                  │
└────────────────┬────────────────────────────────────────┘
                 ↓
        ┌────────────────────┐
        │  Login-Page /      │
        │  Register-Page     │
        └────────┬───────────┘
                 ↓
        ┌────────────────────────────────┐
        │ AuthService.login() o register()
        │ Firebase Auth                  │
        └────────┬───────────────────────┘
                 ↓
        ┌────────────────────────────────┐
        │ Crear/Obtener documento        │
        │ Firestore: users/{uid}         │
        └────────┬───────────────────────┘
                 ↓
        ┌────────────────────────────────┐
        │ Actualizar Signals:            │
        │ - currentUser                  │
        │ - currentProfile               │
        │ - currentRole                  │
        └────────┬───────────────────────┘
                 ↓
        ┌────────────────────────────────┐
        │ Guards validan permisos:       │
        │ - authGuard                    │
        │ - adminGuard                   │
        │ - publicGuard                  │
        └────────┬───────────────────────┘
                 ↓
   ┌─────────────┴──────────────┬───────────────┐
   ↓                            ↓               ↓
┌──────────┐          ┌──────────────┐   ┌─────────────┐
│ /home    │          │ /admin       │   │ /panel      │
│(Usuario) │          │(Admin)       │   │(Autenticado)│
└──────────┘          └──────────────┘   └─────────────┘
```

**Tabla de validación de rutas:**

| Ruta | Guard | Acceso |
|------|-------|--------|
| `/login` | publicGuard | ✅ No autenticados |
| `/register` | - | ✅ Público |
| `/home` | - | ✅ Todos |
| `/admin` | adminGuard | ✅ Solo admin |
| `/panel` | authGuard | ✅ Autenticados |
| `/portfolio/:id` | - | ✅ Público |

---

### 9.9 Resumen de Funciones Principales por Módulo

| Módulo | Función Principal | Propósito |
|--------|-------------------|-----------|
| **App Component** | `ngOnInit()` | Inicializa la sincronización de autenticación |
| **AuthService** | Constructor | Sincroniza estado del usuario en tiempo real |
| **AuthService** | `login(email, password)` | Autentica con email y contraseña |
| **AuthService** | `loginWithGoogle()` | Autentica con Google OAuth |
| **authGuard** | `authGuard()` | Protege rutas para usuarios autenticados |
| **adminGuard** | `adminGuard()` | Protege rutas solo para administradores |
| **LoginPage** | `loginWithEmail()` | Maneja el formulario de login |
| **Interfaces** | `UserProfile` | Define estructura de usuario |
| **Styles** | Tema system | Gestiona cambio de temas dinámicos |

---

### 9.10 Estado del Proyecto

**✅ Completado:**
- Autenticación con Firebase (email/password y Google)
- Sistema de roles (admin, user, Programador) con guards
- Gestión de perfiles de usuario con Firestore
- Base de datos estructurada con interfaces TypeScript
- Estilos modernos con Tailwind + DaisyUI + 3 temas
- Sistema de notificaciones con Toastr
- Rutas con lazy loading para mejor rendimiento
- Constructor reactivo en AuthService con RxJS

**🔄 En Desarrollo:**
- Panel administrativo con gestión de usuarios
- Sistema completo de asesorías/solicitudes
- Portafolio y galería de proyectos
- Integración de notificaciones por email (EmailJS)
- Sincronización en tiempo real avanzada

**⏳ Por Implementar:**
- Integración WhatsApp API
- Cloud Functions para automatizaciones
- Pruebas unitarias exhaustivas (Vitest)
- Optimizaciones de SEO
- Analytics y monitoreo

---

## 10. Conclusiones

### Logros del Proyecto
- Sistema de autenticación robusto y escalable basado en Firebase
- Arquitectura modular con componentes standalone de Angular
- Seguridad implementada con guards especializados por rol
- Base de datos bien estructurada con Firestore
- Interfaz moderna y responsive con Tailwind CSS

### Qué se Aprendió
- Patrones reactivos con RxJS y signals de Angular
- Gestión de estado distribuido sin necesidad de librerías externas
- Integración avanzada de Firebase (Auth y Firestore)
- Mejores prácticas de Angular 17+ (standalone, lazy loading, signals)
- Seguridad frontend con guards y control de acceso basado en roles

### Posibles Mejoras Futuras
1. Implementar testing exhaustivo con Vitest
2. Agregar Cloud Functions para lógica backend
3. Implementar WebSockets para sincronización en tiempo real
4. Agregar analytics con Firebase Analytics
5. Optimizar SEO y metadatos dinámicos
6. Implementar cache estratégico
7. Agregar integración con APIs externas (WhatsApp, Email)

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

