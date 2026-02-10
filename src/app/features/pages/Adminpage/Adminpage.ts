import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, combineLatest, of, BehaviorSubject } from 'rxjs';
import { catchError, map, shareReplay, switchMap } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';

// Servicios
import { AuthService } from '../../../core/services/auth/auth.service';
import { AsesoriasApiService } from '../../../core/services/api/asesorias.api';
import { UsersApiService, UserResponseDto } from '../../../core/services/api/users.api';
import { AsesoriaResponse } from '../../../core/models/asesorias.models';
import { Asesoria, Availability, UserProfile } from '../../share/Interfaces/Interfaces-Users';
import { FormUtils } from '../../share/Formutils/Formutils';

@Component({
  selector: 'app-adminpage',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './Adminpage.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Adminpage implements OnInit { 
  
  public authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private usersApi = inject(UsersApiService);
  private asesoriasApi = inject(AsesoriasApiService);
  private toastr = inject(ToastrService);

  private refetchTrigger$ = new BehaviorSubject<void>(undefined);

  users$: Observable<UserProfile[]> = this.refetchTrigger$.pipe(
    switchMap(() => {
      console.log('🔄 Cargando usuarios desde el backend...');
      return this.usersApi.getUsers();
    }),
    map((users) => {
      console.log('✅ Usuarios obtenidos del backend:', users);
      return users.map((user) => this.mapUser(user));
    }),
    catchError((error) => {
      console.error('❌ Error al cargar usuarios:', error);
      console.error('❌ Status:', error.status);
      console.error('❌ Error body:', error.error);
      console.error('❌ Headers:', error.headers);
      
      if (error.status === 403) {
        this.toastr.error(
          'Tu usuario no tiene el rol ADMIN en el backend. El token está correcto pero el rol no está asignado.', 
          'Error 403 - Sin permisos',
          { timeOut: 10000 }
        );
      } else if (error.status === 401) {
        this.toastr.error('Tu sesión expiró o el token no es válido. Intenta hacer logout y login de nuevo.', 'Error 401');
      } else {
        this.toastr.error(
          error.error?.message || 'No se pudieron cargar los usuarios. Verifica la consola para más detalles.', 
          `Error ${error.status}`
        );
      }
      return of([]);
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  asesorias$: Observable<Asesoria[]> = combineLatest([
    this.users$,
    this.asesoriasApi.getAllAsesorias().pipe(
      catchError((error) => {
        console.error('No se pudieron cargar asesorias.', error);
        return of([] as AsesoriaResponse[]);
      })
    )
  ]).pipe(
    map(([users, asesorias]) => this.mapAsesoriasForView(asesorias, users)),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  // Estado UI
  loading = signal(false);
  activeTab = signal<'users' | 'asesorias'>('users');
  
  formUtils = FormUtils;
  message = signal('Panel de administración - Funcionalidad en construcción. Conectar con backend cuando esté listo.');

  availabilityForm = this.fb.group({
    dias: ['', Validators.required],
    startHour: ['09:00', Validators.required],
    endHour: ['17:00', Validators.required]
  });

  constructor() {}

  ngOnInit() {
    // Mostrar información del usuario logueado
    const currentUser = this.authService.currentUser();
    console.log('👤 Usuario actual:', currentUser);
    console.log('🔑 Roles del usuario:', currentUser?.roles);
    console.log('📧 Email:', currentUser?.email);
    
    // Verificar si tiene rol ADMIN
    const isAdmin = currentUser?.roles?.includes('ROLE_ADMIN');
    console.log('🛡️ ¿Tiene rol ADMIN?:', isAdmin);
    
    // IMPORTANTE: Decodificar el token JWT para ver qué roles tiene realmente
    const token = this.authService.getToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('🎫 TOKEN JWT DECODIFICADO:', payload);
        console.log('🎫 Roles en el token:', payload.roles || payload.authorities || payload.role);
        console.log('🎫 Token completo (primeros 100 chars):', token.substring(0, 100) + '...');
      } catch (e) {
        console.error('❌ Error al decodificar token:', e);
      }
    } else {
      console.error('❌ No hay token en localStorage!');
    }
    
    if (!isAdmin) {
      this.toastr.warning('Tu usuario no tiene el rol ADMIN asignado. Contacta al administrador del sistema.', 'Sin permisos', { timeOut: 8000 });
    }
    
    // Cargar usuarios automáticamente al entrar al panel
    this.refetchTrigger$.next();
  }

  switchTab(tab: 'users' | 'asesorias') {
    this.activeTab.set(tab);
  }

  // Placeholder methods
  async toggleRole(user: UserProfile) {
    if (!user.uid) return;

    const userId = Number(user.uid);
    const isProgramador = user.roles.includes('PROGRAMADOR');

    // Si es programador, degradar a USER; si no, ascender a PROGRAMADOR
    const newRoles = isProgramador 
      ? ['USER'] 
      : ['PROGRAMADOR', 'USER'];

    const action = isProgramador ? 'Degradando' : 'Ascendiendo';
    console.log(`🔄 ${action} rol de usuario ${userId}:`, { from: user.roles, to: newRoles });
    this.toastr.info(`${action} a ${user.displayName || user.email}...`);

    this.usersApi.updateUserRoles(userId, newRoles).subscribe({
      next: (response) => {
        console.log('✅ Rol actualizado:', response);
        this.toastr.success(`Rol actualizado exitosamente`, 'Éxito');
        this.refetchTrigger$.next();
      },
      error: (err) => {
        console.error('❌ Error al cambiar rol:', err);
        console.error('❌ Status:', err.status);
        console.error('❌ Error body:', err.error);
        const msg = err?.error?.message || 'No se pudo actualizar el rol';
        this.toastr.error(msg, 'Error');
      }
    });
  }

  async deleteUser(user: UserProfile) {
    if (!user.uid) return;

    const confirmed = confirm(
      `¿Estás seguro de eliminar a ${user.displayName || user.email}?\n\nEsta acción no se puede deshacer.`
    );

    if (!confirmed) return;

    const userId = Number(user.uid);

    this.usersApi.deleteUser(userId).subscribe({
      next: () => {
        this.toastr.success('Usuario eliminado exitosamente', 'Éxito');
        this.refetchTrigger$.next();
      },
      error: (err) => {
        const msg = err?.error?.message || 'No se pudo eliminar el usuario';
        this.toastr.error(msg, 'Error');
        console.error('Error al eliminar usuario:', err);
      }
    });
  }

  openAvailabilityModal(user: UserProfile) {}
  closeAvailabilityModal() {}
  async saveAvailability() {}
  async updateAsesoriaStatus(asesoria: Asesoria, newStatus: any) {}

  private mapUser(user: UserResponseDto): UserProfile {
    return {
      uid: String(user.id),
      email: user.email,
      roles: user.roles || [],
      displayName: user.username || user.email,
    };
  }

  private mapAsesoriasForView(asesorias: AsesoriaResponse[], users: UserProfile[]): Asesoria[] {
    const userMap = new Map<number, UserProfile>(users.map((user) => [Number(user.uid), user]));

    return asesorias.map((asesoria) => {
      const raw = asesoria as unknown as {
        id?: number;
        programmerId?: number;
        clientId?: number;
        date?: string;
        time?: string;
        comment?: string;
        responseMsg?: string | null;
        status?: string;
        startAt?: string;
        topic?: string;
        notes?: string;
        programmer?: { id: number; username: string; displayName?: string };
        client?: { id: number; username: string };
      };

      const programmerId = raw.programmer?.id ?? raw.programmerId ?? 0;
      const clientId = raw.client?.id ?? raw.clientId ?? 0;

      const programmerName =
        raw.programmer?.displayName ||
        raw.programmer?.username ||
        this.resolveUserName(userMap, programmerId, 'Programador');

      const clientName = raw.client?.username || this.resolveUserName(userMap, clientId, 'Cliente');

      const dateTime = this.resolveDateTime(raw.startAt, raw.date, raw.time);

      return {
        id: raw.id?.toString() || '',
        programmerId: programmerId.toString(),
        programmerName,
        clientId: clientId.toString(),
        clientName,
        date: dateTime.date,
        time: dateTime.time,
        comment: raw.comment || raw.topic || '',
        status: this.mapStatus(raw.status),
        responseMsg: raw.responseMsg || raw.notes || undefined,
      };
    });
  }

  private resolveUserName(userMap: Map<number, UserProfile>, id: number, fallback: string): string {
    if (!id) return fallback;
    const user = userMap.get(id);
    return user?.displayName || user?.email || `${fallback} ${id}`;
  }

  private resolveDateTime(startAt?: string, date?: string, time?: string): { date: string; time: string } {
    if (startAt) {
      const parsed = new Date(startAt);
      if (!isNaN(parsed.getTime())) {
        return {
          date: parsed.toLocaleDateString(),
          time: parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
      }
    }

    return {
      date: date || '',
      time: time || '',
    };
  }

  private mapStatus(status?: string): 'pendiente' | 'aprobada' | 'rechazada' {
    switch (status) {
      case 'PENDIENTE':
      case 'PENDING':
        return 'pendiente';
      case 'CONFIRMADA':
      case 'CONFIRMED':
        return 'aprobada';
      case 'RECHAZADA':
      case 'CANCELADA':
      case 'REJECTED':
      case 'CANCELLED':
      case 'EN_CURSO':
      case 'COMPLETADA':
      default:
        return 'rechazada';
    }
  }
}