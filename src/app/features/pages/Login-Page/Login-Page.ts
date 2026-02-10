import { ChangeDetectionStrategy, Component, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthApiService } from '../../../core/services/api/auth-api.service';
import { AuthStoreService } from '../../../core/services/auth/auth-store.service';
import { AuthLoginRequest } from '../../../core/models/auth.models';
import { FormUtils } from '../../share/Formutils/Formutils';
import { environment } from '../../../../environments/environment';
import { ToastrService } from 'ngx-toastr';

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
  private route = inject(ActivatedRoute);
  private toastr = inject(ToastrService);
  
  loading = signal(false);
  errorMessage = signal<string | null>(null);

  loginForm: FormGroup;
  formUtils = FormUtils;

  private isLoggingIn = false;

  constructor() {
    this.loginForm = this.fb.group({
      identifier: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() {
    // Verificar si viene desde registro exitoso
    this.route.queryParams.subscribe(params => {
      if (params['registered'] === 'true' && params['message']) {
        this.toastr.info(params['message'], 'Registro Exitoso', { timeOut: 5000 });
      }
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

  const rawValues = this.loginForm.getRawValue();
  const email = (rawValues.identifier || '').trim(); // puedes mantener el input llamándose "identifier"
  const password = rawValues.password || '';

  if (!email || !password) {
    this.errorMessage.set('Email y contraseña son requeridos');
    this.isLoggingIn = false;
    this.loading.set(false);
    this.loginForm.markAllAsTouched();
    return;
  }

  const loginRequest = { email, password };

  console.log('🔐 Enviando login request:', {
    email: loginRequest.email,
    passwordLength: loginRequest.password.length,
    url: `${environment.apiUrl}/api/auth/login`
  });
  console.log('⏳ Nota: Si es la primera petición, Render puede tardar 30-60 segundos en despertar...');

  this.authApiService.login(loginRequest).subscribe({
    next: (response) => {
      console.log('✅ Login exitoso:', { userId: response.userId, username: response.username });
      this.authStore.setAuth(response);
      this.isLoggingIn = false;
      this.loading.set(false);
      this.router.navigate(['/home']);
    },
    error: (error: any) => {
      console.error('❌ Error en login:', error);
      this.isLoggingIn = false;
      this.loading.set(false);
      this.errorMessage.set(this.getErrorMessage(error));
    }
  });
}

  private getErrorMessage(error: any): string {
    // Mostrar error detallado del backend para debugging
    if (error?.error?.message) {
      console.error('📋 Respuesta del backend:', error.error);
    }

    if (error?.status) {
      switch (error.status) {
        case 400:
          // Error de validación del backend (email vacío, formato inválido, etc.)
          const backendMsg = error.error?.message || error.error?.details || 'Datos inválidos';
          return `Validación: ${backendMsg}`;
        case 401:
          return 'Credenciales inválidas. Verifica tu email y contraseña.';
        case 404:
          return 'Usuario no encontrado. Por favor, regístrate primero.';
        case 500:
          return 'Error del servidor. Intenta más tarde.';
        default:
          return error.error?.message || `Error ${error.status}: ${error.statusText || 'Error desconocido'}`;
      }
    }

    if (error?.message?.includes('Network')) {
      return 'Error de conexión. Verifica tu conexión a internet.';
    }

    return error?.message || 'Error en el login. Intenta de nuevo.';
  }
}

