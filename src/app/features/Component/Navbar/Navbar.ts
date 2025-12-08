import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/firebase/authservice';

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
}
