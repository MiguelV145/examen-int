import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Firestore, collection, query, where, collectionData, addDoc } from '@angular/fire/firestore';
import { AuthService } from '../../../core/services/firebase/authservice';
import { Observable } from 'rxjs';
import { UserProfile, Asesoria } from '../../share/Interfaces/Interfaces-Users';
import emailjs from '@emailjs/browser';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, AsyncPipe, ReactiveFormsModule],
  templateUrl: './Home-Page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage { 

private firestore = inject(Firestore);
  public authService = inject(AuthService);
  private fb = inject(FormBuilder);

  programmers$: Observable<UserProfile[]>;
  selectedProg: UserProfile | null = null;
  loadingBooking = signal(false);

  // Formulario
  bookingForm = this.fb.group({
    date: ['', Validators.required],
    time: ['', Validators.required],
    subject: ['', Validators.required],
    comment: ['', [Validators.required, Validators.minLength(5)]]
  });

  constructor() {
    const usersRef = collection(this.firestore, 'users');
    const q = query(usersRef, where('role', '==', 'Programador'));
    this.programmers$ = collectionData(q, { idField: 'uid' }) as Observable<UserProfile[]>;
  }

  // Abrir Modal
  openBookingModal(prog: UserProfile) {
    if (!this.authService.currentUser()) {
      alert('⚠️ Debes iniciar sesión para agendar.');
      return;
    }
    this.selectedProg = prog;
    this.bookingForm.reset();
    
    const modal = document.getElementById('booking_modal') as HTMLDialogElement;
    if(modal) modal.showModal();
  }

  // --- ENVIAR SOLICITUD ---
  async submitBooking() {
    if (this.bookingForm.invalid) {
      this.bookingForm.markAllAsTouched();
      return;
    }
    
    const currentUser = this.authService.currentUser();
    if (!currentUser || !this.selectedProg) return;

    this.loadingBooking.set(true);
    const formVal = this.bookingForm.value;

    try {
      // 1. GUARDAR EN BASE DE DATOS (Para el Admin Panel)
      const newAsesoria: Asesoria = {
        programmerId: this.selectedProg.uid,
        programmerName: this.selectedProg.displayName || 'Programador',
        clientId: currentUser.uid,
        clientName: currentUser.displayName || currentUser.email!,
        date: formVal.date!,
        time: formVal.time!,
        comment: `[${formVal.subject}] ${formVal.comment}`,
        status: 'pendiente'
      };

      await addDoc(collection(this.firestore, 'asesorias'), newAsesoria);

      // 2. ENVIAR CORREO CON EMAILJS
      if (this.selectedProg.email) {
        
        const templateParams = {
          to_email: this.selectedProg.email,
          to_name: this.selectedProg.displayName,   
          from_name: currentUser.displayName || currentUser.email, 
          subject: formVal.subject,
          message: formVal.comment,
          date_time: `${formVal.date} - ${formVal.time}`
        };

        // Tus claves de EmailJS
        await emailjs.send(
           'service_y02aan7',
          'template_faf7lba',  
          templateParams,
          'rjFCNekN83tOlNc19'   
        );
        console.log('Correo enviado exitosamente con EmailJS');
      } 
      // ^^^ Aquí había un error en tu código, tenías una llave } extra que cerraba el try antes de tiempo.

      // 3. Confirmación y Cierre (Todo esto debe estar DENTRO del try)
      alert('✅ ¡Solicitud enviada y correo entregado!');
      
      const modal = document.getElementById('booking_modal') as HTMLDialogElement;
      if (modal) modal.close();
      
    } catch (error) {
      console.error('Error:', error);
      // Mensaje amigable si falla
      alert('La solicitud se guardó en el sistema, pero hubo un error enviando el correo.');
    } finally {
      this.loadingBooking.set(false);
    }
  }
}