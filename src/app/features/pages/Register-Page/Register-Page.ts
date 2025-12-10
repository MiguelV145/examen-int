import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common'; // <--- ESTO ES LO CORRECTO
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/firebase/authservice';
import { FormUtils } from '../../share/Formutils/Formutils';

@Component({
  selector: 'app-register-page',
  standalone: true,
  // 👇 AQUÍ ESTABA EL ERROR: Usamos CommonModule, NUNCA BrowserModule
  imports: [CommonModule, ReactiveFormsModule, RouterLink], 
  templateUrl: './Register-Page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterPage {
  
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  // Signals
  loading = signal(false);
  errorMessage = signal<string | null>(null);

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

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  // ESTA ES LA FUNCIÓN QUE LLAMA EL BOTÓN
  onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.registerForm.value;

    this.authService.register(email, password).subscribe({
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

  getErrorMessage(code: string): string {
    const messages: { [key: string]: string } = {
      'auth/email-already-in-use': 'El correo ya está registrado.',
      'auth/invalid-email': 'Correo inválido.',
      'auth/weak-password': 'Contraseña muy débil.',
      'auth/network-request-failed': 'Error de conexión.'
    };
    return messages[code] || 'Error al registrarse.';
  }

  // Getters para el HTML
  get email() { return this.registerForm.get('email'); }
  get password() { return this.registerForm.get('password'); }
  get confirmPassword() { return this.registerForm.get('confirmPassword'); }
}