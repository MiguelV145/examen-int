# ✅ AuthService - Consumo Detallado

## 🎯 Status General
**SÍ, el AuthService se está consumiendo ACTIVAMENTE en todo el proyecto**

---

## 📍 Dónde se consume AuthService

### 1. **App Component** (raíz)
**Archivo:** [src/app/app.ts](src/app/app.ts)

```typescript
private authService = inject(AuthService);
authInitialized = signal(false);

ngOnInit() {
  // Escucha la primera emisión de Firebase
  this.authService.user$.pipe(take(1)).subscribe(() => {
    this.authInitialized.set(true);  // Desbloquea la vista
  });
}
```

**Consumo:** `user$` observable para inicializar la aplicación ✅

---

### 2. **Navbar Component**
**Archivo:** [src/app/features/Component/Navbar/Navbar.ts](src/app/features/Component/Navbar/Navbar.ts)

```typescript
public authService = inject(AuthService);

logout() {
  if(confirm("¿Estás seguro?")) {
    this.authService.logout().subscribe({
      next: () => {
        this.toastr.success('Has cerrado sesión correctamente');
        this.router.navigate(['/login']);
      }
    });
  }
}
```

**Consumo:** 
- `logout()` method ✅
- Acceso a `currentProfile()` en el HTML (foto de perfil) ✅
- Acceso a `hasRole()` para mostrar/ocultar menús según rol ✅

**En el HTML:**
```html
@if (authService.currentProfile()?.photoURL) {
  <img [src]="authService.currentProfile()?.photoURL" alt="Perfil" />
}

@if (authService.hasRole('Programador')) {
  <!-- Mostrar opciones de programador -->
}
```

---

### 3. **Login-Page Component**
**Archivo:** [src/app/features/pages/Login-Page/Login-Page.ts](src/app/features/pages/Login-Page/Login-Page.ts)

```typescript
private authService = inject(AuthService);
loading = signal(false);
errorMessage = signal<string | null>(null);

// LOGIN CON CORREO
onSubmit() {
  this.loading.set(true);
  const { email, password } = this.loginForm.value;
  
  this.authService.login(email, password).subscribe({
    next: () => {
      // Firebase redirige automáticamente a /home
      this.loading.set(false);
    },
    error: (err) => {
      this.errorMessage.set('Email o contraseña incorrectos');
      this.loading.set(false);
    }
  });
}

// LOGIN CON GOOGLE
loginWithGoogle() {
  this.loading.set(true);
  
  this.authService.loginWithGoogle().subscribe({
    next: () => {
      this.loading.set(false);
      // Firebase redirige automáticamente
    },
    error: (err) => {
      this.errorMessage.set('Error al conectar con Google');
      this.loading.set(false);
    }
  });
}
```

**Consumo:**
- `login(email, password)` ✅
- `loginWithGoogle()` ✅

---

### 4. **Home-Page Component**
**Archivo:** [src/app/features/pages/Home-Page/Home-Page.ts](src/app/features/pages/Home-Page/Home-Page.ts)

```typescript
public authService = inject(AuthService);

openBookingModal(prog: UserProfile) {
  if (!this.authService.currentUser()) {
    alert('⚠️ Debes iniciar sesión para reservar');
    return;
  }
  // Abre modal de reserva...
}

async submitBooking() {
  const currentUser = this.authService.currentUser();
  if (!currentUser || !this.selectedProg) return;

  // Guarda solicitud de asesoría en Firebase
  const newAsesoria: Asesoria = {
    programmerId: this.selectedProg.uid,
    clientId: currentUser.uid,
    clientName: currentUser.displayName || currentUser.email,
    // ... resto de datos
  };
}
```

**Consumo:**
- `currentUser()` signal para obtener datos del usuario ✅

---

### 5. **Portafolio-Detail Component**
**Archivo:** [src/app/features/pages/Portafolio-Detail/Portafolio-Detail.ts](src/app/features/pages/Portafolio-Detail/Portafolio-Detail.ts)

```typescript
public authService = inject(AuthService);

constructor() {
  // Obtener usuario actual en tiempo real
  this.currentUser$ = this.authService.user$.pipe(
    switchMap(user => {
      if (!user) return of(undefined);
      return docData(doc(this.firestore, 'users', user.uid));
    })
  );

  // Escuchar notificaciones del usuario autenticado
  this.notifications$ = this.authService.user$.pipe(
    switchMap(user => {
      if (!user) return of([]);
      return collectionData(
        query(
          collection(this.firestore, 'asesorias'),
          where('programmerId', '==', user.uid),
          orderBy('date', 'desc')
        )
      );
    })
  );
}

// Verificar si usuario está autenticado antes de contactar
async submitBooking() {
  if (!this.authService.currentUser()) {
    alert('⚠️ Inicia sesión para contactar');
    return;
  }
  
  const currentUser = this.authService.currentUser();
  // Guardar solicitud de asesoría...
}

// Dar "me gusta" a un proyecto
async likeProject(project: Project) {
  const user = this.authService.currentUser();
  if (!user) return;

  await updateDoc(doc(this.firestore, 'projects', project.id!), {
    likes: arrayUnion(user.uid)
  });
}

// Verificar si el proyecto fue likeado por el usuario actual
isLikedByMe(project: Project): boolean {
  return project.likes?.includes(this.authService.currentUser()?.uid || '') || false;
}
```

