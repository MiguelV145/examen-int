import { ChangeDetectionStrategy, Component, inject, signal, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth.service';
import { FormUtils } from '../../share/Formutils/Formutils';

// Declarar el tipo de Google globalmente
declare var google: any;

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './Login-Page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage implements OnInit {
  
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  
  loading = signal(false);
  errorMessage = signal<string | null>(null);

  loginForm: FormGroup;
  formUtils = FormUtils;

  // Bandera para saber si hay un proceso crítico en curso
  private isLoggingIn = false;

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() {
    // Cargar el script de Google Sign-In si no está cargado
    this.loadGoogleSignInScript();
  }

  /**
   * 🛑 ESTO ES LA MAGIA:
   * Detecta si el usuario intenta recargar (F5) o cerrar la pestaña.
   * Si isLoggingIn es true, el navegador mostrará una alerta nativa de advertencia.
   */
  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any) {
    if (this.isLoggingIn) {
      // Esto dispara la alerta del navegador "Es posible que los cambios no se guarden"
      $event.returnValue = true;
    }
  }

  // --- LOGIN CON CORREO (JWT) ---
  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    // 1. Activamos el bloqueo
    this.isLoggingIn = true;
    this.loading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.loginForm.value;

    // Usar email como usernameOrEmail
    this.authService.login(email, password).subscribe({
      next: () => {
        // 2. Login exitoso: Desactivamos el bloqueo para poder navegar
        this.isLoggingIn = false;
        this.loading.set(false);
        this.router.navigate(['/home']);
      },
      error: (error: any) => {
        // 3. Error: Desactivamos el bloqueo para que el usuario pueda reintentar
        this.isLoggingIn = false;
        this.loading.set(false);
        this.errorMessage.set(this.getErrorMessage(error));
      }
    });
  }

  // --- LOGIN CON GOOGLE ---
  onGoogleLogin() {
    if (this.loading()) return; // Evitar múltiples clics
    
    // Usar credentialUserSelect para permitir que el usuario seleccione una cuenta
    google?.accounts?.id?.signIn();
  }

  /**
   * Carga el script de Google Sign-In si no está cargado
   */
  private loadGoogleSignInScript() {
    if (!document.querySelector('script[src*="google"]')) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => this.initializeGoogleSignIn();
      document.head.appendChild(script);
    } else if (google?.accounts?.id) {
      this.initializeGoogleSignIn();
    }
  }

  /**
   * Inicializa Google Sign-In con el ID de cliente de Google
   */
  private initializeGoogleSignIn() {
    try {
      if (!google?.accounts?.id) {
        console.warn('Google Sign-In script not loaded yet');
        return;
      }

      // 🔑 IMPORTANTE: Reemplaza 'TU_GOOGLE_CLIENT_ID' con tu ID de cliente real
      const clientId = 'YOUR_GOOGLE_CLIENT_ID';

      if (clientId === 'YOUR_GOOGLE_CLIENT_ID') {
        console.warn('⚠️ Google Client ID no configurado. Reemplaza YOUR_GOOGLE_CLIENT_ID con el tuyo.');
        return;
      }

      google.accounts.id.initialize({
        client_id: clientId,
        callback: (response: any) => this.handleGoogleLogin(response)
      });

      // Renderizar el botón de Google Sign-In
      google.accounts.id.renderButton(
        document.getElementById('google-signin-button'),
        {
          theme: 'dark',
          size: 'large',
          width: '100%'
        }
      );

      // También permitir One Tap
      google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // El usuario desactivó el One Tap o ya inició sesión
        }
      });
    } catch (error) {
      console.error('Error initializing Google Sign-In:', error);
    }
  }

  /**
   * Maneja la respuesta de Google Sign-In
   */
  private handleGoogleLogin(response: any) {
    if (!response.credential) {
      this.errorMessage.set('Error al autenticar con Google. Por favor, intenta de nuevo.');
      return;
    }

    this.isLoggingIn = true;
    this.loading.set(true);
    this.errorMessage.set(null);

    // Enviar el JWT token de Google al backend
    this.authService.loginWithGoogle(response.credential).subscribe({
      next: () => {
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
    // Si es un error HTTP del backend
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

    // Si es un error de red
    if (error?.message?.includes('Network')) {
      return 'Error de conexión. Verifica tu conexión a internet.';
    }

    // Error genérico
    return error?.message || 'Error desconocido. Intenta de nuevo.';
  }
}