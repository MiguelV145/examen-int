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
      passwordConfirm: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  // Validador personalizado para contraseñas
  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const passwordConfirm = form.get('passwordConfirm');

    if (password && passwordConfirm && password.value !== passwordConfirm.value) {
      passwordConfirm.setErrors({ passwordMismatch: true });
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
    
    // El backend SOLO espera email y password (sin username ni passwordConfirm)
    const registerRequest = {
      email: email,
      password: password
    };

    console.log('📤 Enviando al backend:', registerRequest);
    console.log('📝 Email:', email);
    console.log('📝 Password length:', password?.length);
    console.log('⏳ Nota: Si es la primera petición, Render puede tardar 30-60 segundos en despertar...');

    this.authApiService.register(registerRequest).subscribe({
      next: (response: any) => {
        console.log('✅ Respuesta del registro:', response);
        
        // Si el backend devuelve token directamente (AuthResponse completo)
        if (response.token && response.userId) {
          // Guardar en store y navegar a home
          this.authStore.setAuth(response);
          this.loading.set(false);
          this.router.navigate(['/home']);
        } else {
          // Si solo devuelve mensaje de éxito, hacer login automático
          console.log('📝 Registro exitoso, iniciando sesión automática...');
          
          // Hacer login automático con las mismas credenciales
          this.authApiService.login({ email, password }).subscribe({
            next: (loginResponse) => {
              console.log('✅ Login automático exitoso:', loginResponse);
              this.authStore.setAuth(loginResponse);
              this.loading.set(false);
              this.router.navigate(['/home']);
            },
            error: (loginError) => {
              console.error('❌ Error en login automático:', loginError);
              this.loading.set(false);
              // Si falla el login automático, redirigir a login manual
              this.router.navigate(['/login'], { 
                queryParams: { registered: 'true', message: 'Registro exitoso. Por favor inicia sesión.' }
              });
            }
          });
        }
      },
      error: (error: any) => {
        console.error('❌ Error completo del backend:', error);
        console.error('❌ Status:', error.status);
        console.error('❌ Error body:', error.error);
        console.error('❌ Message:', error.error?.message);

        const rawError = typeof error?.error === 'string' ? error.error : (error?.error?.message || '');
        const isAlreadyRegistered = error?.status === 400 && rawError.toLowerCase().includes('ya está registrado');

        if (isAlreadyRegistered) {
          // Si ya está registrado, iniciar sesión automáticamente
          this.authApiService.login({ email, password }).subscribe({
            next: (loginResponse) => {
              console.log('✅ Login automático exitoso:', loginResponse);
              this.authStore.setAuth(loginResponse);
              this.loading.set(false);
              this.router.navigate(['/home']);
            },
            error: (loginError) => {
              console.error('❌ Error en login automático:', loginError);
              this.loading.set(false);
              this.errorMessage.set('El email ya está registrado. Inicia sesión manualmente.');
            }
          });
          return;
        }

        this.loading.set(false);
        this.errorMessage.set(this.getErrorMessage(error));
      }
    });
  }

  private getErrorMessage(error: any): string {
    // Si error.error es un string directo, devolverlo
    if (typeof error.error === 'string') {
      return error.error;
    }

    if (error?.status) {
      switch (error.status) {
        case 400:
          return error.error?.message || 'Email inválido o contraseña muy corta (mín 6 caracteres).';
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