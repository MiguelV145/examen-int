import { ChangeDetectionStrategy, Component, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth.service';
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

  // --- LOGIN CON BACKEND SPRING BOOT (JWT) ---
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
        this.errorMessage.set(this.getErrorMessage(error));
      }
    });
  }

  private getErrorMessage(error: any): string {
    // Si es un error HTTP del backend
    if (error?.status) {
      switch (error.status) {
        case 401:
          return 'Credenciales inválidas. Verifica tu usuario/email y contraseña.';
        case 400:
          return error.error?.message || 'Datos inválidos. Por favor, revisa los campos.';
        case 404:
          return 'Usuario no encontrado. Por favor, regístrate primero.';
        case 500:
          return 'Error del servidor. Intenta más tarde.';
        default:
          return error.error?.message || `Error: ${error.statusText || 'Error desconocido'}`;
      }
    }

    // Si es un error de red
    if (error?.message?.includes('Network')) {
      return 'Error de conexión. Verifica tu conexión a internet.';
    }

    // Error genérico
    return error?.message || 'Error desconocido. Intenta de nuevo.';
  }
}