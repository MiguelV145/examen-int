# Evaluación de cumplimiento contra las especificaciones

## 1. Autenticación y roles
- ✔️ Inicio de sesión con Google implementado a través de Firebase Authentication (`AuthService.loginWithGoogle`).
- ⚠️ No hay separación clara de vistas para cada rol; el enrutador solo protege `/admin` y `/panel`, pero no existe una vista dedicada para "usuario normal".
- ⚠️ El rol de programador depende de un campo `role` en Firestore, pero no hay verificación de roles en los componentes de portafolio público.

### Cómo mejorar esta parte
- **Centralizar la autorización**: agregar guards específicos por rol (p. ej. `adminGuard`, `programmerGuard`, `publicGuard`) que verifiquen `customClaims` o el campo `role` antes de cargar cada ruta sensible.
- **Separar las vistas por contexto**: crear módulos/páginas independientes para Administrador (gestión de usuarios y asesorías), Programador (panel de portafolio y solicitudes) y Usuario normal (exploración de portafolios y agendamiento), con layouts y barras de navegación diferenciadas.
- **Sincronizar roles con Firebase**: establecer `customClaims` al crear usuarios administradores/programadores y refrescar el token en el cliente para evitar depender solo de Firestore en tiempo de ejecución.
- **Proteger componentes públicos**: cuando se muestren portafolios o proyectos, validar que solo se renderice el contenido público y ocultar acciones de edición si el rol no es Programador.

## 2. Gestión de usuarios
- ✔️ El administrador puede crear cuentas nuevas y asignar rol de Programador o Usuario (`createUser` en `Adminpage`).
- ⚠️ Los perfiles de programador solo almacenan nombre, correo y rol; faltan campos requeridos (especialidad, descripción, foto, enlaces de contacto/redes).

## 3. Gestión de portafolios y proyectos
- ⚠️ Solo existe la vista "Mis Proyectos" para el programador autenticado. No hay portafolio público individual accesible por usuarios externos.
- ⚠️ No hay formularios para crear o editar proyectos; los botones navegan a rutas inexistentes.
- ⚠️ La estructura mínima del proyecto (nombre, descripción, tipo de participación, tecnologías, repositorios, demo) no se gestiona en formularios ni se muestra completamente.

## 4. Gestión de asesorías
- ⚠️ El administrador puede configurar disponibilidad, pero no existe el flujo de "Agendar Asesoría" para usuarios normales.
- ⚠️ No hay formulario para que el usuario seleccione programador, fecha/hora ni comentario.
- ⚠️ Solo el administrador puede aprobar/rechazar solicitudes; el programador no tiene panel de asesorías.

## 5. Diseño de interfaz y prototipo
- ⚠️ Se proveen algunas vistas estáticas (Home, Login, Register), pero no hay prototipo navegable completo ni diferenciación clara entre panel de admin, portafolio público y vista de usuario externo.
- ⚠️ No hay evidencia de validación UX/UI ni vistas móviles específicas más allá del uso de clases responsive generales.

## 6. Notificaciones
- ⚠️ No existe flujo de notificaciones; las aprobaciones de asesorías solo actualizan Firestore sin comunicar al solicitante.
- ⚠️ No se simula envío externo (correo/WhatsApp).

## 7. Despliegue
- ⚠️ No se incluye URL pública ni configuración documentada de despliegue en Firebase Hosting.

## Conclusión
La aplicación implementa autenticación básica con roles en Firebase y un panel de administración parcial, pero carece de los flujos clave solicitados: portafolios públicos completos, gestión integral de proyectos, agendamiento y notificaciones de asesorías, y evidencia de despliegue en Firebase Hosting.
