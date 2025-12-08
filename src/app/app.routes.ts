import { Routes } from '@angular/router';

export const routes: Routes = [

    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
    },
    {
        path: 'login',
        loadComponent:()=>import('./features/pages/Login-Page/Login-Page').then(m => m.LoginPage)
        
    },
    {
        path: 'register',
        loadComponent:()=>import('./features/pages/Register-Page/Register-Page').then(m => m.RegisterPage)

    },
    
    {
        path: 'home',
        loadComponent: () => import('./features/pages/Home-Page/Home-Page').then(m => m.HomePage)
    },

    {
        path: 'admin',
        loadComponent: () => import('./features/pages/Adminpage/Adminpage').then(m => m.Adminpage)
    },
    
    {
        path: '**',
        redirectTo: 'login'
    }
];
