import { ChangeDetectionStrategy, Component, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthApiService } from '../../../core/services/api/auth-api.service';
import { AuthStoreService } from '../../../core/services/auth/auth-store.service';
import { AuthLoginRequest } from '../../../core/models/auth.models';
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
  private authApiService = inject(AuthApiService);
  private authStore = inject(AuthStoreService);
  private router = inject(Router);
  
  loading = signal(false);
  errorMessage = signal<string | null>(null);

  loginForm: FormGroup;
  formUtils = FormUtils;

  private isLoggingIn = false;

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any) {
    if (this.isLoggingIn) {
      $event.returnValue = true;
    }
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoggingIn = true;
    this.loading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.loginForm.value;
    const loginRequest: AuthLoginRequest = {
      emailOrUsername: email,
      password: password
    };

    this.authApiService.login(loginRequest).subscribe({
      next: (response) => {
        this.authStore.setAuth(response);
        this.isLoggingIn = false;
        this.loading.set(false);
        this.router.navigate(['/home']);
      },
      error: (error: any) => {
        this.isLoggingIn = false;
        this.loading.set(false);
        this.errorMessage.set(this.getErrorMessage(error));
      }
    });
  }

  private getErrorMessage(error: any): string {
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

    if (error?.message?.includes('Network')) {
      return 'Error de conexión. Verifica tu conexión a internet.';
    }

    return error?.message || 'Error en el login. Intenta de nuevo.';
  }
}
