import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/firebase/authservice';
import { FormUtils } from '../../share/Formutils/Formutils';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-tregister-page',
  imports: [ReactiveFormsModule,RouterLink],
  templateUrl: './Register-Page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterPage {

private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  loading = signal(false);
  errorMessage = signal<string | null>(null);

  registerForm: FormGroup;

  // Signal para disparar el registro
  private registerTrigger = signal<{ email: string; password: string } | null>(null);

  // rxResource para manejar el proceso de registro (Angular 20+)
  registerResource = rxResource({
    params: () => this.registerTrigger(),
    stream: ({ params }) => {
      if (!params) return of(null);
      return this.authService.register(params.email, params.password);
    }
  });

  formUtils = FormUtils;

  constructor() {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });

    // Effect para navegar cuando el registro sea exitoso
    effect(() => {
      if (this.registerResource.hasValue() && this.registerResource.value()) {
        console.log('Registro exitoso, navegando a /home');
        this.router.navigate(['/home']);
      }
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
    error: (error) => {
      this.loading.set(false);
      this.errorMessage.set(this.getErrorMessage(error.code));
    }
  });
}
getErrorMessage(code: string): string {
    const errorMessages: { [key: string]: string } = {
      'auth/email-already-in-use': 'Este correo ya está registrado',
      'auth/invalid-email': 'El correo electrónico no es válido',
      'auth/operation-not-allowed': 'Operación no permitida',
      'auth/weak-password': 'La contraseña es muy débil'
    };
    return errorMessages[code] || 'Error al registrar usuario';
  }

  get email() {
    return this.registerForm.get('email');
  }

  get password() {
    return this.registerForm.get('password');
  }

  get confirmPassword() {
    return this.registerForm.get('confirmPassword');
  }
}


