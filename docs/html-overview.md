# Resumen de plantillas HTML

Este documento describe, a nivel visual y semántico, las principales secciones de las plantillas HTML para las páginas de autenticación y vistas clave de la aplicación.

## LoginPage
- **Contenedor principal**: pantalla completa con fondo oscuro y resplandor, que envuelve una tarjeta centrada con borde y blur.【F:src/app/features/pages/Login-Page/Login-Page.html†L1-L12】
- **Encabezado y alerta**: icono de acceso, título/subtítulo y alerta condicional para mostrar errores de autenticación.【F:src/app/features/pages/Login-Page/Login-Page.html†L14-L29】
- **Formulario**: campos de correo y contraseña con iconos embebidos, mensajes de error reactivos y botón que muestra spinner mientras `loading` es verdadero.【F:src/app/features/pages/Login-Page/Login-Page.html†L31-L94】
- **Acciones adicionales**: separador "O continúa con" para el botón de Google y enlace hacia registro en el pie.【F:src/app/features/pages/Login-Page/Login-Page.html†L98-L129】

## RegisterPage
- **Escena**: fondo degradado con elementos circulares difuminados y tarjeta translúcida centrada.【F:src/app/features/pages/Register-Page/Register-Page.html†L1-L7】
- **Cabecera**: icono de usuario y textos de bienvenida encima del formulario.【F:src/app/features/pages/Register-Page/Register-Page.html†L9-L17】
- **Formulario de alta**: tres campos (correo, contraseña y confirmación) con iconos y validaciones visibles, seguido del botón de envío que alterna entre "Registrando..." y "Crear Cuenta" según `loading`.【F:src/app/features/pages/Register-Page/Register-Page.html†L26-L111】
- **Enlaces**: separador que invita a iniciar sesión y botón para redirigir a `/login`.【F:src/app/features/pages/Register-Page/Register-Page.html†L115-L129】

## HomePage
- **Hero**: bloque principal con imagen protagonista, tarjeta flotante con avatares y textos hero que presentan la plataforma.【F:src/app/features/pages/Home-Page/Home-Page.html†L1-L52】
- **Nuestros Expertos**: sección que lista programadores desde `programmers$`, mostrando avatar, especialidad y botón al portafolio; incluye estado vacío estilizado.【F:src/app/features/pages/Home-Page/Home-Page.html†L54-L95】
- **Proyectos Destacados**: grilla de los proyectos top de `featuredProjects$`, cards enlazadas al portafolio con imagen, likes, descripción y categoría, además de placeholders de carga o ausencia de datos.【F:src/app/features/pages/Home-Page/Home-Page.html†L97-L166】

## PortfolioDetail
- **Banner de perfil**: cabecera con avatar, nombre, especialidad y badges de disponibilidad; botones para agendar asesoría o gestionar proyectos si el visitante es dueño.【F:src/app/features/pages/Portafolio-Detail/Portafolio-Detail.html†L1-L101】
- **Listado de proyectos**: grilla de tarjetas con imagen/placeholder, categoría, acciones de edición/eliminación, likes, descripción, chips de tecnologías y enlaces a demo/código.【F:src/app/features/pages/Portafolio-Detail/Portafolio-Detail.html†L106-L195】

## Adminpage
- **Portada**: encabezado con título del panel y tarjeta de identidad del administrador.【F:src/app/features/pages/Adminpage/Adminpage.html†L1-L33】
- **Tabs**: selector para alternar entre vista de usuarios y asesorías, con estilos activos/hover.【F:src/app/features/pages/Adminpage/Adminpage.html†L35-L64】
- **Tabla de usuarios**: tabla responsive con avatar, rol, horario y acciones (cambiar rol o eliminar) condicionadas por permisos.【F:src/app/features/pages/Adminpage/Adminpage.html†L66-L151】
- **Tabla de asesorías**: listado de solicitudes con cliente, programador, fecha/hora, estado con badges y respuesta textual.【F:src/app/features/pages/Adminpage/Adminpage.html†L153-L200】
