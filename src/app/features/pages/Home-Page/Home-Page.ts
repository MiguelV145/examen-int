import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth.service';
import { UserProfile, Project } from '../../share/Interfaces/Interfaces-Users';
import { FormUtils } from '../../share/Formutils/Formutils';
import { ToastrService } from 'ngx-toastr';
import { Observable, of } from 'rxjs';
@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './Home-Page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage { 

  public authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private toastr = inject(ToastrService);

  // Observable placeholders
  programmers$: Observable<UserProfile[]> = of([]);
  featuredProjects$: Observable<any[]> = of([]);
  projects: any[] = [];
  
  // Estado UI
  selectedProg: UserProfile | null = null;
  loadingBooking = signal(false);
  
  formUtils = FormUtils;
  message = signal('Página de inicio - Funcionalidad en construcción. Conectar con backend cuando esté listo.');

  // Formulario de Reserva
  bookingForm = this.fb.group({
    date: ['', [Validators.required]],
    time: ['', [Validators.required]],
    subject: ['', [Validators.required, Validators.minLength(5)]],
    comment: ['', [Validators.required, Validators.minLength(10)]]
  });

  constructor() {}

  openBookingModal(prog: UserProfile) {
    if (!this.authService.currentUser()) {
      alert('⚠️ Debes iniciar sesión para agendar una asesoría.');
      return;
    }
    this.selectedProg = prog;
    this.bookingForm.reset();
    
    const modal = document.getElementById('booking_modal') as HTMLDialogElement;
    if(modal) modal.showModal();
  }

  // Placeholder - Implementar con backend
  async submitBooking() {
    this.toastr.info('Funcionalidad en construcción', 'Info');
  }
}