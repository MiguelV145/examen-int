import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/firebase/authservice';
import { ToastrService } from 'ngx-toastr';


@Component({
  selector: 'app-navbar',
  imports: [RouterLink, ],
  templateUrl: './Navbar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Navbar { 
  public authService = inject(AuthService);

  logout() {
    this.authService.logout().subscribe(() => {
      console.log('Sesión cerrada');
    });
    
  }
private router = inject(Router);
private toastr = inject(ToastrService);

 // Signal que se actualiza automáticamente cuando cambia el usuario

currentUser = this.authService.currentUser; 

  /**
   * Navega a la página de login
   */
  navigateToLogin() {
    this.router.navigate(['/login']);
  }

  /**
   * Verifica si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }


confirmLogout() {
    const modal = document.getElementById('logout_modal') as HTMLDialogElement;
    modal?.close();
    
    this.loggingOut.set(true);
    
    this.authService.logout().subscribe({
      next: () => {
        this.loggingOut.set(false);
        this.toastr.success('Sesión cerrada correctamente', 'Hasta pronto!');
        this.router.navigate(['/login']);
      },
      error: (error) => {
        this.loggingOut.set(false);
        console.error('Error al cerrar sesión:', error);
        this.toastr.error('No se pudo cerrar la sesión', 'Error');
      }
    });
  }


  loggingOut = signal(false); // Agregar
  /**
   * Cierra la sesión del usuario
   */


  openLogoutModal() {
  const modal = document.getElementById('logout_modal') as HTMLDialogElement;
  modal?.showModal();
}




}
