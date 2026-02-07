# Manejo de services y uso de promesas

Este documento explica a qué se refiere la frase "manejo de services, uso de promesas" dentro del proyecto, con ejemplos reales del código.

## ¿Qué es el manejo de services?
En Angular, un **service** es una clase que concentra lógica reutilizable (por ejemplo autenticación, peticiones HTTP o lógica de negocio) y se **inyecta** en componentes para evitar duplicar código.

En este proyecto los servicios más relevantes son:

- **AuthService**: maneja login, registro, logout y sincroniza el perfil/rol del usuario con Firestore. Se usa en Login, Register, Home, Admin, Perfil y Navbar.【F:src/app/core/services/firebase/authservice.ts†L1-L147】【F:src/app/features/pages/Login-Page/Login-Page.ts†L1-L99】
- **LinkPreviewService**: consume la API de Microlink para obtener metadatos (título, descripción, imagen) a partir de una URL. Se usa en el detalle del portafolio para autocompletar proyectos.【F:src/app/core/services/link-preview.service.ts.ts†L1-L33】【F:src/app/features/pages/Portafolio-Detail/Portafolio-Detail.ts†L142-L159】

## ¿Qué es el uso de promesas?
Una **promesa** es una forma de manejar operaciones asíncronas. En este proyecto las promesas aparecen principalmente con `async/await` al interactuar con Firestore o EmailJS.

Ejemplos claros:

- **Guardar asesoría + enviar correo** (HomePage): se espera a que Firestore termine (`addDoc`) y luego se espera a EmailJS (`emailjs.send`).【F:src/app/features/pages/Home-Page/Home-Page.ts†L88-L121】
- **Guardar asesoría en PortafolioDetail**: usa `await addDoc(...)` y `await emailjs.send(...)` en un `try/catch/finally`.【F:src/app/features/pages/Portafolio-Detail/Portafolio-Detail.ts†L166-L339】
- **Guardar/actualizar proyecto**: usa `await updateDoc(...)` o `await addDoc(...)` en el método `saveProject`.【F:src/app/features/pages/Portafolio-Detail/Portafolio-Detail.ts†L166-L205】

## Diferencia rápida: Observables vs Promesas
- **Observables (RxJS)**: se usan con Firebase Auth (stream `user$`) y Firestore `collectionData` para datos en tiempo real.【F:src/app/core/services/firebase/authservice.ts†L26-L49】【F:src/app/features/pages/Home-Page/Home-Page.ts†L45-L59】
- **Promesas**: se usan en acciones puntuales donde se necesita esperar un resultado único (crear docs, enviar correo).【F:src/app/features/pages/Home-Page/Home-Page.ts†L88-L121】
