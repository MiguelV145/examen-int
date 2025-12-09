import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { publicGuard } from './core/guards/public-guard';
import { adminGuard } from './core/guards/admin-guard';

export const routes: Routes = [

    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
    },
    {
        path: 'login',
        loadComponent:()=>import('./features/pages/Login-Page/Login-Page').then(m => m.LoginPage),
         canActivate: [publicGuard]
        
    },
    {
        path: 'register',
        loadComponent:()=>import('./features/pages/Register-Page/Register-Page').then(m => m.RegisterPage),
        canActivate: [publicGuard]
    },
    
    {
        path: 'home',
        loadComponent: () => import('./features/pages/Home-Page/Home-Page').then(m => m.HomePage)
    },

    {
        path: 'admin',
        loadComponent: () => import('./features/pages/Adminpage/Adminpage').then(m => m.Adminpage),
        canActivate:[adminGuard]
    },
    
    {
        path: '**',
        redirectTo: 'login'
    }
];
