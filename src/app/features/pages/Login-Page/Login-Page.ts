import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/firebase/authservice';
import { FormUtils } from '../../share/Formutils/Formutils';
import { of } from 'rxjs';

@Component({
  selector: 'app-login-page',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './Login-Page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
   loading = signal(false);
  errorMessage = signal<string | null>(null);

  loginForm: FormGroup;

  // Signal para disparar el login
  private loginTrigger = signal<{ email: string; password: string } | null>(null);

  // rxResource para manejar el proceso de login (Angular 20+)
  loginResource = rxResource({
    params: () => this.loginTrigger(),
    stream: ({ params }) => {
      if (!params) return of(null);
      return this.authService.login(params.email, params.password);
    }
  });
  
  formUtils = FormUtils;

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    // Effect para navegar cuando el login sea exitoso
    effect(() => {
      if (this.loginResource.hasValue() && this.loginResource.value()) {
        console.log('Login exitoso, navegando a /home');
        this.router.navigate(['/home']);
      }
    });
  }

  onSubmit() {
  if (this.loginForm.invalid) {
    this.loginForm.markAllAsTouched();
    return;
  }

  this.loading.set(true);
  this.errorMessage.set(null);

  const { email, password } = this.loginForm.value;

  this.authService.login(email, password).subscribe({
    next: () => {
      this.loading.set(false);
      // Cambio: Navegar a /home en lugar de /simpsons
      this.router.navigate(['/home']);
    },
    error: (error) => {
      this.loading.set(false);
      this.errorMessage.set(this.getErrorMessage(error.code));
    }
  });
}
  // Computed signal para el estado de carga


  
 private getErrorMessage(code: string): string {
    switch (code) {
      case 'auth/user-not-found':
        return 'Usuario no encontrado.';
      case 'auth/wrong-password':
        return 'Contraseña incorrecta.';
      case 'auth/too-many-requests':
        return 'Demasiados intentos fallidos. Intenta más tarde.';
      default:
        return 'Error de autenticación. Intenta nuevamente.';
    } 
  } 
  onGoogleLogin() {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.authService.loginWithGoogle().subscribe({
      next: () => {
        // No necesitamos navegar aquí manualmente.
        // El AuthService ya redirige según el rol (Admin/Programador/User)
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error Google:', err);
        this.loading.set(false);
        this.errorMessage.set('Error al iniciar con Google. Intenta de nuevo.');
      }
    });
  }


  // Getters para validación en el template
  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }
}