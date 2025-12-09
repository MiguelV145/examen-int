import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { addDoc, collection, collectionData, Firestore, query, where } from '@angular/fire/firestore';
import { Asesoria, UserProfile } from '../../share/Interfaces/Interfaces-Users';
import { AuthService } from '../../../core/services/firebase/authservice';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { AsyncPipe, CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home-page',
  imports: [CommonModule,AsyncPipe, ReactiveFormsModule],
  templateUrl: './Home-Page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage { 

 private firestore = inject(Firestore);
  public authService = inject(AuthService); // Público para usar en el HTML
  private fb = inject(FormBuilder);

  programmers$: Observable<UserProfile[]>;
  selectedProg: UserProfile | null = null;
  loadingBooking = signal(false);

  // Formulario para la cita
  bookingForm = this.fb.group({
    date: ['', Validators.required],
    time: ['', Validators.required],
    comment: ['', [Validators.required, Validators.minLength(5)]]
  });

  constructor() {
    // 1. Traer solo a los Programadores
    const usersRef = collection(this.firestore, 'users');
    const q = query(usersRef, where('role', '==', 'Programador'));
    this.programmers$ = collectionData(q, { idField: 'uid' }) as Observable<UserProfile[]>;
  }

  // Abrir el modal
  openBookingModal(prog: UserProfile) {
    if (!this.authService.currentUser()) {
      alert('⚠️ Debes iniciar sesión para poder agendar.');
      return;
    }
    this.selectedProg = prog;
    this.bookingForm.reset();
    (document.getElementById('booking_modal') as HTMLDialogElement).showModal();
  }

  // Enviar solicitud a Firestore
  async submitBooking() {
    if (this.bookingForm.invalid) return;
    
    const currentUser = this.authService.currentUser();
    if (!currentUser || !this.selectedProg) return;

    this.loadingBooking.set(true);

    try {
      const newAsesoria: Asesoria = {
        programmerId: this.selectedProg.uid,
        programmerName: this.selectedProg.displayName || 'Programador',
        clientId: currentUser.uid,
        clientName: currentUser.displayName || currentUser.email!,
        date: this.bookingForm.value.date!,
        time: this.bookingForm.value.time!,
        comment: this.bookingForm.value.comment!,
        status: 'pendiente'
      };

      await addDoc(collection(this.firestore, 'asesorias'), newAsesoria);
      
      alert('✅ ¡Solicitud enviada con éxito! Revisa tu correo o panel para la respuesta.');
      (document.getElementById('booking_modal') as HTMLDialogElement).close();
      
    } catch (error) {
      console.error(error);
      alert('Error al agendar. Intenta de nuevo.');
    } finally {
      this.loadingBooking.set(false);
    }
  }
}
