import { Routes } from '@angular/router';

export const routes: Routes = [

    {
        path: '',
        loadComponent: () => import('./features/pages/Login-Page/Login-Page').then(c => c.LoginPage)
    },
];
