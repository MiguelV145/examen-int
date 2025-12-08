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

  // Signals para la UI
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

  // Validador personalizado para comparar contraseñas
  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null; // Si coinciden o están vacíos, no hay error a nivel de grupo
  }

  onSubmit() {
    // 1. Si el formulario es inválido, marcamos todo como tocado para mostrar errores
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.registerForm.value;

    // 2. Llamamos al servicio.
    // NOTA: El AuthService que configuramos antes YA crea el documento en Firestore
    // y maneja la redirección. Aquí solo manejamos el estado de carga y errores.
    this.authService.register(email, password).subscribe({
      next: () => {
        this.loading.set(false);
        // La redirección ya la hace el servicio, pero por seguridad podemos dejarla aquí también
        // o simplemente confiar en el servicio.
        console.log('Registro completado.');
      },
      error: (error) => {
        this.loading.set(false);
        this.errorMessage.set(this.getErrorMessage(error.code));
      }
    });
  }

  getErrorMessage(code: string): string {
    const errorMessages: { [key: string]: string } = {
      'auth/email-already-in-use': 'Este correo ya está registrado.',
      'auth/invalid-email': 'El correo electrónico no es válido.',
      'auth/operation-not-allowed': 'Operación no permitida.',
      'auth/weak-password': 'La contraseña es muy débil.',
      'auth/network-request-failed': 'Error de conexión. Revisa tu internet.'
    };
    return errorMessages[code] || 'Error desconocido al registrar usuario.';
  }

  // Getters para usar en el HTML de forma limpia
  get email() { return this.registerForm.get('email'); }
  get password() { return this.registerForm.get('password'); }
  get confirmPassword() { return this.registerForm.get('confirmPassword'); }
}