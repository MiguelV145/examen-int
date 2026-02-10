import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthApiService } from '../../../core/services/api/auth-api.service';
import { AuthStoreService } from '../../../core/services/auth/auth-store.service';
import { AuthRegisterRequest } from '../../../core/models/auth.models';
import { FormUtils } from '../../share/Formutils/Formutils';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './Register-Page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterPage {
  
  private fb = inject(FormBuilder);
  private authApiService = inject(AuthApiService);
  private authStore = inject(AuthStoreService);
  private router = inject(Router);

  // Estados UI
  loading = signal(false);
  errorMessage = signal<string | null>(null);

  // Formulario y Utils
  registerForm: FormGroup;
  formUtils = FormUtils;

  constructor() {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  // Validador personalizado para contraseñas
  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.registerForm.value;
    
    // Generar username a partir del email (parte antes de @)
    const username = email.split('@')[0];
    
    const registerRequest: AuthRegisterRequest = {
      username: username,
      email: email,
      password: password
    };

    this.authApiService.register(registerRequest).subscribe({
      next: (response) => {
        // Registro exitoso: guardar en store y navegar
        this.authStore.setAuth(response);
        this.loading.set(false);
        this.router.navigate(['/home']);
      },
      error: (error: any) => {
        this.loading.set(false);
        this.errorMessage.set(this.getErrorMessage(error));
      }
    });
  }

  private getErrorMessage(error: any): string {
    if (error?.status) {
      switch (error.status) {
        case 400:
          return error.error?.message || 'Datos de registro inválidos.';
        case 409:
          return 'Este correo ya está registrado. Intenta con otro o ve a login.';
        case 500:
          return 'Error del servidor. Intenta más tarde.';
        default:
          return error.error?.message || `Error: ${error.statusText || 'Error desconocido'}`;
      }
    }

    if (error?.message?.includes('Network')) {
      return 'Error de conexión. Verifica tu conexión a internet.';
    }

    return error?.message || 'Error en el registro. Intenta de nuevo.';
  }
}