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
  
  loading = signal(false);
  errorMessage = signal<string | null>(null);

  loginForm: FormGroup;
  formUtils = FormUtils;

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  // --- LOGIN CORREO ---
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
      // SOLUCIÓN: Usamos (error: any) para evitar la línea roja
      error: (error: any) => {
        this.loading.set(false);
        this.errorMessage.set(this.getErrorMessage(error.code));
      }
    });
  }

  // --- LOGIN GOOGLE ---
  onGoogleLogin() {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.authService.loginWithGoogle().subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/home']);
      },
      // SOLUCIÓN: Usamos (err: any) para evitar la línea roja
      error: (err: any) => {
        console.error('Error Google:', err);
        this.loading.set(false);
        this.errorMessage.set('Error con Google: ' + (err.code || err.message));
      }
    });
  }

  getErrorMessage(code: string): string {
    const messages: { [key: string]: string } = {
      'auth/user-not-found': 'Usuario no encontrado.',
      'auth/wrong-password': 'Contraseña incorrecta.',
      'auth/invalid-email': 'Correo inválido.',
      'auth/popup-closed-by-user': 'Inicio de sesión cancelado.'
    };
    return messages[code] || `Error: ${code}`;
  }

  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }
}