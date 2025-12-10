import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Firestore, collection, query, where, collectionData, addDoc, updateDoc, arrayRemove, arrayUnion, doc } from '@angular/fire/firestore';
import { AuthService } from '../../../core/services/firebase/authservice';
import { map, Observable } from 'rxjs';
import { UserProfile, Asesoria, Project } from '../../share/Interfaces/Interfaces-Users';
import emailjs from '@emailjs/browser';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, AsyncPipe, ReactiveFormsModule,RouterLink],
  templateUrl: './Home-Page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage { 

private firestore = inject(Firestore);
  public authService = inject(AuthService);
  private fb = inject(FormBuilder);
  
  programmers$: Observable<UserProfile[]>;
  featuredProjects$: Observable<Project[]>;
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
    const projectsRef = collection(this.firestore, 'projects');
    this.featuredProjects$ = collectionData(projectsRef, { idField: 'id' }).pipe(
      map((projects: any[]) => {
        return projects
          // PASO 1: FILTRAR
          // Solo dejamos pasar los proyectos que tengan el array 'likes' Y que tenga más de 0 elementos
          .filter(p => p.likes && p.likes.length > 0)
          
          // PASO 2: ORDENAR
          // Los ordenamos del que tiene más likes al que tiene menos
          .sort((a, b) => b.likes.length - a.likes.length)
          
          // PASO 3: CORTAR
          // Solo mostramos los 3 mejores (o los que quieras)
          .slice(0, 3);
      })
    ) as Observable<Project[]>;
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

  async toggleLike(project: Project) {
    const user = this.authService.currentUser();
    
    if (!user) {
      alert('Debes iniciar sesión para destacar proyectos ⭐');
      return;
    }

    if (!project.id) return;

    const projectRef = doc(this.firestore, 'projects', project.id);
    const myUid = user.uid;

    // Verificar si ya di like
    const hasLiked = project.likes?.includes(myUid);

    try {
      if (hasLiked) {
        // QUITAR ESTRELLA -> Desaparece del Home si baja en ranking
        await updateDoc(projectRef, {
          likes: arrayRemove(myUid)
        });
      } else {
        // DAR ESTRELLA -> Aparece en el Home (si entra al top)
        await updateDoc(projectRef, {
          likes: arrayUnion(myUid)
        });
      }
    } catch (error) {
      console.error("Error al dar estrella:", error);
    }
  }

  isLikedByMe(project: Project): boolean {
    const user = this.authService.currentUser();
    if (!user || !project.likes) return false;
    return project.likes.includes(user.uid);
  }
  



  
}