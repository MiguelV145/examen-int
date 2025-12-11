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

    {
        path: 'login',
        loadComponent: () => import('./features/pages/Login-Page/Login-Page').then(m => m.LoginPage),
        canActivate: [publicGuard] 
    },
    {
        path: 'register',
        loadComponent: () => import('./features/pages/Register-Page/Register-Page').then(m => m.RegisterPage),
    },
    
    {
        path: 'home',
        loadComponent: () => import('./features/pages/Home-Page/Home-Page').then(m => m.HomePage),
    },

    {
        path: 'admin',
        loadComponent: () => import('./features/pages/Adminpage/Adminpage').then(m => m.Adminpage),
        canActivate: [adminGuard]
    },


    {
        path: 'panel',
        // Verifica que la ruta del archivo coincida con donde guardaste ProgrammerPage
        loadComponent: () => import('./features/pages/Perfil-page/Perfil-Page').then(m => m.ProgrammerPage),
        canActivate: [authGuard] // Solo usuarios logueados pueden entrar aquí
    },
    

    {
        
        path: 'portfolio/:id',
        loadComponent: () => import('./features/pages/Portafolio-Detail/Portafolio-Detail').then(m => m.PortfolioDetail)
    
    },
    

    {
        path: '**',
        redirectTo: 'home'
    }
];