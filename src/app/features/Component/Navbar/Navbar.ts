import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/firebase/authservice';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-navbar',
  imports: [CommonModule, RouterLink, RouterLinkActive ],
  templateUrl: './Navbar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Navbar { 
 public authService = inject(AuthService);
  private router = inject(Router);
  private toastr = inject(ToastrService); // Mantenemos tu Toastr

  // Signal para estado de carga al salir
  loggingOut = signal(false);
  


  /**
   * Cierra la sesión del usuario
   * (Simplificado para funcionar directo desde el botón del menú)
   */
  logout() {
    // Si quisieras confirmación, podrías usar un confirm() nativo rápido
    // o simplemente cerrar sesión directo como es estándar en menús dropdown.
    if(confirm("¿Estás seguro de que quieres cerrar sesión?")) {
      this.performLogout();
    }
  }

  // Lógica real de cierre de sesión
  private performLogout() {
    this.loggingOut.set(true);
    
    this.authService.logout().subscribe({
      next: () => {
        this.loggingOut.set(false);
        this.toastr.success('Has cerrado sesión correctamente', '¡Hasta pronto!');
        // El servicio ya redirige, pero esto no hace daño
        this.router.navigate(['/login']);
      },
      error: (error) => {
        this.loggingOut.set(false);
        console.error('Error al cerrar sesión:', error);
        this.toastr.error('No se pudo cerrar la sesión', 'Error');
      }
    });
  }

  // Métodos auxiliares (si los necesitas en otro lado)
  navigateToLogin() {
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }
}