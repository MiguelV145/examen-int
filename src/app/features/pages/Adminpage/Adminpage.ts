import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

// Servicios
import { AuthService } from '../../../core/services/auth/auth.service';
import { Asesoria, Availability, UserProfile } from '../../share/Interfaces/Interfaces-Users';
import { FormUtils } from '../../share/Formutils/Formutils';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'app-adminpage',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './Adminpage.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Adminpage { 
  
  public authService = inject(AuthService);
  private fb = inject(FormBuilder);

  // Observable placeholders
  users$: Observable<UserProfile[]> = of([]);
  asesorias$: Observable<Asesoria[]> = of([]);

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

  switchTab(tab: 'users' | 'asesorias') {
    this.activeTab.set(tab);
  }

  // Placeholder methods
  async toggleRole(user: UserProfile) {}
  async deleteUser(user: UserProfile) {}
  openAvailabilityModal(user: UserProfile) {}
  closeAvailabilityModal() {}
  async saveAvailability() {}
  async updateAsesoriaStatus(asesoria: Asesoria, newStatus: any) {}
}