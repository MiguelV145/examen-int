import { Routes } from '@angular/router';
// Asegúrate de que los nombres de archivo coincidan con los que creaste
import { authGuard } from './core/guards/auth-guard';       // Protege rutas para usuarios logueados
import { publicGuard } from './core/guards/public-guard';   // Bloquea rutas si ya estás logueado
import { adminGuard } from './core/guards/admin-guard';     // Solo para admins

export const routes: Routes = [

    {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
    },

    // --- RUTAS PÚBLICAS (Solo para visitantes NO logueados) ---
    {
        path: 'login',
        loadComponent: () => import('./features/pages/Login-Page/Login-Page').then(m => m.LoginPage),
        canActivate: [publicGuard] // Si ya estoy logueado, me patea al Home
    },
    {
        path: 'register',
        loadComponent: () => import('./features/pages/Register-Page/Register-Page').then(m => m.RegisterPage),
        canActivate: [publicGuard]
    },
    
    // --- RUTA COMPARTIDA (Visible para todos) ---
    {
        path: 'home',
        loadComponent: () => import('./features/pages/Home-Page/Home-Page').then(m => m.HomePage),
        // IMPORTANTE: Quitamos el guard aquí para que TODOS puedan verla
    },

    // --- RUTA DE ADMINISTRADOR (Rol Admin) ---
    {
        path: 'admin',
        loadComponent: () => import('./features/pages/Adminpage/Adminpage').then(m => m.Adminpage),
        canActivate: [adminGuard]
    },

    // --- RUTA DE PROGRAMADOR (Rol Programador) ---
    // Esta es la ruta que te faltaba para que el botón "Mi Panel" funcione
    {
        path: 'panel',
        // Verifica que la ruta del archivo coincida con donde guardaste ProgrammerPage
        loadComponent: () => import('./features/pages/Programmer-Page/Programmer-Page').then(m => m.ProgrammerPage),
        canActivate: [authGuard] // Solo usuarios logueados pueden entrar aquí
    },
    
    // --- RUTA DETALLE PORTAFOLIO (Pública) ---
    // Si quieres que al dar clic en "Ver Perfil" se vea el detalle
    /*
    {
        path: 'portfolio/:id',
        loadComponent: () => import('./features/pages/Portfolio-Detail/Portfolio-Detail').then(m => m.PortfolioDetail),
    },
    */

    {
        path: '**',
        redirectTo: 'home'
    }
];