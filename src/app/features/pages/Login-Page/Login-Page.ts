import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
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
  
  // Estados reactivos para la UI
  loading = signal(false);
  errorMessage = signal<string | null>(null);

  // Formulario y Utilidades
  loginForm: FormGroup;
  formUtils = FormUtils;

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  // --- LOGIN CON CORREO ---
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
        this.router.navigate(['/home']);
      },
      error: (error: any) => {
        this.loading.set(false);
        this.errorMessage.set(this.getErrorMessage(error.code));
      }
    });
  }

  // --- LOGIN CON GOOGLE ---
  onGoogleLogin() {
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

  // Traducción de errores de Firebase para el usuario
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