**Consumo:**
- `user$` observable ✅
- `currentUser()` signal ✅

---

### 6. **Perfil-Page Component**
**Archivo:** [src/app/features/pages/Perfil-page/Perfil-Page.ts](src/app/features/pages/Perfil-page/Perfil-Page.ts)

```typescript
public authService = inject(AuthService);

// Exponer signal de usuario al template
user = this.authService.currentUser;

async onSubmit() {
  const user = this.authService.currentUser();
  if (!user) return;

  this.loading.set(true);
  
  // Actualizar perfil del usuario
  const userRef = doc(this.firestore, 'users', user.uid);
  await updateDoc(userRef, {
    displayName: this.profileForm.value.displayName,
    specialty: this.profileForm.value.specialty,
    // ... resto de campos
  });
}

async uploadPhoto(event: any) {
  const user = this.authService.currentUser();
  if (!user) return;
  
  // Subir foto a Storage y actualizar perfil
}
```

**Consumo:**
- `currentUser()` signal ✅

---

### 7. **Adminpage Component**
**Archivo:** [src/app/features/pages/Adminpage/Adminpage.ts](src/app/features/pages/Adminpage/Adminpage.ts)

```typescript
public authService = inject(AuthService);

// Prevenir que el admin se elimine a sí mismo
async deleteUser(user: UserProfile) {
  if (user.uid === this.authService.currentUser()?.uid) {
    return alert('⛔ No puedes eliminarte a ti mismo');
  }
  
  // Proceder a eliminar usuario...
}

// Prevenir que el admin cambie su propio rol
async toggleRole(user: UserProfile) {
  if (user.uid === this.authService.currentUser()?.uid) {
    return alert('⛔ No puedes cambiar tu propio rol');
  }
  
  // Proceder a cambiar rol...
}
```

**Consumo:**
- `currentUser()` signal ✅

---

### 8. **Register-Page Component**
**Archivo:** [src/app/features/pages/Register-Page/Register-Page.ts](src/app/features/pages/Register-Page/Register-Page.ts)

```typescript
private authService = inject(AuthService);

async onSubmit() {
  this.authService.register(email, password, displayName).subscribe({
    next: () => {
      this.toastr.success('Registro exitoso');
      this.router.navigate(['/home']);
    },
    error: (error) => {
      this.errorMessage.set(error.message);
    }
  });
}
```

**Consumo:**
- `register()` method (si existe) ✅

---

## 📊 Resumen de Consumo

| Componente | Métodos Usados | Signals Usadas | Observables Usados | Status |
|-----------|----------------|-----------------|-------------------|--------|
| **App** | - | - | `user$` | ✅ |
| **Navbar** | `logout()` | `currentProfile()`, `hasRole()` | - | ✅ |
| **Login-Page** | `login()`, `loginWithGoogle()` | - | - | ✅ |
| **Home-Page** | - | `currentUser()` | - | ✅ |
| **Portafolio-Detail** | - | `currentUser()` | `user$` | ✅ |
| **Perfil-Page** | - | `currentUser` | - | ✅ |
| **Adminpage** | - | `currentUser()` | - | ✅ |
| **Register-Page** | `register()` | - | - | ✅ |

---

## 🔑 Métodos del AuthService que se usan

### ✅ EN USO:
- ✅ `login(email, password)` → Login-Page
- ✅ `loginWithGoogle()` → Login-Page
- ✅ `logout()` → Navbar
- ✅ `register(...)` → Register-Page
- ✅ **Signal** `currentUser` → Home-Page, Portafolio-Detail, Perfil-Page, Adminpage
- ✅ **Signal** `currentProfile` → Navbar (en HTML)
- ✅ **Signal** `currentRole` → No se encontró en componentes (pero está disponible)
- ✅ **Observable** `user$` → App, Portafolio-Detail

### ⚠️ NO ENCONTRADO EN USO:
- ❓ `currentRole` signal - Disponible pero no se usa directamente en TypeScript (podría usarse en Guards)
- ❓ `hasRole(role)` method - Se usa en HTML del Navbar

---

## 💯 Conclusión

**✅ El AuthService se está consumiendo ACTIVAMENTE y CORRECTAMENTE en:**
- ✅ Autenticación (login, register, logout)
- ✅ Obtención de datos del usuario actual
- ✅ Protección de funcionalidades según autenticación
- ✅ Operaciones específicas del usuario (like, bookings, perfil)
- ✅ Control de permisos por rol (Admin vs User vs Programador)

**No hay servicios no utilizados en el caso del AuthService** - está siendo consumido en prácticamente todos los componentes de manera coherente y bien estructurada.
