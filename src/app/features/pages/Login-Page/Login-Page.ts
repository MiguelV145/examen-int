import { ChangeDetectionStrategy, Component, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/firebase/authservice';
import { FormUtils } from '../../share/Formutils/Formutils';

@Component({
  selector: 'app-login-page',
  standalone: true,
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
  formUtils = FormUtils;

  // Bandera para saber si hay un proceso crítico en curso
  private isLoggingIn = false;

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  /**
   * 🛑 ESTO ES LA MAGIA:
   * Detecta si el usuario intenta recargar (F5) o cerrar la pestaña.
   * Si isLoggingIn es true, el navegador mostrará una alerta nativa de advertencia.
   */
  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any) {
    if (this.isLoggingIn) {
      // Esto dispara la alerta del navegador "Es posible que los cambios no se guarden"
      $event.returnValue = true;
    }
  }

  // --- LOGIN CON CORREO ---
  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    // 1. Activamos el bloqueo
    this.isLoggingIn = true;
    this.loading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: () => {
        // 2. Login exitoso: Desactivamos el bloqueo para poder navegar
        this.isLoggingIn = false;
        this.loading.set(false);
        this.router.navigate(['/home']);
      },
      error: (error: any) => {
        // 3. Error: Desactivamos el bloqueo para que el usuario pueda reintentar
        this.isLoggingIn = false;
        this.loading.set(false);
        this.errorMessage.set(this.getErrorMessage(error.code));
      }
    });
  }

  // --- LOGIN CON GOOGLE ---
  onGoogleLogin() {
    // NOTA: Para Google NO activamos 'isLoggingIn' porque este método
    // NECESITA recargar la página para ir a Google (signInWithRedirect).
    // Si lo bloqueamos aquí, el usuario no podría ir a la web de Google.
    
    this.loading.set(true);
    this.errorMessage.set(null);

    this.authService.loginWithGoogle().subscribe({
      next: () => {
        console.log('Redirigiendo a Google...');
      },
      error: (err: any) => {
        console.error('Error Google:', err);
        this.loading.set(false);
        this.errorMessage.set('No se pudo conectar con Google.');
      }
    });
  }

  private getErrorMessage(code: string): string {
    const messages: { [key: string]: string } = {
      'auth/user-not-found': 'No encontramos una cuenta con este correo.',
      'auth/wrong-password': 'La contraseña es incorrecta.',
      'auth/invalid-email': 'El formato del correo no es válido.',
      'auth/too-many-requests': 'Demasiados intentos fallidos. Espera un momento.',
      'auth/popup-closed-by-user': 'Cancelaste el inicio de sesión.'
    };
    return messages[code] || `Error desconocido: ${code}`;
  }
}