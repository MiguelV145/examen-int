import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/firebase/authservice';
import { FormUtils } from '../../share/Formutils/Formutils';

@Component({
  selector: 'app-login-page',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './Login-Page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  // Inyecciones
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  
  loading = signal(false);
  errorMessage = signal<string | null>(null);
  loginForm: FormGroup;

  // 2. EXPONER LA CLASE AL HTML
  // Esto permite usar FormUtils.isValidField(...) en el template
  formUtils = FormUtils; 

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  // --- OPCIÓN 1: LOGIN CON GOOGLE (Requisito del deber) ---
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

  // --- OPCIÓN 2: LOGIN CON EMAIL/PASSWORD ---
  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.loginForm.value;

    this.authService.loginWithEmail(email, password).subscribe({
      next: () => {
        // El AuthService redirige automáticamente
        this.loading.set(false);
      },
      error: (error) => {
        this.loading.set(false);
        this.errorMessage.set(this.getErrorMessage(error.code));
      }
    });
  }

  // Helper para traducir errores de Firebase
  private getErrorMessage(code: string): string {
    switch (code) {
      case 'auth/user-not-found': return 'Usuario no encontrado.';
      case 'auth/wrong-password': return 'Contraseña incorrecta.';
      case 'auth/invalid-credential': return 'Credenciales inválidas.';
      case 'auth/too-many-requests': return 'Muchos intentos. Espera un momento.';
      default: return 'Error de autenticación.';
    }
  }

  // Getters para el HTML
  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }
}