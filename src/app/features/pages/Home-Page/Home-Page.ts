import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Firestore, collection, query, where, collectionData, addDoc } from '@angular/fire/firestore';
import { AuthService } from '../../../core/services/auth/auth.service';
import { map, Observable } from 'rxjs';
import { UserProfile, Asesoria, Project } from '../../share/Interfaces/Interfaces-Users';
import { FormUtils } from '../../share/Formutils/Formutils';
import { ToastrService } from 'ngx-toastr';
import emailjs from '@emailjs/browser';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, AsyncPipe, ReactiveFormsModule, RouterLink],
  templateUrl: './Home-Page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage { 

  private firestore = inject(Firestore);
  public authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private toastr = inject(ToastrService);
  
  // Observables
  programmers$: Observable<UserProfile[]>;
  featuredProjects$: Observable<Project[]>;
  
  // Estado UI
  selectedProg: UserProfile | null = null;
  loadingBooking = signal(false);
  
  // Utilidad de Formularios
  formUtils = FormUtils;

  // Formulario de Reserva
  bookingForm = this.fb.group({
    date: ['', [Validators.required]],
    time: ['', [Validators.required]],
    subject: ['', [Validators.required, Validators.minLength(5)]],
    comment: ['', [Validators.required, Validators.minLength(10)]]
  });

  constructor() {
    // 1. Cargar Programadores
    const usersRef = collection(this.firestore, 'users');
    const q = query(usersRef, where('role', '==', 'Programador'));
    this.programmers$ = collectionData(q, { idField: 'uid' }) as Observable<UserProfile[]>;

    // 2. Cargar Proyectos Destacados (Top 3 por likes)
    const projectsRef = collection(this.firestore, 'projects');
    this.featuredProjects$ = collectionData(projectsRef, { idField: 'id' }).pipe(
      map((projects: any[]) => {
        return projects
          .filter(p => p.likes && p.likes.length > 0) // Solo con likes
          .sort((a, b) => b.likes.length - a.likes.length) // Orden descendente
          .slice(0, 3); // Top 3
      })
    ) as Observable<Project[]>;
  }

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

  // Enviar Solicitud
  async submitBooking() {
    // 1. Validación con FormUtils
    if (this.bookingForm.invalid) {
      this.bookingForm.markAllAsTouched(); // Esto hace que los campos se pongan rojos
      return;
    }
    
    const currentUser = this.authService.currentUser();
    if (!currentUser || !this.selectedProg) return;

    this.loadingBooking.set(true);
    const formVal = this.bookingForm.value;

    // Validar que tenemos id
    if (!currentUser.id) {
      this.toastr.error('No se pudo obtener el ID de usuario', 'Error');
      this.loadingBooking.set(false);
      return;
    }

    try {
      // 2. Guardar en Base de Datos (Para el panel del programador)
      const newAsesoria: Asesoria = {
        programmerId: this.selectedProg.uid,
        programmerName: this.selectedProg.displayName || 'Programador',
        clientId: currentUser.id.toString(),
        clientName: currentUser.displayName || currentUser.email!,
        date: formVal.date!,
        time: formVal.time!,
        comment: `[${formVal.subject}] ${formVal.comment}`, // Juntamos asunto y mensaje
        status: 'pendiente'
      };

      await addDoc(collection(this.firestore, 'asesorias'), newAsesoria);

      // 3. Enviar Correo con EmailJS
      if (this.selectedProg.email) {
        const templateParams = {
          to_email: this.selectedProg.email,
          to_name: this.selectedProg.displayName,   
          from_name: currentUser.displayName || currentUser.email, 
          subject: formVal.subject,
          message: formVal.comment,
          date_time: `${formVal.date} a las ${formVal.time}`
        };

        // REEMPLAZA CON TUS CREDENCIALES REALES
        await emailjs.send(
          'service_y02aan7', // Service ID
          'template_faf7lba', // Template ID
          templateParams,
          'rjFCNekN83tOlNc19' // Public Key
        );
        console.log('Correo enviado correctamente.');
      } 

      alert('✅ ¡Solicitud enviada con éxito! El experto ha sido notificado.');
      
      const modal = document.getElementById('booking_modal') as HTMLDialogElement;
      if (modal) modal.close();
      
    } catch (error) {
      console.error('Error:', error);
      alert('Error al procesar la solicitud. Intenta nuevamente.');
    } finally {
      this.loadingBooking.set(false);
    }
  }
}